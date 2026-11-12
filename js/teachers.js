/* Teacher management. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const STATUSES = ["Full-time", "Part-time", "On leave"];

  function render(root, params) {
    const state = {
      q: params.get("q") || "",
      dept: "all",
      status: "all",
      page: 1,
      pageSize: 8,
      sortKey: "name",
      sortDir: "asc"
    };

    function filtered() {
      let list = CMS.data.teachers.slice();
      const q = state.q.trim().toLowerCase();
      if (q) {
        list = list.filter(function (teacher) {
          return teacher.name.toLowerCase().includes(q) ||
            teacher.employeeId.toLowerCase().includes(q) ||
            teacher.email.toLowerCase().includes(q) ||
            teacher.subjects.join(" ").toLowerCase().includes(q);
        });
      }
      if (state.dept !== "all") list = list.filter(function (teacher) { return teacher.departmentId === state.dept; });
      if (state.status !== "all") list = list.filter(function (teacher) { return teacher.status === state.status; });
      list.sort(function (a, b) {
        const av = state.sortKey === "employeeId" ? a.employeeId : a.name.toLowerCase();
        const bv = state.sortKey === "employeeId" ? b.employeeId : b.name.toLowerCase();
        const result = String(av).localeCompare(String(bv));
        return state.sortDir === "asc" ? result : -result;
      });
      return list;
    }

    function tableHTML(list) {
      const pages = Math.max(1, Math.ceil(list.length / state.pageSize));
      state.page = Math.min(state.page, pages);
      const rows = list.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

      if (!list.length) {
        return ui.emptyState({
          icon: "user-check",
          title: "No faculty match these filters",
          text: "Try another name, subject, department, or employment status.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-clear>Clear filters</button>'
        });
      }

      return '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">Faculty directory with departments, subjects, and employment status</caption>' +
        '<thead><tr><th><button class="sort-btn ' + (state.sortKey === "name" ? "is-sorted" : "") + '" type="button" data-sort="name">Teacher ' + ui.icon(state.sortKey === "name" && state.sortDir === "desc" ? "arrow-down" : "arrow-up", 12) + "</button></th>" +
        '<th><button class="sort-btn ' + (state.sortKey === "employeeId" ? "is-sorted" : "") + '" type="button" data-sort="employeeId">Employee ID ' + ui.icon(state.sortKey === "employeeId" && state.sortDir === "desc" ? "arrow-down" : "arrow-up", 12) + "</button></th>" +
        "<th>Department</th><th>Subjects</th><th>Contact</th><th>Status</th><th class=\"cell-actions\">Actions</th></tr></thead><tbody>" +
        rows.map(function (teacher) {
          const dept = CMS.department(teacher.departmentId);
          const subjects = teacher.subjects.slice(0, 2).map(function (s) { return '<span class="tag">' + u.escape(s) + "</span>"; }).join("") +
            (teacher.subjects.length > 2 ? '<span class="tag">+' + (teacher.subjects.length - 2) + "</span>" : "");
          return "<tr>" +
            "<td>" + u.avatarPair(teacher.name, teacher.title) + "</td>" +
            '<td><span class="cell-mono">' + u.escape(teacher.employeeId) + "</span></td>" +
            '<td><span class="cell-strong">' + u.escape(dept ? dept.short : "—") + '</span><span class="cell-sub">' + u.escape(teacher.office) + "</span></td>" +
            "<td>" + subjects + "</td>" +
            '<td><span class="cell-strong">' + u.escape(teacher.email) + '</span><span class="cell-sub">' + u.escape(teacher.phone) + "</span></td>" +
            "<td>" + u.statusBadge(teacher.status) + "</td>" +
            '<td class="cell-actions"><div class="row-actions">' +
              '<button class="icon-action" type="button" data-view="' + teacher.id + '" aria-label="View ' + u.escape(teacher.name) + '" title="View record">' + ui.icon("eye") + "</button>" +
              '<button class="icon-action" type="button" data-edit="' + teacher.id + '" aria-label="Edit ' + u.escape(teacher.name) + '" title="Edit record">' + ui.icon("edit") + "</button>" +
              '<button class="icon-action danger" type="button" data-delete="' + teacher.id + '" aria-label="Delete ' + u.escape(teacher.name) + '" title="Delete record">' + ui.icon("trash") + "</button>" +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>" +
        ui.pager({ page: state.page, pages: pages, total: list.length, pageSize: state.pageSize, label: "teachers" });
    }

    function paint() {
      const region = root.querySelector("#teachersTableRegion");
      if (!region) return;
      const list = filtered();
      region.innerHTML = tableHTML(list);
      const count = root.querySelector("#teacherCount");
      if (count) count.textContent = list.length === CMS.data.teachers.length ? String(CMS.data.teachers.length) : list.length + " of " + CMS.data.teachers.length;
    }

    function clearErrors(form) {
      form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
      form.querySelectorAll("[aria-invalid='true']").forEach(function (node) { node.removeAttribute("aria-invalid"); });
    }
    function setError(form, name, message) {
      const input = form.elements[name];
      const node = form.querySelector('[data-error-for="' + name + '"]');
      if (node) node.textContent = message || "";
      if (input) message ? input.setAttribute("aria-invalid", "true") : input.removeAttribute("aria-invalid");
    }

    function openForm(teacher) {
      const editing = Boolean(teacher);
      const body = '<form id="teacherForm" novalidate><div class="form-grid">' +
        '<div class="field span-2"><label for="tcName">Full name <span class="text-danger">*</span></label><input id="tcName" name="name" type="text" autofocus value="' + u.escape(teacher ? teacher.name : "") + '" placeholder="e.g. Dr. Lena Ortiz" /><p class="field-error" data-error-for="name" role="alert"></p></div>' +
        '<div class="field"><label for="tcEmployee">Employee ID <span class="text-danger">*</span></label><input id="tcEmployee" name="employeeId" type="text" value="' + u.escape(teacher ? teacher.employeeId : "EMP-" + (1001 + CMS.data.teachers.length)) + '" /><p class="field-error" data-error-for="employeeId" role="alert"></p></div>' +
        '<div class="field"><label for="tcStatus">Employment status <span class="text-danger">*</span></label><select id="tcStatus" name="status">' + STATUSES.map(function (status) { return "<option" + (teacher && teacher.status === status ? " selected" : "") + ">" + status + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="tcEmail">Email address <span class="text-danger">*</span></label><input id="tcEmail" name="email" type="email" value="' + u.escape(teacher ? teacher.email : "") + '" placeholder="name@evergreen.edu" /><p class="field-error" data-error-for="email" role="alert"></p></div>' +
        '<div class="field"><label for="tcPhone">Phone number <span class="text-danger">*</span></label><input id="tcPhone" name="phone" type="tel" value="' + u.escape(teacher ? teacher.phone : "") + '" placeholder="+1 (802) 555-0100" /><p class="field-error" data-error-for="phone" role="alert"></p></div>' +
        '<div class="field"><label for="tcDept">Department <span class="text-danger">*</span></label><select id="tcDept" name="departmentId">' +
          CMS.data.departments.map(function (dept) { return '<option value="' + dept.id + '"' + (teacher && teacher.departmentId === dept.id ? " selected" : "") + ">" + u.escape(dept.name) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="tcOffice">Office</label><input id="tcOffice" name="office" type="text" value="' + u.escape(teacher ? teacher.office : "") + '" placeholder="e.g. office-cse-4" /></div>' +
        '<div class="field span-2"><label for="tcTitle">Role or title</label><input id="tcTitle" name="title" type="text" value="' + u.escape(teacher ? teacher.title : "") + '" placeholder="e.g. Senior Lecturer" /></div>' +
        '<div class="field span-2"><label for="tcSubjects">Subjects taught <span class="text-danger">*</span></label><input id="tcSubjects" name="subjects" type="text" value="' + u.escape(teacher ? teacher.subjects.join(", ") : "") + '" placeholder="Data Structures, Algorithms, Database Systems" /><p class="hint">Separate multiple subjects with commas.</p><p class="field-error" data-error-for="subjects" role="alert"></p></div>' +
        '<div class="field span-2"><div class="form-note">' + ui.icon("info", 14) + "<span>Deleting a teacher who leads a department is blocked until another head is assigned. This keeps the demo structure intact.</span></div></div>" +
      "</div></form>";

      ui.modal.open({
        title: editing ? "Edit faculty record" : "Add a faculty member",
        subtitle: editing ? "Update employment details and teaching subjects." : "Create a sample teacher record for the directory.",
        size: "modal-lg",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="teacherForm">' + ui.icon(editing ? "check" : "plus", 15) + (editing ? "Save changes" : "Add teacher") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#teacherForm");
          form.addEventListener("input", function (event) {
            if (event.target.name) setError(form, event.target.name, "");
          });
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearErrors(form);
            const values = {
              name: form.elements.name.value.trim(),
              employeeId: form.elements.employeeId.value.trim(),
              email: form.elements.email.value.trim(),
              phone: form.elements.phone.value.trim(),
              departmentId: form.elements.departmentId.value,
              office: form.elements.office.value.trim(),
              title: form.elements.title.value.trim(),
              subjects: form.elements.subjects.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
              status: form.elements.status.value
            };
            let valid = true;
            if (!values.name || values.name.length < 2) { setError(form, "name", "Enter the teacher's full name."); valid = false; }
            if (!values.employeeId) { setError(form, "employeeId", "An employee ID is required."); valid = false; }
            else if (CMS.data.teachers.some(function (t) { return t.employeeId.toLowerCase() === values.employeeId.toLowerCase() && (!teacher || t.id !== teacher.id); })) {
              setError(form, "employeeId", "That employee ID is already in use."); valid = false;
            }
            if (!values.email) { setError(form, "email", "Enter an email address."); valid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setError(form, "email", "Enter a valid email address."); valid = false; }
            if (!values.phone) { setError(form, "phone", "Enter a contact number."); valid = false; }
            if (!values.subjects.length) { setError(form, "subjects", "Add at least one subject."); valid = false; }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            const record = Object.assign({}, teacher || {}, values, {
              id: teacher ? teacher.id : u.uid("tch"),
              title: values.title || (values.status === "Part-time" ? "Lecturer" : "Faculty member"),
              joined: teacher ? teacher.joined : u.todayISO()
            });
            if (teacher) {
              const index = CMS.data.teachers.findIndex(function (t) { return t.id === teacher.id; });
              CMS.data.teachers[index] = record;
            } else {
              CMS.data.teachers.push(record);
            }
            CMS.store.save();
            close();
            ui.toast(teacher ? "Faculty record updated." : record.name + " has been added to the faculty directory.", "success", teacher ? "Changes saved" : "Teacher added");
            paint();
          });
        }
      });
    }

    function openView(teacher) {
      const dept = CMS.department(teacher.departmentId);
      const courses = CMS.data.courses.filter(function (c) { return c.teacherId === teacher.id; });
      const classes = CMS.data.classes.filter(function (c) { return c.teacherId === teacher.id; });
      const body = '<div class="detail-profile">' + u.avatar(teacher.name, "xl") +
        '<div><h3>' + u.escape(teacher.name) + "</h3><p>" + u.escape(teacher.title) + " · " + u.escape(dept ? dept.short : "") + "</p>" + u.statusBadge(teacher.status) + "</div></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("user", 12) + " Contact & employment</p>" +
          '<dl class="detail-grid">' +
            '<div class="detail-item"><dt>Employee ID</dt><dd>' + u.escape(teacher.employeeId) + "</dd></div>" +
            '<div class="detail-item"><dt>Department</dt><dd>' + u.escape(dept ? dept.name : "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Email</dt><dd>' + u.escape(teacher.email) + "</dd></div>" +
            '<div class="detail-item"><dt>Phone</dt><dd>' + u.escape(teacher.phone) + "</dd></div>" +
            '<div class="detail-item"><dt>Office</dt><dd>' + u.escape(teacher.office || "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Joined</dt><dd>' + u.formatDate(teacher.joined, "medium") + "</dd></div>" +
          "</dl></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("book-open", 12) + " Teaching</p>" +
          '<div class="subject-list">' + teacher.subjects.map(function (subject) { return '<span class="subject-chip">' + u.escape(subject) + "</span>"; }).join("") + "</div>" +
          '<div class="summary-card-grid" style="margin-top:14px">' +
            '<div class="summary-card"><span>Courses</span><strong>' + courses.length + "</strong><small>Assigned this term</small></div>" +
            '<div class="summary-card"><span>Class groups</span><strong>' + classes.length + "</strong><small>As class teacher</small></div>" +
            '<div class="summary-card"><span>Subjects</span><strong>' + teacher.subjects.length + "</strong><small>On teaching record</small></div>" +
          "</div></div>" +
        (courses.length ? '<div class="detail-section"><p class="detail-section-title">' + ui.icon("layers", 12) + " Assigned courses</p><div class=\"info-list\">" +
          courses.slice(0, 6).map(function (course) {
            return '<div class="info-row"><span>' + u.escape(course.code) + " · " + u.escape(course.title) + "</span><strong>Sem " + course.semester + "</strong></div>";
          }).join("") + "</div></div>" : "") +
        '<div class="callout">' + ui.icon("info", 15) + "<span>Faculty records are demo data stored in this browser. They are not connected to a live college system.</span></div>";

      ui.drawer.open({
        title: "Faculty details",
        subtitle: teacher.employeeId,
        wide: true,
        body: body,
        footer: '<button class="btn btn-danger-soft" type="button" data-view-delete>' + ui.icon("trash", 15) + "Delete</button>" +
          '<button class="btn btn-outline" type="button" data-drawer-close>Close</button>' +
          '<button class="btn btn-primary" type="button" data-view-edit>' + ui.icon("edit", 15) + "Edit teacher</button>",
        onMount: function (drawer, close) {
          drawer.querySelector("[data-view-edit]").addEventListener("click", function () {
            close();
            openForm(teacher);
          });
          drawer.querySelector("[data-view-delete]").addEventListener("click", function () {
            close();
            removeTeacher(teacher);
          });
        }
      });
    }

    function removeTeacher(teacher) {
      const isHead = CMS.data.departments.some(function (dept) { return dept.headId === teacher.id; });
      if (isHead) {
        ui.toast("Reassign the department head role before deleting this teacher.", "warning", "Cannot delete department head");
        return;
      }
      ui.confirm({
        title: "Delete faculty record?",
        heading: "Remove " + teacher.name + "?",
        message: "This will remove the teacher from the demo directory and unassign their courses and classes. This cannot be undone.",
        confirmLabel: "Delete teacher",
        tone: "danger",
        icon: "trash"
      }).then(function (ok) {
        if (!ok) return;
        CMS.data.teachers = CMS.data.teachers.filter(function (t) { return t.id !== teacher.id; });
        CMS.data.courses.forEach(function (course) { if (course.teacherId === teacher.id) course.teacherId = null; });
        CMS.data.classes.forEach(function (cls) { if (cls.teacherId === teacher.id) cls.teacherId = null; });
        CMS.store.save();
        ui.toast(teacher.name + " was removed from the demo directory.", "success", "Teacher deleted");
        paint();
      });
    }

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">People · Faculty directory</p><h1 class="view-title">Teachers</h1>' +
        '<p class="view-sub"><span id="teacherCount">' + CMS.data.teachers.length + "</span> faculty and instructors across the college. Search by name, employee ID, or subject.</p></div>" +
        '<div class="view-actions"><button class="btn btn-outline" type="button" id="teacherExport">' + ui.icon("download", 15) + ' Export</button>' +
        '<button class="btn btn-primary" type="button" id="teacherAdd">' + ui.icon("plus", 15) + " Add teacher</button></div></div>" +
      '<div class="card table-card">' +
        '<div class="table-toolbar">' +
          '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="teacherSearch" value="' + u.escape(state.q) + '" placeholder="Search teacher, ID, or subject" aria-label="Search teachers" /></div>' +
          '<select class="select-compact" id="teacherDept" aria-label="Filter by department"><option value="all">All departments</option>' +
            CMS.data.departments.map(function (dept) { return '<option value="' + dept.id + '">' + u.escape(dept.short) + "</option>"; }).join("") + "</select>" +
          '<select class="select-compact" id="teacherStatus" aria-label="Filter by employment status"><option value="all">All statuses</option>' +
            STATUSES.map(function (status) { return "<option>" + status + "</option>"; }).join("") + "</select>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="teacherReset">Reset</button>' +
          '<span class="toolbar-count">Demo data · saved locally</span>' +
        "</div><div id=\"teachersTableRegion\"></div></div>";

    const search = root.querySelector("#teacherSearch");
    const dept = root.querySelector("#teacherDept");
    const status = root.querySelector("#teacherStatus");

    function reset() {
      state.q = "";
      state.dept = "all";
      state.status = "all";
      state.page = 1;
      search.value = "";
      dept.value = "all";
      status.value = "all";
      paint();
    }

    search.addEventListener("input", function () { state.q = search.value; state.page = 1; paint(); });
    dept.addEventListener("change", function () { state.dept = dept.value; state.page = 1; paint(); });
    status.addEventListener("change", function () { state.status = status.value; state.page = 1; paint(); });
    root.querySelector("#teacherReset").addEventListener("click", reset);

    root.querySelector(".table-card").addEventListener("click", function (event) {
      const target = event.target.closest("[data-view], [data-edit], [data-delete], [data-sort], [data-page], [data-clear]");
      if (!target) return;
      if (target.hasAttribute("data-view")) {
        const teacher = CMS.teacher(target.getAttribute("data-view"));
        if (teacher) openView(teacher);
      } else if (target.hasAttribute("data-edit")) {
        const teacher = CMS.teacher(target.getAttribute("data-edit"));
        if (teacher) openForm(teacher);
      } else if (target.hasAttribute("data-delete")) {
        const teacher = CMS.teacher(target.getAttribute("data-delete"));
        if (teacher) removeTeacher(teacher);
      } else if (target.hasAttribute("data-sort")) {
        const key = target.getAttribute("data-sort");
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = key; state.sortDir = "asc"; }
        paint();
      } else if (target.hasAttribute("data-page")) {
        state.page = Number(target.getAttribute("data-page")) || 1;
        paint();
      } else if (target.hasAttribute("data-clear")) {
        reset();
      }
    });

    root.querySelector("#teacherAdd").addEventListener("click", function () { openForm(null); });

    root.querySelector("#teacherExport").addEventListener("click", function () {
      const list = filtered();
      if (!list.length) { ui.toast("There are no teacher records in this view to export.", "warning"); return; }
      const rows = [["Name", "Employee ID", "Title", "Department", "Subjects", "Email", "Phone", "Office", "Status"]];
      list.forEach(function (teacher) {
        const deptObj = CMS.department(teacher.departmentId);
        rows.push([teacher.name, teacher.employeeId, teacher.title, deptObj ? deptObj.name : "", teacher.subjects.join("; "), teacher.email, teacher.phone, teacher.office, teacher.status]);
      });
      ui.downloadCSV("evergreen-teachers.csv", rows);
      ui.toast("Faculty directory exported as a CSV file.", "success", "Export ready");
    });

    paint();
    if (params.get("new") === "1") openForm(null);
  }

  CMS.views = CMS.views || {};
  CMS.views.teachers = { render: render };
})();
