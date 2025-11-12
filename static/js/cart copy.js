(function(window) {
  window.BBCart = {};

  BBCart.updateCartSum = function() {
    const totalElems = document.querySelectorAll(".prod-card [data-price]");
    const total = [...totalElems].map(el => parseFloat(el.dataset.price))
                                .reduce((a,b) => a+b, 0);  
    const sumElem = document.getElementById("cartSum");
    const totalElem = document.getElementById("cartTotal");  
    if (sumElem) sumElem.textContent = total.toLocaleString("ru-RU") + " ₽";
    if (totalElem) totalElem.textContent = total.toLocaleString("ru-RU") + " ₽";
  };


  // --- Обновление блока с доставкой и оплатой ---
  BBCart.updateDeliveryPaymentInfo = function() {
    const cityText = document.getElementById("cartCityText");
    if (!cityText) return;

    // --- Способ доставки ---
    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    if (deliveryRadio) {
      if (deliveryRadio.id === "pickup") {
        cityText.textContent = "Самовывоз";
      } else {
        const city = document.querySelector('input[name="city"]').value || "";
        const street = document.querySelector('input[name="street"]').value || "";
        const house = document.querySelector('input[name="house"]').value || "";
        const apt = document.querySelector('input[name="apt"]').value || "";
        let addr = `Доставка по адресу: ${city}`;
        if (street) addr += `, ${street}`;
        if (house) addr += `, д. ${house}`;
        if (apt) addr += `, кв/офис ${apt}`;
        cityText.textContent = addr;
      }
    }

    // --- Способ оплаты ---
    const creditCheck = document.getElementById("creditCheck");
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    let paymentText = "";
    if (creditCheck && creditCheck.checked) {
      paymentText = "Оплата: в кредит через Тинькофф";
    } else {
      paymentRadios.forEach(radio => {
        if (radio.checked) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label) paymentText = "Оплата: " + label.textContent;
        }
      });
    }

    // Создаем/обновляем блок с информацией
    let infoBlock = document.getElementById("cartDeliveryPaymentInfo");
    if (!infoBlock) {
      infoBlock = document.createElement("div");
      infoBlock.id = "cartDeliveryPaymentInfo";
      infoBlock.className = "mt-2 mb-2";
      const totalContainer = document.getElementById("cartTotal").parentElement;
      totalContainer.insertBefore(infoBlock, totalContainer.firstChild);
    }
    infoBlock.textContent = paymentText;
  };

  // --- Загрузка корзины ---
  BBCart.loadCarts = async function() {
    const container = document.getElementById("cartsContainer");
    if (!container) return;

    const carts = BBUtils.getCarts();
    if (!carts.length) {
      container.innerHTML = "<p>Вы пока не добавили товары в корзину.</p>";
      return;
    }

    container.innerHTML = "<p>Загрузка корзины товаров...</p>";
    const query = carts.join(",");
    try {
      const res = await fetch(`/carts/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      container.innerHTML = html;
      BBUtils.updateAllFavoriteButtons();
      BBUtils.updateAllCartButtons();
      BBUtils.updateCartTotal();
      BBCart.updateDeliveryPaymentInfo(); // <-- обновляем блок при загрузке
    } catch (err) {
      console.error("Ошибка загрузки carts cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров корзины.</p>";
    }
  };

  // --- Обработка кликов по кнопкам корзины ---
  BBCart.handleCartClick = function(e) {
    const cartBtn = e.target.closest(".cartBtn");
    if (!cartBtn) return false;

    e.preventDefault();
    const id = String(cartBtn.dataset.id);
    let carts = BBUtils.getCarts();
    if (carts.includes(id)) carts = carts.filter(x => x !== id);
    else carts.push(id);
    BBUtils.saveCarts(carts);
    BBUtils.updateButtonVisual(cartBtn);

    if (window.location.pathname.startsWith("/carts")) {
      const card = cartBtn.closest(".prod-card");
      if (card) card.remove();
      const container = document.getElementById("cartsContainer");
      if (container && BBUtils.getCarts().length === 0) container.innerHTML = "<p>В корзине теперь пусто.</p>";
      BBUtils.updateCartTotal();
      BBCart.updateDeliveryPaymentInfo();
    }
    return true;
  };

  // --- Обработка кликов по количеству ---
  BBCart.handleQuantityClick = function(e) {
    const minusBtn = e.target.closest(".qty-minus");
    const plusBtn = e.target.closest(".qty-plus");
    if (!minusBtn && !plusBtn) return false;

    const card = e.target.closest(".prod-card");
    const input = card.querySelector(".qty-input");
    const totalElem = card.querySelector(".total-value");
    const price = parseFloat(card.dataset.price);
    const id = String(card.dataset.id);
    let qty = parseInt(input.value);

    if (minusBtn) qty = Math.max(0, qty - 1);
    if (plusBtn) qty += 1;

    input.value = qty;
    totalElem.textContent = (price * qty).toFixed(2);

    let carts = BBUtils.getCarts();
    if (qty === 0) {
      carts = carts.filter(x => x !== id);
      card.remove();
    } else if (!carts.includes(id)) {
      carts.push(id);
    }
    BBUtils.saveCarts(carts);

    const container = document.getElementById("cartsContainer");
    if (container && carts.length === 0) container.innerHTML = "<p>В корзине теперь пусто.</p>";

    BBUtils.updateCartTotal();
    BBCart.updateDeliveryPaymentInfo(); // <-- обновляем блок при изменении количества
    return true;
  };

  // --- Автоматическое обновление блока при изменении доставки или оплаты ---
  document.addEventListener("change", e => {
    if (e.target.name === "delivery" ||
        e.target.name === "city" ||
        e.target.name === "street" ||
        e.target.name === "house" ||
        e.target.name === "apt" ||
        e.target.id === "creditCheck" ||
        e.target.name === "payment") {
      BBCart.updateDeliveryPaymentInfo();
    }
  });

})(window);
