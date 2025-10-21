// static/js/main.js

document.addEventListener("DOMContentLoaded", function() {
  // обработка кнопки избранное
  const btn = document.getElementById("favoriteBtn");
  if (btn) {
    const productId = String(btn.dataset.id);

    function updateButtonState() {
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      btn.classList.remove("btn-outline-warning", "btn-warning");

      if (favorites.includes(productId)) {
        btn.textContent = "★ В избранном";
        btn.classList.add("btn-warning");
      } else {
        btn.textContent = "☆ Добавить в избранное";
        btn.classList.add("btn-outline-warning");
      }
    }

    // Проверяем состояние при загрузке страницы
    updateButtonState();

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

      if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId); // удалить
      } else {
        favorites.push(productId); // добавить
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateButtonState();

      // Если мы на странице избранного, обновляем список товаров
      if (window.location.pathname === "/favorites") {
        loadFavorites(); // функция загрузки карточек (см. ниже)
      }
    });
  }

  // ==== Страница Избранное ====
  async function loadFavorites() {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;

    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (favorites.length === 0) {
      container.innerHTML = "<p>Вы пока не добавили товары в избранное.</p>";
      return;
    }

    const query = favorites.join(",");
    try {
      const res = await fetch(`/favorites/cards?ids=${query}`);
      if (!res.ok) throw new Error("Ошибка загрузки товаров");

      const html = await res.text();
      container.innerHTML = html || "<p>Товары не найдены.</p>";
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Ошибка загрузки товаров.</p>";
    }
  }

  // Если мы на странице избранного — сразу загрузить карточки
  if (window.location.pathname === "/favorites") {
    loadFavorites();
  }

//   const btn = document.getElementById("favoriteBtn");
//   if (!btn) return;

//   const productId = String(btn.dataset.id);

//   function getFavorites() {
//     return JSON.parse(localStorage.getItem("favorites") || "[]");
//   }

//   function saveFavorites(favs) {
//     localStorage.setItem("favorites", JSON.stringify(favs));
//   }

//   function updateButtonState() {
//     const favorites = getFavorites();
//     btn.classList.remove("btn-outline-warning", "btn-warning");
//     if (favorites.includes(productId)) {
//       btn.innerHTML = "★ В избранном";
//       btn.classList.add("btn-warning");
//     } else {
//       btn.innerHTML = "☆ Добавить в избранное";
//       btn.classList.add("btn-outline-warning");
//     }
//   }

//   // Первичная инициализация
//   updateButtonState();

//   btn.addEventListener("click", (e) => {
//     e.preventDefault();

//     let favorites = getFavorites();

//     if (favorites.includes(productId)) {
//       favorites = favorites.filter(id => id !== productId);
//     } else {
//       favorites.push(productId);
//     }

//     saveFavorites(favorites);
//     updateButtonState();

//     console.log("Сохраняем избранное:", favorites);
//     console.log("Проверка:", localStorage.getItem("favorites"));
//   });



  /* === 1. Плавная прокрутка по якорям === */
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach(link => {
    link.addEventListener("click", function(e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth"
        });
      }
    });
  });

  /* === 2. Обработка формы обратной связи === */
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();

      const formData = new FormData(form);
      const response = await fetch("/send", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        alert("Спасибо! Ваша заявка отправлена.");
        form.reset();
      } else {
        alert("Ошибка при отправке. Попробуйте позже.");
      }
    });
  }

  /* === 3. Мобильное меню === */
  const burger = document.querySelector(".burger");
  const nav = document.querySelector("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("active");
      burger.classList.toggle("active");
    });
  }

  /* === 4. Плавное появление карточек при прокрутке === */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".prod-card").forEach(card => {
    observer.observe(card);
  });

// новая обработка кнопок избранное
  document.querySelectorAll(".favoriteBtn").forEach(btn => {
    const productId = String(btn.dataset.id);

    function updateButtonState() {
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      btn.classList.remove("btn-outline-warning", "btn-warning");

      if (favorites.includes(productId)) {
        btn.textContent = "★ В избранном";
        btn.classList.add("btn-warning");
      } else {
        btn.textContent = "☆ Добавить в избранное";
        btn.classList.add("btn-outline-warning");
      }
    }
    updateButtonState();
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

      if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
      } else {
        favorites.push(productId);
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateButtonState();

      if (window.location.pathname === "/favorites") {
        loadFavorites();
      }
    });
  });
});
