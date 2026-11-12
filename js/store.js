/* Local demo persistence, lookups, and theme preferences. */
(function () {
  "use strict";

  const CMS = (window.CMS = window.CMS || {});
  const DATA_KEY = "cms:data:v1";
  const PREFS_KEY = "cms:prefs";
  const SESSION_KEY = "cms:session";
  let mediaQuery = null;

  const store = {
    init: function () {
      let data = null;
      try {
        data = JSON.parse(localStorage.getItem(DATA_KEY) || "null");
      } catch (err) {
        data = null;
      }
      if (!data || data.version !== 1) {
        data = CMS.seed();
        try {
          localStorage.setItem(DATA_KEY, JSON.stringify(data));
        } catch (err) {
          console.warn("Could not seed local demo data.", err);
        }
      }
      CMS.data = data;
      return data;
    },

    save: function () {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(CMS.data));
      } catch (err) {
        if (CMS.ui && CMS.ui.toast) CMS.ui.toast("Changes could not be saved in this browser.", "danger");
      }
    },

    reset: function () {
      localStorage.removeItem(DATA_KEY);
      CMS.data = CMS.seed();
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(CMS.data));
      } catch (err) {}
      return CMS.data;
    },

    getPrefs: function () {
      try {
        return Object.assign({ theme: "system", emailNotices: true, feeReminders: true, weeklyDigest: false }, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
      } catch (err) {
        return { theme: "system", emailNotices: true, feeReminders: true, weeklyDigest: false };
      }
    },

    savePrefs: function (prefs) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      store.applyTheme(prefs.theme || "system");
    },

    applyTheme: function (theme) {
      const root = document.documentElement;
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = theme === "dark" || (theme === "system" && prefersDark);
      root.setAttribute("data-theme", dark ? "dark" : "light");
      root.style.colorScheme = dark ? "dark" : "light";

      if (mediaQuery) {
        mediaQuery.removeEventListener("change", handleSystemTheme);
        mediaQuery = null;
      }
      if (theme === "system" && window.matchMedia) {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", handleSystemTheme);
      }
    },

    getSession: function () {
      try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
      } catch (err) {
        return null;
      }
    },

    updateSession: function (patch) {
      const current = store.getSession();
      if (!current) return;
      const next = Object.assign({}, current, patch);
      const target = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
      target.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    },

    clearSession: function () {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    },

    isLoggedIn: function () {
      return Boolean(store.getSession());
    }
  };

  function handleSystemTheme() {
    const prefs = store.getPrefs();
    if ((prefs.theme || "system") === "system") store.applyTheme("system");
  }

  CMS.store = store;

  CMS.byId = function (collection, id) {
    if (!CMS.data || !CMS.data[collection]) return null;
    return CMS.data[collection].find(function (item) { return item.id === id; }) || null;
  };

  CMS.department = function (id) { return CMS.byId("departments", id); };
  CMS.program = function (id) { return CMS.byId("programs", id); };
  CMS.classInfo = function (id) { return CMS.byId("classes", id); };
  CMS.teacher = function (id) { return CMS.byId("teachers", id); };
  CMS.student = function (id) { return CMS.byId("students", id); };
  CMS.course = function (id) { return CMS.byId("courses", id); };
  CMS.book = function (id) { return CMS.byId("books", id); };
  CMS.exam = function (id) { return CMS.byId("exams", id); };

  CMS.studentsInClass = function (classId) {
    return CMS.data.students.filter(function (student) { return student.classId === classId; });
  };

  CMS.activeLoans = function (bookId) {
    return CMS.data.loans.filter(function (loan) {
      return loan.bookId === bookId && !loan.returnedOn;
    });
  };

  CMS.feeStatus = function (fee) {
    if (fee.paid >= fee.amount) return "Paid";
    const today = new Date().toISOString().slice(0, 10);
    return fee.dueDate < today ? "Overdue" : "Pending";
  };
})();
