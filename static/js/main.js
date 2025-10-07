// static/js/main.js

document.addEventListener("DOMContentLoaded", function() {

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

});
