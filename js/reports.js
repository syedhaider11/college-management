/* Consolidated reports with print and CSV export. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;

  const TYPES = {
    enrollment: "Student enrollment",
    attendance: "Attendance",
    fees: "Fees & outstanding balances",
    results: "Examination results",
    faculty: "Faculty & departments"
  };

  function inRange(date, start, end) {
    return Boolean(date) && date >= start && date <= end;
  }

  function rate(part, whole) {
    return whole ? (part / whole) * 100 : 0;
  }

  function render(root, params) {
    const initialType = TYPES[params.get("type")] ? params.get("type") : "enrollment";
    const state = {
      type: initialType,
      start: params.get("start") || u.addDaysISO(-540),
      end: params.get("end") || u.addDaysISO(90),
      dept: params.get("dept") || "all",
      classId: params.get("class") || "all",
      report: null,
      generatedAt: null
    };

    const typeOptions = Object.keys(TYPES).map(function (key) {
      return '<option value="' + key + '"' + (key === state.type ? " selected" : "") + ">" + u.escape(TYPES[key]) + "</option>";
    }).join("");
    const deptOptions = CMS.data.departments.map(function (dept) {
      return '<option value="' + dept.id + '"' + (dept.id === state.dept ? " selected" : "") + ">" + u.escape(dept.name) + "</option>";
    }).join("");

    function classOptions() {
      const classes = CMS.data.classes.filter(function (cls) {
        return state.dept === "all" || cls.departmentId === state.dept;
      });
      return '<option value="all">All classes</option>' + classes.map(function (cls) {
        return '<option value="' + cls.id + '"' + (cls.id === state.classId ? " selected" : "") + ">" + u.escape(cls.name) + "</option>";
      }).join("");
    }

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Administration · Analysis</p><h1 class="view-title">Reports</h1>' +
        '<p class="view-sub">Build a report from current demo records, then print it or export the underlying table as CSV.</p></div>' +
        '<div class="view-actions"><button class="btn btn-outline" type="button" id="printReport">' + ui.icon("printer", 15) + ' Print</button>' +
        '<button class="btn btn-primary" type="button" id="exportReport">' + ui.icon("download", 15) + " Export CSV</button></div></div>" +
      '<div class="card report-controls">' +
        '<div class="field"><label for="reportType">Report type</label><select id="reportType">' + typeOptions + "</select></div>" +
        '<div class="field"><label for="reportStart">From date</label><input id="reportStart" type="date" value="' + u.escape(state.start) + '" /></div>' +
        '<div class="field"><label for="reportEnd">To date</label><input id="reportEnd" type="date" value="' + u.escape(state.end) + '" /></div>' +
        '<div class="field"><label for="reportDept">Department</label><select id="reportDept"><option value="all">All departments</option>' + deptOptions + "</select></div>" +
        '<div class="field"><label for="reportClass">Class</label><select id="reportClass">' + classOptions() + "</select></div>" +
        '<button class="btn btn-primary" type="button" id="generateReport">' + ui.icon("chart", 15) + " Generate report</button>" +
      "</div>" +
      '<div class="report-output" id="reportOutput"></div>';

    const typeSelect = root.querySelector("#reportType");
    const startInput = root.querySelector("#reportStart");
    const endInput = root.querySelector("#reportEnd");
    const deptSelect = root.querySelector("#reportDept");
    const classSelect = root.querySelector("#reportClass");
    const output = root.querySelector("#reportOutput");

    function scopeText() {
      const dept = state.dept !== "all" ? CMS.department(state.dept) : null;
      const cls = state.classId !== "all" ? CMS.classInfo(state.classId) : null;
      const pieces = [dept ? dept.name : "All departments"];
      if (cls) pieces.push(cls.name);
      return pieces.join(" · ");
    }

    function buildEnrollment() {
      const students = CMS.data.students.filter(function (student) {
        if (state.dept !== "all" && student.departmentId !== state.dept) return false;
        if (state.classId !== "all" && student.classId !== state.classId) return false;
        return inRange(student.admissionDate, state.start, state.end);
      });
      const classIds = Array.from(new Set(students.map(function (student) { return student.classId; })));
      const rows = CMS.data.classes.filter(function (cls) {
        return classIds.indexOf(cls.id) !== -1;
      }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (cls) {
        const roster = students.filter(function (student) { return student.classId === cls.id; });
        const program = CMS.program(cls.programId);
        const dept = CMS.department(cls.departmentId);
        return [
          cls.name,
          program ? program.name : "—",
          dept ? dept.short : "—",
          roster.length,
          roster.filter(function (student) { return student.status === "Active"; }).length,
          roster.filter(function (student) { return student.status === "Probation"; }).length,
          roster.filter(function (student) { return student.status === "Inactive"; }).length
        ];
      });
      const programs = Array.from(new Set(students.map(function (student) { return student.programId; }))).length;
      return {
        title: "Student enrollment summary",
        subtitle: "Admissions between " + u.formatDate(state.start, "medium") + " and " + u.formatDate(state.end, "medium"),
        columns: [
          { label: "Class", type: "text" }, { label: "Programme", type: "text" }, { label: "Department", type: "text" },
          { label: "Students", type: "num" }, { label: "Active", type: "num" }, { label: "Probation", type: "num" }, { label: "Inactive", type: "num" }
        ],
        rows: rows,
        summary: [
          { label: "Students in period", value: String(students.length) },
          { label: "Active", value: String(students.filter(function (s) { return s.status === "Active"; }).length) },
          { label: "Programmes", value: String(programs) },
          { label: "Classes", value: String(rows.length) }
        ],
        note: "Rows include students whose admission date falls inside the selected period. Status reflects the current student record, not the status on the admission date.",
        empty: "No student admissions fall within this period and scope."
      };
    }

    function buildAttendance() {
      const records = CMS.data.attendanceHistory.filter(function (entry) {
        if (!inRange(entry.date, state.start, state.end)) return false;
        if (state.classId !== "all" && entry.classId !== state.classId) return false;
        if (state.dept !== "all") {
          const cls = CMS.classInfo(entry.classId);
          if (!cls || cls.departmentId !== state.dept) return false;
        }
        return true;
      });
      const classIds = Array.from(new Set(records.map(function (entry) { return entry.classId; })));
      const rows = classIds.map(function (id) {
        const entries = records.filter(function (entry) { return entry.classId === id; });
        const cls = CMS.classInfo(id);
        const present = entries.reduce(function (sum, entry) { return sum + entry.present; }, 0);
        const late = entries.reduce(function (sum, entry) { return sum + entry.late; }, 0);
        const absent = entries.reduce(function (sum, entry) { return sum + entry.absent; }, 0);
        const excused = entries.reduce(function (sum, entry) { return sum + entry.excused; }, 0);
        const total = entries.reduce(function (sum, entry) { return sum + entry.total; }, 0);
        return [cls ? cls.name : "—", entries.length, present, late, absent, excused, rate(present + late, total)];
      }).sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
      const totalMarks = records.reduce(function (sum, entry) { return sum + entry.total; }, 0);
      const attended = records.reduce(function (sum, entry) { return sum + entry.present + entry.late; }, 0);
      const absences = records.reduce(function (sum, entry) { return sum + entry.absent; }, 0);
      return {
        title: "Attendance summary",
        subtitle: "Registers between " + u.formatDate(state.start, "medium") + " and " + u.formatDate(state.end, "medium"),
        columns: [
          { label: "Class", type: "text" }, { label: "Sessions", type: "num" }, { label: "Present", type: "num" }, { label: "Late", type: "num" },
          { label: "Absent", type: "num" }, { label: "Excused", type: "num" }, { label: "Attendance rate", type: "percent" }
        ],
        rows: rows,
        summary: [
          { label: "Sessions", value: String(records.length) },
          { label: "Attendance rate", value: totalMarks ? rate(attended, totalMarks).toFixed(1) + "%" : "—" },
          { label: "Student marks", value: u.formatNumber(totalMarks) },
          { label: "Absences", value: u.formatNumber(absences) }
        ],
        note: "Attendance rate counts present and late as attended. Rates are weighted by the number of students in each saved register.",
        empty: "No attendance registers were saved in this period and scope."
      };
    }

    function buildFees() {
      const fees = CMS.data.fees.filter(function (fee) {
        if (!inRange(fee.dueDate, state.start, state.end)) return false;
        const student = CMS.student(fee.studentId);
        if (!student) return false;
        if (state.dept !== "all" && student.departmentId !== state.dept) return false;
        if (state.classId !== "all" && student.classId !== state.classId) return false;
        return true;
      });
      const classIds = Array.from(new Set(fees.map(function (fee) {
        const student = CMS.student(fee.studentId);
        return student ? student.classId : null;
      }).filter(Boolean)));
      const rows = classIds.map(function (id) {
        const classFees = fees.filter(function (fee) {
          const student = CMS.student(fee.studentId);
          return student && student.classId === id;
        });
        const cls = CMS.classInfo(id);
        const billed = classFees.reduce(function (sum, fee) { return sum + Number(fee.amount); }, 0);
        const collected = classFees.reduce(function (sum, fee) { return sum + Number(fee.paid); }, 0);
        return [cls ? cls.name : "—", classFees.length, billed, collected, Math.max(0, billed - collected), rate(collected, billed)];
      }).sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
      const billed = fees.reduce(function (sum, fee) { return sum + Number(fee.amount); }, 0);
      const collected = fees.reduce(function (sum, fee) { return sum + Number(fee.paid); }, 0);
      const overdue = fees.filter(function (fee) { return CMS.feeStatus(fee) === "Overdue"; });
      return {
        title: "Fee collection summary",
        subtitle: "Fee accounts due between " + u.formatDate(state.start, "medium") + " and " + u.formatDate(state.end, "medium"),
        columns: [
          { label: "Class", type: "text" }, { label: "Accounts", type: "num" }, { label: "Billed", type: "money" }, { label: "Collected", type: "money" },
          { label: "Outstanding", type: "money" }, { label: "Collection rate", type: "percent" }
        ],
        rows: rows,
        summary: [
          { label: "Total billed", value: u.formatMoney(billed) },
          { label: "Collected", value: u.formatMoney(collected) },
          { label: "Outstanding", value: u.formatMoney(Math.max(0, billed - collected)) },
          { label: "Overdue accounts", value: String(overdue.length) }
        ],
        note: "Outstanding balances are calculated from the demo fee ledger. No real payments are processed and no interest or late fees are applied.",
        empty: "No fee accounts fall within this period and scope."
      };
    }

    function buildResults() {
      const exams = CMS.data.exams.filter(function (exam) {
        if (!inRange(exam.date, state.start, state.end)) return false;
        if (state.classId !== "all" && exam.classId !== state.classId) return false;
        if (state.dept !== "all") {
          const cls = CMS.classInfo(exam.classId);
          if (!cls || cls.departmentId !== state.dept) return false;
        }
        return true;
      }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      const allPercents = [];
      let totalEntered = 0;
      let totalStudents = 0;
      const rows = exams.map(function (exam) {
        const roster = CMS.studentsInClass(exam.classId);
        const percents = roster.map(function (student) {
          const mark = exam.marks ? Number(exam.marks[student.id]) : NaN;
          return isFinite(mark) && mark >= 0 && mark <= exam.total ? (mark / exam.total) * 100 : null;
        }).filter(function (pct) { return pct != null; });
        allPercents.push.apply(allPercents, percents);
        totalEntered += percents.length;
        totalStudents += roster.length;
        const average = percents.length ? percents.reduce(function (sum, pct) { return sum + pct; }, 0) / percents.length : null;
        const passRate = percents.length ? rate(percents.filter(function (pct) { return pct >= 50; }).length, percents.length) : null;
        return [exam.name, classLabel(exam.classId), exam.subject, exam.date, percents.length + " / " + roster.length, average, passRate];
      });
      const overallAverage = allPercents.length ? allPercents.reduce(function (sum, pct) { return sum + pct; }, 0) / allPercents.length : 0;
      return {
        title: "Examination results summary",
        subtitle: "Assessments dated between " + u.formatDate(state.start, "medium") + " and " + u.formatDate(state.end, "medium"),
        columns: [
          { label: "Assessment", type: "text" }, { label: "Class", type: "text" }, { label: "Subject", type: "text" }, { label: "Date", type: "date" },
          { label: "Marks entered", type: "text" }, { label: "Class average", type: "percent" }, { label: "Pass rate", type: "percent" }
        ],
        rows: rows,
        summary: [
          { label: "Assessments", value: String(exams.length) },
          { label: "Marks entered", value: totalEntered + " / " + totalStudents },
          { label: "Overall average", value: allPercents.length ? overallAverage.toFixed(1) + "%" : "—" },
          { label: "Pass rate", value: allPercents.length ? rate(allPercents.filter(function (pct) { return pct >= 50; }).length, allPercents.length).toFixed(1) + "%" : "—" }
        ],
        note: "Grade bands: A+ 90+, A 80+, B 70+, C 60+, D 50+, F below 50. Pass mark is 50%. Averages include only marks that have been entered.",
        empty: "No assessments fall within this period and scope."
      };
    }

    function buildFaculty() {
      const teachers = CMS.data.teachers.filter(function (teacher) {
        return state.dept === "all" || teacher.departmentId === state.dept;
      });
      const departments = CMS.data.departments.filter(function (dept) {
        return state.dept === "all" || dept.id === state.dept;
      });
      const rows = departments.map(function (dept) {
        const faculty = teachers.filter(function (teacher) { return teacher.departmentId === dept.id; });
        const head = CMS.teacher(dept.headId);
        const students = CMS.data.students.filter(function (student) { return student.departmentId === dept.id; }).length;
        return [
          dept.name,
          head ? head.name : "Unassigned",
          faculty.length,
          faculty.filter(function (teacher) { return teacher.status === "Full-time"; }).length,
          faculty.filter(function (teacher) { return teacher.status === "Part-time"; }).length,
          students,
          faculty.length ? (students / faculty.length).toFixed(1) + " : 1" : "—"
        ];
      }).sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
      return {
        title: "Faculty & department summary",
        subtitle: "Current faculty establishment across " + (state.dept === "all" ? "all departments" : (CMS.department(state.dept) || {}).name || "the selected department"),
        columns: [
          { label: "Department", type: "text" }, { label: "Department head", type: "text" }, { label: "Faculty", type: "num" },
          { label: "Full-time", type: "num" }, { label: "Part-time", type: "num" }, { label: "Students", type: "num" }, { label: "Student : faculty", type: "text" }
        ],
        rows: rows,
        summary: [
          { label: "Faculty", value: String(teachers.length) },
          { label: "Departments", value: String(rows.length) },
          { label: "Full-time", value: String(teachers.filter(function (teacher) { return teacher.status === "Full-time"; }).length) },
          { label: "Part-time", value: String(teachers.filter(function (teacher) { return teacher.status === "Part-time"; }).length) }
        ],
        note: "Date range and class filters do not apply to this establishment summary. Student : faculty ratios use all current students in each department.",
        empty: "No departments or faculty match this selection."
      };
    }

    function classLabel(id) {
      const cls = CMS.classInfo(id);
      return cls ? cls.name : "—";
    }

    function buildReport() {
      if (state.type === "attendance") return buildAttendance();
      if (state.type === "fees") return buildFees();
      if (state.type === "results") return buildResults();
      if (state.type === "faculty") return buildFaculty();
      return buildEnrollment();
    }

    function cellText(value, type) {
      if (value == null || value === "") return "—";
      if (type === "money") return u.formatMoney(value);
      if (type === "percent") return Number(value).toFixed(1) + "%";
      if (type === "num") return u.formatNumber(value);
      if (type === "date") return u.formatDate(value, "medium");
      return u.escape(value);
    }

    function sheetHTML(report) {
      const college = CMS.data.college;
      const generated = state.generatedAt ? u.formatDate(state.generatedAt, "medium") + " · " + u.formatDate(state.generatedAt, "time") : u.formatDate(new Date(), "long");
      return '<div class="doc-sheet report-sheet">' +
        '<div class="doc-head"><div class="doc-brand"><span class="brand-mark">' + u.escape((college.initials || "E").slice(0, 2)) + "</span>" +
          "<div><strong>" + u.escape(college.name) + "</strong><span>" + u.escape(college.tagline || "Campus administration") + "</span></div></div>" +
          '<div class="doc-meta"><strong>Administrative report</strong>' + u.escape(college.address) + "<br />" + u.escape(college.email) + " · " + u.escape(college.phone) + "</div></div>" +
        '<div class="report-title-row"><div><h2>' + u.escape(report.title) + "</h2><p>" + u.escape(report.subtitle) + " · " + u.escape(scopeText()) + "</p></div>" +
          '<span class="report-badge">Generated ' + u.escape(generated) + "</span></div>" +
        '<div class="report-summary-grid">' + report.summary.map(function (item) {
          return '<div class="report-summary-cell"><span>' + u.escape(item.label) + "</span><strong>" + u.escape(item.value) + "</strong></div>";
        }).join("") + "</div>" +
        (report.rows.length ? '<table class="doc-table"><caption class="sr-only">' + u.escape(report.title) + " · " + u.escape(report.subtitle) + "</caption><thead><tr>" + report.columns.map(function (column) {
          return "<th" + (["num", "money", "percent", "date"].indexOf(column.type) !== -1 ? ' class="num"' : "") + ">" + u.escape(column.label) + "</th>";
        }).join("") + "</tr></thead><tbody>" + report.rows.map(function (row) {
          return "<tr>" + row.map(function (value, index) {
            const column = report.columns[index];
            return "<td" + (["num", "money", "percent", "date"].indexOf(column.type) !== -1 ? ' class="num"' : "") + ">" + cellText(value, column.type) + "</td>";
          }).join("") + "</tr>";
        }).join("") + "</tbody></table>" :
          '<div class="report-empty">' + ui.emptyState({ icon: "chart", title: "No data for this report", text: report.empty, compact: true }) + "</div>") +
        '<div class="report-note">' + u.escape(report.note) + "<br />This report is generated from local prototype data and is not an official college record.</div>" +
        '<div class="doc-foot"><div>Prepared by the Evergreen College administration workspace.<br />Generated ' + u.escape(generated) + ".</div><div class=\"doc-signature\"><span>Administrative office</span></div></div>" +
      "</div>";
    }

    function paint() {
      if (state.start > state.end) {
        ui.toast("The start date must be before or equal to the end date.", "warning", "Check the date range");
        startInput.focus();
        return;
      }
      state.generatedAt = new Date();
      state.report = buildReport();
      output.innerHTML = sheetHTML(state.report);
    }

    function syncClasses() {
      state.dept = deptSelect.value;
      if (state.classId !== "all") {
        const cls = CMS.classInfo(state.classId);
        if (!cls || (state.dept !== "all" && cls.departmentId !== state.dept)) state.classId = "all";
      }
      classSelect.innerHTML = classOptions();
    }

    deptSelect.addEventListener("change", syncClasses);
    typeSelect.addEventListener("change", function () {
      state.type = typeSelect.value;
    });
    root.querySelector("#generateReport").addEventListener("click", function () {
      state.type = typeSelect.value;
      state.start = startInput.value || state.start;
      state.end = endInput.value || state.end;
      state.dept = deptSelect.value;
      state.classId = classSelect.value;
      paint();
    });
    [startInput, endInput, deptSelect, classSelect, typeSelect].forEach(function (control) {
      control.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          root.querySelector("#generateReport").click();
        }
      });
    });

    root.querySelector("#printReport").addEventListener("click", function () {
      if (!state.report) {
        ui.toast("Generate a report before printing.", "warning");
        return;
      }
      ui.print(state.report.title, sheetHTML(state.report));
    });
    root.querySelector("#exportReport").addEventListener("click", function () {
      if (!state.report || !state.report.rows.length) {
        ui.toast("There is no report data to export with the current selection.", "warning");
        return;
      }
      const rows = [state.report.columns.map(function (column) { return column.label; })];
      state.report.rows.forEach(function (row) {
        rows.push(row.map(function (value) {
          if (value == null) return "";
          return value;
        }));
      });
      ui.downloadCSV(state.type + "-report-" + u.todayISO() + ".csv", rows);
      ui.toast("Report data exported as a CSV file.", "success", "Export ready");
    });

    paint();
  }

  CMS.views = CMS.views || {};
  CMS.views.reports = { render: render };
})();
