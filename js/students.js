/* Student management. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;

  const STATUSES = ["Active", "Probation", "Inactive"];

  function optionList(items, selected, valueKey, labelKey) {
    return items.map(function (item) {
      const value = item[valueKey];
      return '<option value="' + u.escape(value) + '"' + (value === selected ? " selected" : "") + ">" + u.escape(item[labelKey]) + "</option>";
    }).join("");
  }

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
      let list = CMS.data.students.slice();
      const q = state.q.trim().toLowerCase();
      if (q) {
        list = list.filter(function (student) {
          return student.name.toLowerCase().includes(q) ||
            student.admissionNo.toLowerCase().includes(q) ||
            student.email.toLowerCase().includes(q);
        });
      }
      if (state.dept !== "all") list = list.filter(function (student) { return student.departmentId === state.dept; });
      if (state.status !== "all") list = list.filter(function (student) { return student.status === state.status; });
      list.sort(function (a, b) {
        let av;
        let bv;
        if (state.sortKey === "admissionNo") {
          av = a.admissionNo;
          bv = b.admissionNo;
        } else if (state.sortKey === "admitted") {
          av = a.admissionDate;
          bv = b.admissionDate;
        } else {
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
        }
        const result = String(av).localeCompare(String(bv));
        return state.sortDir === "asc" ? result : -result;
      });
      return list;
    }

    function tableHTML(list) {
      const pages = Math.max(1, Math.ceil(list.length / state.pageSize));
      state.page = Math.min(state.page, pages);
      const start = (state.page - 1) * state.pageSize;
      const rows = list.slice(start, start + state.pageSize);

      if (!list.length) {
        return ui.emptyState({
          icon: "users",
          title: "No students match these filters",
          text: "Try a different name or admission number, or clear the department and status filters.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-clear-filters>Clear filters</button>'
        });
      }

      const sortIcon = function (key) {
        if (state.sortKey !== key) return ui.icon("chevron-down", 12);
        return ui.icon(state.sortDir === "asc" ? "arrow-up" : "arrow-down", 12);
      };

      return '<div class="table-wrap"><table class="data-table">' +
        "<caption class=\"sr-only\">Student records with programme, contact details, and enrolment status</caption>" +
        "<thead><tr>" +
          '<th><button class="sort-btn ' + (state.sortKey === "name" ? "is-sorted" : "") + '" type="button" data-sort="name">Student ' + sortIcon("name") + "</button></th>" +
          '<th><button class="sort-btn ' + (state.sortKey === "admissionNo" ? "is-sorted" : "") + '" type="button" data-sort="admissionNo">Admission no. ' + sortIcon("admissionNo") + "</button></th>" +
          "<th>Programme & class</th><th>Contact</th><th>Status</th><th class=\"cell-actions\">Actions</th>" +
        "</tr></thead><tbody>" +
        rows.map(function (student) {
          const program = CMS.program(student.programId);
          const cls = CMS.classInfo(student.classId);
          return '<tr data-student-row="' + u.escape(student.id) + '">' +
            "<td>" + u.avatarPair(student.name, student.email) + "</td>" +
            '<td><span class="cell-mono">' + u.escape(student.admissionNo) + "</span></td>" +
            '<td><span class="cell-strong">' + u.escape(program ? program.name : "—") + '</span><span class="cell-sub">' + u.escape(cls ? cls.name : "—") + " · Semester " + student.semester + "</span></td>" +
            '<td><span class="cell-strong">' + u.escape(student.phone) + '</span><span class="cell-sub">Admitted ' + u.formatDate(student.admissionDate, "short") + "</span></td>" +
            "<td>" + u.statusBadge(student.status) + "</td>" +
            '<td class="cell-actions"><div class="row-actions">' +
              '<button class="icon-action" type="button" data-view="' + u.escape(student.id) + '" aria-label="View ' + u.escape(student.name) + '" title="View record">' + ui.icon("eye") + "</button>" +
              '<button class="icon-action" type="button" data-edit="' + u.escape(student.id) + '" aria-label="Edit ' + u.escape(student.name) + '" title="Edit record">' + ui.icon("edit") + "</button>" +
              '<button class="icon-action danger" type="button" data-delete="' + u.escape(student.id) + '" aria-label="Delete ' + u.escape(student.name) + '" title="Delete record">' + ui.icon("trash") + "</button>" +
            "</div></td></tr>";
        }).join("") +
        "</tbody></table></div>" + ui.pager({ page: state.page, pages: pages, total: list.length, pageSize: state.pageSize, label: "students" });
    }

    function paint() {
      const list = filtered();
      const region = root.querySelector("#studentsTableRegion");
      if (!region) return;
      region.innerHTML = tableHTML(list);
      const count = root.querySelector("#studentCount");
      if (count) count.textContent = list.length === CMS.data.students.length ? String(CMS.data.students.length) : list.length + " of " + CMS.data.students.length;
    }

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

    function nextAdmissionNo() {
      const year = new Date().getFullYear();
      const prefix = "EC-" + year + "-";
      const numbers = CMS.data.students
        .filter(function (s) { return s.admissionNo.indexOf(prefix) === 0; })
        .map(function (s) { return Number(s.admissionNo.replace(prefix, "")); })
        .filter(function (n) { return !isNaN(n); });
      const next = (numbers.length ? Math.max.apply(null, numbers) : 100) + 1;
      return prefix + next;
    }

    function openForm(student) {
      const editing = Boolean(student);
      const departments = CMS.data.departments;
      const currentDept = student ? student.departmentId : departments[0].id;
      const programs = CMS.data.programs.filter(function (p) { return p.departmentId === currentDept; });
      const currentProgram = student ? student.programId : (programs[0] ? programs[0].id : "");
      const classes = CMS.data.classes.filter(function (c) { return c.programId === currentProgram; });
      const currentClass = student ? student.classId : (classes[0] ? classes[0].id : "");
      const currentSemester = student ? String(student.semester) : (classes[0] ? String(classes[0].semester) : "1");

      const body = '<form id="studentForm" novalidate>' +
        '<div class="form-grid">' +
          '<div class="field span-2"><label for="stName">Full name <span class="text-danger">*</span></label>' +
            '<input id="stName" name="name" type="text" autofocus value="' + u.escape(student ? student.name : "") + '" placeholder="e.g. Amara Okafor" aria-describedby="stNameError" />' +
            '<p class="field-error" id="stNameError" data-error-for="name" role="alert"></p></div>' +
          '<div class="field"><label for="stAdmission">Admission number <span class="text-danger">*</span></label>' +
            '<input id="stAdmission" name="admissionNo" type="text" value="' + u.escape(student ? student.admissionNo : nextAdmissionNo()) + '" placeholder="EC-2026-101" aria-describedby="stAdmissionError" />' +
            '<p class="field-error" id="stAdmissionError" data-error-for="admissionNo" role="alert"></p></div>' +
          '<div class="field"><label for="stStatus">Enrolment status <span class="text-danger">*</span></label>' +
            '<select id="stStatus" name="status">' + STATUSES.map(function (status) { return '<option' + (student && student.status === status ? " selected" : "") + ">" + status + "</option>"; }).join("") + "</select></div>" +
          '<div class="field"><label for="stEmail">Email address <span class="text-danger">*</span></label>' +
            '<input id="stEmail" name="email" type="email" value="' + u.escape(student ? student.email : "") + '" placeholder="name@student.evergreen.edu" aria-describedby="stEmailError" />' +
            '<p class="field-error" id="stEmailError" data-error-for="email" role="alert"></p></div>' +
          '<div class="field"><label for="stPhone">Phone number <span class="text-danger">*</span></label>' +
            '<input id="stPhone" name="phone" type="tel" value="' + u.escape(student ? student.phone : "") + '" placeholder="+1 (802) 555-0100" aria-describedby="stPhoneError" />' +
            '<p class="field-error" id="stPhoneError" data-error-for="phone" role="alert"></p></div>' +
          '<p class="form-section-title">Academic placement</p>' +
          '<div class="field"><label for="stDepartment">Department <span class="text-danger">*</span></label>' +
            '<select id="stDepartment" name="departmentId">' + optionList(departments, currentDept, "id", "name") + "</select></div>" +
          '<div class="field"><label for="stProgram">Programme <span class="text-danger">*</span></label>' +
            '<select id="stProgram" name="programId">' + optionList(CMS.data.programs.filter(function (p) { return p.departmentId === currentDept; }), currentProgram, "id", "name") + "</select></div>" +
          '<div class="field"><label for="stClass">Class <span class="text-danger">*</span></label>' +
            '<select id="stClass" name="classId">' + optionList(classes, currentClass, "id", "name") + '</select><p class="hint">Semester updates from the selected class.</p></div>' +
          '<div class="field"><label for="stSemester">Semester</label><input id="stSemester" name="semester" type="text" value="' + currentSemester + '" readonly /></div>' +
          '<div class="field"><label for="stDate">Admission date <span class="text-danger">*</span></label>' +
            '<input id="stDate" name="admissionDate" type="date" max="' + u.todayISO() + '" value="' + u.escape(student ? student.admissionDate : u.todayISO()) + '" aria-describedby="stDateError" />' +
            '<p class="field-error" id="stDateError" data-error-for="admissionDate" role="alert"></p></div>' +
          '<div class="field"><label for="stAddress">Home address</label><input id="stAddress" name="address" type="text" value="' + u.escape(student ? (student.address || "") : "") + '" placeholder="Street, city" /></div>' +
          '<div class="field span-2"><div class="form-note">' + ui.icon("info", 14) + "<span>Student records are stored in this browser for demonstration only. Deleting a student also removes their fee record and library loans.</span></div></div>" +
        "</div></form>";

      const ref = ui.modal.open({
        title: editing ? "Edit student record" : "Add a new student",
        subtitle: editing ? "Update the student's academic and contact information." : "Create a sample record to use across the dashboard and modules.",
        size: "modal-lg",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="studentForm">' + ui.icon(editing ? "check" : "plus", 15) + (editing ? "Save changes" : "Add student") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#studentForm");
          const deptSelect = form.elements.departmentId;
          const programSelect = form.elements.programId;
          const classSelect = form.elements.classId;
          const semesterInput = form.elements.semester;

          function syncPrograms() {
            const options = CMS.data.programs.filter(function (p) { return p.departmentId === deptSelect.value; });
            programSelect.innerHTML = optionList(options, "", "id", "name");
            syncClasses();
          }
          function syncClasses() {
            const options = CMS.data.classes.filter(function (c) { return c.programId === programSelect.value; });
            classSelect.innerHTML = optionList(options, "", "id", "name");
            const cls = CMS.classInfo(classSelect.value);
            semesterInput.value = cls ? String(cls.semester) : "";
          }

          deptSelect.addEventListener("change", syncPrograms);
          programSelect.addEventListener("change", syncClasses);
          classSelect.addEventListener("change", function () {
            const cls = CMS.classInfo(classSelect.value);
            semesterInput.value = cls ? String(cls.semester) : "";
          });

          form.addEventListener("input", function (event) {
            if (event.target.name) fieldError(form, event.target.name, "");
          });

          form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearErrors(form);
            const values = {
              name: form.elements.name.value.trim(),
              admissionNo: form.elements.admissionNo.value.trim(),
              email: form.elements.email.value.trim(),
              phone: form.elements.phone.value.trim(),
              departmentId: form.elements.departmentId.value,
              programId: form.elements.programId.value,
              classId: form.elements.classId.value,
              admissionDate: form.elements.admissionDate.value,
              status: form.elements.status.value,
              address: form.elements.address.value.trim()
            };
            let valid = true;

            if (!values.name || values.name.length < 2) { fieldError(form, "name", "Enter the student's full name."); valid = false; }
            if (!values.admissionNo) { fieldError(form, "admissionNo", "An admission number is required."); valid = false; }
            else if (CMS.data.students.some(function (s) { return s.admissionNo.toLowerCase() === values.admissionNo.toLowerCase() && (!student || s.id !== student.id); })) {
              fieldError(form, "admissionNo", "That admission number is already in use."); valid = false;
            }
            if (!values.email) { fieldError(form, "email", "Enter an email address."); valid = false; }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { fieldError(form, "email", "Enter a valid email address."); valid = false; }
            else if (CMS.data.students.some(function (s) { return s.email.toLowerCase() === values.email.toLowerCase() && (!student || s.id !== student.id); })) {
              fieldError(form, "email", "That email address is already linked to a student."); valid = false;
            }
            if (!values.phone) { fieldError(form, "phone", "Enter a contact number."); valid = false; }
            if (!values.programId || !values.classId) { fieldError(form, "classId", "Choose a programme and class."); valid = false; }
            if (!values.admissionDate) { fieldError(form, "admissionDate", "Choose an admission date."); valid = false; }

            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }

            const cls = CMS.classInfo(values.classId);
            const record = Object.assign({}, student || {}, values, {
              id: student ? student.id : u.uid("stu"),
              semester: cls ? cls.semester : 1
            });

            if (student) {
              const index = CMS.data.students.findIndex(function (s) { return s.id === student.id; });
              CMS.data.students[index] = record;
            } else {
              CMS.data.students.push(record);
            }
            CMS.store.save();
            close();
            ui.toast(student ? "Student record updated." : record.name + " has been added to the student roll.", "success", student ? "Changes saved" : "Student added");
            paint();
          });
        }
      });
      return ref;
    }

    function attendanceStats(student) {
      const rows = CMS.data.attendanceHistory.filter(function (entry) { return entry.classId === student.classId; });
      const total = rows.reduce(function (sum, entry) { return sum + entry.total; }, 0);
      const attended = rows.reduce(function (sum, entry) { return sum + entry.present + entry.late; }, 0);
      return { total: total, attended: attended, rate: total ? (attended / total) * 100 : 0 };
    }

    function openView(student) {
      const program = CMS.program(student.programId);
      const department = CMS.department(student.departmentId);
      const cls = CMS.classInfo(student.classId);
      const fees = CMS.data.fees.filter(function (fee) { return fee.studentId === student.id; });
      const feeTotal = fees.reduce(function (sum, fee) { return sum + fee.amount; }, 0);
      const feePaid = fees.reduce(function (sum, fee) { return sum + fee.paid; }, 0);
      const attendance = attendanceStats(student);
      const loans = CMS.data.loans.filter(function (loan) { return loan.studentId === student.id && !loan.returnedOn; });

      const body = '<div class="detail-profile">' + u.avatar(student.name, "xl") +
        '<div><h3>' + u.escape(student.name) + "</h3><p>" + u.escape(student.admissionNo) + " · " + u.escape(program ? program.name : "") + "</p>" + u.statusBadge(student.status) + "</div></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("user", 12) + " Contact</p>" +
          '<dl class="detail-grid">' +
            '<div class="detail-item"><dt>Email</dt><dd>' + u.escape(student.email) + "</dd></div>" +
            '<div class="detail-item"><dt>Phone</dt><dd>' + u.escape(student.phone) + "</dd></div>" +
            '<div class="detail-item"><dt>Address</dt><dd>' + u.escape(student.address || "Not provided") + "</dd></div>" +
            '<div class="detail-item"><dt>Admitted</dt><dd>' + u.formatDate(student.admissionDate, "medium") + "</dd></div>" +
          "</dl></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("graduation-cap", 12) + " Academic placement</p>" +
          '<dl class="detail-grid">' +
            '<div class="detail-item"><dt>Department</dt><dd>' + u.escape(department ? department.name : "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Programme</dt><dd>' + u.escape(program ? program.name : "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Class</dt><dd>' + u.escape(cls ? cls.name : "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Semester</dt><dd>Semester ' + student.semester + " · " + u.escape(cls ? cls.room : "") + "</dd></div>" +
          "</dl></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("activity", 12) + " Snapshot</p>" +
          '<div class="summary-card-grid">' +
            '<div class="summary-card"><span>Attendance</span><strong>' + attendance.rate.toFixed(1) + "%</strong><small>Across this class</small></div>" +
            '<div class="summary-card"><span>Fees paid</span><strong>' + u.formatMoney(feePaid) + "</strong><small>of " + u.formatMoney(feeTotal) + " billed</small></div>" +
            '<div class="summary-card"><span>Library</span><strong>' + loans.length + "</strong><small>Active " + u.plural(loans.length, "loan") + "</small></div>" +
          "</div></div>" +
        (fees.length ? '<div class="detail-section"><p class="detail-section-title">' + ui.icon("credit-card", 12) + " Fee record</p>" +
          '<div class="info-list"><div class="info-row"><span>' + u.escape(fees[0].type) + '</span><strong>' + u.statusBadge(CMS.feeStatus(fees[0])) + "</strong></div>" +
          '<div class="info-row"><span>Balance</span><strong>' + u.formatMoney(Math.max(0, feeTotal - feePaid)) + "</strong></div>" +
          '<div class="info-row"><span>Due date</span><strong>' + u.formatDate(fees[0].dueDate, "medium") + "</strong></div></div></div>" : "") +
        '<div class="callout">' + ui.icon("info", 15) + "<span>This is a demonstration record. Information is stored only in this browser.</span></div>";

      const ref = ui.drawer.open({
        title: "Student details",
        subtitle: student.admissionNo,
        body: body,
        wide: true,
        footer: '<button class="btn btn-danger-soft" type="button" data-view-delete>' + ui.icon("trash", 15) + "Delete</button>" +
          '<button class="btn btn-outline" type="button" data-drawer-close>Close</button>' +
          '<button class="btn btn-primary" type="button" data-view-edit>' + ui.icon("edit", 15) + "Edit student</button>",
        onMount: function (drawer, close) {
          drawer.querySelector("[data-view-edit]").addEventListener("click", function () {
            close();
            openForm(student);
          });
          drawer.querySelector("[data-view-delete]").addEventListener("click", function () {
            close();
            removeStudent(student);
          });
        }
      });
      return ref;
    }

    function removeStudent(student) {
      ui.confirm({
        title: "Delete student record?",
        heading: "Remove " + student.name + "?",
        message: "This will remove the student, their fee record, and any library loans from this demo. This cannot be undone.",
        confirmLabel: "Delete student",
        tone: "danger",
        icon: "trash"
      }).then(function (ok) {
        if (!ok) return;
        CMS.data.students = CMS.data.students.filter(function (s) { return s.id !== student.id; });
        CMS.data.fees = CMS.data.fees.filter(function (fee) { return fee.studentId !== student.id; });
        CMS.data.loans = CMS.data.loans.filter(function (loan) { return loan.studentId !== student.id; });
        CMS.data.exams.forEach(function (exam) {
          if (exam.marks) delete exam.marks[student.id];
        });
        CMS.store.save();
        ui.toast(student.name + " was removed from the demo roll.", "success", "Student deleted");
        paint();
      });
    }

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">People · Student records</p>' +
        '<h1 class="view-title">Students</h1>' +
        '<p class="view-sub"><span id="studentCount">' + CMS.data.students.length + "</span> students across " + CMS.data.departments.length + " departments. Use search and filters to find a record quickly.</p></div>" +
        '<div class="view-actions"><button class="btn btn-outline" type="button" id="studentExport">' + ui.icon("download", 15) + ' Export</button>' +
        '<button class="btn btn-primary" type="button" id="studentAdd">' + ui.icon("plus", 15) + " Add student</button></div></div>" +
      '<div class="card table-card">' +
        '<div class="table-toolbar">' +
          '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="studentSearch" value="' + u.escape(state.q) + '" placeholder="Search name, admission no. or email" aria-label="Search students" /></div>' +
          '<select class="select-compact" id="studentDept" aria-label="Filter by department"><option value="all">All departments</option>' +
            CMS.data.departments.map(function (dept) { return '<option value="' + dept.id + '">' + u.escape(dept.short) + "</option>"; }).join("") + "</select>" +
          '<select class="select-compact" id="studentStatus" aria-label="Filter by status"><option value="all">All statuses</option>' +
            STATUSES.map(function (status) { return "<option>" + status + "</option>"; }).join("") + "</select>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="studentReset">Reset</button>' +
          '<span class="toolbar-count">Demo data · saved locally</span>' +
        "</div>" +
        '<div id="studentsTableRegion"></div>' +
      "</div>";

    const search = root.querySelector("#studentSearch");
    const dept = root.querySelector("#studentDept");
    const status = root.querySelector("#studentStatus");

    search.addEventListener("input", function () {
      state.q = search.value;
      state.page = 1;
      paint();
    });
    dept.addEventListener("change", function () {
      state.dept = dept.value;
      state.page = 1;
      paint();
    });
    status.addEventListener("change", function () {
      state.status = status.value;
      state.page = 1;
      paint();
    });
    root.querySelector("#studentReset").addEventListener("click", function () {
      state.q = "";
      state.dept = "all";
      state.status = "all";
      state.page = 1;
      search.value = "";
      dept.value = "all";
      status.value = "all";
      paint();
    });

    root.querySelector(".table-card").addEventListener("click", function (event) {
      const target = event.target.closest("[data-view], [data-edit], [data-delete], [data-sort], [data-page], [data-clear-filters]");
      if (!target) return;
      if (target.hasAttribute("data-view")) {
        const student = CMS.student(target.getAttribute("data-view"));
        if (student) openView(student);
      } else if (target.hasAttribute("data-edit")) {
        const student = CMS.student(target.getAttribute("data-edit"));
        if (student) openForm(student);
      } else if (target.hasAttribute("data-delete")) {
        const student = CMS.student(target.getAttribute("data-delete"));
        if (student) removeStudent(student);
      } else if (target.hasAttribute("data-sort")) {
        const key = target.getAttribute("data-sort");
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else {
          state.sortKey = key;
          state.sortDir = "asc";
        }
        paint();
      } else if (target.hasAttribute("data-page")) {
        state.page = Number(target.getAttribute("data-page")) || 1;
        paint();
      } else if (target.hasAttribute("data-clear-filters")) {
        state.q = "";
        state.dept = "all";
        state.status = "all";
        state.page = 1;
        search.value = "";
        dept.value = "all";
        status.value = "all";
        paint();
      }
    });

    root.querySelector("#studentAdd").addEventListener("click", function () { openForm(null); });

    root.querySelector("#studentExport").addEventListener("click", function () {
      const list = filtered();
      if (!list.length) {
        ui.toast("There are no student records in this view to export.", "warning");
        return;
      }
      const rows = [["Student", "Admission number", "Email", "Phone", "Department", "Programme", "Class", "Semester", "Admission date", "Status"]];
      list.forEach(function (student) {
        const deptObj = CMS.department(student.departmentId);
        const program = CMS.program(student.programId);
        const cls = CMS.classInfo(student.classId);
        rows.push([student.name, student.admissionNo, student.email, student.phone, deptObj ? deptObj.name : "", program ? program.name : "", cls ? cls.name : "", student.semester, student.admissionDate, student.status]);
      });
      ui.downloadCSV("evergreen-students.csv", rows);
      ui.toast("Student list exported as a CSV file.", "success", "Export ready");
    });

    paint();
    if (params.get("new") === "1") openForm(null);
  }

  CMS.views = CMS.views || {};
  CMS.views.students = { render: render };
})();
