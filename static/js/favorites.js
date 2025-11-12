(function(window) {
  window.BBFavorites = {};

  BBFavorites.loadFavorites = async function() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;

    const favorites = BBUtils.getFavorites();
    if (!favorites.length) {
      container.innerHTML = "<p>Вы пока не добавили товары в избранное.</p>";
      return;
    }

    container.innerHTML = "<p>Загрузка избранных товаров...</p>";
    const query = favorites.join(",");
    try {
      const res = await fetch(`/favorites/cards?ids=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      container.innerHTML = html;
      BBUtils.updateAllFavoriteButtons();
      BBUtils.updateAllCartButtons();
    } catch (err) {
      console.error("Ошибка загрузки favorites cards:", err);
      container.innerHTML = "<p>Ошибка загрузки товаров.</p>";
    }
  };

  BBFavorites.handleFavoriteClick = function(e) {
    const favBtn = e.target.closest(".favoriteBtn");
    if (!favBtn) return false;

    e.preventDefault();
    const id = String(favBtn.dataset.id);
    let favs = BBUtils.getFavorites();
    if (favs.includes(id)) favs = favs.filter(x => x !== id);
    else favs.push(id);
    BBUtils.saveFavorites(favs);
    BBUtils.updateButtonVisual(favBtn);

    if (window.location.pathname.startsWith("/favorites")) {
      const card = favBtn.closest(".prod-card");
      if (card) card.remove();
      const container = document.getElementById("favoritesContainer");
      if (container && BBUtils.getFavorites().length === 0) container.innerHTML = "<p>В избранном теперь пусто.</p>";
    }
    return true;
  };

})(window);
