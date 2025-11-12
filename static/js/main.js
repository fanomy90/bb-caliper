document.addEventListener("DOMContentLoaded", function() {
  if (window.location.pathname.startsWith("/favorites")) BBFavorites.loadFavorites();
  else if (window.location.pathname.startsWith("/carts")) BBCart.loadCarts();
  else {
    BBUtils.updateAllFavoriteButtons();
    BBUtils.updateAllCartButtons();
  }
});

document.addEventListener("click", function(e) {
  if (BBFavorites.handleFavoriteClick(e)) return;
  if (BBCart.handleCartClick(e)) return;
  BBCart.handleQuantityClick(e);
});
