/* Attendance register. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const STATUSES = [
    { id: "present", label: "Present" },
    { id: "late", label: "Late" },
    { id: "absent", label: "Absent" },
    { id: "excused", label: "Excused" }
  ];

  function render(root, params) {
    const classParam = params.get("class");
    const initialClass = CMS.classInfo(classParam) || CMS.data.classes[0];
    const state = {
      classId: initialClass ? initialClass.id : "",
      date: u.todayISO(),
      subjectId: "",
      marks: {},
      saved: false
    };

    function currentClass() { return CMS.classInfo(state.classId); }
    function subjectsFor(classId) {
      const cls = CMS.classInfo(classId);
      if (!cls) return [];
      return CMS.data.courses.filter(function (course) {
        return course.programId === cls.programId && course.semester === cls.semester;
      });
    }
    function roster() { return CMS.studentsInClass(state.classId); }
    function marksKey() { return state.date + "|" + state.classId + "|" + state.subjectId; }

    function ensureSubject() {
      const subjects = subjectsFor(state.classId);
      if (!subjects.some(function (course) { return course.id === state.subjectId; })) {
        state.subjectId = subjects[0] ? subjects[0].id : "";
      }
    }

    function loadMarks() {
      ensureSubject();
      const saved = CMS.data.attendanceMarks[marksKey()];
      state.marks = {};
      roster().forEach(function (student) {
        state.marks[student.id] = saved && saved[student.id] ? saved[student.id] : "present";
      });
      state.saved = Boolean(saved);
    }

    function summary() {
      const values = Object.keys(state.marks).map(function (id) { return state.marks[id]; });
      const total = values.length;
      const counts = { present: 0, late: 0, absent: 0, excused: 0 };
      values.forEach(function (status) { if (counts[status] != null) counts[status] += 1; });
      const rate = total ? ((counts.present + counts.late) / total) * 100 : 0;
      return { total: total, counts: counts, rate: rate };
    }

    function donutStyle(counts, total) {
      if (!total) return "--seg-present:0%;--seg-late:0%;--seg-absent:0%";
      const present = (counts.present / total) * 100;
      const late = ((counts.present + counts.late) / total) * 100;
      const absent = ((counts.present + counts.late + counts.absent) / total) * 100;
      return "--seg-present:" + present.toFixed(1) + "%;--seg-late:" + late.toFixed(1) + "%;--seg-absent:" + absent.toFixed(1) + "%";
    }

    function summaryHTML() {
      const data = summary();
      const subjects = subjectsFor(state.classId);
      const subject = subjects.find(function (course) { return course.id === state.subjectId; });
      return '<div class="summary-top"><h3>Session summary</h3><p>' + u.escape(subject ? subject.code + " · " + subject.title : "No subject selected") + "</p></div>" +
        '<div class="summary-donut"><div class="donut" style="' + donutStyle(data.counts, data.total) + '">' +
          '<div class="donut-center"><strong>' + data.rate.toFixed(1) + '%</strong><span>Attendance</span></div></div></div>' +
        '<div class="summary-counts">' +
          '<div class="summary-count"><span>Present</span><strong>' + data.counts.present + "</strong></div>" +
          '<div class="summary-count"><span>Late</span><strong>' + data.counts.late + "</strong></div>" +
          '<div class="summary-count"><span>Absent</span><strong>' + data.counts.absent + "</strong></div>" +
          '<div class="summary-count"><span>Excused</span><strong>' + data.counts.excused + "</strong></div>" +
        "</div>" +
        '<div class="summary-note">' + ui.icon("info", 13) + "<span>" + (state.saved ? "A saved register was loaded for this session." : "New register. Everyone is marked present by default.") + "</span></div>" +
        '<div class="summary-actions"><button class="btn btn-primary" type="button" id="saveAttendance"' + (data.total ? "" : " disabled") + ">" + ui.icon("check", 15) + " Save attendance</button>" +
        '<p>Demo save · stored in this browser</p></div>';
    }

    function rosterHTML() {
      const students = roster();
      const cls = currentClass();
      const subjects = subjectsFor(state.classId);
      const subject = subjects.find(function (course) { return course.id === state.subjectId; });
      root.querySelector("#rosterSubject").textContent = (cls ? cls.name : "") + (subject ? " · " + subject.code : "");
      root.querySelector("#rosterCount").textContent = students.length + " " + u.plural(students.length, "student");

      if (!students.length) {
        root.querySelector("#attendanceRoster").innerHTML = ui.emptyState({
          icon: "users",
          title: "No students in this class",
          text: "Assign students to this class group before taking a register.",
          compact: true
        });
        return;
      }

      root.querySelector("#attendanceRoster").innerHTML = '<div class="table-wrap"><table class="data-table roster-table">' +
        '<caption class="sr-only">Attendance roster for ' + u.escape(cls ? cls.name : "") + "</caption>" +
        '<thead><tr><th>Student</th><th>Admission no.</th><th>Mark attendance</th></tr></thead><tbody>' +
        students.map(function (student) {
          const current = state.marks[student.id] || "present";
          return '<tr data-row="' + student.id + '"><td>' + u.avatarPair(student.name, student.email) + "</td>" +
            '<td><span class="cell-mono">' + u.escape(student.admissionNo) + "</span></td>" +
            '<td><div class="status-group" role="group" aria-label="Attendance status for ' + u.escape(student.name) + '">' +
            STATUSES.map(function (status) {
              return '<button class="status-btn ' + status.id + '" type="button" data-student="' + student.id + '" data-status="' + status.id + '" aria-pressed="' + (current === status.id) + '">' + status.label + "</button>";
            }).join("") + "</div></td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function updateRow(studentId) {
      const row = root.querySelector('[data-row="' + studentId + '"]');
      if (!row) return;
      row.querySelectorAll("[data-status]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-status") === state.marks[studentId]));
      });
    }

    function paintSummary() {
      const holder = root.querySelector("#attendanceSummary");
      if (holder) holder.innerHTML = summaryHTML();
      bindSave();
    }

    function paintRecords() {
      const region = root.querySelector("#attendanceRecords");
      if (!region) return;
      const rows = CMS.data.attendanceHistory.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date) || a.classId.localeCompare(b.classId);
      }).slice(0, 8);
      if (!rows.length) {
        region.innerHTML = ui.emptyState({ icon: "clipboard-check", title: "No saved registers yet", text: "Save your first register to see recent class records here.", compact: true });
        return;
      }
      region.innerHTML = '<div class="table-wrap"><table class="data-table recent-table">' +
        '<caption class="sr-only">Recent class attendance records</caption>' +
        '<thead><tr><th>Date</th><th>Class</th><th class="cell-center">Present</th><th class="cell-center">Late</th><th class="cell-center">Absent</th><th class="cell-center">Excused</th><th>Rate</th></tr></thead><tbody>' +
        rows.map(function (entry) {
          const cls = CMS.classInfo(entry.classId);
          const rate = entry.total ? ((entry.present + entry.late) / entry.total) * 100 : 0;
          const tone = rate >= 90 ? "" : rate >= 80 ? "warning" : "danger";
          return "<tr><td><span class=\"cell-strong\">" + u.formatDate(entry.date, "short") + '</span><span class="cell-sub">' + u.formatDate(entry.date, "weekday") + "</span></td>" +
            "<td>" + u.escape(cls ? cls.name : "—") + "</td>" +
            '<td class="cell-center cell-mono">' + entry.present + "</td>" +
            '<td class="cell-center cell-mono">' + entry.late + "</td>" +
            '<td class="cell-center cell-mono">' + entry.absent + "</td>" +
            '<td class="cell-center cell-mono">' + entry.excused + "</td>" +
            '<td><span class="rate-chip ' + tone + '">' + rate.toFixed(1) + "%</span></td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function bindSave() {
      const save = root.querySelector("#saveAttendance");
      if (!save) return;
      save.addEventListener("click", function () {
        const data = summary();
        if (!data.total) { ui.toast("There are no students to save for this class.", "warning"); return; }
        const cls = currentClass();
        const subject = CMS.data.courses.find(function (course) { return course.id === state.subjectId; });
        ui.confirm({
          title: "Save this attendance register?",
          heading: (cls ? cls.name : "Class") + " · " + u.formatDate(state.date, "medium"),
          message: "This will record " + data.counts.present + " present, " + data.counts.late + " late, " + data.counts.absent + " absent, and " + data.counts.excused + " excused" + (subject ? " for " + subject.code : "") + ". You can update it later in this demo.",
          confirmLabel: "Save attendance",
          tone: "warning",
          icon: "clipboard-check"
        }).then(function (ok) {
          if (!ok) return;
          CMS.data.attendanceMarks[marksKey()] = Object.assign({}, state.marks);
          const existing = CMS.data.attendanceHistory.find(function (entry) {
            return entry.date === state.date && entry.classId === state.classId;
          });
          const record = {
            id: existing ? existing.id : u.uid("att"),
            date: state.date,
            classId: state.classId,
            present: data.counts.present,
            late: data.counts.late,
            absent: data.counts.absent,
            excused: data.counts.excused,
            total: data.total
          };
          if (existing) Object.assign(existing, record);
          else CMS.data.attendanceHistory.push(record);
          CMS.store.save();
          state.saved = true;
          paintSummary();
          paintRecords();
          ui.toast("Attendance saved for " + (cls ? cls.name : "this class") + " on " + u.formatDate(state.date, "short") + ".", "success", "Register saved");
        });
      });
    }

    const classOptions = CMS.data.classes.map(function (cls) {
      const program = CMS.program(cls.programId);
      return '<option value="' + cls.id + '"' + (cls.id === state.classId ? " selected" : "") + ">" + u.escape(cls.name) + " · " + u.escape(program ? program.code : "") + "</option>";
    }).join("");

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Daily register</p><h1 class="view-title">Attendance</h1>' +
        '<p class="view-sub">Mark a class register, review the live totals, and save a demo record. Rates count present and late as attended.</p></div>' +
        '<div class="view-actions"><span class="pill">' + ui.icon("calendar", 13) + u.formatDate(u.todayISO(), "medium") + '</span><a class="btn btn-outline" href="app.html#/reports?type=attendance">' + ui.icon("chart", 15) + " Attendance report</a></div></div>" +
      '<div class="page-stack">' +
        '<div class="card attendance-controls">' +
          '<div class="field"><label for="attDate">Date</label><input id="attDate" type="date" max="' + u.todayISO() + '" value="' + u.todayISO() + '" /></div>' +
          '<div class="field"><label for="attClass">Class</label><select id="attClass">' + classOptions + "</select></div>" +
          '<div class="field"><label for="attSubject">Subject</label><select id="attSubject"></select></div>' +
          '<button class="btn btn-outline" type="button" id="markAll">' + ui.icon("check-circle", 15) + " Mark all present</button>" +
        "</div>" +
        '<div class="attendance-layout">' +
          '<section class="card roster-card">' +
            '<div class="roster-head"><div class="roster-head-copy"><h3 id="rosterSubject">Class register</h3><p><span id="rosterCount">0 students</span> · click a status for each student</p></div><span class="badge badge-info no-dot">Live totals</span></div>' +
            '<div id="attendanceRoster"></div>' +
          "</section>" +
          '<aside class="card attendance-summary" id="attendanceSummary"></aside>' +
        "</div>" +
        '<section class="card table-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Recent class records</h2><p class="card-sub">The latest saved registers across the college</p></div><a class="link-btn" href="app.html#/reports?type=attendance">Open report ' + ui.icon("arrow-right", 13) + "</a></div>" +
          '<div id="attendanceRecords" style="padding-top:12px"></div>' +
        "</section>" +
      "</div>";

    const dateInput = root.querySelector("#attDate");
    const classSelect = root.querySelector("#attClass");
    const subjectSelect = root.querySelector("#attSubject");

    function paintSubjects() {
      const subjects = subjectsFor(state.classId);
      ensureSubject();
      subjectSelect.innerHTML = subjects.map(function (course) {
        return '<option value="' + course.id + '"' + (course.id === state.subjectId ? " selected" : "") + ">" + u.escape(course.code) + " · " + u.escape(course.title) + "</option>";
      }).join("");
      subjectSelect.disabled = !subjects.length;
    }

    function refreshAll() {
      loadMarks();
      paintSubjects();
      rosterHTML();
      paintSummary();
    }

    dateInput.addEventListener("change", function () {
      state.date = dateInput.value || u.todayISO();
      dateInput.value = state.date;
      refreshAll();
    });
    classSelect.addEventListener("change", function () {
      state.classId = classSelect.value;
      state.subjectId = "";
      refreshAll();
    });
    subjectSelect.addEventListener("change", function () {
      state.subjectId = subjectSelect.value;
      refreshAll();
    });

    root.querySelector("#markAll").addEventListener("click", function () {
      roster().forEach(function (student) { state.marks[student.id] = "present"; });
      rosterHTML();
      paintSummary();
      ui.toast("Everyone in the class is marked present. Remember to save the register.", "info", "Register updated");
    });

    root.addEventListener("click", function (event) {
      const statusButton = event.target.closest("[data-student][data-status]");
      if (!statusButton) return;
      const studentId = statusButton.getAttribute("data-student");
      state.marks[studentId] = statusButton.getAttribute("data-status");
      updateRow(studentId);
      paintSummary();
    });

    refreshAll();
    paintRecords();
  }

  CMS.views = CMS.views || {};
  CMS.views.attendance = { render: render };
})();
