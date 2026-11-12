/* Campus announcements and notices. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const READ_KEY = "cms:notif-read";

  function audienceOptions(selected) {
    const audiences = ["All college", "Students", "Faculty"].concat(CMS.data.departments.map(function (dept) { return dept.name; }));
    return audiences.map(function (audience) {
      return '<option' + (selected === audience ? " selected" : "") + ">" + u.escape(audience) + "</option>";
    }).join("");
  }

  function markRead(id) {
    try {
      const current = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
      if (current.indexOf(id) === -1) {
        current.push(id);
        localStorage.setItem(READ_KEY, JSON.stringify(current));
      }
      if (CMS.app && CMS.app.refreshNotifications) CMS.app.refreshNotifications();
    } catch (err) {}
  }

  function render(root, params) {
    const state = {
      q: params.get("q") || "",
      audience: "all",
      priority: "all"
    };
    const audiences = Array.from(new Set(CMS.data.announcements.map(function (item) { return item.audience; }))).sort();

    function sorted() {
      return CMS.data.announcements.slice().sort(function (a, b) {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
    }

    function filtered() {
      const q = state.q.trim().toLowerCase();
      return sorted().filter(function (item) {
        if (state.audience !== "all" && item.audience !== state.audience) return false;
        if (state.priority !== "all" && item.priority !== state.priority) return false;
        if (q && !(item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q) || item.author.toLowerCase().includes(q))) return false;
        return true;
      });
    }

    function cardHTML(item) {
      const priorityClass = item.priority.toLowerCase();
      return '<article class="announcement-card priority-' + u.escape(priorityClass) + (item.pinned ? " is-pinned" : "") + '">' +
        '<div class="announce-top">' + ui.statusBadge(item.priority, "no-dot") +
          (item.pinned ? '<span class="announce-pin">' + ui.icon("pin", 10) + " Pinned</span>" : "") +
          '<span class="tag" style="margin-left:auto">' + u.escape(item.audience) + "</span></div>" +
        "<h3><button class=\"announce-title\" type=\"button\" data-open-announce=\"" + u.escape(item.id) + "\">" + u.escape(item.title) + "</button></h3>" +
        '<p class="announce-body">' + u.escape(item.body) + "</p>" +
        '<div class="announce-meta"><span>' + u.formatDate(item.date, "medium") + '</span><span class="dot" aria-hidden="true"></span><span>' + u.escape(item.author) + "</span></div>" +
        '<div class="announce-foot"><div class="announce-author">' + u.avatar(item.author, "sm") + "<span>" + u.escape(item.author) + "</span></div>" +
          '<div class="announce-actions">' +
            '<button class="icon-action" type="button" data-pin-announcement="' + u.escape(item.id) + '" aria-label="' + (item.pinned ? "Unpin" : "Pin") + " " + u.escape(item.title) + '" title="' + (item.pinned ? "Unpin notice" : "Pin notice") + '">' + ui.icon("pin") + "</button>" +
            '<button class="icon-action" type="button" data-edit-announcement="' + u.escape(item.id) + '" aria-label="Edit ' + u.escape(item.title) + '" title="Edit notice">' + ui.icon("edit") + "</button>" +
            '<button class="icon-action danger" type="button" data-delete-announcement="' + u.escape(item.id) + '" aria-label="Delete ' + u.escape(item.title) + '" title="Delete notice">' + ui.icon("trash") + "</button>" +
          "</div></div></article>";
    }

    function paint() {
      const list = filtered();
      const grid = root.querySelector("#announcementsGrid");
      if (!grid) return;
      grid.innerHTML = list.length ? list.map(cardHTML).join("") : ui.emptyState({
        icon: "megaphone",
        title: "No announcements match these filters",
        text: "Try another search term, audience, or priority. Clear the filters to see every notice.",
        action: '<button class="btn btn-outline btn-sm" type="button" data-clear-announcement-filters>Clear filters</button>'
      });
      const count = root.querySelector("#announcementCount");
      if (count) count.textContent = list.length === CMS.data.announcements.length ? String(CMS.data.announcements.length) : list.length + " of " + CMS.data.announcements.length;
    }

    function showRead(item) {
      markRead(item.id);
      const paragraphs = String(item.body).split(/\n{2,}/).map(function (paragraph) {
        return "<p>" + u.escape(paragraph).replace(/\n/g, "<br />") + "</p>";
      }).join("");
      const ref = ui.modal.open({
        title: "Campus announcement",
        subtitle: item.pinned ? "Pinned notice · " + item.audience : item.audience,
        size: "modal-lg",
        body: '<div class="announce-top">' + ui.statusBadge(item.priority) + (item.pinned ? '<span class="announce-pin">' + ui.icon("pin", 10) + " Pinned</span>" : "") + "</div>" +
          '<h2 style="font-family:var(--font-display);font-size:24px;font-weight:500;letter-spacing:-.02em;line-height:1.3;margin:12px 0 0">' + u.escape(item.title) + "</h2>" +
          '<div class="announce-detail-meta"><span>' + u.formatDate(item.date, "medium") + '</span><span class="dot" aria-hidden="true"></span><span>By ' + u.escape(item.author) + "</span>" +
            '<span class="dot" aria-hidden="true"></span><span>Audience: ' + u.escape(item.audience) + "</span></div>" +
          '<div class="announcement-read-body">' + paragraphs + "</div>",
        footer: '<button class="btn btn-danger-soft" type="button" data-read-delete>' + ui.icon("trash", 15) + ' Delete</button>' +
          '<button class="btn btn-outline" type="button" data-modal-close>Close</button>' +
          '<button class="btn btn-primary" type="button" data-read-edit>' + ui.icon("edit", 15) + ' Edit notice</button>',
        onMount: function (modal, close) {
          modal.querySelector("[data-read-edit]").addEventListener("click", function () {
            close();
            openForm(item);
          });
          modal.querySelector("[data-read-delete]").addEventListener("click", function () {
            deleteItem(item, close);
          });
        }
      });
      return ref;
    }

    function openForm(item) {
      const editing = Boolean(item);
      const body = '<form id="announcementForm" novalidate><div class="form-grid">' +
        '<div class="field span-2"><label for="anTitle">Notice title <span class="text-danger">*</span></label><input id="anTitle" name="title" type="text" autofocus value="' + u.escape(item ? item.title : "") + '" placeholder="e.g. Examination timetable published" aria-describedby="anTitleError" /><p class="field-error" id="anTitleError" data-error-for="title" role="alert"></p></div>' +
        '<div class="field span-2"><label for="anBody">Message <span class="text-danger">*</span></label><textarea id="anBody" name="body" rows="6" placeholder="Write the full notice for students and staff…" aria-describedby="anBodyError">' + u.escape(item ? item.body : "") + '</textarea><p class="field-error" id="anBodyError" data-error-for="body" role="alert"></p><p class="hint">Use a blank line to separate paragraphs. The card preview shows the first few lines.</p></div>' +
        '<div class="field"><label for="anAudience">Audience <span class="text-danger">*</span></label><select id="anAudience" name="audience">' + audienceOptions(item ? item.audience : "All college") + '</select><p class="field-error" data-error-for="audience" role="alert"></p></div>' +
        '<div class="field"><label for="anPriority">Priority</label><select id="anPriority" name="priority">' + ["High", "Medium", "Low"].map(function (priority) {
          return '<option' + (item && item.priority === priority ? " selected" : (!item && priority === "Medium" ? " selected" : "")) + ">" + priority + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label for="anDate">Publication date <span class="text-danger">*</span></label><input id="anDate" name="date" type="date" max="' + u.todayISO() + '" value="' + u.escape(item ? item.date : u.todayISO()) + '" aria-describedby="anDateError" /><p class="field-error" id="anDateError" data-error-for="date" role="alert"></p></div>' +
        '<div class="field"><label for="anAuthor">Author / office <span class="text-danger">*</span></label><input id="anAuthor" name="author" type="text" value="' + u.escape(item ? item.author : "Registrar's Office") + '" placeholder="e.g. Student Services" aria-describedby="anAuthorError" /><p class="field-error" id="anAuthorError" data-error-for="author" role="alert"></p></div>' +
        '<div class="field span-2"><label class="checkbox"><input type="checkbox" name="pinned"' + (item && item.pinned ? " checked" : "") + ' /> <span>Pin this notice to the top of the board</span></label></div>' +
        '<div class="field span-2"><div class="form-note">' + ui.icon("info", 14) + "<span>Announcements appear in the notification menu and on the dashboard. Changes are saved in this browser only.</span></div></div>" +
      "</div></form>";

      ui.modal.open({
        title: editing ? "Edit announcement" : "Post an announcement",
        subtitle: editing ? "Update the notice content, audience, or priority." : "Share a notice with the college community.",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="announcementForm">' + ui.icon(editing ? "check" : "megaphone", 15) + (editing ? " Save changes" : " Publish notice") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#announcementForm");
          function setError(name, message) {
            const input = form.elements[name];
            const node = form.querySelector('[data-error-for="' + name + '"]');
            if (node) node.textContent = message || "";
            if (input) message ? input.setAttribute("aria-invalid", "true") : input.removeAttribute("aria-invalid");
          }
          form.addEventListener("input", function (event) {
            if (event.target.name) setError(event.target.name, "");
          });
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
            form.querySelectorAll("[aria-invalid='true']").forEach(function (node) { node.removeAttribute("aria-invalid"); });
            const values = {
              title: form.elements.title.value.trim(),
              body: form.elements.body.value.trim(),
              audience: form.elements.audience.value,
              priority: form.elements.priority.value,
              date: form.elements.date.value,
              author: form.elements.author.value.trim(),
              pinned: form.elements.pinned.checked
            };
            let valid = true;
            if (values.title.length < 4) { setError("title", "Give the notice a clear title of at least 4 characters."); valid = false; }
            if (values.body.length < 20) { setError("body", "Write at least 20 characters so readers have enough context."); valid = false; }
            if (!values.audience) { setError("audience", "Choose the audience for this notice."); valid = false; }
            if (!values.date) { setError("date", "Choose a publication date."); valid = false; }
            else if (values.date > u.todayISO()) { setError("date", "The publication date cannot be in the future."); valid = false; }
            if (!values.author) { setError("author", "Add the office or person publishing this notice."); valid = false; }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            if (item) {
              Object.assign(item, values);
            } else {
              CMS.data.announcements.push(Object.assign({ id: u.uid("ann"), pinned: false }, values));
            }
            CMS.store.save();
            close();
            paint();
            if (CMS.app && CMS.app.refreshNotifications) CMS.app.refreshNotifications();
            ui.toast(editing ? "The announcement was updated." : "Your notice is now visible on the announcement board.", "success", editing ? "Announcement updated" : "Announcement published");
          });
        }
      });
    }

    function deleteItem(item, closeRead) {
      ui.confirm({
        title: "Delete this announcement?",
        heading: item.title,
        message: "The notice will be removed from the board and the notification menu. This cannot be undone.",
        confirmLabel: "Delete announcement",
        tone: "danger",
        icon: "trash"
      }).then(function (ok) {
        if (!ok) return;
        CMS.data.announcements = CMS.data.announcements.filter(function (entry) { return entry.id !== item.id; });
        CMS.store.save();
        if (closeRead) closeRead();
        paint();
        if (CMS.app && CMS.app.refreshNotifications) CMS.app.refreshNotifications();
        ui.toast("The announcement was deleted.", "success", "Notice removed");
      });
    }

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Administration · Campus notices</p><h1 class="view-title">Announcements</h1>' +
        '<p class="view-sub">Share notices with students, faculty, or the whole college. Pinned notices stay at the top of the board.</p></div>' +
        '<div class="view-actions"><button class="btn btn-primary" type="button" id="newAnnouncement">' + ui.icon("plus", 15) + " New announcement</button></div></div>" +
      '<div class="announcement-toolbar">' +
        '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="announcementSearch" value="' + u.escape(state.q) + '" placeholder="Search notices, authors, or content" aria-label="Search announcements" /></div>' +
        '<select class="select-compact" id="announcementAudience" aria-label="Filter by audience"><option value="all">All audiences</option>' +
          audiences.map(function (audience) { return '<option value="' + u.escape(audience) + '">' + u.escape(audience) + "</option>"; }).join("") + "</select>" +
        '<select class="select-compact" id="announcementPriority" aria-label="Filter by priority"><option value="all">All priorities</option><option value="High">High priority</option><option value="Medium">Medium priority</option><option value="Low">Low priority</option></select>' +
        '<span class="toolbar-count"><strong id="announcementCount">' + CMS.data.announcements.length + "</strong> notices</span>" +
      "</div>" +
      '<div class="announcement-grid" id="announcementsGrid"></div>';

    const search = root.querySelector("#announcementSearch");
    const audience = root.querySelector("#announcementAudience");
    const priority = root.querySelector("#announcementPriority");

    search.addEventListener("input", u.debounce(function () {
      state.q = search.value;
      paint();
    }, 140));
    audience.addEventListener("change", function () {
      state.audience = audience.value;
      paint();
    });
    priority.addEventListener("change", function () {
      state.priority = priority.value;
      paint();
    });

    root.querySelector("#newAnnouncement").addEventListener("click", function () { openForm(null); });

    root.addEventListener("click", function (event) {
      const open = event.target.closest("[data-open-announce]");
      if (open) {
        const item = CMS.byId("announcements", open.getAttribute("data-open-announce"));
        if (item) showRead(item);
        return;
      }
      const pin = event.target.closest("[data-pin-announcement]");
      if (pin) {
        const item = CMS.byId("announcements", pin.getAttribute("data-pin-announcement"));
        if (!item) return;
        item.pinned = !item.pinned;
        CMS.store.save();
        paint();
        ui.toast(item.pinned ? "The notice is pinned to the top of the board." : "The notice was unpinned.", "success", item.pinned ? "Notice pinned" : "Notice unpinned");
        return;
      }
      const edit = event.target.closest("[data-edit-announcement]");
      if (edit) {
        const item = CMS.byId("announcements", edit.getAttribute("data-edit-announcement"));
        if (item) openForm(item);
        return;
      }
      const remove = event.target.closest("[data-delete-announcement]");
      if (remove) {
        const item = CMS.byId("announcements", remove.getAttribute("data-delete-announcement"));
        if (item) deleteItem(item);
        return;
      }
      if (event.target.closest("[data-clear-announcement-filters]")) {
        state.q = "";
        state.audience = "all";
        state.priority = "all";
        search.value = "";
        audience.value = "all";
        priority.value = "all";
        paint();
      }
    });

    paint();

    if (params.get("new") === "1") openForm(null);
  }

  CMS.views = CMS.views || {};
  CMS.views.announcements = { render: render };
})();
