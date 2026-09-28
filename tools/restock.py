# -*- coding: utf-8 -*-
"""Reposição automática: pedido APPROVED -> 1 key Central Key no SKU Key Steam."""
import json
import os
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


def key_values(keys):
    out = []
    for k in keys or []:
        if isinstance(k, dict):
            v = k.get("value") or k.get("code") or k.get("key")
        else:
            v = k
        if v:
            out.append(str(v))
    return out


def restock_sku(st, ck, keymap, state, product_id, hint_title=None):
    if product_id in (state.get("ck_404") or []):
        return "ck_404"
    gs, got = req_retry(ST_BASE + "/product/" + product_id, token=st)
    if gs != 200 or not isinstance(got, dict):
        return "get_fail_%s" % gs
    have = key_values(got.get("license_keys"))
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


def list_orders(st):
    rows = []
    page = 1
    while page <= 5:
        qs = "?status=APPROVED&limit=50&page=%s" % page
        status, data = req_retry(ST_BASE + "/order" + qs, token=st)
        if status != 200 or not isinstance(data, dict):
            break
        chunk = data.get("data") or []
        rows.extend(chunk)
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
    for order in orders:
        if (order.get("status") or "").upper() != "APPROVED":
            continue
        iid = str(order.get("internal_id") or order.get("id"))
        items = order_items(st, order)
        order_ok = True
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
