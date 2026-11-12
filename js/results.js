/* Examinations, marks entry, grade calculations, and result sheets. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const TYPES = ["Quiz", "Assignment", "Midterm", "Practical", "Review", "Final"];
  const PASS_MARK = 50;

  function sortedExams() {
    return CMS.data.exams.slice().sort(function (a, b) { return a.date.localeCompare(b.date) || a.name.localeCompare(b.name); });
  }

  function subjectsFor(classId) {
    const cls = CMS.classInfo(classId);
    if (!cls) return [];
    return CMS.data.courses.filter(function (course) {
      return course.programId === cls.programId && course.semester === cls.semester;
    });
  }

  function validMark(value, total) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    if (!isFinite(number) || number < 0 || number > total) return null;
    return number;
  }

  function examStatus(exam) {
    const total = CMS.studentsInClass(exam.classId).length;
    const entered = Object.keys(exam.marks || {}).filter(function (id) {
      return validMark(exam.marks[id], exam.total) != null;
    }).length;
    if (!total) return "No class";
    if (!entered) return exam.date > u.todayISO() ? "Upcoming" : "Not graded";
    if (entered < total) return "In progress";
    return "Completed";
  }

  function classLabel(classId) {
    const cls = CMS.classInfo(classId);
    return cls ? cls.name : "—";
  }

  function documentHTML(exam) {
    const college = CMS.data.college;
    const cls = CMS.classInfo(exam.classId);
    const program = cls ? CMS.program(cls.programId) : null;
    const students = CMS.studentsInClass(exam.classId);
    const marks = students.map(function (student) {
      const raw = (exam.marks || {})[student.id];
      const mark = validMark(raw, exam.total);
      const pct = mark == null ? null : (mark / exam.total) * 100;
      return { student: student, mark: mark, pct: pct, grade: u.gradeFor(pct) };
    });
    const graded = marks.filter(function (entry) { return entry.mark != null; });
    const average = graded.length ? graded.reduce(function (sum, entry) { return sum + entry.pct; }, 0) / graded.length : 0;
    const passed = graded.filter(function (entry) { return entry.pct >= PASS_MARK; }).length;
    const passRate = graded.length ? (passed / graded.length) * 100 : 0;
    const highest = graded.length ? Math.max.apply(null, graded.map(function (entry) { return entry.pct; })) : 0;

    return '<div class="doc-sheet">' +
      '<div class="doc-head"><div class="doc-brand"><span class="brand-mark">' + u.escape((college.initials || "E").slice(0, 2)) + "</span>" +
        "<div><strong>" + u.escape(college.name) + "</strong><span>" + u.escape(college.tagline || "Campus administration") + "</span></div></div>" +
        '<div class="doc-meta"><strong>Examination result sheet</strong>' + u.escape(college.term) + "<br />" + u.escape(college.address) + "</div></div>" +
      '<div class="report-title-row"><div><h2>' + u.escape(exam.name) + "</h2><p>" + u.escape(exam.subject) + " · " + u.escape(cls ? cls.name : "") + " · " + u.formatDate(exam.date, "long") + "</p></div>" +
        '<span class="report-badge">' + u.escape(exam.type) + "</span></div>" +
      '<div class="doc-info">' +
        '<div class="doc-info-row"><span>Class</span><strong>' + u.escape(cls ? cls.name : "—") + "</strong></div>" +
        '<div class="doc-info-row"><span>Programme</span><strong>' + u.escape(program ? program.name : "—") + "</strong></div>" +
        '<div class="doc-info-row"><span>Subject</span><strong>' + u.escape(exam.subject) + "</strong></div>" +
        '<div class="doc-info-row"><span>Assessment date</span><strong>' + u.formatDate(exam.date, "medium") + "</strong></div>" +
        '<div class="doc-info-row"><span>Total marks</span><strong>' + exam.total + "</strong></div>" +
        '<div class="doc-info-row"><span>Marks entered</span><strong>' + graded.length + " of " + students.length + "</strong></div>" +
      "</div>" +
      '<div class="report-summary-grid" style="margin-top:16px">' +
        '<div class="report-summary-cell"><span>Class average</span><strong>' + average.toFixed(1) + "%</strong></div>" +
        '<div class="report-summary-cell"><span>Highest mark</span><strong>' + highest.toFixed(1) + "%</strong></div>" +
        '<div class="report-summary-cell"><span>Pass rate</span><strong>' + passRate.toFixed(1) + "%</strong></div>" +
        '<div class="report-summary-cell"><span>Passed</span><strong>' + passed + " / " + graded.length + "</strong></div>" +
      "</div>" +
      (students.length ? '<table class="doc-table"><thead><tr><th>Student</th><th>Admission no.</th><th class="num">Marks</th><th class="num">Percentage</th><th>Grade</th><th>Result</th></tr></thead><tbody>' +
        marks.map(function (entry) {
          return "<tr><td>" + u.escape(entry.student.name) + "</td><td>" + u.escape(entry.student.admissionNo) + "</td>" +
            '<td class="num">' + (entry.mark == null ? "—" : entry.mark + " / " + exam.total) + "</td>" +
            '<td class="num">' + (entry.pct == null ? "—" : entry.pct.toFixed(1) + "%") + "</td>" +
            "<td>" + (entry.grade || "—") + "</td><td>" + (entry.pct == null ? "Not graded" : entry.pct >= PASS_MARK ? "Pass" : "Fail") + "</td></tr>";
        }).join("") + "</tbody></table>" : '<p class="report-note">No students are enrolled in this class.</p>') +
      '<div class="report-note"><strong>Demo grading rules:</strong> A+ 90–100%, A 80–89%, B 70–79%, C 60–69%, D 50–59%, F below 50%. Pass mark: 50%. This result sheet is prototype data and is not an official transcript.</div>' +
      '<div class="doc-foot"><div>Generated ' + u.formatDate(u.todayISO(), "long") + " from the Evergreen College prototype.<br />Marks are stored in this browser only.</div>" +
        '<div class="doc-signature"><span>Examination officer</span></div></div>' +
    "</div>";
  }

  function showPreview(exam) {
    const html = documentHTML(exam);
    ui.modal.open({
      title: "Result sheet preview",
      subtitle: exam.name + " · " + classLabel(exam.classId),
      size: "modal-lg",
      body: '<div class="doc-preview">' + html + "</div>",
      footer: '<button class="btn btn-outline" type="button" data-modal-close>Close</button>' +
        '<button class="btn btn-primary" type="button" id="printResultSheet">' + ui.icon("printer", 15) + " Print result sheet</button>",
      onMount: function (modal) {
        modal.querySelector("#printResultSheet").addEventListener("click", function () {
          ui.print("Result sheet · " + exam.name, html);
        });
      }
    });
  }

  function render(root, params) {
    const exams = sortedExams();
    if (!exams.length) {
      root.innerHTML = '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Assessment</p><h1 class="view-title">Exams & results</h1></div></div>' +
        '<div class="card card-pad">' + ui.emptyState({ icon: "award", title: "No assessments yet", text: "Create an examination to begin entering marks." }) + "</div>";
      return;
    }

    const requested = CMS.exam(params.get("exam"));
    const initial = requested || exams[0];
    const state = {
      examId: initial.id,
      search: "",
      marks: {},
      dirty: false
    };

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Assessment</p><h1 class="view-title">Exams & results</h1>' +
        '<p class="view-sub">Enter sample marks, review calculated grades, and preview a printable result sheet. Grades update as you type.</p></div>' +
        '<div class="view-actions"><button class="btn btn-outline" type="button" id="previewResults">' + ui.icon("file-text", 15) + ' Preview result sheet</button>' +
        '<button class="btn btn-primary" type="button" id="newExam">' + ui.icon("plus", 15) + " New exam</button></div></div>" +
      '<div class="card exam-panel">' +
        '<div class="exam-panel-top">' +
          '<div class="exam-select-wrap"><label for="examSelect">Examination</label><select id="examSelect"></select></div>' +
          '<div class="exam-quick-meta" id="examMeta"></div>' +
        "</div>" +
      "</div>" +
      '<div class="result-summary" id="resultSummary" style="margin:16px 0"></div>' +
      '<div class="card table-card">' +
        '<div class="table-toolbar">' +
          '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="marksSearch" placeholder="Search a student in this class" aria-label="Search students in this exam" /></div>' +
          '<span class="toolbar-count" id="marksCount"></span>' +
          '<span class="badge badge-warning no-dot" id="markState" hidden>Unsaved changes</span>' +
        "</div>" +
        '<div id="marksRegion"></div>' +
        '<div class="exam-save-bar"><div><p id="saveNote">Marks are saved to this browser only. Leave a field blank for a student who has not been graded.</p>' +
          '<div class="grade-legend" style="border:0;background:transparent;padding:6px 0 0"><strong>Grading</strong><span>A+ 90+</span><span>A 80+</span><span>B 70+</span><span>C 60+</span><span>D 50+</span><span>F below 50</span></div></div>' +
          '<div class="row"><button class="btn btn-ghost btn-sm" type="button" id="discardMarks">Discard changes</button>' +
          '<button class="btn btn-outline btn-sm" type="button" id="exportMarks">' + ui.icon("download", 14) + ' Export CSV</button>' +
          '<button class="btn btn-primary btn-sm" type="button" id="saveMarks">' + ui.icon("check", 14) + " Save marks</button></div>" +
        "</div>" +
      "</div>" +
      '<div class="card table-card">' +
        '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Exam schedule</h2><p class="card-sub">All assessments across the college, ordered by date</p></div><span class="pill">' + CMS.data.exams.length + " total</span></div>" +
        '<div id="examList" style="padding-top:12px"></div>' +
      "</div>";

    const examSelect = root.querySelector("#examSelect");
    const search = root.querySelector("#marksSearch");
    const marksRegion = root.querySelector("#marksRegion");

    function currentExam() { return CMS.exam(state.examId); }

    function students() {
      const exam = currentExam();
      return exam ? CMS.studentsInClass(exam.classId) : [];
    }

    function markPercent(studentId) {
      const exam = currentExam();
      const raw = state.marks[studentId];
      const mark = validMark(raw, exam.total);
      return mark == null ? null : (mark / exam.total) * 100;
    }

    function summary() {
      const exam = currentExam();
      const list = students();
      const percents = list.map(function (student) { return markPercent(student.id); }).filter(function (pct) { return pct != null; });
      const average = percents.length ? percents.reduce(function (sum, pct) { return sum + pct; }, 0) / percents.length : 0;
      const passed = percents.filter(function (pct) { return pct >= PASS_MARK; }).length;
      const passRate = percents.length ? (passed / percents.length) * 100 : 0;
      const highest = percents.length ? Math.max.apply(null, percents) : 0;
      return { total: list.length, entered: percents.length, average: average, passRate: passRate, passed: passed, highest: highest };
    }

    function summaryHTML() {
      const data = summary();
      const exam = currentExam();
      return '<div class="result-stat"><span>Students in class</span><strong>' + data.total + "</strong><small>" + u.escape(classLabel(exam.classId)) + "</small></div>" +
        '<div class="result-stat"><span>Marks entered</span><strong>' + data.entered + "</strong><small>of " + data.total + " students · out of " + exam.total + "</small></div>" +
        '<div class="result-stat"><span>Class average</span><strong>' + (data.entered ? data.average.toFixed(1) + "%" : "—") + "</strong><small>Average of entered percentages</small></div>" +
        '<div class="result-stat"><span>Pass rate</span><strong>' + (data.entered ? data.passRate.toFixed(1) + "%" : "—") + "</strong><small>" + data.passed + " passed · highest " + (data.entered ? data.highest.toFixed(1) + "%" : "—") + "</small></div>";
    }

    function rowCells(student) {
      const pct = markPercent(student.id);
      const grade = u.gradeFor(pct);
      const tone = u.gradeTone(grade);
      const pctNode = '<span class="cell-strong">' + (pct == null ? "—" : pct.toFixed(1) + "%") + "</span>";
      const gradeNode = grade ? '<span class="grade-chip ' + tone + '">' + grade + "</span>" : '<span class="grade-chip neutral">—</span>';
      const stateNode = pct == null ? '<span class="result-state empty">Not graded</span>' : '<span class="result-state ' + (pct >= PASS_MARK ? "pass" : "fail") + '">' + (pct >= PASS_MARK ? "Pass" : "Fail") + "</span>";
      return { pct: pctNode, grade: gradeNode, state: stateNode, rawPct: pct };
    }

    function validateRow(studentId) {
      const exam = currentExam();
      const value = state.marks[studentId];
      const invalid = value !== undefined && value !== "" && validMark(value, exam.total) == null;
      const input = marksRegion.querySelector('.mark-input[data-student="' + studentId + '"]');
      const error = marksRegion.querySelector('[data-mark-error="' + studentId + '"]');
      if (input) {
        input.classList.toggle("has-error", invalid);
        if (invalid) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
      if (error) error.textContent = invalid ? "Enter a mark from 0 to " + exam.total + "." : "";
      return !invalid;
    }

    function refreshRow(studentId) {
      const row = marksRegion.querySelector('[data-mark-row="' + studentId + '"]');
      if (!row) return;
      const cells = rowCells(CMS.student(studentId));
      const pctNode = row.querySelector("[data-cell-pct]");
      const gradeNode = row.querySelector("[data-cell-grade]");
      const stateNode = row.querySelector("[data-cell-state]");
      if (pctNode) pctNode.innerHTML = cells.pct;
      if (gradeNode) gradeNode.innerHTML = cells.grade;
      if (stateNode) stateNode.innerHTML = cells.state;
    }

    function marksTableHTML() {
      const exam = currentExam();
      const q = state.search.trim().toLowerCase();
      const list = students().filter(function (student) {
        return !q || student.name.toLowerCase().includes(q) || student.admissionNo.toLowerCase().includes(q);
      });
      if (!students().length) {
        return ui.emptyState({ icon: "users", title: "No students in this class", text: "Assign students to " + classLabel(exam.classId) + " before recording marks." });
      }
      if (!list.length) {
        return ui.emptyState({ icon: "search", title: "No students match your search", text: "Try another name or admission number.", action: '<button class="btn btn-outline btn-sm" type="button" data-clear-mark-search>Clear search</button>' });
      }
      return '<div class="table-wrap"><table class="data-table marks-table">' +
        '<caption class="sr-only">Marks entry for ' + u.escape(exam.name) + "</caption>" +
        "<thead><tr><th>Student</th><th>Admission no.</th><th>Marks obtained</th><th>Percentage</th><th>Grade</th><th>Result</th></tr></thead><tbody>" +
        list.map(function (student) {
          const cells = rowCells(student);
          const value = state.marks[student.id];
          return '<tr data-mark-row="' + u.escape(student.id) + '"><td>' + u.avatarPair(student.name, student.email) + "</td>" +
            '<td><span class="cell-mono">' + u.escape(student.admissionNo) + "</span></td>" +
            '<td><div class="mark-input-wrap"><input class="mark-input" type="number" inputmode="decimal" min="0" max="' + exam.total + '" step="1" data-student="' + u.escape(student.id) + '" value="' + u.escape(value == null ? "" : value) + '" placeholder="—" aria-label="Marks for ' + u.escape(student.name) + ' out of ' + exam.total + '" aria-describedby="markError-' + u.escape(student.id) + '" />' +
              '<span class="mark-total">/ ' + exam.total + '</span></div><p class="field-error" id="markError-' + u.escape(student.id) + '" data-mark-error="' + u.escape(student.id) + '" role="alert"></p></td>' +
            '<td data-cell-pct>' + cells.pct + "</td><td data-cell-grade>" + cells.grade + "</td><td data-cell-state>" + cells.state + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function examListHTML() {
      return '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">All examination assessments</caption>' +
        "<thead><tr><th>Assessment</th><th>Class</th><th>Subject</th><th>Date</th><th>Type</th><th>Marks entered</th><th>Status</th><th class=\"cell-actions\">Action</th></tr></thead><tbody>" +
        sortedExams().map(function (exam) {
          const total = CMS.studentsInClass(exam.classId).length;
          const entered = Object.keys(exam.marks || {}).filter(function (id) { return validMark(exam.marks[id], exam.total) != null; }).length;
          const status = examStatus(exam);
          return '<tr><td><span class="cell-strong">' + u.escape(exam.name) + '</span><span class="cell-sub">Total ' + exam.total + " marks</span></td>" +
            "<td>" + u.escape(classLabel(exam.classId)) + "</td><td>" + u.escape(exam.subject) + "</td>" +
            '<td><span class="cell-strong">' + u.formatDate(exam.date, "short") + '</span><span class="cell-sub">' + u.formatDate(exam.date, "weekday") + "</span></td>" +
            '<td><span class="tag">' + u.escape(exam.type) + "</span></td><td>" + entered + " / " + total + "</td>" +
            "<td>" + ui.statusBadge(status) + "</td>" +
            '<td class="cell-actions"><button class="btn btn-outline btn-sm" type="button" data-open-exam="' + u.escape(exam.id) + '">Open ' + ui.icon("arrow-right", 13) + "</button></td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function paintSaveState() {
      const badge = root.querySelector("#markState");
      if (badge) badge.hidden = !state.dirty;
      const note = root.querySelector("#saveNote");
      if (note) note.textContent = state.dirty ? "You have unsaved changes. Save before leaving this exam to keep the marks." : "Marks are saved to this browser only. Leave a field blank for a student who has not been graded.";
    }

    function paintMarks() {
      marksRegion.innerHTML = marksTableHTML();
      const data = summary();
      root.querySelector("#resultSummary").innerHTML = summaryHTML();
      root.querySelector("#marksCount").textContent = data.entered + " of " + data.total + " graded";
      paintSaveState();
    }

    function paintMeta() {
      const exam = currentExam();
      const cls = CMS.classInfo(exam.classId);
      const program = cls ? CMS.program(cls.programId) : null;
      root.querySelector("#examMeta").innerHTML =
        '<div class="meta-piece"><span>Class</span><strong>' + u.escape(cls ? cls.name : "—") + "</strong></div>" +
        '<div class="meta-piece"><span>Programme</span><strong>' + u.escape(program ? program.code : "—") + " · Sem " + (cls ? cls.semester : "—") + "</strong></div>" +
        '<div class="meta-piece"><span>Date</span><strong>' + u.formatDate(exam.date, "medium") + "</strong></div>" +
        '<div class="meta-piece"><span>Total</span><strong>' + exam.total + " marks</strong></div>";
    }

    function fillExamSelect() {
      examSelect.innerHTML = sortedExams().map(function (exam) {
        return '<option value="' + u.escape(exam.id) + '"' + (exam.id === state.examId ? " selected" : "") + ">" + u.escape(exam.name) + " · " + u.escape(classLabel(exam.classId)) + "</option>";
      }).join("");
    }

    function loadExam() {
      const exam = currentExam();
      state.marks = {};
      state.search = "";
      state.dirty = false;
      if (search) search.value = "";
      Object.keys(exam ? exam.marks || {} : {}).forEach(function (id) {
        state.marks[id] = String(exam.marks[id]);
      });
      fillExamSelect();
      paintMeta();
      paintMarks();
      root.querySelector("#examList").innerHTML = examListHTML();
    }

    function openExamForm() {
      const current = currentExam();
      const defaultClass = current ? current.classId : (CMS.data.classes[0] ? CMS.data.classes[0].id : "");
      const classOptions = CMS.data.classes.map(function (cls) {
        return '<option value="' + cls.id + '"' + (cls.id === defaultClass ? " selected" : "") + ">" + u.escape(cls.name) + "</option>";
      }).join("");
      const subjects = subjectsFor(defaultClass);
      const body = '<form id="examForm" novalidate><div class="form-grid">' +
        '<div class="field span-2"><label for="exName">Assessment name <span class="text-danger">*</span></label><input id="exName" name="name" type="text" autofocus placeholder="e.g. Midterm · Database Systems" aria-describedby="exNameError" /><p class="field-error" id="exNameError" data-error-for="name" role="alert"></p></div>' +
        '<div class="field"><label for="exClass">Class <span class="text-danger">*</span></label><select id="exClass" name="classId">' + classOptions + "</select></div>" +
        '<div class="field"><label for="exSubject">Subject <span class="text-danger">*</span></label><select id="exSubject" name="subject"></select><p class="field-error" data-error-for="subject" role="alert"></p></div>' +
        '<div class="field"><label for="exDate">Assessment date <span class="text-danger">*</span></label><input id="exDate" name="date" type="date" value="' + u.addDaysISO(14) + '" aria-describedby="exDateError" /><p class="field-error" id="exDateError" data-error-for="date" role="alert"></p></div>' +
        '<div class="field"><label for="exTotal">Total marks <span class="text-danger">*</span></label><input id="exTotal" name="total" type="number" min="1" max="500" step="1" value="100" aria-describedby="exTotalError" /><p class="field-error" id="exTotalError" data-error-for="total" role="alert"></p></div>' +
        '<div class="field"><label for="exType">Assessment type</label><select id="exType" name="type">' + TYPES.map(function (type) { return "<option>" + type + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><div class="form-note">' + ui.icon("info", 14) + "<span>The subject list follows the class programme and semester. Marks can be entered as soon as the assessment is created.</span></div></div>" +
      "</div></form>";

      ui.modal.open({
        title: "Create a new assessment",
        subtitle: "Add a quiz, assignment, practical, or examination to the schedule.",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="examForm">' + ui.icon("plus", 15) + " Create assessment</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#examForm");
          const classSelect = form.elements.classId;
          const subjectSelect = form.elements.subject;

          function syncSubjects() {
            const list = subjectsFor(classSelect.value);
            subjectSelect.innerHTML = list.length ? list.map(function (course) {
              return '<option value="' + u.escape(course.code + " · " + course.title) + '">' + u.escape(course.code + " · " + course.title) + "</option>";
            }).join("") : '<option value="">No subjects for this class</option>';
          }
          classSelect.addEventListener("change", syncSubjects);
          syncSubjects();

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
              name: form.elements.name.value.trim(),
              classId: form.elements.classId.value,
              subject: form.elements.subject.value,
              date: form.elements.date.value,
              total: Number(form.elements.total.value),
              type: form.elements.type.value
            };
            let valid = true;
            if (!values.name || values.name.length < 3) { setError("name", "Enter a clear assessment name."); valid = false; }
            if (!values.classId) { setError("classId", "Choose a class."); valid = false; }
            if (!values.subject) { setError("subject", "Choose a subject for this class."); valid = false; }
            if (!values.date) { setError("date", "Choose the assessment date."); valid = false; }
            if (!values.total || values.total < 1 || values.total > 500) { setError("total", "Total marks must be between 1 and 500."); valid = false; }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            const exam = Object.assign({ id: u.uid("exam"), marks: {} }, values);
            CMS.data.exams.push(exam);
            CMS.store.save();
            state.examId = exam.id;
            close();
            loadExam();
            ui.toast(values.name + " was added for " + classLabel(values.classId) + ".", "success", "Assessment created");
          });
        }
      });
    }

    function saveMarks() {
      const exam = currentExam();
      const list = students();
      let invalidId = null;
      list.forEach(function (student) {
        const value = state.marks[student.id];
        if (value !== undefined && value !== "" && validMark(value, exam.total) == null && !invalidId) invalidId = student.id;
      });
      if (invalidId) {
        refreshRow(invalidId);
        validateRow(invalidId);
        const input = marksRegion.querySelector('.mark-input[data-student="' + invalidId + '"]');
        if (input) {
          input.focus();
          input.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        ui.toast("One or more marks are outside the allowed range. Enter a value from 0 to " + exam.total + ".", "danger", "Marks not saved");
        return;
      }
      const next = {};
      let count = 0;
      list.forEach(function (student) {
        const mark = validMark(state.marks[student.id], exam.total);
        if (mark != null) {
          next[student.id] = mark;
          count += 1;
        }
      });
      exam.marks = next;
      CMS.store.save();
      state.dirty = false;
      paintMarks();
      root.querySelector("#examList").innerHTML = examListHTML();
      const summaryData = summary();
      ui.toast(count + " " + u.plural(count, "mark") + " saved. Class average " + (summaryData.entered ? summaryData.average.toFixed(1) + "%" : "—") + ".", "success", "Marks saved");
    }

    examSelect.addEventListener("change", function () {
      state.examId = examSelect.value;
      loadExam();
    });
    search.addEventListener("input", u.debounce(function () {
      state.search = search.value;
      marksRegion.innerHTML = marksTableHTML();
    }, 130));

    marksRegion.addEventListener("input", function (event) {
      const input = event.target.closest(".mark-input");
      if (!input) return;
      const studentId = input.getAttribute("data-student");
      state.marks[studentId] = input.value;
      state.dirty = true;
      validateRow(studentId);
      refreshRow(studentId);
      const data = summary();
      root.querySelector("#resultSummary").innerHTML = summaryHTML();
      root.querySelector("#marksCount").textContent = data.entered + " of " + data.total + " graded";
      paintSaveState();
    });

    marksRegion.addEventListener("click", function (event) {
      if (event.target.closest("[data-clear-mark-search]")) {
        state.search = "";
        search.value = "";
        marksRegion.innerHTML = marksTableHTML();
      }
    });

    root.querySelector("#examList").addEventListener("click", function (event) {
      const open = event.target.closest("[data-open-exam]");
      if (!open) return;
      state.examId = open.getAttribute("data-open-exam");
      loadExam();
      root.querySelector(".exam-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    root.querySelector("#newExam").addEventListener("click", openExamForm);
    root.querySelector("#previewResults").addEventListener("click", function () {
      showPreview(currentExam());
    });
    root.querySelector("#saveMarks").addEventListener("click", saveMarks);
    root.querySelector("#discardMarks").addEventListener("click", function () {
      const exam = currentExam();
      state.marks = {};
      Object.keys(exam.marks || {}).forEach(function (id) { state.marks[id] = String(exam.marks[id]); });
      state.dirty = false;
      paintMarks();
      ui.toast("Unsaved mark changes were discarded.", "info", "Changes discarded");
    });
    root.querySelector("#exportMarks").addEventListener("click", function () {
      const exam = currentExam();
      const list = students();
      const rows = [["Student", "Admission no.", "Class", "Assessment", "Subject", "Marks", "Total", "Percentage", "Grade", "Result"]];
      list.forEach(function (student) {
        const pct = markPercent(student.id);
        const mark = validMark(state.marks[student.id], exam.total);
        rows.push([
          student.name, student.admissionNo, classLabel(exam.classId), exam.name, exam.subject,
          mark == null ? "" : mark, exam.total,
          pct == null ? "" : pct.toFixed(1),
          u.gradeFor(pct) || "",
          pct == null ? "Not graded" : pct >= PASS_MARK ? "Pass" : "Fail"
        ]);
      });
      ui.downloadCSV("marks-" + exam.id + "-" + u.todayISO() + ".csv", rows);
      ui.toast("Marks export includes the values currently shown on screen.", "success", "Export ready");
    });

    loadExam();
  }

  CMS.views = CMS.views || {};
  CMS.views.exams = { render: render };
})();
