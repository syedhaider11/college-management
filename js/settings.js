/* College profile, user preferences, and demo data controls. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const TABS = ["college", "profile", "preferences", "data"];
  const ROLES = ["Administrator", "Teacher", "Accounts staff", "Student"];

  function fieldError(form, name, message) {
    const input = form.elements[name];
    const node = form.querySelector('[data-error-for="' + name + '"]');
    if (node) node.textContent = message || "";
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }

  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
    form.querySelectorAll("[aria-invalid='true']").forEach(function (node) { node.removeAttribute("aria-invalid"); });
  }

  function themeCard(theme, label, icon, selected) {
    return '<button class="theme-card ' + (selected === theme ? "is-active" : "") + '" type="button" data-theme-choice="' + theme + '" aria-pressed="' + (selected === theme) + '">' +
      '<div class="theme-preview ' + theme + '"><div class="tp-side"></div><div class="tp-main"><i></i><i></i><i></i></div></div>' +
      '<span class="theme-label">' + u.escape(label) + ui.icon(icon, 13) + "</span></button>";
  }

  function render(root, params) {
    const college = CMS.data.college;
    const session = CMS.store.getSession() || CMS.session || { name: "Maya Chen", email: "admin@evergreen.edu", role: "Administrator" };
    const prefs = CMS.store.getPrefs();
    let activeTab = TABS.indexOf(params.get("tab")) !== -1 ? params.get("tab") : "college";
    let selectedTheme = prefs.theme || "system";

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">System · Workspace</p><h1 class="view-title">Settings</h1>' +
        '<p class="view-sub">Manage the college profile, your demo user details, appearance, and browser-stored sample data.</p></div>' +
        '<div class="view-actions"><span class="pill pill-demo">' + ui.icon("shield-check", 13) + " Local demo workspace</span></div></div>" +
      '<div class="settings-layout">' +
        '<nav class="settings-nav" role="tablist" aria-label="Settings sections">' +
          '<button type="button" role="tab" id="tab-college" data-settings-tab="college" aria-selected="' + (activeTab === "college") + '" aria-controls="panel-college" class="' + (activeTab === "college" ? "is-active" : "") + '">' + ui.icon("building", 15) + " College profile</button>" +
          '<button type="button" role="tab" id="tab-profile" data-settings-tab="profile" aria-selected="' + (activeTab === "profile") + '" aria-controls="panel-profile" class="' + (activeTab === "profile" ? "is-active" : "") + '">' + ui.icon("user", 15) + " User profile</button>" +
          '<button type="button" role="tab" id="tab-preferences" data-settings-tab="preferences" aria-selected="' + (activeTab === "preferences") + '" aria-controls="panel-preferences" class="' + (activeTab === "preferences" ? "is-active" : "") + '">' + ui.icon("sun", 15) + " Preferences</button>" +
          '<button type="button" role="tab" id="tab-data" data-settings-tab="data" aria-selected="' + (activeTab === "data") + '" aria-controls="panel-data" class="' + (activeTab === "data" ? "is-active" : "") + '">' + ui.icon("refresh", 15) + " Demo data</button>" +
        "</nav>" +
        '<div class="settings-panels">' +

          '<section class="settings-panel ' + (activeTab === "college" ? "is-active" : "") + '" id="panel-college" role="tabpanel" aria-labelledby="tab-college">' +
            '<div class="card settings-section">' +
              '<div class="settings-section-head"><h3>College identity</h3><p>This name and mark appear in the sidebar, page titles, printed receipts, and reports.</p></div>' +
              '<div id="brandPreview"></div>' +
              '<form id="collegeForm" novalidate><div class="form-grid">' +
                '<div class="field"><label for="colName">College name <span class="text-danger">*</span></label><input id="colName" name="name" type="text" value="' + u.escape(college.name) + '" aria-describedby="colNameError" /><p class="field-error" id="colNameError" data-error-for="name" role="alert"></p></div>' +
                '<div class="field"><label for="colInitials">Logo initials <span class="text-danger">*</span></label><input id="colInitials" name="initials" type="text" maxlength="2" value="' + u.escape(college.initials) + '" aria-describedby="colInitialsError" /><p class="field-error" id="colInitialsError" data-error-for="initials" role="alert"></p></div>' +
                '<div class="field"><label for="colTagline">Tagline</label><input id="colTagline" name="tagline" type="text" value="' + u.escape(college.tagline || "") + '" placeholder="Campus administration" /></div>' +
                '<div class="field"><label for="colEstablished">Established</label><input id="colEstablished" name="established" type="number" min="1800" max="' + new Date().getFullYear() + '" value="' + college.established + '" aria-describedby="colEstablishedError" /><p class="field-error" id="colEstablishedError" data-error-for="established" role="alert"></p></div>' +
                '<div class="field"><label for="colEmail">Public email <span class="text-danger">*</span></label><input id="colEmail" name="email" type="email" value="' + u.escape(college.email) + '" aria-describedby="colEmailError" /><p class="field-error" id="colEmailError" data-error-for="email" role="alert"></p></div>' +
                '<div class="field"><label for="colPhone">Phone</label><input id="colPhone" name="phone" type="tel" value="' + u.escape(college.phone) + '" /></div>' +
                '<div class="field"><label for="colWebsite">Website</label><input id="colWebsite" name="website" type="text" value="' + u.escape(college.website || "") + '" placeholder="college.edu" /></div>' +
                '<div class="field"><label for="colTerm">Current term</label><input id="colTerm" name="term" type="text" value="' + u.escape(college.term || "") + '" placeholder="Fall 2026" /></div>' +
                '<div class="field span-2"><label for="colAddress">Campus address</label><input id="colAddress" name="address" type="text" value="' + u.escape(college.address) + '" /></div>' +
                '<div class="field"><label for="colWeek">Term label</label><input id="colWeek" name="weekLabel" type="text" value="' + u.escape(college.weekLabel || "") + '" placeholder="Fall semester · Week 8" /></div>' +
                '<div class="field"><div class="form-note">' + ui.icon("info", 14) + "<span>Changes to the college name or logo initials refresh the app brand as soon as you save.</span></div></div>" +
              "</div>" +
              '<div class="settings-form-actions"><span class="note">Demo profile · saved in this browser</span><button class="btn btn-outline" type="button" id="resetCollege">Reset fields</button><button class="btn btn-primary" type="submit">' + ui.icon("check", 15) + " Save college profile</button></div>" +
              "</form>" +
            "</div>" +
          "</section>" +

          '<section class="settings-panel ' + (activeTab === "profile" ? "is-active" : "") + '" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">' +
            '<div class="card settings-section">' +
              '<div class="settings-section-head"><h3>Your demo profile</h3><p>These details appear in the top-right profile menu. They identify this browser session only.</p></div>' +
              '<div id="profilePreview"></div>' +
              '<form id="profileForm" novalidate><div class="form-grid">' +
                '<div class="field"><label for="profName">Full name <span class="text-danger">*</span></label><input id="profName" name="name" type="text" value="' + u.escape(session.name) + '" aria-describedby="profNameError" /><p class="field-error" id="profNameError" data-error-for="name" role="alert"></p></div>' +
                '<div class="field"><label for="profRole">Demo role</label><select id="profRole" name="role">' + ROLES.map(function (role) {
                  return '<option' + (role === session.role ? " selected" : "") + ">" + u.escape(role) + "</option>";
                }).join("") + "</select></div>" +
                '<div class="field span-2"><label for="profEmail">Email address <span class="text-danger">*</span></label><input id="profEmail" name="email" type="email" value="' + u.escape(session.email) + '" aria-describedby="profEmailError" /><p class="field-error" id="profEmailError" data-error-for="email" role="alert"></p></div>' +
                '<div class="field span-2"><div class="form-note">' + ui.icon("shield-check", 14) + "<span>This is a visual demo profile. The prototype has no secure authentication, password store, or server-side permissions. Changing the role does not change what you can access.</span></div></div>" +
              "</div>" +
              '<div class="settings-form-actions"><span class="note">Signed in ' + u.formatDate(session.signedInAt || new Date().toISOString(), "medium") + '</span><button class="btn btn-primary" type="submit">' + ui.icon("check", 15) + " Save profile</button></div>" +
              "</form>" +
            "</div>" +
          "</section>" +

          '<section class="settings-panel ' + (activeTab === "preferences" ? "is-active" : "") + '" id="panel-preferences" role="tabpanel" aria-labelledby="tab-preferences">' +
            '<div class="card settings-section">' +
              '<div class="settings-section-head"><h3>Appearance</h3><p>Choose a colour theme. The preview applies immediately; save to keep it after a refresh.</p></div>' +
              '<form id="prefsForm">' +
                '<div class="theme-grid" id="themeGrid">' +
                  themeCard("light", "Light", "sun", selectedTheme) +
                  themeCard("dark", "Dark", "moon", selectedTheme) +
                  themeCard("system", "Match system", "grid", selectedTheme) +
                "</div>" +
                '<div class="settings-note">' + ui.icon("info", 14) + "<span>Theme choice is stored in local browser preferences. It is applied before the page paints to reduce flashing.</span></div>" +
                '<div class="settings-form-actions"><span class="note">Saved preference: ' + u.escape((prefs.theme || "system").charAt(0).toUpperCase() + (prefs.theme || "system").slice(1)) + '</span><button class="btn btn-primary" type="submit">' + ui.icon("check", 15) + " Save appearance</button></div>" +
              "</form>" +
            "</div>" +
            '<div class="card settings-section">' +
              '<div class="settings-section-head"><h3>Notifications</h3><p>These switches are frontend preferences only. The prototype never sends real email or messages.</p></div>' +
              '<form id="notifyForm">' +
                '<div class="check-list">' +
                  '<div class="check-row"><div class="check-copy"><strong>Email notices</strong><span>Receive a sample email when a new college announcement is published.</span></div><label class="checkbox"><input type="checkbox" name="emailNotices"' + (prefs.emailNotices ? " checked" : "") + ' aria-label="Email notices" /></label></div>' +
                  '<div class="check-row"><div class="check-copy"><strong>Fee reminders</strong><span>Show a reminder preference for upcoming and overdue student balances.</span></div><label class="checkbox"><input type="checkbox" name="feeReminders"' + (prefs.feeReminders ? " checked" : "") + ' aria-label="Fee reminders" /></label></div>' +
                  '<div class="check-row"><div class="check-copy"><strong>Weekly digest</strong><span>Include a weekly summary of attendance, fees, and library activity.</span></div><label class="checkbox"><input type="checkbox" name="weeklyDigest"' + (prefs.weeklyDigest ? " checked" : "") + ' aria-label="Weekly digest" /></label></div>' +
                "</div>" +
                '<div class="settings-form-actions"><span class="note">No messages are actually delivered</span><button class="btn btn-primary" type="submit">' + ui.icon("check", 15) + " Save notification preferences</button></div>" +
              "</form>" +
            "</div>" +
          "</section>" +

          '<section class="settings-panel ' + (activeTab === "data" ? "is-active" : "") + '" id="panel-data" role="tabpanel" aria-labelledby="tab-data">' +
            '<div class="card settings-section">' +
              '<div class="settings-section-head"><h3>Demo data snapshot</h3><p>All records in this prototype live in your browser’s local storage. Nothing is sent to a server.</p></div>' +
              '<div class="summary-card-grid">' +
                '<div class="summary-card"><span>Students</span><strong>' + CMS.data.students.length + "</strong><small>Demo student records</small></div>" +
                '<div class="summary-card"><span>Faculty</span><strong>' + CMS.data.teachers.length + "</strong><small>Teaching staff</small></div>" +
                '<div class="summary-card"><span>Classes</span><strong>' + CMS.data.classes.length + "</strong><small>Active class groups</small></div>" +
                '<div class="summary-card"><span>Fee accounts</span><strong>' + CMS.data.fees.length + "</strong><small>Tuition records</small></div>" +
                '<div class="summary-card"><span>Library titles</span><strong>' + CMS.data.books.length + "</strong><small>" + CMS.data.loans.length + " borrowing records</small></div>" +
                '<div class="summary-card"><span>Announcements</span><strong>' + CMS.data.announcements.length + "</strong><small>Campus notices</small></div>" +
              "</div>" +
              '<div class="settings-form-actions"><span class="note">Data is stored under cms:data:v1</span>' +
                '<button class="btn btn-outline" type="button" id="exportData">' + ui.icon("download", 15) + ' Download JSON</button>' +
                '<button class="btn btn-outline" type="button" id="resetPrefs">' + ui.icon("refresh", 15) + " Reset preferences</button>" +
              "</div>" +
            "</div>" +
            '<div class="danger-zone">' +
              "<h3>Reset all demo data</h3>" +
              "<p>This restores the original sample students, teachers, classes, fees, attendance, exams, library records, announcements, and college profile. Any records you added or edited will be lost. Your saved preferences are kept.</p>" +
              '<div class="danger-zone-actions"><button class="btn btn-danger" type="button" id="resetData">' + ui.icon("trash", 15) + " Reset demo data</button>" +
                '<a class="btn btn-outline" href="index.html">Sign out instead</a></div>' +
            "</div>" +
            '<div class="settings-note">' + ui.icon("shield-check", 14) + "<span>Browser storage is not secure and should not be used for real student records. This project is a UI/UX prototype without a backend, database, secure authentication, or real payment processing.</span></div>" +
          "</section>" +

        "</div>" +
      "</div>";

    const collegeForm = root.querySelector("#collegeForm");
    const profileForm = root.querySelector("#profileForm");
    const prefsForm = root.querySelector("#prefsForm");
    const notifyForm = root.querySelector("#notifyForm");

    function brandPreviewHTML() {
      const name = collegeForm.elements.name.value.trim() || "College name";
      const initials = collegeForm.elements.initials.value.trim() || name.charAt(0);
      const tagline = collegeForm.elements.tagline.value.trim() || "Campus administration";
      const established = collegeForm.elements.established.value;
      return '<div class="brand-preview"><span class="brand-mark">' + u.escape(initials.slice(0, 2).toUpperCase()) + "</span>" +
        '<div class="brand-preview-copy"><strong>' + u.escape(name) + "</strong><span>" + u.escape(tagline) + (established ? " · Est. " + u.escape(established) : "") + "</span></div></div>";
    }

    function profilePreviewHTML() {
      const name = profileForm.elements.name.value.trim() || "Your name";
      const role = profileForm.elements.role.value;
      const email = profileForm.elements.email.value.trim() || "you@evergreen.edu";
      return '<div class="profile-avatar-row">' + u.avatar(name, "lg") + "<div><strong>" + u.escape(name) + "</strong><span>" + u.escape(role) + " · " + u.escape(email) + "</span></div></div>";
    }

    function paintPreview() {
      const brand = root.querySelector("#brandPreview");
      if (brand) brand.innerHTML = brandPreviewHTML();
      const profile = root.querySelector("#profilePreview");
      if (profile) profile.innerHTML = profilePreviewHTML();
    }

    function syncTab(tab, updateURL) {
      activeTab = tab;
      root.querySelectorAll("[data-settings-tab]").forEach(function (button) {
        const active = button.getAttribute("data-settings-tab") === tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      root.querySelectorAll(".settings-panel").forEach(function (panel) {
        panel.classList.toggle("is-active", panel.id === "panel-" + tab);
      });
      if (updateURL) {
        window.history.replaceState(null, "", "#/settings?tab=" + tab);
      }
    }

    root.querySelector(".settings-nav").addEventListener("click", function (event) {
      const button = event.target.closest("[data-settings-tab]");
      if (button) syncTab(button.getAttribute("data-settings-tab"), true);
    });

    ["name", "initials", "tagline", "established"].forEach(function (name) {
      collegeForm.elements[name].addEventListener("input", paintPreview);
    });
    ["name", "role", "email"].forEach(function (name) {
      profileForm.elements[name].addEventListener("input", paintPreview);
    });
    profileForm.elements.role.addEventListener("change", paintPreview);

    collegeForm.addEventListener("input", function (event) {
      if (event.target.name) fieldError(collegeForm, event.target.name, "");
    });
    collegeForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors(collegeForm);
      const values = {
        name: collegeForm.elements.name.value.trim(),
        initials: collegeForm.elements.initials.value.trim().toUpperCase(),
        tagline: collegeForm.elements.tagline.value.trim(),
        established: Number(collegeForm.elements.established.value) || college.established,
        email: collegeForm.elements.email.value.trim(),
        phone: collegeForm.elements.phone.value.trim(),
        website: collegeForm.elements.website.value.trim(),
        term: collegeForm.elements.term.value.trim(),
        address: collegeForm.elements.address.value.trim(),
        weekLabel: collegeForm.elements.weekLabel.value.trim()
      };
      let valid = true;
      if (values.name.length < 2) { fieldError(collegeForm, "name", "Enter the college name."); valid = false; }
      if (!values.initials) { fieldError(collegeForm, "initials", "Add one or two initials for the logo."); valid = false; }
      else if (!/^[A-Z0-9]{1,2}$/.test(values.initials)) { fieldError(collegeForm, "initials", "Use one or two letters or digits."); valid = false; }
      if (!values.email) { fieldError(collegeForm, "email", "Enter a public contact email."); valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { fieldError(collegeForm, "email", "Enter a valid email address."); valid = false; }
      if (!values.established || values.established < 1800 || values.established > new Date().getFullYear()) {
        fieldError(collegeForm, "established", "Enter a year between 1800 and " + new Date().getFullYear() + ".");
        valid = false;
      }
      if (!valid) {
        const first = collegeForm.querySelector("[aria-invalid='true']");
        if (first) first.focus();
        return;
      }
      Object.assign(CMS.data.college, values);
      CMS.store.save();
      CMS.app.refreshBrand();
      document.title = "Settings · " + values.name;
      paintPreview();
      ui.toast("The college profile was updated. The sidebar and printed documents use the new details.", "success", "College profile saved");
    });
    root.querySelector("#resetCollege").addEventListener("click", function () {
      collegeForm.elements.name.value = college.name;
      collegeForm.elements.initials.value = college.initials;
      collegeForm.elements.tagline.value = college.tagline || "";
      collegeForm.elements.established.value = college.established;
      collegeForm.elements.email.value = college.email;
      collegeForm.elements.phone.value = college.phone;
      collegeForm.elements.website.value = college.website || "";
      collegeForm.elements.term.value = college.term || "";
      collegeForm.elements.address.value = college.address;
      collegeForm.elements.weekLabel.value = college.weekLabel || "";
      clearErrors(collegeForm);
      paintPreview();
      ui.toast("Unsaved college details were reset to the saved values.", "info", "Fields reset");
    });

    profileForm.addEventListener("input", function (event) {
      if (event.target.name) fieldError(profileForm, event.target.name, "");
    });
    profileForm.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors(profileForm);
      const name = profileForm.elements.name.value.trim();
      const email = profileForm.elements.email.value.trim();
      const role = profileForm.elements.role.value;
      let valid = true;
      if (name.length < 2) { fieldError(profileForm, "name", "Enter your full name."); valid = false; }
      if (!email) { fieldError(profileForm, "email", "Enter your email address."); valid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fieldError(profileForm, "email", "Enter a valid email address."); valid = false; }
      if (!valid) {
        const first = profileForm.querySelector("[aria-invalid='true']");
        if (first) first.focus();
        return;
      }
      const next = CMS.store.updateSession({ name: name, email: email, role: role });
      CMS.session = next;
      if (CMS.app.refreshProfile) CMS.app.refreshProfile();
      if (CMS.app.updateProfileMenu) CMS.app.updateProfileMenu();
      paintPreview();
      ui.toast("Your demo profile was updated for this browser session.", "success", "Profile saved");
    });

    root.querySelector("#themeGrid").addEventListener("click", function (event) {
      const card = event.target.closest("[data-theme-choice]");
      if (!card) return;
      selectedTheme = card.getAttribute("data-theme-choice");
      root.querySelectorAll("[data-theme-choice]").forEach(function (button) {
        const active = button === card;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      CMS.store.applyTheme(selectedTheme);
    });
    prefsForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const next = CMS.store.getPrefs();
      next.theme = selectedTheme;
      CMS.store.savePrefs(next);
      ui.toast("Appearance preferences saved.", "success", "Preferences updated");
    });

    notifyForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const next = CMS.store.getPrefs();
      next.emailNotices = notifyForm.elements.emailNotices.checked;
      next.feeReminders = notifyForm.elements.feeReminders.checked;
      next.weeklyDigest = notifyForm.elements.weeklyDigest.checked;
      CMS.store.savePrefs(next);
      ui.toast("Notification preferences saved for this browser. No real messages are sent.", "success", "Preferences updated");
    });

    root.querySelector("#exportData").addEventListener("click", function () {
      const blob = new Blob([JSON.stringify(CMS.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "evergreen-cms-demo-data-" + u.todayISO() + ".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      ui.toast("A JSON snapshot of the local demo data was downloaded.", "success", "Export ready");
    });

    root.querySelector("#resetPrefs").addEventListener("click", function () {
      ui.confirm({
        title: "Reset appearance and notification preferences?",
        heading: "Restore default preferences",
        message: "The theme returns to Match system, and notification preferences return to their original demo settings. Student and college records are not affected.",
        confirmLabel: "Reset preferences",
        tone: "warning",
        icon: "refresh"
      }).then(function (ok) {
        if (!ok) return;
        localStorage.removeItem("cms:prefs");
        selectedTheme = "system";
        CMS.store.applyTheme("system");
        ui.toast("Preferences were reset. Reloading this screen to show the defaults.", "success", "Preferences reset");
        window.setTimeout(function () { CMS.app.route(); }, 450);
      });
    });

    root.querySelector("#resetData").addEventListener("click", function () {
      ui.confirm({
        title: "Reset all demo data?",
        heading: "Restore the original sample college",
        message: "Every record you added or edited in students, teachers, fees, attendance, exams, library, and announcements will be replaced by the original demo seed. Your saved preferences are kept. This cannot be undone.",
        confirmLabel: "Reset demo data",
        icon: "alert-triangle"
      }).then(function (ok) {
        if (!ok) return;
        CMS.store.reset();
        try { localStorage.removeItem("cms:notif-read"); } catch (err) {}
        if (CMS.app.refreshBrand) CMS.app.refreshBrand();
        if (CMS.app.refreshProfile) CMS.app.refreshProfile();
        if (CMS.app.refreshNotifications) CMS.app.refreshNotifications();
        if (CMS.app.updateProfileMenu) CMS.app.updateProfileMenu();
        window.history.replaceState(null, "", "#/settings?tab=data");
        CMS.app.route();
        ui.toast("All demo records were restored to their original sample values.", "success", "Demo data reset");
      });
    });

    paintPreview();
  }

  CMS.views = CMS.views || {};
  CMS.views.settings = { render: render };
})();
