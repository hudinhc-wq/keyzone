const checkout = document.querySelector("#checkout");
if (checkout) {
    const productsList = checkout.querySelector("#products-list");
    const emptyHTML = checkout.querySelector("#empty-products")?.outerHTML || "";
    const couponInput = checkout.querySelector("#coupon-input");
    const couponButton = checkout.querySelector("#coupon-button");
    const couponError = checkout.querySelector("#coupon-error");
    const documentField = checkout.querySelector("#client_document");
    const paymentButtons = checkout.querySelectorAll("[data-payment-method]");

    const cardFields = checkout.querySelector("#credit-card-fields");
    const cardNumberInput = checkout.querySelector("input[name=card_number]");
    const cardHolderInput = checkout.querySelector("input[name=card_holder]");
    const cardExpiryInput = checkout.querySelector("input[name=card_expiry]");
    const cardCvvInput = checkout.querySelector("input[name=card_cvv]");
    const cardInstallments = checkout.querySelector("#card-installments");
    const cardBrandEl = checkout.querySelector("#card-brand");

    const INSTALLMENT_MARKUP = {
        1: 0,
        2: 0.07,
        3: 0.08,
        4: 0.09,
        5: 0.1,
        6: 0.11,
        7: 0.14,
        8: 0.15,
        9: 0.16,
        10: 0.1578,
        11: 0.1596,
        12: 0.1666,
    };

    function loadEfiTokenScript() {
        return new Promise((resolve, reject) => {
            if (window.EfiPay && window.EfiPay.CreditCard) return resolve(window.EfiPay);
            const existing = document.querySelector("script[data-efi-token]");
            if (existing) {
                existing.addEventListener("load", () => resolve(window.EfiPay));
                existing.addEventListener("error", () => reject(new Error("Falha ao carregar tokenização Efí")));
                return;
            }
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi-umd.min.js";
            script.async = true;
            script.dataset.efiToken = "1";
            script.onload = () => resolve(window.EfiPay);
            script.onerror = () => reject(new Error("Falha ao carregar tokenização Efí"));
            document.head.appendChild(script);
        });
    }

    async function tokenizeEfiCard({ payee, number, cvv, holder, expiryMonth, expiryYear, document }) {
        const EfiPay = await loadEfiTokenScript();
        if (!EfiPay?.CreditCard) throw new Error("Biblioteca de cartão da Efí indisponível.");
        const brand = detectCardBrand(number);
        const efiBrand = brand === "mastercard" ? "mastercard" : brand === "amex" ? "amex" : brand === "elo" ? "elo" : "visa";
        let year = expiryYear;
        if (year.length === 2) year = "20" + year;
        const result = await EfiPay.CreditCard.setAccount(payee)
            .setEnvironment("production")
            .setCreditCardData({
                brand: efiBrand,
                number,
                cvv,
                expirationMonth: expiryMonth,
                expirationYear: year,
                holderName: holder,
                holderDocument: document,
                reuse: false,
            })
            .getPaymentToken();
        const token = result?.payment_token;
        if (!token) throw new Error("A Efí não retornou o token do cartão.");
        return token;
    }

    function detectCardBrand(digits) {
        if (/^(4011|4312|4389|4514|4576|5041|5067|509|6277|6363|6504|6505|6509|6516|6550)/.test(digits)) return "elo";
        if (/^(606282|3841)/.test(digits)) return "hipercard";
        if (/^3[47]/.test(digits)) return "amex";
        if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard";
        if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
        if (/^4/.test(digits)) return "visa";
        return "";
    }

    const CARD_BRAND_ICONS = {
        visa: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path fill="#fff" d="M19.4 21.2 22.1 10.8h3.2l-2.7 10.4h-3.2zm-7.3 0 2.6-10.4h3.1l-2.6 10.4h-3.1zm16.3-7.3c-.6-.3-1.6-.6-2.8-.6-3.1 0-5.3 1.6-5.3 4 0 1.7 1.6 2.7 2.8 3.3 1.3.6 1.7 1 1.7 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.7l-.4-.2-.5 2.8c.8.4 2.3.7 3.9.7 3.3 0 5.4-1.6 5.4-4.1 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.8-1-1.8-1.6 0-.5.6-1.1 1.9-1.1 1.1 0 1.9.2 2.5.5l.3.1.4-2.5zm8.8 7.3h-2.5s-.2-.8-.4-1.1h-4.2l-.7 1.1h-3.2l4.4-10.1c.3-.7.8-1 1.5-1h2.4l2.7 10.1zm-3.3-3.2c.4-1.1 1.6-4.3 1.6-4.3s.3.9.5 1.6l.7 2.7h-2.8z"/><path fill="#F9A51A" d="M11.4 10.8 8.3 21.2H5.1L3.7 13c-.1-.4-.2-.6-.5-.8-.6-.3-1.5-.6-2.3-.8l.1-.6h3.9c.5 0 1 .4 1.1 1l1 5.3 2.5-6.3h3.3z"/></svg>',
        mastercard: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#1c1c1c"/><circle cx="19.5" cy="16" r="8" fill="#EB001B"/><circle cx="28.5" cy="16" r="8" fill="#F79E1B"/><path fill="#FF5F00" d="M24 9.7a8 8 0 0 1 0 12.6 8 8 0 0 1 0-12.6z"/></svg>',
        amex: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#2E77BB"/><path fill="#fff" d="M8 20.8 11.4 11h3.3l3.4 9.8h-3l-.6-1.8h-3.8l-.6 1.8H8zm4.4-4 1.1-3.3 1.1 3.3h-2.2zm9.2 4V11h4.6c1.8 0 3 .8 3 2.5 0 1.1-.6 1.9-1.6 2.2l2 5.1h-3.1l-1.6-4.2h-1.2v4.2h-2.1zm2.1-5.8h1.6c.6 0 .9-.3.9-.8s-.3-.8-.9-.8h-1.6v1.6zM31.2 11h8.6v2.2h-6.4v1.6h6.1v2.1h-6.1v1.7h6.5v2.2h-8.7V11z"/></svg>',
        elo: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#000"/><circle cx="18" cy="16" r="7" fill="#FFCB05"/><circle cx="24" cy="16" r="7" fill="#00A4E0"/><circle cx="30" cy="16" r="7" fill="#EF3E42"/></svg>',
        hipercard: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#B3131B"/><path fill="#fff" d="M10 11.2h4.2c3.4 0 5.5 1.8 5.5 4.8S17.6 20.8 14.2 20.8H10V11.2zm3 7.4h1c1.6 0 2.5-.8 2.5-2.6s-.9-2.6-2.5-2.6h-1v5.2zm8.4-7.4h2.9l3.3 5.2 3.3-5.2h2.9v9.6h-2.8v-5.2l-2.6 4h-1.6l-2.6-4v5.2h-2.8V11.2z"/></svg>',
        discover: '<svg viewBox="0 0 48 32" class="h-6 w-10" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" rx="4" fill="#fff"/><rect x="24" width="24" height="32" rx="0" fill="#F76F1A"/><path fill="#F76F1A" d="M24 0h8c6.6 0 12 7.2 12 16S38.6 32 32 32h-8V0z"/><path fill="#1c1c1c" d="M8.2 20.4V11.6h2.4c2.2 0 3.5 1.1 3.5 2.9 0 1.8-1.3 2.9-3.5 2.9H10v3h-1.8zm1.8-4.5h.6c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4h-.6v2.8zm6.6 4.5V11.6h5.2v1.6h-3.4v1.6h3.2v1.5h-3.2v2.5h3.5v1.6h-5.3zm6.9 0V11.6h1.8l2.4 5.6V11.6h1.7v8.8h-1.8l-2.4-5.6v5.6h-1.7z"/></svg>',
    };

    function luhnOk(num) {
        let sum = 0;
        let alt = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let n = parseInt(num[i], 10);
            if (alt) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alt = !alt;
        }
        return num.length >= 13 && sum % 10 === 0;
    }

    function formatCardNumber(value) {
        const digits = value.replace(/\D/g, "").slice(0, 19);
        return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }

    function formatExpiry(value) {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        if (digits.length <= 2) return digits;
        return digits.slice(0, 2) + "/" + digits.slice(2);
    }

    function checkoutTotal() {
        const cartSubtotal = Cart.calculateTotal();
        let bumpsSubtotal = 0;
        selectedBumps.forEach((entry) => {
            bumpsSubtotal += entry.bump_price * (entry.quantity || 1);
        });
        const subtotal = cartSubtotal + bumpsSubtotal;
        let discount = 0;
        if (appliedDiscount && cartSubtotal > 0) {
            const discType = appliedDiscount.discount_type || appliedDiscount.discountType;
            const discValue = Number(appliedDiscount.discount_value || appliedDiscount.discountValue);
            discount = discType === "PERCENTAGE" ? cartSubtotal * (discValue / 100) : Math.min(discValue, cartSubtotal);
        }
        return Math.max(0, subtotal - discount);
    }

    function refreshInstallments() {
        if (!cardInstallments) return;
        const total = checkoutTotal();
        const selected = cardInstallments.value || "1";
        const options = [];
        const cardBtn = checkout.querySelector("[data-payment-method='CREDIT_CARD']");
        const maxInstallments = Math.min(
            12,
            Math.max(1, parseInt(cardBtn?.getAttribute("data-max-installments") || "12", 10) || 12),
        );
        for (let n = 1; n <= maxInstallments; n++) {
            const markup = INSTALLMENT_MARKUP[n] || 0;
            const withInterest = total * (1 + markup);
            const installment = withInterest / n;
            if (n > 1 && installment < 5) continue;
            const label =
                n === 1
                    ? `1x de ${SellTrust.formatPrice(total)} à vista`
                    : `${n}x de ${SellTrust.formatPrice(installment)} (total ${SellTrust.formatPrice(withInterest)})`;
            options.push(`<option value="${n}">${label}</option>`);
        }
        cardInstallments.innerHTML = options.join("") || `<option value="1">1x à vista</option>`;
        const still = [...cardInstallments.options].some((o) => o.value === selected);
        cardInstallments.value = still ? selected : "1";
    }

    cardNumberInput?.addEventListener("input", (e) => {
        e.target.value = formatCardNumber(e.target.value);
        const brand = detectCardBrand(e.target.value.replace(/\D/g, ""));
        if (cardBrandEl) cardBrandEl.innerHTML = CARD_BRAND_ICONS[brand] || "";
    });

    cardExpiryInput?.addEventListener("input", (e) => {
        e.target.value = formatExpiry(e.target.value);
    });

    cardCvvInput?.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });

    function onPaymentMethodChange(btn) {
        paymentButtons.forEach((b) => b.setAttribute("data-selected", "false"));
        btn.setAttribute("data-selected", "true");
        const method = btn.getAttribute("data-payment-method");
        const requireDoc = btn.getAttribute("data-require-document") === "true" || method === "CREDIT_CARD";
        if (documentField) documentField.classList.toggle("hidden", !requireDoc);
        if (cardFields) cardFields.classList.toggle("hidden", method !== "CREDIT_CARD");
        const efiExtra = checkout.querySelector("#efi-card-extra");
        const isEfi = method === "CREDIT_CARD" && btn.getAttribute("data-card-provider") === "EFI_PAY";
        if (efiExtra) efiExtra.classList.toggle("hidden", !isEfi);
        if (method === "CREDIT_CARD") {
            if (cardHolderInput && !cardHolderInput.value) {
                cardHolderInput.value = checkout.querySelector("input[name=name]")?.value || "";
            }
            refreshInstallments();
        }
    }

    let appliedDiscount = null;
    let availableBumps = [];
    const selectedBumps = new Map();

    paymentButtons.forEach((btn) => btn.addEventListener("click", () => onPaymentMethodChange(btn)));

    const initialBtn = checkout.querySelector("[data-selected='true']");
    if (initialBtn) onPaymentMethodChange(initialBtn);

    const bumpsContainer = checkout.querySelector("#order-bumps-container");
    const BUMP_NO_IMAGE = bumpsContainer?.dataset.noImage || "";

    const BUMP_BTN_BASE =
        "bump-add-btn shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";
    const BUMP_BTN_ADD = "bg-blue-600 text-white shadow-sm hover:bg-blue-500";
    const BUMP_BTN_REMOVE = "border border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10";

    const computeBumpsSubtotal = () => {
        let total = 0;
        selectedBumps.forEach((entry) => {
            total += entry.bump_price * (entry.quantity || 1);
        });
        return total;
    };

    const updatePricing = () => {
        const pricing = checkout.querySelector("#pricing");
        if (!pricing) return;

        const cartSubtotal = Cart.calculateTotal();
        const bumpsSubtotal = computeBumpsSubtotal();
        const subtotal = cartSubtotal + bumpsSubtotal;
        let discount = 0;

        if (appliedDiscount && cartSubtotal > 0) {
            let discType = appliedDiscount.discount_type || appliedDiscount.discountType;
            let discValue = Number(appliedDiscount.discount_value || appliedDiscount.discountValue);

            discount = discType === "PERCENTAGE" ? cartSubtotal * (discValue / 100) : Math.min(discValue, cartSubtotal);
        }

        const total = Math.max(0, subtotal - discount);

        pricing.querySelector(".subtotal-value").textContent = SellTrust.formatPrice(subtotal);
        pricing.querySelector(".discount-value").textContent = SellTrust.formatPrice(discount);
        pricing.querySelector(".total-value").textContent = SellTrust.formatPrice(total);
        document.querySelector("#pay-button-price").textContent = SellTrust.formatPrice(total);
        refreshInstallments();
    };

    const renderBumps = () => {
        if (!bumpsContainer) return;
        const savedBumpScrolls = bumpsContainer.querySelectorAll(".order-bump-scroll-inner").length
            ? [...bumpsContainer.querySelectorAll(".order-bump-scroll-inner")].map((el) => el.scrollTop)
            : [];

        if (!availableBumps.length) {
            bumpsContainer.classList.add("hidden");
            bumpsContainer.innerHTML = "";
            return;
        }

        bumpsContainer.classList.remove("hidden");
        bumpsContainer.innerHTML = availableBumps
            .map((bump) => {
                const productsHTML = bump.products
                    .map((product) => {
                        const key = bump.id + ":" + product.id;
                        const isChecked = selectedBumps.has(key);
                        const hasDiscount = product.bump_price < product.original_price;
                        const image = product.image || BUMP_NO_IMAGE;
                        
                        const btnClass = isChecked ? BUMP_BTN_REMOVE : BUMP_BTN_ADD;
                        const btnText = isChecked ? "Remover" : "Adicionar";

                        return `
                            <div class="flex items-start gap-4 px-4 py-4" data-bump-id="${bump.id}" data-product-id="${product.id}">
                                <div class="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                    <img src="${image}" class="size-full object-contain bg-black/40" alt="${product.title}" />
                                </div>
                                <div class="flex-1 min-w-0 pt-0.5">
                                    <p class="text-sm font-medium leading-snug text-foreground line-clamp-2">${product.title}</p>
                                    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                        ${hasDiscount ? `<span class="text-xs text-muted-foreground line-through">${SellTrust.formatPrice(product.original_price)}</span>` : ""}
                                        <span class="text-sm font-semibold ${hasDiscount ? "text-emerald-500" : "text-foreground"}">${SellTrust.formatPrice(product.bump_price)}</span>
                                    </div>
                                </div>
                                <button type="button" class="${BUMP_BTN_BASE} ${btnClass}">
                                    ${btnText}
                                </button>
                            </div>
                        `;
                    })
                    .join("");

                return `
                    <div class="border border-white/10 rounded-lg overflow-hidden">
                        <div class="flex items-start gap-3 border-b border-white/10 p-4">
                            <i data-lucide="flame" class="size-5 text-orange-500 shrink-0 mt-0.5"></i>
                            <div class="min-w-0">
                                <p class="text-sm font-bold text-foreground uppercase tracking-wide">${bump.title}</p>
                                ${bump.description ? `<p class="text-xs text-muted-foreground mt-1 leading-relaxed">${bump.description}</p>` : ""}
                            </div>
                        </div>
                        <div class="order-bump-scroll-inner max-h-[280px] divide-y divide-white/10 overflow-y-auto pr-1 custom-scrollbar">
                            ${productsHTML}
                        </div>
                    </div>
                `;
            })
            .join("");

        if (window.lucide) window.lucide.createIcons();

        bumpsContainer.querySelectorAll(".order-bump-scroll-inner").forEach((el, i) => {
            if (savedBumpScrolls[i] !== undefined) {
                requestAnimationFrame(() => {
                    el.scrollTop = savedBumpScrolls[i];
                });
            }
        });

        bumpsContainer.querySelectorAll(".bump-add-btn").forEach((btn) => {
            const container = btn.closest("[data-bump-id]");
            const bump_id = container.getAttribute("data-bump-id");
            const product_id = container.getAttribute("data-product-id");
            const key = bump_id + ":" + product_id;

            const bump = availableBumps.find((b) => b.id === bump_id);
            const product = bump?.products.find((p) => p.id === product_id);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                if (selectedBumps.has(key)) {
                    selectedBumps.delete(key);
                } else {
                    selectedBumps.set(key, {
                        bump_id,
                        product_id,
                        bump_price: product?.bump_price || 0,
                        quantity: 1,
                    });
                }
                updatePricing();
                const on = selectedBumps.has(key);
                btn.textContent = on ? "Remover" : "Adicionar";
                btn.className = `${BUMP_BTN_BASE} ${on ? BUMP_BTN_REMOVE : BUMP_BTN_ADD}`;
            });
        });
    };

    const refreshBumps = async () => {
        const productIds = Array.from(new Set(Cart.products.map((p) => p.product_id)));
        if (productIds.length === 0) {
            availableBumps = [];
            selectedBumps.clear();
            renderBumps();
            updatePricing();
            return;
        }
        try {
            const res = await SellTrust.matchOrderBumps(productIds);
            availableBumps = res || [];

            const validKeys = new Set();
            availableBumps.forEach((b) => b.products.forEach((p) => validKeys.add(b.id + ":" + p.id)));
            Array.from(selectedBumps.keys()).forEach((key) => {
                if (!validKeys.has(key)) selectedBumps.delete(key);
            });

            renderBumps();
            updatePricing();
        } catch (err) {
            availableBumps = [];
            renderBumps();
        }
    };

    const render = () => {
        const products = Cart.products;
        if (!products.length) {
            productsList.innerHTML = emptyHTML;
            updatePricing();
            return;
        }

        productsList.innerHTML =
            typeof window.getCheckoutItemsRender === "function" ? window.getCheckoutItemsRender(products) : "";
        window.lucide?.createIcons();
        if (window.kzEnsureGameNames) {
            window.kzEnsureGameNames(products).then((changed) => {
                if (changed) render();
            });
        }

        productsList.querySelectorAll("[data-product-id]").forEach((item) => {
            const id = item.dataset.productId;
            const input = item.querySelector("input");

            item.querySelector("[data-action='add-quantity']")?.addEventListener("click", () =>
                Cart.updateQuantity(id, (parseInt(input.value) || 1) + 1),
            );
            item.querySelector("[data-action='remove-quantity']")?.addEventListener("click", () =>
                Cart.updateQuantity(id, Math.max(1, (parseInt(input.value) || 1) - 1)),
            );
            item.querySelector("[data-action='remove-item']")?.addEventListener("click", () => Cart.removeItem(id));
            input?.addEventListener("change", (e) =>
                Cart.updateQuantity(id, Math.max(1, parseInt(e.target.value, 10) || 1)),
            );
        });

        updatePricing();
    };

    async function applyCouponCode(code, silent) {
        if (!code || appliedDiscount) return false;
        couponButton.disabled = true;
        try {
            const res = await SellTrust.validateCoupon(code);
            const subtotal = Cart.calculateTotal();

            if (res.min_order_value !== null && subtotal < res.min_order_value) {
                throw new Error(`Valor mínimo do pedido para este cupom é ${SellTrust.formatPrice(res.min_order_value)}`);
            }

            if (res.product_ids && res.product_ids.length > 0) {
                const isInvalid = Cart.products.some((p) => !res.product_ids.includes(p.product_id));
                if (isInvalid) {
                    throw new Error("O cupom de desconto não é aplicável para um ou mais itens no seu carrinho.");
                }
            }

            appliedDiscount = res;
            couponButton.setAttribute("data-state", "remove");
            window.couponCode = code;
            couponError.textContent = "";
            updatePricing();
            if (!silent) window.toast.success("Cupom aplicado!");
            SellTrust.track("apply_coupon", { coupon_code: code });
            return true;
        } catch (err) {
            couponError.textContent = err.message;
            return false;
        } finally {
            couponButton.disabled = false;
        }
    }

    couponButton?.addEventListener("click", async () => {
        if (appliedDiscount) {
            appliedDiscount = null;
            couponButton.setAttribute("data-state", "apply");
            couponInput.value = "";
            couponError.textContent = "";
            window.couponCode = null;
            updatePricing();
            return;
        }

        const code = couponInput.value.trim();
        if (!code) return (couponError.textContent = "Informe um cupom");
        await applyCouponCode(code, false);
    });

    (async function autoPackCoupon() {
        const code = sessionStorage.getItem("kzPackCoupon") || (sessionStorage.getItem("kzPackState") ? "PACK20" : "");
        if (!code || !couponInput || !couponButton || appliedDiscount) return;
        couponInput.value = code;
        for (let i = 0; i < 20 && !(Cart.products && Cart.products.length); i++) {
            await new Promise((r) => setTimeout(r, 250));
        }
        if (!(Cart.products && Cart.products.length)) return;
        const ok = await applyCouponCode(code, true);
        if (ok) sessionStorage.removeItem("kzPackCoupon");
    })();

    checkout.querySelector("#pay-button")?.addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        const name = checkout.querySelector("input[name=name]")?.value;
        const email = checkout.querySelector("input[name=email]")?.value.trim();
        const documentInput = checkout.querySelector("input[name=client_document]")?.value.trim();

        if (!name || !email) return window.toast.error("Preencha nome e e-mail!");
        if (documentField && !documentField.classList.contains("hidden")) {
            const doc = checkout.querySelector("input[name=client_document]")?.value.trim();
            if (!doc) return window.toast.error("CPF é obrigatório para este pagamento!");
        }
        if (Cart.products.length < 1) return window.toast.error("Carrinho vazio!");

        const selectedBtn = checkout.querySelector("[data-selected='true']");
        const paymentMethod = selectedBtn ? selectedBtn.getAttribute("data-payment-method") : "PIX";

        let cardPayload = undefined;
        let installments = undefined;

        if (paymentMethod === "CREDIT_CARD") {
            const number = (cardNumberInput?.value || "").replace(/\D/g, "");
            const holder = (cardHolderInput?.value || "").trim();
            const expiry = (cardExpiryInput?.value || "").replace(/\D/g, "");
            const cvv = (cardCvvInput?.value || "").replace(/\D/g, "");
            installments = parseInt(cardInstallments?.value || "1", 10) || 1;

            if (!luhnOk(number)) return window.toast.error("Número do cartão inválido.");
            if (holder.length < 3) return window.toast.error("Informe o nome impresso no cartão.");
            if (expiry.length < 4) return window.toast.error("Validade do cartão inválida.");
            if (cvv.length < 3) return window.toast.error("CVV inválido.");

            cardPayload = {
                number,
                holder_name: holder,
                expiry_month: expiry.slice(0, 2),
                expiry_year: expiry.slice(2),
                cvv,
            };

            const cardProvider = selectedBtn?.getAttribute("data-card-provider");
            if (cardProvider === "EFI_PAY") {
                const payee = selectedBtn?.getAttribute("data-efi-payee-code") || "";
                if (!payee) {
                    return window.toast.error("Cartão Efí sem identificador de conta. Configure no painel.");
                }
                const phone = (checkout.querySelector("input[name=card_phone]")?.value || "").replace(/\D/g, "");
                const birth = checkout.querySelector("input[name=card_birth]")?.value || "";
                const zipcode = (checkout.querySelector("input[name=card_zipcode]")?.value || "").replace(/\D/g, "");
                const street = (checkout.querySelector("input[name=card_street]")?.value || "").trim();
                const addrNumber = (checkout.querySelector("input[name=card_number_addr]")?.value || "").trim();
                const neighborhood = (checkout.querySelector("input[name=card_neighborhood]")?.value || "").trim();
                const city = (checkout.querySelector("input[name=card_city]")?.value || "").trim();
                const state = (checkout.querySelector("input[name=card_state]")?.value || "").trim().toUpperCase();

                if (phone.length < 10) return window.toast.error("Informe um celular válido.");
                if (!birth) return window.toast.error("Informe a data de nascimento.");
                if (zipcode.length !== 8 || !street || !addrNumber || !neighborhood || !city || state.length !== 2) {
                    return window.toast.error("Preencha o endereço completo para o cartão.");
                }

                try {
                    const paymentToken = await tokenizeEfiCard({
                        payee,
                        number,
                        cvv,
                        holder,
                        expiryMonth: expiry.slice(0, 2),
                        expiryYear: expiry.slice(2),
                        document: (documentInput || "").replace(/\D/g, ""),
                    });
                    cardPayload.payment_token = paymentToken;
                    cardPayload.phone = phone;
                    cardPayload.birth = birth;
                    cardPayload.address = {
                        street,
                        number: addrNumber,
                        neighborhood,
                        zipcode,
                        city,
                        state,
                    };
                } catch (err) {
                    return window.toast.error(err.message || "Não foi possível tokenizar o cartão na Efí.");
                }
            }
        }

        btn.disabled = true;
        const original = btn.innerHTML;
        btn.innerHTML = "Processando...";

        try {
            const bumpsPayload = Array.from(selectedBumps.values()).map((b) => ({
                bump_id: b.bump_id,
                product_id: b.product_id,
            }));

            const packTrack = (() => {
                try {
                    const raw = JSON.parse(sessionStorage.getItem("kzPackState") || "null");
                    const coupon = sessionStorage.getItem("kzPackCoupon") || window.couponCode || "";
                    if (!raw && String(coupon).toUpperCase() !== "PACK20") return {};
                    return {
                        utm_source: "pack",
                        utm_medium: "mystery",
                        utm_campaign: "PACK20",
                        utm_term: String((raw && raw.size) || (Cart.products || []).length || ""),
                    };
                } catch (err) {
                    return {};
                }
            })();

            const res = await SellTrust.checkout({
                client_name: name,
                client_email: email,
                client_document: documentInput || null,
                items: Cart.products.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    custom_answers: Array.isArray(i.custom_answers) ? i.custom_answers : [],
                })),
                bumps: bumpsPayload,
                payment_method: paymentMethod,
                coupon_code: window.couponCode || null,
                installments,
                card: cardPayload,
                ...packTrack,
            });
            Cart.clear();
            sessionStorage.removeItem("kzPackState");
            sessionStorage.removeItem("kzPackCoupon");

            if (window.KZOrders) {
                window.KZOrders.remember({
                    id: res.id,
                    internal_id: res.internal_id,
                    status: res.status,
                    price: res.price,
                    created_at: res.created_at || new Date().toISOString(),
                });
            }

            const paymentLink = res.payment_link || res.payment?.payment_link || null;
            const pixCode = res.payment?.pix_code || null;

            if (paymentLink && !pixCode) {
                const openPaymentLinkKey = `selltrust_open_payment_link:${res.internal_id}`;
                sessionStorage.setItem(openPaymentLinkKey, paymentLink);
                window.location.href = `/order/${res.internal_id}?open_payment_link=1`;
                return;
            }

            window.location.href =
                res.status === "APPROVED" || res.status === "COMPLETED" ? `/order/${res.internal_id}` : `/payment/${res.internal_id}`;
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = original;
            window.toast.error(err.message || "Erro no pedido");
        }
    });

    window.addEventListener("cart:updated", () => {
        render();
        refreshBumps();
    });
    render();
    refreshBumps();
}
