// static/js/main.js
(function () {
  // --- Утилиты ---
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch (e) {
      console.warn("Ошибка парсинга favorites:", e);
      return [];
    }
  }
  function saveFavorites(arr) {
    localStorage.setItem("favorites", JSON.stringify(arr));
  }
  function getСarts() {
    try {
      return JSON.parse(localStorage.getItem("carts") || "[]");
    } catch (e) {
      console.warn("Ошибка парсинга carts:", e);
      return [];
    }
  }
  function saveCarts(arr) {
    localStorage.setItem("carts", JSON.stringify(arr));
  }

  // --- Обновление состояния конкретной кнопки ---
  function updateButtonVisual(btn) {
    if (!btn) return;
    const id = String(btn.dataset.id);
    const favs = getFavorites();
    const carts = getСarts();
    // --- Кнопки избранного ---
    btn.classList.remove("btn-outline-warning", "btn-warning");
    if (favs.includes(id)) {
      btn.textContent = "★ В избранном";
      btn.classList.add("btn-warning");
    } else {
      btn.textContent = "☆ Добавить в избранное";
      btn.classList.add("btn-outline-warning");
    }
    // --- Кнопки корзины ---
    btn.classList.remove("btn-outline-warning", "btn-warning");
    if (carts.includes(id)) {
      btn.textContent = "★ В корзине";
      btn.classList.add("btn-warning");
    } else {
      btn.textContent = "☆ Добавить в корзину";
      btn.classList.add("btn-outline-warning");
    }
  }

  // --- Обновить все кнопки на странице ---
  function updateAllFavoriteButtons() {
    document.querySelectorAll(".favoriteBtn").forEach(updateButtonVisual);
  }
  function updateAllCartButtons() {
    document.querySelectorAll(".cartBtn").forEach(updateButtonVisual);
  }

  // --- Делегированный обработчик кликов на favoriteBtn ---
  document.addEventListener("click", function (e) {
    const btn = e.target.closest && e.target.closest(".favoriteBtn");
    if (!btn) return; // не наша кнопка

    e.preventDefault();
    const id = String(btn.dataset.id);
    if (!id) return;

    let favs = getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter(x => x !== id);
    } else {
      favs.push(id);
    }
    saveFavorites(favs);

    // обновляем вид кнопки
    updateButtonVisual(btn);

    // если мы на странице /favorites — удаляем карточку
    if (window.location.pathname.startsWith("/favorites")) {
      const card = btn.closest(".prod-card");
      if (card) card.remove();

      // если теперь пусто — покажем сообщение
      const remaining = getFavorites();
      if (!remaining || remaining.length === 0) {
        const container = document.getElementById("favoritesContainer");
        if (container) container.innerHTML = "<p>В избранном теперь пусто.</p>";
      }
    }
  });
  // --- Делегированный обработчик кликов на cartsBtn ---
  document.addEventListener("click", function (e) {
    const btn = e.target.closest && e.target.closest(".cartBtn");
    if (!btn) return; // не наша кнопка

    e.preventDefault();
    const id = String(btn.dataset.id);
    if (!id) return;

    let carts = getСarts();
    if (carts.includes(id)) {
      carts = carts.filter(x => x !== id);
    } else {
      carts.push(id);
    }
    saveCarts(carts);

    // обновляем вид кнопки
    updateButtonVisual(btn);

    // если мы на странице /carts — удаляем карточку
    if (window.location.pathname.startsWith("/carts")) {
      const card = btn.closest(".prod-card");
      if (card) card.remove();

      // если теперь пусто — покажем сообщение
      const remaining = getСarts();
      if (!remaining || remaining.length === 0) {
        const container = document.getElementById("cartsContainer");
        if (container) container.innerHTML = "<p>В корзине теперь пусто.</p>";
      }
    }
  });

  // --- Загружает карточки для страницы /favorites ---
  async function loadFavorites() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;

    const favorites = getFavorites();
    if (!favorites || favorites.length === 0) {
      container.innerHTML = "<p>Вы пока не добавили товары в избранное.</p>";
      return;
    }

    container.innerHTML = "<p>Загрузка избранных товаров...</p>";
    const query = favorites.join(",");
    try {
      const res = await fetch(`/favorites/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();

      // мы просто вставляем HTML карточек в контейнер
      // (этот HTML должен содержать элементы .prod-card и кнопки .favoriteBtn)
      container.innerHTML = html;

      // после вставки — обновим визуальное состояние всех кнопок
      updateAllFavoriteButtons();
    } catch (err) {
      console.error("Ошибка загрузки favorites cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров.</p>";
    }
  }

  // --- Загружает карточки для страницы /carts ---
  async function loadCarts() {
    const container = document.getElementById("cartsContainer");
    if (!container) return;

    const carts = getСarts();
    if (!carts || carts.length === 0) {
      container.innerHTML = "<p>Вы пока не добавили товары в корзину.</p>";
      return;
    }

    container.innerHTML = "<p>Загрузка корзины товаров...</p>";
    const query = carts.join(",");
    try {
      const res = await fetch(`/carts/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();

      // мы просто вставляем HTML карточек в контейнер
      // (этот HTML должен содержать элементы .prod-card и кнопки .cartBtn)
      container.innerHTML = html;

      // после вставки — обновим визуальное состояние всех кнопок
      updateAllCartButtons();
    } catch (err) {
      console.error("Ошибка загрузки carts cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров корзины.</p>";
    }
  }

  // --- При загрузке страницы: инициализация ---
  document.addEventListener("DOMContentLoaded", function () {
    // Если мы на странице favorites — загрузим карточки
    if (window.location.pathname.startsWith("/favorites")) {
      loadFavorites();
    }
    // Если мы на странице carts — загрузим карточки
    if (window.location.pathname.startsWith("/carts")) {
      loadCarts();
    }
    else {
      // На прочих страницах — обновим визуал кнопок, если карточки уже в DOM
      updateAllFavoriteButtons();
      updateAllCartButtons();
    }
  });

  // Экспорт (если надо)
  window._bbcaliper_fav = { getFavorites, saveFavorites, loadFavorites, updateAllFavoriteButtons };
  window._bbcaliper_cart = { getСarts, saveCarts, loadCarts, updateAllCartButtons };
})();
