document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Navigation Toggle
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

    // Close mobile menu when a link or button is clicked
    const mobileLinks = mobileNav.querySelectorAll(".mobile-link, .btn-secondary-drawer, .btn-primary-drawer");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
      });
    });
  }

  // Toggle other category input
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

  // Provider Registration Form Handling
  const providerForm = document.getElementById("provider-form");
  const formSuccess = document.getElementById("form-success");
  const formError = document.getElementById("form-error");
  const errorMessage = document.getElementById("error-message");
  const btnSubmit = document.getElementById("btn-submit");
  const formLoader = document.getElementById("form-loader");

  if (providerForm) {
    providerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Reset alert states
      formSuccess.style.display = "none";
      formError.style.display = "none";

      // Form validation
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const categoryId = document.getElementById("categoryId").value;
      const city = document.getElementById("city").value.trim();
      const neighborhood = document.getElementById("neighborhood").value.trim();
      const description = document.getElementById("description").value.trim();

      if (!name || !email || !phone || !categoryId || !city || !neighborhood || !description) {
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

      // Show loader and disable submit button
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
          // Success
          formSuccess.style.display = "flex";
          providerForm.reset();
          if (otherCategoryGroup) {
            otherCategoryGroup.style.display = "none";
          }
          
          // Smooth scroll to success message
          formSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          // API error
          showError(result.error || "Ocorreu um erro ao realizar o cadastro. Verifique os dados e tente novamente.");
        }
      } catch (err) {
        console.error("Error submitting form:", err);
        showError("Falha na conexão com o servidor. Verifique sua internet e tente novamente.");
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
});
