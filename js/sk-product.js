(function () {
  var root = document.querySelector("[data-kz-detail]");
  if (!root) return;

  var sheet = root.querySelector(".kz-detail__sheet");
  var hero = root.querySelector("[data-kz-hero]");
  var thumbs = root.querySelector("[data-kz-thumbs]");
  var cover = root.querySelector("[data-kz-cover]");
  var title = root.querySelector("[data-kz-title]");
  var wasRow = root.querySelector("[data-kz-was-row]");
  var was = root.querySelector("[data-kz-was]");
  var off = root.querySelector("[data-kz-off]");
  var activateTitle = root.querySelector("[data-kz-activate-title]");
  var now = root.querySelector("[data-kz-now]");
  var activate = root.querySelector("[data-kz-activate]");
  var cartBtn = root.querySelector("[data-kz-cart]");
  var rail = root.querySelector("[data-kz-rail]");
  var prev = root.querySelector("[data-kz-prev]");
  var next = root.querySelector("[data-kz-next]");
  var current = null;
  var lastFocus = null;

  var gem = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.1 10.4 6 6 10.9 1.6 6Z"/></svg>';
  var cartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 18Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM6.3 6l.5 2h11.7l-1.5 7H8.2L6.5 4.2H3.2V2.4h4.4l.4 1.6h13.1l-2.1 10.2H7.7L6.3 6Z"/></svg>';

  function text(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function discountLabel(pill, original, price) {
    var fromPill = String(pill || "").match(/(\d+)\s*%/);
    if (fromPill) return fromPill[1] + "% OFF";
    var a = cents(original);
    var b = cents(price);
    if (a > b && a > 0) return Math.round((1 - b / a) * 100) + "% OFF";
    return "";
  }

  function cents(value) {
    var match = String(value || "").replace(/\s/g, "").match(/(\d[\d.]*)[,.](\d{2})/);
    if (!match) return 0;
    return Number(match[1].replace(/\./g, "")) * 100 + Number(match[2]);
  }

  function platformFrom(title) {
    var match = String(title).match(/\(([^)]+)\)\s*$/);
    if (!match) return "Steam";
    if (/steam/i.test(match[1])) return "Steam";
    if (/ps/i.test(match[1])) return "PlayStation";
    return match[1];
  }

  function pack(id, titleText, src, alt, original, price, pill, platform, cats) {
    var images = src ? [{ src: src, alt: alt || titleText }] : [];
    return {
      id: id || titleText,
      title: titleText,
      images: images,
      cover: src || "",
      original: original,
      price: price,
      off: discountLabel(pill, original, price),
      platform: platform || "Steam",
      cats: cats || ""
    };
  }

  function fromCard(card) {
    if (card.classList.contains("sk-tw-card")) {
      var shot = card.querySelector(".sk-tw-card__img");
      var name = text(card.querySelector(".sk-tw-card__name"));
      return pack(name, name, shot && shot.getAttribute("src"), shot && shot.getAttribute("alt"), text(card.querySelector(".sk-tw-card__price s")), text(card.querySelector(".sk-tw-card__price strong")), "", platformFrom(name), "");
    }
    if (card.classList.contains("card-wrapper--sk-ig")) {
      var heading = card.querySelector(".card__information__horizontal .card__heading") || card.querySelector(".card__heading");
      var name = text(heading);
      var shot = card.querySelector(".main-image-steam, .card__media img");
      var sale = text(card.querySelector(".price-item--sale")) || text(card.querySelector(".price-item--last"));
      var regular = text(card.querySelector("s.price-item--regular"));
      return pack(name, name, shot && shot.getAttribute("src"), shot && shot.getAttribute("alt"), regular, sale, text(card.querySelector(".label-roxa")), platformFrom(name), "");
    }
    var img = card.querySelector(".kz-card__shot img");
    var images = [];
    var extra = card.getAttribute("data-gallery") || "";
    extra.split("|").forEach(function (src) {
      src = src.trim();
      if (src) images.push({ src: src, alt: "" });
    });
    if (img && img.getAttribute("src")) {
      images.unshift({ src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" });
    }
    var seen = Object.create(null);
    images = images.filter(function (item) {
      if (seen[item.src]) return false;
      seen[item.src] = true;
      return true;
    });
    var platform = text(card.querySelector(".kz-card__who-v")) || "Steam";
    var original = text(card.querySelector(".kz-card__bid s"));
    var price = text(card.querySelector(".kz-card__price strong"));
    var id = card.getAttribute("data-name") || text(card.querySelector(".kz-card__title"));
    return {
      id: id,
      title: text(card.querySelector(".kz-card__title")),
      images: images,
      cover: card.getAttribute("data-cover") || (images[0] && images[0].src) || "",
      original: original,
      price: price,
      off: discountLabel(text(card.querySelector(".kz-card__pill")), original, price),
      platform: platform,
      cats: card.getAttribute("data-cats") || ""
    };
  }

  function paintThumbs(product, index) {
    thumbs.innerHTML = "";
    product.images.forEach(function (image, i) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "kz-detail__thumb" + (i === index ? " is-on" : "");
      button.setAttribute("aria-label", "Ver imagem " + (i + 1));
      button.setAttribute("aria-pressed", i === index ? "true" : "false");
      var pic = document.createElement("img");
      pic.src = image.src;
      pic.alt = "";
      button.appendChild(pic);
      button.addEventListener("click", function () { showImage(product, i); });
      thumbs.appendChild(button);
    });
  }

  function showImage(product, index) {
    var image = product.images[index] || product.images[0];
    if (!image) return;
    hero.src = image.src;
    hero.alt = image.alt || product.title;
    paintThumbs(product, index);
  }

  function paintCart(product) {
    var added = window.KZCart && KZCart.has(product.id);
    cartBtn.classList.toggle("is-in", added);
    cartBtn.innerHTML = cartIcon + (added ? " Adicionado ao carrinho" : " Adicionar ao carrinho");
    cartBtn.setAttribute("aria-pressed", added ? "true" : "false");
  }

  function similarOf(product) {
    var cards = [].slice.call(document.querySelectorAll(".kz-card, .sk-tw-card, .card-wrapper--sk-ig"));
    var mine = product.cats.split(/\s+/).filter(Boolean);
    var seen = Object.create(null);
    var ranked = cards.map(function (card) {
      var item = fromCard(card);
      if (!item.title || item.id === product.id || seen[item.id]) return null;
      seen[item.id] = true;
      var score = 0;
      mine.forEach(function (cat) {
        if ((" " + item.cats + " ").indexOf(" " + cat + " ") !== -1) score += 1;
      });
      return { item: item, score: score };
    }).filter(Boolean);
    ranked.sort(function (a, b) { return b.score - a.score; });
    return ranked.slice(0, 12).map(function (row) { return row.item; });
  }

  function paintSimilar(product) {
    rail.innerHTML = "";
    similarOf(product).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "kz-sim";
      var shot = document.createElement("div");
      shot.className = "kz-sim__shot";
      var pic = document.createElement("img");
      pic.src = item.cover;
      pic.alt = item.title;
      shot.appendChild(pic);
      var tag = document.createElement("span");
      tag.className = "kz-sim__tag";
      tag.textContent = "Chave " + item.platform;
      shot.appendChild(tag);
      card.appendChild(shot);
      var heading = document.createElement("h3");
      heading.textContent = item.title;
      card.appendChild(heading);
      if (item.original) {
        var row = document.createElement("p");
        row.className = "kz-sim__was";
        var strike = document.createElement("s");
        strike.textContent = item.original;
        row.appendChild(strike);
        if (item.off) {
          var badge = document.createElement("span");
          badge.className = "kz-sim__off";
          badge.textContent = item.off;
          row.appendChild(badge);
        }
        card.appendChild(row);
      }
      var price = document.createElement("p");
      price.className = "kz-sim__price";
      price.textContent = item.price;
      card.appendChild(price);
      var pix = document.createElement("p");
      pix.className = "kz-sim__pix";
      pix.innerHTML = gem + " À vista no Pix";
      card.appendChild(pix);
      var buy = document.createElement("button");
      buy.type = "button";
      buy.className = "kz-sim__buy";
      buy.innerHTML = cartIcon + " Comprar agora";
      buy.addEventListener("click", function () { openProduct(item); });
      card.appendChild(buy);
      rail.appendChild(card);
    });
    rail.scrollLeft = 0;
    requestAnimationFrame(syncArrows);
  }

  function openProduct(product) {
    current = product;
    title.textContent = product.title;
    cover.src = product.cover;
    cover.alt = product.title;
    was.textContent = product.original;
    off.textContent = product.off;
    off.hidden = !product.off;
    wasRow.hidden = !product.original && !product.off;
    now.textContent = product.price;
    activateTitle.textContent = "3. Ative na " + product.platform;
    activate.textContent = "Resgate a key direto na " + product.platform + ", baixe o jogo e pronto — é seu para sempre.";
    showImage(product, 0);
    paintCart(product);
    paintSimilar(product);
    if (root.hidden) {
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.style.overflow = "hidden";
      sheet.scrollTop = 0;
      root.querySelector(".kz-detail__close").focus();
    } else {
      sheet.scrollTop = 0;
    }
  }

  function close() {
    if (root.hidden) return;
    root.hidden = true;
    document.body.style.overflow = "";
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function syncArrows() {
    var max = rail.scrollWidth - rail.clientWidth - 4;
    prev.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft >= max;
  }

  function scrollRail(dir) {
    var card = rail.querySelector(".kz-sim");
    var step = card ? card.getBoundingClientRect().width + 16 : 226;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  document.querySelectorAll(".card-wrapper--sk-ig").forEach(function (card) {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest(".kz-detail")) return;
    var card = event.target.closest(".kz-card, .sk-tw-card, .card-wrapper--sk-ig");
    if (!card) return;
    event.preventDefault();
    openProduct(fromCard(card));
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-kz-close]")) close();
  });

  cartBtn.addEventListener("click", function () {
    if (!current || !window.KZCart) return;
    KZCart.add(current);
    paintCart(current);
  });
  if (window.KZCart) KZCart.onChange(function () { if (current) paintCart(current); });

  prev.addEventListener("click", function () { scrollRail(-1); });
  next.addEventListener("click", function () { scrollRail(1); });
  rail.addEventListener("scroll", syncArrows);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    var card = event.target.closest(".kz-card, .sk-tw-card, .card-wrapper--sk-ig");
    if (!card || event.target !== card) return;
    event.preventDefault();
    openProduct(fromCard(card));
  });
})();
