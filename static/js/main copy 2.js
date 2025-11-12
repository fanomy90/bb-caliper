(function () {
  // --- Утилиты ---
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
    catch (e) { console.warn("Ошибка парсинга favorites:", e); return []; }
  }
  function saveFavorites(arr) { localStorage.setItem("favorites", JSON.stringify(arr)); }

  function getCarts() {
    try { return JSON.parse(localStorage.getItem("carts") || "[]"); }
    catch (e) { console.warn("Ошибка парсинга carts:", e); return []; }
  }
  function saveCarts(arr) { localStorage.setItem("carts", JSON.stringify(arr)); }

  // --- Обновление визуала кнопки ---
  function updateButtonVisual(btn) {
    if (!btn) return;
    const id = String(btn.dataset.id);
    const favs = getFavorites();
    const carts = getCarts();

    if (btn.classList.contains("favoriteBtn")) {
      btn.classList.remove("btn-outline-warning", "btn-warning");
      if (favs.includes(id)) { btn.textContent = "★ В избранном"; btn.classList.add("btn-warning"); }
      else { btn.textContent = "☆ Добавить в избранное"; btn.classList.add("btn-outline-warning"); }
    }

    if (btn.classList.contains("cartBtn")) {
      btn.classList.remove("btn-outline-warning", "btn-warning");
      if (carts.includes(id)) { btn.textContent = "★ В корзине"; btn.classList.add("btn-warning"); }
      else { btn.textContent = "☆ Добавить в корзину"; btn.classList.add("btn-outline-warning"); }
    }
  }

  function updateAllFavoriteButtons() { document.querySelectorAll(".favoriteBtn").forEach(updateButtonVisual); }
  function updateAllCartButtons() { document.querySelectorAll(".cartBtn").forEach(updateButtonVisual); }

  // --- Функция пересчёта суммы ---
  function updateCartTotal() {
    const totals = document.querySelectorAll(".total-value");
    let sum = 0;
    totals.forEach(t => { const val = parseFloat(t.textContent); if (!isNaN(val)) sum += val; });
    const totalElem = document.getElementById("cartTotalValue");
    if (totalElem) totalElem.textContent = sum.toFixed(2);

    // обновление суммы заказа внизу корзины
    const totalElem2 = document.getElementById("cartSum");
    if (totalElem2) totalElem2.textContent = sum.toFixed(0) + " ₽";
    const totalElem3 = document.getElementById("cartTotal");
    if (totalElem3) totalElem3.textContent = sum.toFixed(0) + " ₽";
  }

  // --- Делегированный обработчик кликов ---
  document.addEventListener("click", function (e) {
    const favBtn = e.target.closest(".favoriteBtn");
    if (favBtn) {
      e.preventDefault();
      const id = String(favBtn.dataset.id);
      let favs = getFavorites();
      if (favs.includes(id)) favs = favs.filter(x => x !== id);
      else favs.push(id);
      saveFavorites(favs);
      updateButtonVisual(favBtn);

      if (window.location.pathname.startsWith("/favorites")) {
        const card = favBtn.closest(".prod-card");
        if (card) card.remove();
        const container = document.getElementById("favoritesContainer");
        if (container && getFavorites().length === 0) container.innerHTML = "<p>В избранном теперь пусто.</p>";
      }
      return;
    }

    const cartBtn = e.target.closest(".cartBtn");
    if (cartBtn) {
      e.preventDefault();
      const id = String(cartBtn.dataset.id);
      let carts = getCarts();
      if (carts.includes(id)) carts = carts.filter(x => x !== id);
      else carts.push(id);
      saveCarts(carts);
      updateButtonVisual(cartBtn);

      if (window.location.pathname.startsWith("/carts")) {
        const card = cartBtn.closest(".prod-card");
        if (card) card.remove();
        const container = document.getElementById("cartsContainer");
        if (container && getCarts().length === 0) container.innerHTML = "<p>В корзине теперь пусто.</p>";
        updateCartTotal();
      }
      return;
    }

    const minusBtn = e.target.closest(".qty-minus");
    const plusBtn = e.target.closest(".qty-plus");
    if (minusBtn || plusBtn) {
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

      let carts = getCarts();
      if (qty === 0) {
        carts = carts.filter(x => x !== id);
        card.remove();
      } else if (!carts.includes(id)) {
        carts.push(id);
      }
      saveCarts(carts);

      const container = document.getElementById("cartsContainer");
      if (container && carts.length === 0) container.innerHTML = "<p>В корзине теперь пусто.</p>";

      updateCartTotal();
    }
  });

  // --- Загрузка карточек ---
  async function loadFavorites() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;

    const favorites = getFavorites();
    if (!favorites.length) { container.innerHTML = "<p>Вы пока не добавили товары в избранное.</p>"; return; }

    container.innerHTML = "<p>Загрузка избранных товаров...</p>";
    const query = favorites.join(",");
    try {
      const res = await fetch(`/favorites/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      container.innerHTML = html;
      updateAllFavoriteButtons();
      updateAllCartButtons();
    } catch (err) {
      console.error("Ошибка загрузки favorites cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров.</p>";
    }
  }

  async function loadCarts() {
    const container = document.getElementById("cartsContainer");
    if (!container) return;

    const carts = getCarts();
    if (!carts.length) { container.innerHTML = "<p>Вы пока не добавили товары в корзину.</p>"; return; }

    container.innerHTML = "<p>Загрузка корзины товаров...</p>";
    const query = carts.join(",");
    try {
      const res = await fetch(`/carts/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      container.innerHTML = html;
      updateAllFavoriteButtons();
      updateAllCartButtons();
      updateCartTotal();
    } catch (err) {
      console.error("Ошибка загрузки carts cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров корзины.</p>";
    }
  }

  // --- Инициализация при загрузке страницы ---
  document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.startsWith("/favorites")) loadFavorites();
    else if (window.location.pathname.startsWith("/carts")) loadCarts();
    else { updateAllFavoriteButtons(); updateAllCartButtons(); }
  });

  // --- Экспорт (если нужно) ---
  window._bbcaliper_fav = { getFavorites, saveFavorites, loadFavorites, updateAllFavoriteButtons };
  window._bbcaliper_cart = { getCarts, saveCarts, loadCarts, updateAllCartButtons };
})();
