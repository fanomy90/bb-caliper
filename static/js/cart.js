(function(window) {
  window.BBCart = {};

  // --- Обновление блока с доставкой и оплатой ---
  BBCart.updateDeliveryPaymentInfo = function() {
    // --- Блок доставки ---
    const deliveryRadios = document.querySelector('input[name="delivery"]:checked');
    let deliveryText = "";
    if (deliveryRadios) {
      if (deliveryRadios.id === "pickup") {
        deliveryText = "Самовывоз — Москва, ул. Барышиха 14";
      } else {
        const city = document.querySelector('input[name="city"]').value || "";
        const street = document.querySelector('input[name="street"]').value || "";
        const house = document.querySelector('input[name="house"]').value || "";
        const apt = document.querySelector('input[name="apt"]').value || "";
        const comment = document.querySelector('[name="comment"]')?.value.trim() || "";

        let addr = `Доставка по адресу: ${city}`;
        if (street) addr += `, ул. ${street}`;
        if (house) addr += `, д. ${house}`;
        if (apt) addr += `, кв/офис ${apt}`;
        if (comment) addr += `, доп.инф.: ${comment}`;
        deliveryText = addr;
      }
    }

    const deliveryBlock = document.getElementById("cartCityText");
    if (deliveryBlock) deliveryBlock.textContent = deliveryText;

    // --- Блок оплаты ---
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

    const paymentBlock = document.getElementById("cartPaymentText");
    if (paymentBlock) paymentBlock.textContent = paymentText;
  };

  // --- Загрузка корзины ---
  BBCart.loadCarts = async function() {
    const container = document.getElementById("cartsContainer");
    if (!container) return;

    const carts = BBUtils.getCarts();
    if (!carts.length) {
      container.innerHTML = "<p>Ваша корзина пуста.</p>";
      BBCart.updateDeliveryPaymentInfo();
      return;
    }

    container.innerHTML = "<p>Загрузка корзины товаров...</p>";
    const query = carts.join(",");
    try {
      const res = await fetch(`/carts/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      container.innerHTML = html;

      if (window.BBUtils) {
        BBUtils.updateAllFavoriteButtons?.();
        BBUtils.updateAllCartButtons?.();
      }

      BBCart.updateDeliveryPaymentInfo();
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
      if (container && BBUtils.getCarts().length === 0)
        container.innerHTML = "<p>В корзине теперь пусто.</p>";

      BBCart.updateDeliveryPaymentInfo();
    }
    return true;
  };

  // --- Обработка изменения количества ---
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
    if (container && carts.length === 0)
      container.innerHTML = "<p>В корзине теперь пусто.</p>";

    BBCart.updateDeliveryPaymentInfo();
    return true;
  };

  // --- Автоматическое обновление блока при изменении данных ---
  document.addEventListener("change", e => {
    if (
      ["delivery", "city", "street", "house", "apt", "payment", "comment"].includes(e.target.name) ||
      e.target.id === "creditCheck"
    ) {
      BBCart.updateDeliveryPaymentInfo();
    }
  });

  document.addEventListener("input", e => {
    if (["city", "street", "house", "apt", "comment"].includes(e.target.name)) {
      BBCart.updateDeliveryPaymentInfo();
    }
  });

  // --- Отправка оформления заказа ---
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const carts = JSON.parse(localStorage.getItem("carts") || "[]");
      if (!carts.length) {
        alert("Корзина пуста!");
        return;
      }

      const formData = new FormData(form);
      const orderData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        city: formData.get("city"),
        street: formData.get("street"),
        house: formData.get("house"),
        apt: formData.get("apt"),
        comment: formData.get("comment"),
        payment: document.querySelector("input[name=payment]:checked").id,
        delivery: document.querySelector("input[name=delivery]:checked").id,
        items: carts.map(id => ({id, quantity: 1}))  // передаём массив объектов
      };

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicate) {
        alert("Похоже, вы уже оформляли заказ ранее.\nНомер: " + data.order_number);
        return;
      }

      if (!data.success) {
        alert("Ошибка: " + data.error);
        return;
      }

      // Очистка корзины
      localStorage.removeItem("carts");

      // Перенаправление на страницу благодарности
      window.location.href = "/thanks?order=" + data.order_number;
    });

    // При первой загрузке страницы
    BBCart.loadCarts();
  });

})(window);
