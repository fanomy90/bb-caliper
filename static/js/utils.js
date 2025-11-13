(function(window) {
  window.BBUtils = {};

  BBUtils.getFavorites = function() {
    try { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
    catch (e) { console.warn("Ошибка парсинга favorites:", e); return []; }
  };

  BBUtils.saveFavorites = function(arr) {
    localStorage.setItem("favorites", JSON.stringify(arr));
  };

  BBUtils.getCarts = function() {
    try { return JSON.parse(localStorage.getItem("carts") || "[]"); }
    catch (e) { console.warn("Ошибка парсинга carts:", e); return []; }
  };

  BBUtils.saveCarts = function(arr) {
    localStorage.setItem("carts", JSON.stringify(arr));
  };

  BBUtils.updateButtonVisual = function(btn) {
    if (!btn) return;
    const id = String(btn.dataset.id);
    const favs = BBUtils.getFavorites();
    const carts = BBUtils.getCarts();

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
  };

  BBUtils.updateAllFavoriteButtons = function() {
    document.querySelectorAll(".favoriteBtn").forEach(BBUtils.updateButtonVisual);
  };

  BBUtils.updateAllCartButtons = function() {
    document.querySelectorAll(".cartBtn").forEach(BBUtils.updateButtonVisual);
  };

  BBUtils.updateCartTotal = function() {
    const totals = document.querySelectorAll(".total-value");
    let sum = 0;
    totals.forEach(t => {
      const val = parseFloat(t.textContent);
      if (!isNaN(val)) sum += val;
    });

    // --- Обновление блока с суммой заказа ---

    const totalElem = document.getElementById("cartTotalValue");
    if (totalElem) totalElem.textContent = sum.toFixed(2);

    const totalElem2 = document.getElementById("cartSum");
    if (totalElem2) totalElem2.textContent = sum.toFixed(0) + " ₽";

    const totalElem3 = document.getElementById("cartTotal");
    if (totalElem3) totalElem3.textContent = sum.toFixed(0) + " ₽";
  };

})(window);
