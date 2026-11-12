/* Application shell, routing, search, and header menus. */
(function () {
  "use strict";

  const CMS = window.CMS;
  const u = CMS.utils;
  const SESSION_KEY = "cms:session";
  const READ_KEY = "cms:notif-read";

  const NAV = [
    {
      label: "Overview",
      items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard" }]
    },
    {
      label: "People",
      items: [
        { id: "students", label: "Students", icon: "users" },
        { id: "teachers", label: "Teachers", icon: "user-check" }
      ]
    },
    {
      label: "Academics",
      items: [
        { id: "departments", label: "Departments", icon: "building" },
        { id: "courses", label: "Courses & subjects", icon: "book-open" },
        { id: "classes", label: "Classes & semesters", icon: "layers" },
        { id: "attendance", label: "Attendance", icon: "clipboard-check" },
        { id: "timetable", label: "Timetable", icon: "calendar" },
        { id: "exams", label: "Exams & results", icon: "award" }
      ]
    },
    {
      label: "Administration",
      items: [
        { id: "fees", label: "Fees", icon: "credit-card" },
        { id: "library", label: "Library", icon: "library" },
        { id: "announcements", label: "Announcements", icon: "megaphone" },
        { id: "reports", label: "Reports", icon: "chart" }
      ]
    },
    {
      label: "System",
      items: [{ id: "settings", label: "Settings", icon: "settings" }]
    }
  ];

  const TITLES = {
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers",
    departments: "Departments",
    courses: "Courses & subjects",
    classes: "Classes & semesters",
    attendance: "Attendance",
    fees: "Fees",
    timetable: "Timetable",
    exams: "Exams & results",
    library: "Library",
    announcements: "Announcements",
    reports: "Reports",
    settings: "Settings"
  };

  let session = null;
  let currentView = null;
  let currentParams = null;

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (err) {
      return null;
    }
  }

  function parseRoute() {
    let raw = (window.location.hash || "").replace(/^#\/?/, "");
    if (!raw) raw = "dashboard";
    const question = raw.indexOf("?");
    const path = question >= 0 ? raw.slice(0, question) : raw;
    const query = question >= 0 ? raw.slice(question + 1) : "";
    return { view: path.split("/")[0] || "dashboard", params: new URLSearchParams(query) };
  }

  function navigate(view, params) {
    const query = params ? (typeof params === "string" ? params : params.toString()) : "";
    window.location.hash = "#/" + view + (query ? "?" + query : "");
  }

  function renderSidebar() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;
    nav.innerHTML = NAV.map(function (group) {
      return '<div class="nav-group"><p class="nav-label">' + u.escape(group.label) + "</p>" +
        group.items.map(function (item) {
          return '<a class="nav-item" href="app.html#/' + item.id + '" data-nav="' + item.id + '">' +
            CMS.icon(item.icon, 17) + "<span>" + u.escape(item.label) + "</span></a>";
        }).join("") + "</div>";
    }).join("");
  }

  function setActiveNav(view) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      const active = link.getAttribute("data-nav") === view;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function refreshBrand() {
    const college = CMS.data.college;
    const words = String(college.name || "Evergreen College").trim().split(/\s+/);
    const first = words.shift() || "Evergreen";
    const rest = words.join(" ") || "College";
    const nameEl = document.getElementById("brandName");
    const markEl = document.getElementById("brandMark");
    const crumb = document.getElementById("crumbRoot");
    if (nameEl) {
      nameEl.innerHTML = u.escape(first) + "<span>" + u.escape(rest) + "</span>";
      nameEl.style.fontFamily = "";
    }
    if (markEl) markEl.textContent = (college.initials || first.charAt(0) || "E").slice(0, 2);
    if (crumb) crumb.textContent = college.name;
  }

  function currentSession() {
    return CMS.store.getSession() || session;
  }

  function refreshProfile() {
    const active = currentSession();
    if (!active) return;
    session = active;
    CMS.session = active;
    const nameEl = document.getElementById("topName");
    const roleEl = document.getElementById("topRole");
    const avatarEl = document.getElementById("topAvatar");
    if (nameEl) nameEl.textContent = active.name;
    if (roleEl) roleEl.textContent = active.role;
    if (avatarEl) {
      const tone = (CMS.utils.hashName(active.name) % 6) + 1;
      avatarEl.className = "avatar avatar-sm tone-" + tone;
      avatarEl.textContent = CMS.utils.initials(active.name);
    }
  }

  function profileMenuHTML() {
    const active = currentSession() || { name: "Maya Chen", role: "Administrator" };
    return '<div class="profile-menu-head">' + u.avatar(active.name, "sm") +
      '<div><strong>' + u.escape(active.name) + "</strong><span>" + u.escape(active.role) + "</span></div></div>" +
      '<button class="menu-item" type="button" data-menu-settings>' + CMS.icon("settings") + "Account settings</button>" +
      '<button class="menu-item" type="button" data-menu-profile>' + CMS.icon("user") + "My profile</button>" +
      '<a class="menu-item" href="app.html#/announcements">' + CMS.icon("megaphone") + "Campus announcements</a>" +
      '<div class="menu-sep"></div>' +
      '<p class="menu-note">Signed in on this browser. This prototype has no secure authentication.</p>' +
      '<button class="menu-item danger" type="button" data-menu-logout>' + CMS.icon("log-out") + "Sign out</button>";
  }

  function getRead() {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function setRead(ids) {
    try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(new Set(ids)))); } catch (err) {}
  }

  function notifData() {
    return CMS.data.announcements
      .slice()
      .sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      })
      .slice(0, 4);
  }

  function refreshNotificationDot() {
    const dot = document.getElementById("notifDot");
    const read = getRead();
    const unread = notifData().filter(function (item) { return read.indexOf(item.id) === -1; }).length;
    if (dot) dot.hidden = unread === 0;
    const button = document.getElementById("notifBtn");
    if (button) button.setAttribute("aria-label", unread ? "Notifications, " + unread + " unread" : "Notifications");
  }

  function renderNotifications() {
    const menu = document.getElementById("notifMenu");
    if (!menu) return;
    const read = getRead();
    const items = notifData();
    menu.innerHTML = '<div class="popover-head"><strong>Notifications</strong>' +
      (items.some(function (item) { return read.indexOf(item.id) === -1; }) ? '<button class="link-btn" type="button" data-mark-read>Mark all read</button>' : "") +
      "</div>" +
      '<div class="notif-list">' + items.map(function (item) {
        const unread = read.indexOf(item.id) === -1;
        return '<button class="notif-item" type="button" data-notif="' + u.escape(item.id) + '">' +
          '<span class="notif-item-icon">' + CMS.icon(item.priority === "High" ? "alert-triangle" : "megaphone", 15) + "</span>" +
          '<span class="notif-copy"><strong>' + u.escape(item.title) + "</strong><span>" + u.escape(item.audience) + " · " + u.formatDate(item.date, "short") + (unread ? " · New" : "") + "</span></span>" +
          "</button>";
      }).join("") + "</div>" +
      '<div class="popover-foot"><a class="link-btn" href="app.html#/announcements">View all announcements ' + CMS.icon("arrow-right", 13) + "</a></div>";

    menu.querySelectorAll("[data-notif]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.getAttribute("data-notif");
        setRead(getRead().concat(id));
        refreshNotificationDot();
        closePopover(menu);
        navigate("announcements");
      });
    });
    const mark = menu.querySelector("[data-mark-read]");
    if (mark) {
      mark.addEventListener("click", function () {
        setRead(getRead().concat(items.map(function (item) { return item.id; })));
        refreshNotificationDot();
        renderNotifications();
      });
    }
  }

  function closePopover(element) {
    if (!element) return;
    element.hidden = true;
    if (element.id === "notifMenu") document.getElementById("notifBtn").setAttribute("aria-expanded", "false");
    if (element.id === "profileMenu") document.getElementById("profileBtn").setAttribute("aria-expanded", "false");
    if (element.id === "searchResults") document.getElementById("globalSearch").setAttribute("aria-expanded", "false");
  }

  function closeAllPopovers(except) {
    ["notifMenu", "profileMenu", "searchResults"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el !== except) closePopover(el);
    });
  }

  function setupHeader() {
    const notifBtn = document.getElementById("notifBtn");
    const notifMenu = document.getElementById("notifMenu");
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    profileMenu.innerHTML = profileMenuHTML();

    notifBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      closeAllPopovers(notifMenu);
      const open = notifMenu.hidden;
      notifMenu.hidden = !open;
      notifBtn.setAttribute("aria-expanded", String(open));
    });

    profileBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      closeAllPopovers(profileMenu);
      const open = profileMenu.hidden;
      profileMenu.hidden = !open;
      profileBtn.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest(".popover-wrap") || event.target.closest("#globalSearchWrap")) return;
      closeAllPopovers();
    });

    profileMenu.addEventListener("click", function (event) {
      if (event.target.closest("[data-menu-settings]")) {
        closeAllPopovers();
        navigate("settings", "tab=college");
      }
      if (event.target.closest("[data-menu-profile]")) {
        closeAllPopovers();
        navigate("settings", "tab=profile");
      }
      if (event.target.closest("[data-menu-logout]")) {
        CMS.store.clearSession();
        window.location.href = "index.html";
      }
    });

    refreshNotificationDot();
    renderNotifications();
  }

  function updateProfileMenu() {
    const menu = document.getElementById("profileMenu");
    if (menu) menu.innerHTML = profileMenuHTML();
  }

  function setupMobileNav() {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    const closeBtn = document.getElementById("sidebarClose");
    const backdrop = document.getElementById("navBackdrop");

    function openNav() {
      document.body.classList.add("nav-open");
      backdrop.hidden = false;
      menuBtn.setAttribute("aria-expanded", "true");
      const first = sidebar.querySelector("a, button");
      if (first) first.focus();
    }
    function closeNav() {
      document.body.classList.remove("nav-open");
      backdrop.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }

    menuBtn.addEventListener("click", openNav);
    closeBtn.addEventListener("click", closeNav);
    backdrop.addEventListener("click", closeNav);
    sidebar.addEventListener("click", function (event) {
      if (event.target.closest(".nav-item")) closeNav();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1180) closeNav();
    });
  }

  function setupSearch() {
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("searchResults");
    if (!input || !results) return;

    function buildResults(query) {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      const pages = [];
      NAV.forEach(function (group) {
        group.items.forEach(function (item) {
          if (item.label.toLowerCase().includes(q) || (TITLES[item.id] || "").toLowerCase().includes(q)) {
            pages.push({ id: item.id, label: item.label, group: group.label });
          }
        });
      });
      const students = CMS.data.students.filter(function (s) {
        return s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q);
      }).slice(0, 3);
      const teachers = CMS.data.teachers.filter(function (t) {
        return t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || t.subjects.join(" ").toLowerCase().includes(q);
      }).slice(0, 3);
      const books = CMS.data.books.filter(function (b) {
        return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
      }).slice(0, 3);
      return { pages: pages.slice(0, 4), students: students, teachers: teachers, books: books };
    }

    function paint(query) {
      const data = buildResults(query);
      if (!data) {
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return;
      }
      const hasAny = data.pages.length || data.students.length || data.teachers.length || data.books.length;
      let html = "";
      if (data.pages.length) {
        html += '<p class="search-group-label">Pages</p>' + data.pages.map(function (page) {
          return '<button class="search-result" type="button" data-search-page="' + page.id + '">' + CMS.icon("arrow-up-right") +
            '<span class="search-result-copy"><strong>' + u.escape(page.label) + "</strong><span>" + u.escape(page.group) + "</span></span></button>";
        }).join("");
      }
      if (data.students.length) {
        html += '<p class="search-group-label">Students</p>' + data.students.map(function (student) {
          return '<button class="search-result" type="button" data-search-student="' + u.escape(student.name) + '">' +
            CMS.icon("users") + '<span class="search-result-copy"><strong>' + u.escape(student.name) + "</strong><span>" + u.escape(student.admissionNo) + " · " + u.escape(CMS.program(student.programId) ? CMS.program(student.programId).name : "") + "</span></span></button>";
        }).join("");
      }
      if (data.teachers.length) {
        html += '<p class="search-group-label">Faculty</p>' + data.teachers.map(function (teacher) {
          return '<button class="search-result" type="button" data-search-teacher="' + u.escape(teacher.name) + '">' +
            CMS.icon("user-check") + '<span class="search-result-copy"><strong>' + u.escape(teacher.name) + "</strong><span>" + u.escape(teacher.employeeId) + " · " + u.escape(CMS.department(teacher.departmentId) ? CMS.department(teacher.departmentId).short : "") + "</span></span></button>";
        }).join("");
      }
      if (data.books.length) {
        html += '<p class="search-group-label">Library</p>' + data.books.map(function (book) {
          return '<button class="search-result" type="button" data-search-book="' + u.escape(book.title) + '">' +
            CMS.icon("book") + '<span class="search-result-copy"><strong>' + u.escape(book.title) + "</strong><span>" + u.escape(book.author) + "</span></span></button>";
        }).join("");
      }
      if (!hasAny) {
        html = '<div class="search-empty">No matches for “' + u.escape(query.trim()) + '”. Try a name, admission number, or page.</div>';
      }
      html += '<div class="search-hint"><span>Navigate with ↑ ↓ · Enter to open</span><span><kbd>Esc</kbd> to close</span></div>';
      results.innerHTML = html;
      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
      results.querySelectorAll(".search-result").forEach(function (button) { button.dataset.index = String(Array.prototype.indexOf.call(results.querySelectorAll(".search-result"), button)); });
    }

    const delayed = u.debounce(function () { paint(input.value); }, 110);
    input.addEventListener("input", delayed);
    input.addEventListener("focus", function () { if (input.value.trim()) paint(input.value); });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closePopover(results);
        input.blur();
      }
      const buttons = Array.prototype.slice.call(results.querySelectorAll(".search-result"));
      const active = results.querySelector(".search-result.is-highlighted");
      let index = active ? Number(active.dataset.index) : -1;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!buttons.length) return;
        index = (index + 1) % buttons.length;
        buttons.forEach(function (b) { b.classList.remove("is-highlighted"); });
        buttons[index].classList.add("is-highlighted");
        buttons[index].scrollIntoView({ block: "nearest" });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!buttons.length) return;
        index = index <= 0 ? buttons.length - 1 : index - 1;
        buttons.forEach(function (b) { b.classList.remove("is-highlighted"); });
        buttons[index].classList.add("is-highlighted");
        buttons[index].scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter") {
        if (active) {
          event.preventDefault();
          active.click();
        }
      }
    });

    results.addEventListener("click", function (event) {
      const page = event.target.closest("[data-search-page]");
      const student = event.target.closest("[data-search-student]");
      const teacher = event.target.closest("[data-search-teacher]");
      const book = event.target.closest("[data-search-book]");
      if (page) navigate(page.getAttribute("data-search-page"));
      if (student) navigate("students", "q=" + encodeURIComponent(student.getAttribute("data-search-student")));
      if (teacher) navigate("teachers", "q=" + encodeURIComponent(teacher.getAttribute("data-search-teacher")));
      if (book) navigate("library", "q=" + encodeURIComponent(book.getAttribute("data-search-book")));
      if (page || student || teacher || book) {
        input.value = "";
        closePopover(results);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target;
        const editing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
        if (!editing) {
          event.preventDefault();
          input.focus();
          input.select();
        }
      }
    });
  }

  function renderRoute() {
    const route = parseRoute();
    let view = route.view;
    if (!CMS.views[view]) {
      view = "dashboard";
      if (window.location.hash !== "#/dashboard") {
        window.history.replaceState(null, "", "#/dashboard");
      }
    }
    currentView = view;
    currentParams = route.params;
    setActiveNav(view);
    const title = TITLES[view] || view;
    const crumb = document.getElementById("crumbCurrent");
    if (crumb) crumb.textContent = title;
    document.title = title + " · " + CMS.data.college.name;
    document.body.dataset.view = view;

    // Dialogs belong to the screen that opened them, so dismiss any open
    // modal or drawer before rendering the next route.
    if (CMS.ui && CMS.ui.modal) CMS.ui.modal.close();
    if (CMS.ui && CMS.ui.drawer) CMS.ui.drawer.close();

    const root = document.getElementById("viewRoot");
    if (!root) return;
    try {
      root.innerHTML = "";
      CMS.views[view].render(root, route.params);
    } catch (err) {
      console.error("Unable to render view:", view, err);
      root.innerHTML = '<div class="card card-pad" style="margin-top:20px"><div class="empty-state"><div class="empty-icon">' +
        CMS.icon("alert-triangle") + '</div><h4>This screen could not be loaded</h4><p>' +
        "There was a problem rendering the " + u.escape(title) + " screen. Please refresh the page or choose another section.</p></div></div>";
    }
    root.classList.remove("view-enter");
    void root.offsetWidth;
    root.classList.add("view-enter");
    window.scrollTo(0, 0);
    closeAllPopovers();
    refreshNotificationDot();
    updateProfileMenu();
  }

  function boot() {
    session = readSession();
    if (!session) {
      window.location.replace("index.html");
      return;
    }

    CMS.store.init();
    CMS.store.applyTheme(CMS.store.getPrefs().theme || "system");
    session = CMS.store.getSession();
    CMS.session = session;

    renderSidebar();
    refreshBrand();
    refreshProfile();
    setupHeader();
    setupMobileNav();
    setupSearch();
    CMS.hydrateIcons(document);

    document.getElementById("crumbRoot").textContent = CMS.data.college.name;
    document.getElementById("topAvatar").setAttribute("aria-hidden", "true");
    refreshNotificationDot();

    window.addEventListener("hashchange", renderRoute);
    if (!window.location.hash) window.history.replaceState(null, "", "#/dashboard");
    renderRoute();
  }

  CMS.app = {
    navigate: navigate,
    route: renderRoute,
    refreshBrand: refreshBrand,
    refreshProfile: refreshProfile,
    updateProfileMenu: updateProfileMenu,
    refreshNotifications: function () {
      renderNotifications();
      refreshNotificationDot();
    },
    nav: NAV,
    titles: TITLES
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
