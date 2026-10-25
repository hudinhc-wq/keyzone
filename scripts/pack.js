(function () {
    if (window.__kzPackBoundGift) return;
    var page = document.querySelector("#combo");
    if (!page) return;
    window.__kzPackBoundGift = true;
    var CATS = [
        { id: "", name: "Todas" },
        { id: "c1cce89a-dd18-40ea-b241-6d431690f990", name: "Lançamentos" },
        { id: "d05b7441-8bed-496a-ab61-06cf49aaf233", name: "Ação" },
        { id: "1b1acdad-b677-4c6a-a77b-8dd133a13016", name: "RPG" },
        { id: "a29f0f25-3ce7-463d-84f4-c08e1d8989c3", name: "Luta" },
        { id: "b53ed0ba-bdf7-40de-a967-17c7117dfe64", name: "Tiro" },
        { id: "b4061d6e-2de5-4934-b0dc-9dbbae45dd7e", name: "Terror" },
        { id: "b3c563fd-444d-4b08-8738-3e29cc0dde7d", name: "Esportes" },
        { id: "5aae53db-8d93-4104-a365-879e1cef58f8", name: "Corrida" },
        { id: "e7059cd6-2ecf-4162-8945-cd6b138258fe", name: "Simulação" },
        { id: "7c86826a-f136-4e67-8133-757d0df4f965", name: "Minecraft" },
        { id: "dd3b7c2c-4205-401b-9f1f-22cb6cb7b26a", name: "Outros" }
    ];
    var FETCH_CATS = CATS.filter(function (c) { return c.id; });
    var COUPON = "PACK20";
    var PAGE_SIZE = 50;
    var MAX_PAGE = 20;
    var sizePref = new URLSearchParams(location.search).get("n") || new URLSearchParams(location.search).get("oferta");
    try { if (!sizePref) sizePref = sessionStorage.getItem("kzPackPref") || ""; } catch (e) {}
    var size = sizePref === "3" ? 3 : 5;
    var selected = [];
    var gifts = [];
    var items = [];
    var seen = {};
    var currentCat = "";
    var q = "";
    var busy = false;
    var leadEl = page.querySelector("[data-pack-lead]");
    var titleEl = page.querySelector("[data-cb-title]");
    var hintEl = page.querySelector("[data-cb-hint]");
    var slotsEl = page.querySelector("[data-cb-slots]");
    var sumEl = page.querySelector("[data-cb-sum]");
    var offEl = page.querySelector("[data-cb-off]");
    var totalEl = page.querySelector("[data-cb-total]");
    var couponEl = page.querySelector("[data-cb-coupon]");
    var giftsEl = page.querySelector("[data-cb-gifts]");
    var goEl = page.querySelector("[data-cb-go]");
    var grid = document.getElementById("cb-grid");
    var statusEl = page.querySelector("[data-cb-status]");
    var chipsEl = page.querySelector("[data-cb-chips]");
    var searchEl = page.querySelector("[data-cb-q]");

    function money(cents) {
        if (window.SellTrust && SellTrust.formatPrice) return SellTrust.formatPrice(cents / 100);
        return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
    function centsOf(text) {
        var match = String(text || "").replace(/\s/g, "").match(/(\d[\d.]*)[,.](\d{2})/);
        if (!match) return 0;
        return Number(match[1].replace(/\./g, "")) * 100 + Number(match[2]);
    }
    function fold(value) {
        return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }
    function notify(msg) {
        if (window.toast && window.toast.error) return window.toast.error(msg);
        if (window.Toastify) Toastify({ text: msg, duration: 2800 }).showToast();
    }
    function bonusOf(n) {
        return n === 3 ? 1 : 2;
    }
    function copyFor(n) {
        var b = bonusOf(n);
        return {
            lead: "Escolha " + n + " jogos com 20% off e mais " + (b === 1 ? "1 jogo grátis" : "2 jogos grátis") + ". As keys de brinde entram sozinhas depois do Pix.",
            hint: "Monte " + n + " pagos + " + b + " brinde" + (b === 1 ? "" : "s") + ". Os slots verdes são as keys grátis"
        };
    }
    function pickFromCard(a) {
        var img = a.querySelector(".kz-card__img--main");
        var priceEl = a.querySelector(".kz-card__price");
        var titleNode = a.querySelector(".kz-card__title");
        return {
            href: a.getAttribute("href") || "",
            productId: a.getAttribute("data-product-id") || "",
            variantId: a.getAttribute("data-variant-id") || "",
            title: ((titleNode && titleNode.textContent) || "").trim(),
            img: img ? img.getAttribute("src") || "" : "",
            cents: centsOf(priceEl && priceEl.textContent)
        };
    }
    function save() {
        try { sessionStorage.setItem("kzPackState", JSON.stringify({ size: size, items: selected, gifts: gifts })); } catch (e) {}
    }
    function restore() {
        try {
            var raw = JSON.parse(sessionStorage.getItem("kzPackState") || "null");
            if (!raw || Number(raw.size) !== size || !Array.isArray(raw.items)) return;
            selected = raw.items.filter(function (it) { return it && it.href; }).slice(0, size);
            gifts = (Array.isArray(raw.gifts) ? raw.gifts : []).filter(function (it) { return it && it.href; }).slice(0, bonusOf(size));
        } catch (e) {}
    }
    function setSize(n, push) {
        size = n === 3 ? 3 : 5;
        if (selected.length > size) selected = selected.slice(0, size);
        if (gifts.length > bonusOf(size)) gifts = gifts.slice(0, bonusOf(size));
        page.querySelectorAll("[data-pack]").forEach(function (btn) {
            var on = Number(btn.getAttribute("data-pack")) === size;
            btn.classList.toggle("is-on", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });
        var copy = copyFor(size);
        if (leadEl) leadEl.textContent = copy.lead;
        if (hintEl) hintEl.textContent = copy.hint;
        if (push) history.replaceState({}, "", "/pack?n=" + size);
        save();
        paint();
    }
    function paintSlots() {
        var html = '<div class="cb-slots-group">';
        var i;
        for (i = 0; i < size; i++) {
            var it = selected[i];
            html += it
                ? '<button type="button" class="cb-slot is-on" data-paid-slot="' + i + '"><img src="' + it.img + '" alt=""></button>'
                : '<button type="button" class="cb-slot" data-paid-slot="' + i + '">+ ' + (i + 1) + "</button>";
        }
        html += '</div><span class="cb-slot-plus" aria-hidden="true">+</span><div class="cb-slots-group is-gift"><span class="cb-gift-label">Brindes</span>';
        var bonus = bonusOf(size);
        for (i = 0; i < bonus; i++) {
            var gift = gifts[i];
            html += gift
                ? '<button type="button" class="cb-slot is-gift is-on" data-gift-slot="' + i + '"><img src="' + gift.img + '" alt=""><span class="cb-slot-tag">Brinde</span></button>'
                : '<button type="button" class="cb-slot is-gift" data-gift-slot="' + i + '">Brinde ' + (i + 1) + "</button>";
        }
        html += "</div>";
        slotsEl.innerHTML = html;
        slotsEl.querySelectorAll("[data-paid-slot]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var idx = Number(btn.getAttribute("data-paid-slot"));
                if (!selected[idx]) return;
                selected.splice(idx, 1);
                save();
                paint();
            });
        });
        slotsEl.querySelectorAll("[data-gift-slot]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var idx = Number(btn.getAttribute("data-gift-slot"));
                if (!gifts[idx]) return;
                gifts.splice(idx, 1);
                save();
                paint();
            });
        });
    }
    function paintTotals() {
        var sum = selected.reduce(function (acc, it) { return acc + (it.cents || 0); }, 0);
        var off = Math.round(sum * 0.2);
        var bonus = bonusOf(size);
        var full = selected.length >= size && gifts.length >= bonus;
        titleEl.textContent = "SEU COMBO " + selected.length + "/" + size + " + " + gifts.length + "/" + bonus + " BRINDE" + (bonus === 1 ? "" : "S");
        sumEl.textContent = money(sum);
        offEl.textContent = money(off);
        if (giftsEl) giftsEl.textContent = gifts.length ? gifts.length + (gifts.length === 1 ? " key grátis" : " keys grátis") : "—";
        totalEl.textContent = money(sum - off);
        couponEl.textContent = selected.length >= size ? COUPON : "—";
        goEl.disabled = !full || busy;
        goEl.textContent = busy ? "Adicionando..." : (full ? "Ir para o checkout" : (selected.length < size ? "Escolha " + size + " jogos" : "Escolha " + bonus + " brinde" + (bonus === 1 ? "" : "s")));
    }
    function markCards() {
        var paid = {};
        var free = {};
        selected.forEach(function (it) { paid[it.href] = true; });
        gifts.forEach(function (it) { free[it.href] = true; });
        grid.querySelectorAll("a.kz-card").forEach(function (a) {
            var href = a.getAttribute("href");
            var onPaid = !!paid[href];
            var onGift = !!free[href];
            a.classList.toggle("is-in-pack", onPaid);
            a.classList.toggle("is-in-gift", onGift);
            var media = a.querySelector(".kz-card__media");
            var badge = a.querySelector(".kz-cb-on");
            if ((onPaid || onGift) && media) {
                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "kz-cb-on";
                    media.appendChild(badge);
                }
                badge.textContent = onGift ? "BRINDE" : "No combo";
                badge.classList.toggle("is-gift", onGift);
            } else if (badge) badge.remove();
        });
    }
    function paint() { paintSlots(); paintTotals(); markCards(); filterGrid(); }
    function toggleCard(a) {
        if (a.classList.contains("is-soldout")) return notify("Esse jogo está esgotado.");
        var item = pickFromCard(a);
        if (!item.href) return;
        var paidIdx = selected.findIndex(function (it) { return it.href === item.href; });
        var giftIdx = gifts.findIndex(function (it) { return it.href === item.href; });
        if (paidIdx !== -1) selected.splice(paidIdx, 1);
        else if (giftIdx !== -1) gifts.splice(giftIdx, 1);
        else if (selected.length < size) selected.push(item);
        else if (gifts.length < bonusOf(size)) gifts.push(item);
        else return notify("O pack já está completo. Tire um jogo para trocar.");
        save();
        paint();
    }
    function titleOf(wrap) {
        var heading = wrap.querySelector(".kz-card__title");
        var img = wrap.querySelector(".kz-card__img--main");
        return fold((heading && heading.textContent) || (img && img.getAttribute("alt")) || "");
    }
    function isJunk(wrap) {
        var t = titleOf(wrap);
        return t.indexOf("caixa misteriosa") !== -1 || t.indexOf("ganhe qualquer") !== -1 || (t.indexOf("metodo") !== -1 && (t.indexOf("key") !== -1 || t.indexOf("steam") !== -1));
    }
    function filterGrid() {
        var shown = 0;
        items.forEach(function (wrap) {
            var cats = "|" + (wrap.getAttribute("data-cats") || wrap.getAttribute("data-cat") || "") + "|";
            var ok = (!currentCat || cats.indexOf("|" + currentCat + "|") !== -1) && (!q || titleOf(wrap).indexOf(q) !== -1);
            wrap.hidden = !ok;
            if (ok) shown += 1;
        });
        if (statusEl) statusEl.textContent = shown ? shown + (shown === 1 ? " jogo" : " jogos") : "Nenhum jogo encontrado.";
    }
    function ingest(cat, wraps) {
        wraps.forEach(function (wrap) {
            var a = wrap.querySelector("a.kz-card");
            var href = a && a.getAttribute("href");
            if (!href || isJunk(wrap)) return;
            if (seen[href]) {
                var cur = seen[href].getAttribute("data-cats") || "";
                if (("|" + cur + "|").indexOf("|" + cat.id + "|") === -1) seen[href].setAttribute("data-cats", cur ? cur + "|" + cat.id : cat.id);
                return;
            }
            seen[href] = wrap;
            wrap.setAttribute("data-cat", cat.id);
            wrap.setAttribute("data-cats", cat.id);
            wrap.classList.add("visible");
            items.push(wrap);
            grid.appendChild(wrap);
            a.addEventListener("click", function (e) { e.preventDefault(); toggleCard(a); });
        });
        markCards();
        filterGrid();
    }
    function parsePage(html) {
        var tmp = document.createElement("div");
        tmp.innerHTML = html;
        var wraps = [].slice.call(tmp.querySelectorAll(".reveal-fade-up"));
        var mark = tmp.querySelector("[data-kz-loaded]");
        return { wraps: wraps, loaded: mark ? Number(mark.getAttribute("data-kz-loaded") || "0") : wraps.length };
    }
    function fetchCat(cat) {
        var lastKey = "";
        function loop(pageNo) {
            return fetch("/search?category_id=" + encodeURIComponent(cat.id) + "&type=EXPAND&page=" + pageNo + "&pg=" + pageNo)
                .then(function (res) { return res.text(); })
                .then(parsePage)
                .then(function (row) {
                    var key = row.wraps.map(function (w) { var a = w.querySelector("a.kz-card"); return a ? a.getAttribute("href") : ""; }).join("|");
                    if (pageNo > 1 && key && key === lastKey) return;
                    lastKey = key;
                    ingest(cat, row.wraps);
                    if (row.loaded >= PAGE_SIZE && pageNo < MAX_PAGE) return loop(pageNo + 1);
                }).catch(function () {});
        }
        return loop(1);
    }
    function seedExisting() {
        [].slice.call(grid.querySelectorAll(".reveal-fade-up")).forEach(function (wrap) {
            var a = wrap.querySelector("a.kz-card");
            var href = a && a.getAttribute("href");
            if (!href || seen[href]) return;
            seen[href] = wrap;
            wrap.setAttribute("data-cat", "d05b7441-8bed-496a-ab61-06cf49aaf233");
            wrap.setAttribute("data-cats", "d05b7441-8bed-496a-ab61-06cf49aaf233");
            items.push(wrap);
            a.addEventListener("click", function (e) { e.preventDefault(); toggleCard(a); });
        });
    }
    function fillIds(item) {
        if (item.productId) return Promise.resolve(item);
        return fetch(item.href, { credentials: "same-origin" }).then(function (res) { return res.text(); }).then(function (html) {
            var box = document.createElement("div");
            box.innerHTML = html;
            var wrap = box.querySelector("#product-wrapper");
            if (wrap) item.productId = wrap.getAttribute("data-product-id") || "";
            var chosen = box.querySelector("[data-variant-id][data-selected='true']") || box.querySelector("[data-variant-id]");
            if (chosen) item.variantId = chosen.getAttribute("data-variant-id") || item.variantId;
            return item;
        });
    }
    function clearCart() {
        return ((window.Cart && Cart.products) || []).slice().reduce(function (chain, row) {
            return chain.then(function () {
                var id = (row.details && row.details.id) || row.product_id || row.id;
                if (id && Cart.removeItem) return Cart.removeItem(id);
            });
        }, Promise.resolve());
    }
    function checkout() {
        if (selected.length !== size || gifts.length !== bonusOf(size) || busy) return;
        if (!window.Cart || !Cart.addItem) return notify("Carrinho indisponível. Recarregue a página.");
        busy = true;
        paintTotals();
        selected.concat(gifts).reduce(function (chain, item) { return chain.then(function () { return fillIds(item); }); }, Promise.resolve())
            .then(clearCart)
            .then(function () {
                return selected.reduce(function (chain, item) {
                    return chain.then(function () {
                        if (!item.productId) throw new Error("Não achei o id de " + (item.title || "um jogo"));
                        return Cart.addItem(item.productId, item.variantId || undefined, 1, undefined, { skipSheet: true });
                    });
                }, Promise.resolve());
            })
            .then(function () {
                var missingGift = gifts.some(function (it) { return !it.productId; });
                if (missingGift) throw new Error("Não achei o id de um jogo grátis.");
                save();
                sessionStorage.setItem("kzPackCoupon", COUPON);
                window.location.href = "/checkout";
            })
            .catch(function (err) {
                busy = false;
                paintTotals();
                notify((err && err.message) || "Não deu para montar o checkout.");
            });
    }

    restore();
    seedExisting();
    page.querySelectorAll("[data-pack]").forEach(function (btn) {
        btn.addEventListener("click", function () { setSize(Number(btn.getAttribute("data-pack")), true); });
    });
    CATS.forEach(function (cat) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cb-chip" + (cat.id === "" ? " is-on" : "");
        btn.textContent = cat.name;
        btn.addEventListener("click", function () {
            currentCat = cat.id;
            chipsEl.querySelectorAll(".cb-chip").forEach(function (el) { el.classList.toggle("is-on", el === btn); });
            filterGrid();
        });
        chipsEl.appendChild(btn);
    });
    searchEl.addEventListener("input", function () { q = fold(searchEl.value); filterGrid(); });
    setSize(size, false);
    goEl.addEventListener("click", checkout);
    var i = 0;
    function next() {
        if (i >= FETCH_CATS.length) {
            if (statusEl && items.length) statusEl.textContent = items.length + " jogos";
            return;
        }
        fetchCat(FETCH_CATS[i++]).then(next);
    }
    next();
})();
