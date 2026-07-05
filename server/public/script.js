document.addEventListener("DOMContentLoaded", () => {
  // ─── Mobile Menu Navigation Toggle ───
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileNavClose = document.getElementById("mobile-nav-close");

  if (mobileMenuBtn && mobileNav && mobileNavClose) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileNav.classList.add("open");
    });

    mobileNavClose.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });

    const mobileLinks = mobileNav.querySelectorAll(
      ".mobile-link, .btn-secondary-drawer, .btn-primary-drawer",
    );
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
      });
    });
  }

  // ─── Header Scroll Shadow ───
  const header = document.querySelector("header");
  if (header) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle("scrolled", window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ─── Scroll Reveal (IntersectionObserver) ───
  const revealElements = document.querySelectorAll("[data-reveal]");
  if (revealElements.length > 0 && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    revealElements.forEach((el) => el.classList.add("revealed"));
  }

  // ─── Animated Counter for Stats ───
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length > 0 && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute("data-count"), 10);
            const suffix = el.getAttribute("data-suffix") || "";
            const prefix = el.getAttribute("data-prefix") || "";
            const duration = 1200;
            const startTime = performance.now();

            function animate(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(target * eased);
              el.textContent = prefix + current.toLocaleString("pt-BR") + suffix;
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            }

            requestAnimationFrame(animate);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  // ─── Toggle other category input ───
  const categoryIdSelect = document.getElementById("categoryId");
  const otherCategoryGroup = document.getElementById("other-category-group");
  const otherCategoryInput = document.getElementById("otherCategory");

  if (categoryIdSelect && otherCategoryGroup && otherCategoryInput) {
    categoryIdSelect.addEventListener("change", (e) => {
      if (e.target.value === "outro") {
        otherCategoryGroup.style.display = "block";
        otherCategoryInput.required = true;
      } else {
        otherCategoryGroup.style.display = "none";
        otherCategoryInput.required = false;
        otherCategoryInput.value = "";
      }
    });
  }

  // ─── Provider Registration Form Handling ───
  const providerForm = document.getElementById("provider-form");
  const formSuccess = document.getElementById("form-success");
  const formError = document.getElementById("form-error");
  const errorMessage = document.getElementById("error-message");
  const btnSubmit = document.getElementById("btn-submit");
  const formLoader = document.getElementById("form-loader");

  if (providerForm) {
    providerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      formSuccess.style.display = "none";
      formError.style.display = "none";

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const categoryId = document.getElementById("categoryId").value;
      const city = document.getElementById("city").value.trim();
      const neighborhood = document.getElementById("neighborhood").value.trim();
      const description = document.getElementById("description").value.trim();

      if (
        !name ||
        !email ||
        !phone ||
        !categoryId ||
        !city ||
        !neighborhood ||
        !description
      ) {
        showError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      let otherCategory = "";
      if (categoryId === "outro") {
        otherCategory = otherCategoryInput.value.trim();
        if (!otherCategory) {
          showError("Por favor, especifique a sua categoria.");
          return;
        }
      }

      setLoading(true);

      try {
        const refCode = localStorage.getItem("ref_code") || undefined;
        const response = await fetch("/api/web-register-provider", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            categoryId,
            otherCategory,
            city,
            neighborhood,
            description,
            refCode,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          formSuccess.style.display = "flex";
          providerForm.reset();
          if (otherCategoryGroup) {
            otherCategoryGroup.style.display = "none";
          }
          formSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          showError(
            result.error ||
              "Ocorreu um erro ao realizar o cadastro. Verifique os dados e tente novamente.",
          );
        }
      } catch (err) {
        console.error("Error submitting form:", err);
        showError(
          "Falha na conexão com o servidor. Verifique sua internet e tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    });
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    formError.style.display = "flex";
    formError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setLoading(isLoading) {
    if (isLoading) {
      btnSubmit.disabled = true;
      formLoader.style.display = "inline-block";
      btnSubmit.querySelector("span").textContent = "Enviando...";
    } else {
      btnSubmit.disabled = false;
      formLoader.style.display = "none";
      btnSubmit.querySelector("span").textContent = "Enviar Formulário";
    }
  }

  // ─── Smooth anchor offset for fixed header ───
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
