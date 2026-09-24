(function () {
  var KEY = "kz-cart";
  var listeners = [];

  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    render();
    listeners.forEach(function (fn) { fn(items); });
  }

  function cents(value) {
    var match = String(value || "").replace(/\s/g, "").match(/(\d[\d.]*)[,.](\d{2})/);
    if (!match) return 0;
    return Number(match[1].replace(/\./g, "")) * 100 + Number(match[2]);
  }

  function money(amount) {
    return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function units(items) {
    return items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function total(items) {
    return items.reduce(function (sum, item) { return sum + item.cents * item.qty; }, 0);
  }

  function render() {
    var items = read();
    var drawer = document.querySelector("cart-drawer");
    var list = document.getElementById("CartDrawer-CartItems");
    var drawerItems = document.querySelector("cart-drawer-items");
    if (!drawer || !list) return;

    var count = units(items);
    document.querySelectorAll(".sk-cart-dropdown__count").forEach(function (el) {
      el.textContent = "(" + count + ")";
    });
    document.querySelectorAll(".cart-count-bubble").forEach(function (bubble) {
      var shown = bubble.querySelector('[aria-hidden="true"]');
      var hidden = bubble.querySelector(".visually-hidden");
      if (shown) shown.textContent = String(count);
      if (hidden) hidden.textContent = count + (count === 1 ? " item no carrinho" : " itens no carrinho");
    });

    drawer.classList.toggle("is-empty", count === 0);
    if (drawerItems) drawerItems.classList.toggle("is-empty", count === 0);

    list.querySelectorAll(".sk-cart-item").forEach(function (el) { el.remove(); });
    var oldFoot = drawer.querySelector(".sk-cart-dropdown__footer");
    if (oldFoot) oldFoot.remove();
    if (!count) return;

    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "sk-cart-item";
      row.innerHTML =
        '<div class="sk-cart-item__image">' + (item.image ? '<img alt="" src="' + item.image + '">' : "") + "</div>" +
        '<div class="sk-cart-item__info">' +
          '<div class="sk-cart-item__line1"><span class="sk-cart-item__name"></span></div>' +
          '<div class="sk-cart-item__line2">' +
            '<div class="kz-cart-qty">' +
              '<button type="button" data-kz-qty="-1" aria-label="Diminuir quantidade">−</button>' +
              '<span></span>' +
              '<button type="button" data-kz-qty="1" aria-label="Aumentar quantidade">+</button>' +
            "</div>" +
            '<span class="sk-cart-item__price"></span>' +
          "</div>" +
        "</div>" +
        '<button type="button" class="sk-cart-item__remove" aria-label="Remover"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></button>';
      row.querySelector(".sk-cart-item__name").textContent = item.title;
      row.querySelector(".kz-cart-qty span").textContent = String(item.qty);
      row.querySelector(".sk-cart-item__price").textContent = money(item.cents * item.qty);
      row.querySelector("[data-kz-qty='-1']").addEventListener("click", function (event) {
        event.stopPropagation();
        change(item.id, -1);
      });
      row.querySelector("[data-kz-qty='1']").addEventListener("click", function (event) {
        event.stopPropagation();
        change(item.id, 1);
      });
      row.querySelector(".sk-cart-item__remove").addEventListener("click", function (event) {
        event.stopPropagation();
        remove(item.id);
      });
      list.appendChild(row);
    });

    var foot = document.createElement("div");
    foot.className = "sk-cart-dropdown__footer";
    foot.innerHTML =
      '<div class="sk-cart-dropdown__checkout-btn">Total <span class="sk-cart-dropdown__checkout-sep">·</span> <span class="sk-cart-dropdown__checkout-total"></span></div>' +
      '<p class="kz-cart-note">Salvo neste navegador. O pagamento no Pix entra na próxima etapa.</p>';
    foot.querySelector(".sk-cart-dropdown__checkout-total").textContent = money(total(items));
    drawer.querySelector(".sk-cart-dropdown__inner").appendChild(foot);
  }

  function add(product) {
    var items = read();
    var id = product.id || product.title;
    var found = items.filter(function (item) { return item.id === id; })[0];
    if (found) found.qty += 1;
    else items.push({
      id: id,
      title: product.title,
      image: product.cover || (product.images && product.images[0] && product.images[0].src) || "",
      cents: cents(product.price),
      qty: 1
    });
    write(items);
    var drawer = document.querySelector("cart-drawer");
    if (drawer && typeof drawer.open === "function") {
      setTimeout(function () { drawer.open(); }, 0);
    }
  }

  function change(id, delta) {
    var items = read().map(function (item) {
      if (item.id === id) item.qty += delta;
      return item;
    }).filter(function (item) { return item.qty > 0; });
    write(items);
  }

  function remove(id) {
    write(read().filter(function (item) { return item.id !== id; }));
  }

  function has(id) {
    return read().some(function (item) { return item.id === id; });
  }

  window.KZCart = {
    add: add,
    remove: remove,
    has: has,
    onChange: function (fn) { listeners.push(fn); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
