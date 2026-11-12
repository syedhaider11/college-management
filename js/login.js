/* Login screen — simulated frontend-only authentication. */
(function () {
  "use strict";

  const SESSION_KEY = "cms:session";
  const rememberKey = (k) => localStorage.getItem(k) || sessionStorage.getItem(k);

  function existingSession() {
    try {
      return JSON.parse(rememberKey(SESSION_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function hydrate() {
    if (window.CMS && CMS.hydrateIcons) CMS.hydrateIcons();
  }

  document.addEventListener("DOMContentLoaded", function () {
    hydrate();

    if (existingSession()) {
      window.location.replace("app.html");
      return;
    }

    const form = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const submit = document.getElementById("signInBtn");
    const toggle = document.getElementById("togglePassword");
    const fill = document.getElementById("fillDemo");
    let role = "Administrator";

    document.querySelectorAll(".role-option").forEach(function (button) {
      button.addEventListener("click", function () {
        role = button.dataset.role;
        document.querySelectorAll(".role-option").forEach(function (other) {
          const active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", String(active));
        });
      });
    });

    function setError(input, node, message) {
      node.textContent = message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }

    function validateEmail() {
      const value = email.value.trim();
      if (!value) {
        setError(email, emailError, "Enter your email address.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(email, emailError, "Enter a valid email address, for example you@evergreen.edu.");
        return false;
      }
      setError(email, emailError, "");
      return true;
    }

    function validatePassword() {
      if (!password.value) {
        setError(password, passwordError, "Enter your password.");
        return false;
      }
      if (password.value.length < 6) {
        setError(password, passwordError, "Use at least 6 characters for this demo.");
        return false;
      }
      setError(password, passwordError, "");
      return true;
    }

    email.addEventListener("input", function () {
      if (emailError.textContent) validateEmail();
    });
    password.addEventListener("input", function () {
      if (passwordError.textContent) validatePassword();
    });

    toggle.addEventListener("click", function () {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      toggle.innerHTML = CMS.icon(show ? "eye" : "eye");
      password.focus();
    });

    fill.addEventListener("click", function () {
      email.value = "admin@evergreen.edu";
      password.value = "demo1234";
      document.querySelectorAll(".role-option").forEach(function (option) {
        const active = option.dataset.role === "Administrator";
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
      role = "Administrator";
      validateEmail();
      validatePassword();
      email.focus();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const okEmail = validateEmail();
      const okPassword = validatePassword();
      if (!okEmail || !okPassword) {
        (okEmail ? password : email).focus();
        return;
      }

      submit.classList.add("is-loading");
      submit.disabled = true;

      const names = {
        Administrator: "Maya Chen",
        Teacher: "Dr. Lena Ortiz",
        Student: "Aarav Mehta",
        "Accounts staff": "Rosa Delgado"
      };

      const session = {
        name: names[role] || "Maya Chen",
        email: email.value.trim(),
        role: role,
        signedInAt: new Date().toISOString()
      };

      window.setTimeout(function () {
        const target = document.getElementById("remember").checked ? localStorage : sessionStorage;
        const other = target === localStorage ? sessionStorage : localStorage;
        other.removeItem(SESSION_KEY);
        target.setItem(SESSION_KEY, JSON.stringify(session));
        window.location.href = "app.html";
      }, 700);
    });
  });
})();
