# -*- coding: utf-8 -*-
"""Reposição automática: pedido APPROVED -> 1 key Central Key no SKU Key Steam."""
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV = os.path.join(ROOT, ".env")
MAP_PATH = os.path.join(ROOT, "tools", "key-map.json")
LOCAL_MAP_PATH = os.path.join(ROOT, ".key-map.json")
STATE_PATH = os.path.join(ROOT, ".restock-state.json")
LOG_PATH = os.path.join(os.path.dirname(__file__), "restock.log")
TMP = os.path.join(os.environ.get("TEMP", "."), "kz-ck")

ST_BASE = "https://api.selltrust.com.br/api/v1"
CK_GEN = "https://centralkey.com.br/api/v1/keys/generate"
STEAM_APP_RE = re.compile(r"steam/apps/(\d+)", re.I)
MIN_STOCK = 100
UA = "KeyzzoneRestock/1.0"


def log(msg):
    line = "%s %s" % (datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), msg)
    try:
        print(line, flush=True)
    except Exception:
        pass
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_env():
    data = {}
    if os.path.exists(ENV):
        with open(ENV, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                data[k.strip()] = v.strip()
    for k in ("SELLTRUST_API_TOKEN", "CENTRALKEY_API_TOKEN"):
        val = os.environ.get(k)
        if val:
            data[k] = val.strip()
    return data


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def req(url, method="GET", token=None, body=None, timeout=40):
    headers = {"Accept": "application/json", "User-Agent": UA}
    data = None
    if token:
        headers["Authorization"] = "Bearer " + token
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw.decode("utf-8") or "null")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "ignore")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {}
        return e.code, parsed


def req_retry(url, method="GET", token=None, body=None, tries=4):
    for i in range(tries):
        status, data = req(url, method=method, token=token, body=body)
        if status in (429, 403):
            time.sleep(8 + i * 8)
            continue
        return status, data
    return status, data


def seed_map(keymap):
    reports = [
        os.path.join(TMP, "stock-report.json"),
        os.path.join(TMP, "stock-retry-report.json"),
    ]
    added = 0
    for path in reports:
        if not os.path.exists(path):
            continue
        data = load_json(path, {})
        for row in data.get("ok") or []:
            vid = row.get("variant_id")
            app_id = row.get("app_id")
            if not vid or not app_id or vid in keymap:
                continue
            keymap[vid] = {"app_id": str(app_id), "game": row.get("game")}
            added += 1
    uncharted = "e041e214-18b4-4884-ad99-1f316530c17a"
    if uncharted not in keymap:
        keymap[uncharted] = {"app_id": "1659420", "game": "UNCHARTED: Coleção Legado dos Ladrões"}
        added += 1
    return added


def assert_st_token(st):
    ping, ping_body = req_retry(ST_BASE + "/product?limit=1", token=st)
    if ping == 200:
        return True
    extra = ""
    if isinstance(ping_body, dict):
        extra = str(ping_body.get("message") or ping_body.get("error") or "")[:120]
    log("TOKEN_FAIL http=%s %s" % (ping, extra))
    return False


def load_keymap():
    keymap = load_json(MAP_PATH, {})
    if not isinstance(keymap, dict):
        keymap = {}
    extra = load_json(LOCAL_MAP_PATH, {})
    if isinstance(extra, dict):
        keymap.update(extra)
    return keymap


def appid_from_images(images):
    for img in images or []:
        m = STEAM_APP_RE.search(str(img))
        if m:
            return m.group(1)
    return None


def normalize_key(v):
    if v is None:
        return ""
    if isinstance(v, dict):
        v = v.get("value") or v.get("code") or v.get("key") or v.get("license_key") or ""
    s = str(v).strip().lstrip("\ufeff")
    for _ in range(4):
        if len(s) >= 2 and ((s[0] == '"' and s[-1] == '"') or (s[0] == "'" and s[-1] == "'")):
            blob = s if s[0] == '"' else json.dumps(s[1:-1])
            try:
                parsed = json.loads(blob)
            except json.JSONDecodeError:
                s = s[1:-1].strip()
                continue
            if isinstance(parsed, str):
                s = parsed.strip()
                continue
            if isinstance(parsed, dict):
                s = normalize_key(parsed)
                continue
            break
        if s[:1] in "{[":
            try:
                parsed = json.loads(s)
            except json.JSONDecodeError:
                break
            if isinstance(parsed, dict):
                s = normalize_key(parsed)
                continue
            if isinstance(parsed, str):
                s = parsed.strip()
                continue
            break
        break
    return s


def key_values(keys):
    out = []
    seen = set()
    for k in keys or []:
        v = normalize_key(k)
        if not v or v in seen:
            continue
        seen.add(v)
        out.append(v)
    return out


def restock_sku(st, ck, keymap, state, product_id, hint_title=None):
    if product_id in (state.get("ck_404") or []):
        return "ck_404"
    gs, got = req_retry(ST_BASE + "/product/" + product_id, token=st)
    if gs != 200 or not isinstance(got, dict):
        return "get_fail_%s" % gs
    raw_keys = got.get("license_keys") or []
    have = key_values(raw_keys)
    raw_text = []
    for k in raw_keys:
        if isinstance(k, dict):
            raw_text.append(str(k.get("value") or k.get("code") or k.get("key") or k.get("license_key") or "").strip())
        elif k is not None:
            raw_text.append(str(k).strip())
    raw_text = [x for x in raw_text if x]
    if raw_text != have:
        ps, _patched = req_retry(
            ST_BASE + "/product/" + product_id,
            method="PATCH",
            token=st,
            body={"is_bundle": False, "license_keys": have},
        )
        if ps == 200:
            log("SCRUB_QUOTES %s stock=%s" % (product_id, len(have)))
    if len(have) >= MIN_STOCK:
        return "ok_stock"
    title = (got.get("title") or hint_title or "").strip()
    if "dlc" in title.lower():
        return "skip_dlc"

    info = keymap.get(product_id) or {}
    app_id = info.get("app_id") or appid_from_images(got.get("images") or [])
    if not app_id:
        return "no_app_id"

    keymap[product_id] = {
        "app_id": str(app_id),
        "game": info.get("game") or (got.get("parent") or {}).get("title") or title,
    }
    added_n = 0
    charged = 0
    while True:
        need = MIN_STOCK - len(have)
        if need <= 0:
            break
        qty = need
        cs, gen = req_retry(
            CK_GEN,
            method="POST",
            token=ck,
            body={"appId": str(app_id), "quantity": qty},
        )
        if cs != 200 and qty > 10:
            qty = 10
            cs, gen = req_retry(
                CK_GEN,
                method="POST",
                token=ck,
                body={"appId": str(app_id), "quantity": qty},
            )
        if cs == 402:
            return "no_balance"
        if cs == 404:
            state.setdefault("ck_404", [])
            if product_id not in state["ck_404"]:
                state["ck_404"].append(product_id)
            return "ck_404"
        if cs != 200 or not isinstance(gen, dict):
            return "ck_fail_%s" % cs
        codes = key_values(gen.get("keys") or gen.get("data") or [])
        if not codes:
            return "ck_no_code"
        gs2, got2 = req_retry(ST_BASE + "/product/" + product_id, token=st)
        existing = have
        if gs2 == 200 and isinstance(got2, dict):
            existing = key_values(got2.get("license_keys"))
            if len(existing) >= MIN_STOCK:
                have = existing
                break
        merged = existing + codes
        ps, patched = req_retry(
            ST_BASE + "/product/" + product_id,
            method="PATCH",
            token=st,
            body={"is_bundle": False, "license_keys": merged},
        )
        if ps != 200:
            msg = ""
            if isinstance(patched, dict):
                msg = str(patched.get("message") or patched.get("error") or "")[:120]
            return "patch_fail_%s %s" % (ps, msg)
        added_n += len(codes)
        charged += int(gen.get("totalCents") or 0)
        have = merged
        if qty < need:
            time.sleep(0.25)
            continue
        break

    if added_n <= 0:
        return "ok_stock"
    state["charged_cents"] = int(state.get("charged_cents") or 0) + charged
    log(
        "RESTOCK %s app=%s added=%s stock=%s cents=%s"
        % (keymap[product_id].get("game") or product_id, app_id, added_n, len(have), charged)
    )
    return "restocked"


def order_items(st, order):
    items = order.get("items") or []
    if items and isinstance(items[0], dict) and items[0].get("product_id"):
        return items
    iid = order.get("internal_id")
    if not iid:
        return []
    status, detail = req_retry(ST_BASE + "/order/" + str(iid), token=st)
    if status == 200 and isinstance(detail, dict):
        return detail.get("items") or []
    return []


GIFT_MARK = "[KZ-GIFT]"
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.I,
)


def order_detail(st, order):
    iid = order.get("internal_id")
    if not iid:
        return order
    status, detail = req_retry(ST_BASE + "/order/" + str(iid), token=st)
    if status == 200 and isinstance(detail, dict):
        merged = dict(order)
        merged.update(detail)
        for key in ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "coupon_code"):
            if not merged.get(key) and order.get(key):
                merged[key] = order[key]
        return merged
    return order


def notes_have_gift(st, iid):
    status, data = req_retry(ST_BASE + "/order/" + str(iid) + "/notes", token=st)
    rows = []
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = data.get("data") or data.get("notes") or []
    for note in rows or []:
        content = ""
        if isinstance(note, dict):
            content = str(note.get("content") or "")
        else:
            content = str(note)
        if GIFT_MARK in content:
            return True
    return False


def pack_bonus(order, items):
    source = str(order.get("utm_source") or "").strip().lower()
    campaign = str(order.get("utm_campaign") or "").strip().upper()
    coupon = str(order.get("coupon_code") or "").strip().upper()
    if source != "pack" and campaign != "PACK20" and coupon != "PACK20":
        return 0, set()
    paid_n = 0
    paid_ids = set()
    for item in items or []:
        pid = item.get("product_id")
        qty = int(item.get("quantity") or 1)
        if not pid:
            continue
        paid_ids.add(str(pid))
        paid_n += max(qty, 1)
    bonus = 1 if paid_n == 3 else 2 if paid_n == 5 else 0
    return bonus, paid_ids


def norm_email(value):
    return str(value or "").strip().lower()


def game_fingerprint(info):
    info = info if isinstance(info, dict) else {}
    app = str(info.get("app_id") or "").strip()
    title = re.sub(r"\s+", " ", str(info.get("game") or "").strip().lower())
    title = re.sub(r"[^a-z0-9]+", "", title)
    return app, title


def add_buyer_ids(state, bucket, email, pids):
    email = norm_email(email)
    if not email:
        return
    row = state.setdefault(bucket, {}).setdefault(email, [])
    for pid in pids or []:
        pid = str(pid)
        if pid and pid not in row:
            row.append(pid)


def buyer_blocklist(keymap, state, email, paid_ids):
    email = norm_email(email)
    blocked_ids = set(str(x) for x in (paid_ids or []))
    for bucket in ("buyer_owned", "buyer_gifts"):
        for pid in (state.get(bucket) or {}).get(email) or []:
            blocked_ids.add(str(pid))
    blocked_apps = set()
    blocked_titles = set()
    for pid in blocked_ids:
        app, title = game_fingerprint((keymap or {}).get(pid) or (keymap or {}).get(str(pid)))
        if app:
            blocked_apps.add(app)
        if title:
            blocked_titles.add(title)
    return blocked_ids, blocked_apps, blocked_titles


def pick_random_gift_ids(keymap, state, paid_ids, bonus, email=""):
    blocked = set(str(x) for x in (state.get("ck_404") or []))
    owned_ids, owned_apps, owned_titles = buyer_blocklist(keymap, state, email, paid_ids)
    blocked.update(owned_ids)
    pool = []
    for pid, info in (keymap or {}).items():
        pid = str(pid)
        if pid in blocked or not UUID_RE.match(pid):
            continue
        if not isinstance(info, dict):
            continue
        game = str(info.get("game") or "").lower()
        if "dlc" in game:
            continue
        if not info.get("app_id"):
            continue
        app, title = game_fingerprint(info)
        if app and app in owned_apps:
            continue
        if title and title in owned_titles:
            continue
        pool.append(pid)
    random.shuffle(pool)
    picked = []
    picked_apps = set(owned_apps)
    picked_titles = set(owned_titles)
    for pid in pool:
        info = keymap.get(pid) or {}
        app, title = game_fingerprint(info)
        if app and app in picked_apps:
            continue
        if title and title in picked_titles:
            continue
        picked.append(pid)
        if app:
            picked_apps.add(app)
        if title:
            picked_titles.add(title)
        if len(picked) >= bonus:
            break
    return picked


def take_or_generate_key(st, ck, keymap, state, product_id):
    gs, got = req_retry(ST_BASE + "/product/" + product_id, token=st)
    if gs != 200 or not isinstance(got, dict):
        return None, product_id, "get_fail_%s" % gs
    title = (
        (got.get("parent") or {}).get("title")
        or got.get("title")
        or product_id
    )
    have = key_values(got.get("license_keys"))
    if have:
        code = have[0]
        ps, patched = req_retry(
            ST_BASE + "/product/" + product_id,
            method="PATCH",
            token=st,
            body={"is_bundle": False, "license_keys": have[1:]},
        )
        if ps != 200:
            msg = ""
            if isinstance(patched, dict):
                msg = str(patched.get("message") or patched.get("error") or "")[:80]
            return None, title, "pop_fail_%s %s" % (ps, msg)
        return code, title, None

    info = keymap.get(product_id) or {}
    app_id = info.get("app_id") or appid_from_images(got.get("images") or [])
    if not app_id:
        return None, title, "no_app_id"
    keymap[product_id] = {
        "app_id": str(app_id),
        "game": info.get("game") or title,
    }
    cs, gen = req_retry(
        CK_GEN,
        method="POST",
        token=ck,
        body={"appId": str(app_id), "quantity": 1},
    )
    if cs == 402:
        return None, title, "no_balance"
    if cs != 200 or not isinstance(gen, dict):
        return None, title, "ck_fail_%s" % cs
    codes = key_values(gen.get("keys") or gen.get("data") or [])
    if not codes:
        return None, title, "ck_no_code"
    state["charged_cents"] = int(state.get("charged_cents") or 0) + int(gen.get("totalCents") or 0)
    return codes[0], title, None


def post_order_note(st, iid, content):
    return req_retry(
        ST_BASE + "/order/" + str(iid) + "/notes",
        method="POST",
        token=st,
        body={"content": content[:1000]},
    )


def deliver_pack_gifts(st, ck, keymap, state, order, items):
    iid = str(order.get("internal_id") or order.get("id") or "")
    if not iid:
        return "skip"
    done = state.setdefault("gifts_done", {})
    if done.get(iid):
        return "already"
    if notes_have_gift(st, iid):
        done[iid] = True
        return "already"
    bonus, paid_ids = pack_bonus(order, items)
    if not bonus:
        return "none"
    email = order.get("client_email")
    gift_ids = pick_random_gift_ids(keymap, state, paid_ids, bonus, email)
    if not gift_ids:
        log("GIFT_NO_POOL order=%s bonus=%s" % (iid, bonus))
        return "fail"
    lines = [GIFT_MARK + " Keys de brinde do pack:"]
    for pid in gift_ids:
        code, title, err = take_or_generate_key(st, ck, keymap, state, pid)
        if err == "no_balance":
            return "no_balance"
        if err or not code:
            log("GIFT_FAIL order=%s sku=%s %s" % (iid, pid, err or "empty"))
            return "fail"
        lines.append("%s: %s" % (title[:80], code))
        result = restock_sku(st, ck, keymap, state, pid, title)
        log("GIFT_RESTOCK order=%s sku=%s result=%s" % (iid, pid, result))
        if result == "no_balance":
            return "no_balance"
    content = "\n".join(lines)
    ns, nbody = post_order_note(st, iid, content)
    if ns not in (200, 201):
        msg = ""
        if isinstance(nbody, dict):
            msg = str(nbody.get("message") or nbody.get("error") or "")[:120]
        log("GIFT_NOTE_FAIL order=%s http=%s %s" % (iid, ns, msg))
        return "note_fail"
    done[iid] = True
    add_buyer_ids(state, "buyer_gifts", email, gift_ids)
    log("GIFT_OK order=%s n=%s" % (iid, len(gift_ids)))
    return "ok"


def list_orders(st):
    rows = []
    seen = set()
    for st_name in ("APPROVED", "COMPLETED"):
        page = 1
        while page <= 5:
            qs = "?status=%s&limit=50&page=%s" % (st_name, page)
            status, data = req_retry(ST_BASE + "/order" + qs, token=st)
            if status != 200 or not isinstance(data, dict):
                log("ORDER_LIST %s http=%s" % (st_name, status))
                if isinstance(data, dict):
                    log("ORDER_LIST_ERR %s" % str(data.get("message") or data.get("error") or "")[:120])
                break
            chunk = data.get("data") or []
            for order in chunk:
                iid = str(order.get("internal_id") or order.get("id") or "")
                if not iid or iid in seen:
                    continue
                seen.add(iid)
                rows.append(order)
            meta = data.get("meta") or {}
            if page >= int(meta.get("last_page") or 1):
                break
            page += 1
            time.sleep(0.2)
    return rows


def run_cycle():
    env = load_env()
    st = env.get("SELLTRUST_API_TOKEN")
    ck = env.get("CENTRALKEY_API_TOKEN")
    if not st or not ck:
        log("NO_TOKENS")
        return 1
    if not assert_st_token(st):
        return 1

    keymap = load_keymap()
    added = seed_map(keymap)
    if added:
        save_json(MAP_PATH, keymap)
        log("MAP_SEEDED +%s total=%s" % (added, len(keymap)))

    state = load_json(STATE_PATH, {"processed": [], "ck_404": [], "charged_cents": 0})
    processed = set(state.get("processed") or [])

    orders = list_orders(st)
    restocked = 0
    skipped = 0
    seen_pids = set()
    enriched = []
    for order in orders:
        if (order.get("status") or "").upper() not in ("APPROVED", "COMPLETED"):
            continue
        detail = order_detail(st, order)
        items = order_items(st, detail)
        add_buyer_ids(
            state,
            "buyer_owned",
            detail.get("client_email") or order.get("client_email"),
            [item.get("product_id") for item in items if item.get("product_id")],
        )
        enriched.append((detail, items))

    for detail, items in enriched:
        iid = str(detail.get("internal_id") or detail.get("id"))
        gift_result = deliver_pack_gifts(st, ck, keymap, state, detail, items)
        if gift_result == "no_balance":
            log("STOP_NO_BALANCE gift order=%s" % iid)
            save_json(MAP_PATH, keymap)
            save_json(STATE_PATH, state)
            return 2
        order_ok = gift_result in ("ok", "already", "none")
        for item in items:
            pid = item.get("product_id")
            if not pid:
                log("ORDER %s missing_product_id" % iid)
                order_ok = False
                continue
            if pid in seen_pids:
                continue
            seen_pids.add(pid)
            result = restock_sku(st, ck, keymap, state, pid, item.get("title"))
            log("ORDER %s sku=%s result=%s" % (iid, pid, result))
            if result == "restocked":
                restocked += 1
            elif result == "no_balance":
                log("STOP_NO_BALANCE order=%s" % iid)
                save_json(MAP_PATH, keymap)
                save_json(STATE_PATH, state)
                return 2
            elif result in ("ok_stock", "skip_dlc", "no_app_id", "ck_404"):
                skipped += 1
            else:
                order_ok = False
        if order_ok:
            processed.add(iid)
            state["processed"] = sorted(processed)

    save_json(MAP_PATH, keymap)
    save_json(STATE_PATH, state)
    log("CYCLE orders=%s restocked=%s skipped=%s processed=%s" % (len(orders), restocked, skipped, len(processed)))
    return 0


def fill_catalog():
    env = load_env()
    st = env.get("SELLTRUST_API_TOKEN")
    ck = env.get("CENTRALKEY_API_TOKEN")
    if not st or not ck:
        log("NO_TOKENS")
        return 1
    if not assert_st_token(st):
        return 1

    keymap = load_keymap()
    added = seed_map(keymap)
    if added:
        save_json(MAP_PATH, keymap)
        log("MAP_SEEDED +%s total=%s" % (added, len(keymap)))

    state = load_json(STATE_PATH, {"processed": [], "ck_404": [], "charged_cents": 0})
    ids = list(keymap.keys())
    log("FILL_START target=%s skus=%s" % (MIN_STOCK, len(ids)))
    filled = 0
    skipped = 0
    for i, pid in enumerate(ids, 1):
        game = (keymap.get(pid) or {}).get("game") or pid
        result = restock_sku(st, ck, keymap, state, pid)
        log("FILL %s/%s %s %s" % (i, len(ids), game, result))
        if result == "restocked":
            filled += 1
        elif result == "no_balance":
            save_json(MAP_PATH, keymap)
            save_json(STATE_PATH, state)
            log("FILL_STOP_NO_BALANCE filled=%s skipped=%s" % (filled, skipped))
            return 2
        else:
            skipped += 1
        if i % 10 == 0:
            save_json(MAP_PATH, keymap)
            save_json(STATE_PATH, state)
        time.sleep(0.35)

    save_json(MAP_PATH, keymap)
    save_json(STATE_PATH, state)
    log("FILL_DONE filled=%s skipped=%s charged_cents=%s" % (filled, skipped, state.get("charged_cents") or 0))
    return 0


if __name__ == "__main__":
    if "--fill" in sys.argv:
        raise SystemExit(fill_catalog())
    raise SystemExit(run_cycle())
