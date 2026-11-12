/* Class timetable with week and day views. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const MORNING = [["08:30", "10:00"], ["10:15", "11:45"]];
  const AFTERNOON = [["12:45", "14:15"], ["14:30", "16:00"]];

  function startOfWeek() {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return monday;
  }

  function weekDates() {
    const monday = startOfWeek();
    return DAYS.map(function (_, index) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }

  function isoDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function todayIndex() {
    const index = (new Date().getDay() + 6) % 7;
    return index > 4 ? 0 : index;
  }

  function coursesFor(classId) {
    const cls = CMS.classInfo(classId);
    if (!cls) return [];
    return CMS.data.courses.filter(function (course) {
      return course.programId === cls.programId && course.semester === cls.semester;
    });
  }

  function scheduleFor(classId) {
    const cls = CMS.classInfo(classId);
    const courses = coursesFor(classId);
    if (!cls || !courses.length) return [];
    const slots = cls.shift === "Afternoon" ? AFTERNOON : MORNING;
    const sessions = [];
    DAYS.forEach(function (day, dayIndex) {
      slots.forEach(function (time, slotIndex) {
        let courseIndex = (dayIndex * slots.length + slotIndex) % courses.length;
        const previous = sessions.length ? sessions[sessions.length - 1] : null;
        if (previous && courseIndex === previous.courseIndex && courses.length > 1) {
          courseIndex = (courseIndex + 1) % courses.length;
        }
        const course = courses[courseIndex];
        const teacher = CMS.teacher(course.teacherId);
        sessions.push({
          id: "session-" + classId + "-" + dayIndex + "-" + slotIndex,
          dayIndex: dayIndex,
          start: time[0],
          end: time[1],
          course: course,
          courseIndex: courseIndex,
          teacher: teacher,
          teacherName: teacher ? teacher.name : "To be assigned",
          room: cls.room,
          tone: (CMS.department(course.departmentId) || {}).tone || "mint"
        });
      });
    });
    return sessions;
  }

  function timeRange(session) {
    return session.start + " – " + session.end;
  }

  function durationLabel(session) {
    const start = session.start.split(":").map(Number);
    const end = session.end.split(":").map(Number);
    return ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) + " min";
  }

  function sessionCard(session) {
    const teacher = u.firstName(session.teacherName);
    return '<article class="session-card" style="--session-color:var(--tone-' + u.escape(session.tone) + '-strong)" aria-label="' + u.escape(session.course.title) + ', ' + timeRange(session) + '">' +
      '<div class="session-time">' + ui.icon("clock", 11) + timeRange(session) + "</div>" +
      '<h4 class="session-subject">' + u.escape(session.course.title) + "</h4>" +
      '<div class="session-code">' + u.escape(session.course.code) + "</div>" +
      '<div class="session-meta"><span>' + ui.icon("user", 10) + u.escape(teacher) + "</span><span>" + ui.icon("map-pin", 10) + u.escape(session.room) + "</span></div>" +
    "</article>";
  }

  function legendHTML(sessions) {
    const seen = {};
    const depts = [];
    sessions.forEach(function (session) {
      const dept = CMS.department(session.course.departmentId);
      if (dept && !seen[dept.id]) {
        seen[dept.id] = true;
        depts.push(dept);
      }
    });
    if (!depts.length) return "";
    return '<div class="timetable-legend"><span>Colour key</span>' + depts.map(function (dept) {
      return '<span><i style="background:var(--tone-' + u.escape(dept.tone) + '-strong)"></i>' + u.escape(dept.short) + "</span>";
    }).join("") + '<span style="margin-left:auto">' + ui.icon("info", 12) + " Generated demo schedule</span></div>";
  }

  function printTimetable(classId, dayIndex, view) {
    const cls = CMS.classInfo(classId);
    if (!cls) return;
    const program = CMS.program(cls.programId);
    const dept = CMS.department(cls.departmentId);
    const teacher = CMS.teacher(cls.teacherId);
    const sessions = scheduleFor(classId);
    const dates = weekDates();
    const college = CMS.data.college;
    const filtered = view === "day" ? sessions.filter(function (session) { return session.dayIndex === dayIndex; }) : sessions;
    const title = view === "day" ? "Daily timetable" : "Weekly timetable";

    const rows = filtered.map(function (session) {
      return "<tr><td>" + DAYS[session.dayIndex] + ", " + u.formatDate(dates[session.dayIndex], "short") + "</td>" +
        '<td class="num">' + timeRange(session) + "</td><td><strong>" + u.escape(session.course.code) + "</strong> · " + u.escape(session.course.title) + "</td>" +
        "<td>" + u.escape(session.teacherName) + "</td><td>" + u.escape(session.room) + "</td></tr>";
    }).join("");

    const html = '<div class="doc-sheet">' +
      '<div class="doc-head"><div class="doc-brand"><span class="brand-mark">' + u.escape((college.initials || "E").slice(0, 2)) + "</span>" +
        "<div><strong>" + u.escape(college.name) + "</strong><span>" + u.escape(college.tagline || "Campus administration") + "</span></div></div>" +
        '<div class="doc-meta"><strong>' + title + "</strong>" + u.escape(college.term) + "<br />" + u.escape(college.address) + "</div></div>" +
      '<h2 class="doc-title">' + u.escape(cls.name) + " · " + title + "</h2>" +
      '<p class="doc-subtitle">' + u.escape(program ? program.name : "") + " · Semester " + cls.semester + " · Week of " + u.formatDate(dates[0], "medium") + "</p>" +
      '<div class="doc-info">' +
        '<div class="doc-info-row"><span>Department</span><strong>' + u.escape(dept ? dept.name : "—") + "</strong></div>" +
        '<div class="doc-info-row"><span>Class teacher</span><strong>' + u.escape(teacher ? teacher.name : "Unassigned") + "</strong></div>" +
        '<div class="doc-info-row"><span>Room</span><strong>' + u.escape(cls.room) + "</strong></div>" +
        '<div class="doc-info-row"><span>Shift</span><strong>' + u.escape(cls.shift) + "</strong></div>" +
      "</div>" +
      (filtered.length ? '<table class="doc-table"><thead><tr><th>Day</th><th class="num">Time</th><th>Course</th><th>Teacher</th><th>Room</th></tr></thead><tbody>' + rows + "</tbody></table>" :
        '<p class="report-note">No sessions are scheduled for this class.</p>') +
      '<div class="doc-foot"><div>Generated from the Evergreen College timetable prototype.<br />Times and sessions are sample data.</div><div class="doc-signature"><span>Academic office</span></div></div>' +
    "</div>";
    ui.print(title + " · " + cls.name, html);
  }

  function render(root, params) {
    const initial = CMS.classInfo(params.get("class")) || CMS.data.classes[0];
    const state = {
      classId: initial ? initial.id : "",
      view: params.get("view") === "day" ? "day" : "week",
      dayIndex: todayIndex()
    };

    if (!state.classId) {
      root.innerHTML = '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Schedule</p><h1 class="view-title">Timetable</h1></div></div>' +
        '<div class="card card-pad">' + ui.emptyState({ icon: "calendar", title: "No classes available", text: "Create a class before building a timetable." }) + "</div>";
      return;
    }

    const classOptions = CMS.data.classes.map(function (cls) {
      const program = CMS.program(cls.programId);
      return '<option value="' + cls.id + '"' + (cls.id === state.classId ? " selected" : "") + ">" + u.escape(cls.name) + " · " + u.escape(program ? program.code : "") + "</option>";
    }).join("");

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Schedule</p><h1 class="view-title">Timetable</h1>' +
        '<p class="view-sub">Switch between a weekly overview and a single-day agenda. Today is highlighted automatically.</p></div>' +
        '<div class="view-actions"><a class="btn btn-outline" href="app.html#/classes">' + ui.icon("layers", 15) + ' Classes</a>' +
        '<button class="btn btn-outline" type="button" id="printTimetable">' + ui.icon("printer", 15) + " Print schedule</button></div></div>" +
      '<div class="card timetable-controls">' +
        '<div class="field-inline"><label for="ttClass">Class</label><select id="ttClass">' + classOptions + "</select></div>" +
        '<div class="segmented" role="group" aria-label="Timetable view">' +
          '<button type="button" data-view="week" aria-pressed="' + (state.view === "week") + '">' + ui.icon("grid", 13) + " Week</button>" +
          '<button type="button" data-view="day" aria-pressed="' + (state.view === "day") + '">' + ui.icon("list", 13) + " Day</button>" +
        "</div>" +
      "</div>" +
      '<div class="card timetable-card">' +
        '<div id="timetableCaption"></div>' +
        '<div id="timetableBody"></div>' +
        '<div id="timetableLegend"></div>' +
      "</div>";

    const body = root.querySelector("#timetableBody");
    const caption = root.querySelector("#timetableCaption");
    const legend = root.querySelector("#timetableLegend");
    const classSelect = root.querySelector("#ttClass");

    function captionHTML(sessions) {
      const cls = CMS.classInfo(state.classId);
      const program = CMS.program(cls.programId);
      const teacher = CMS.teacher(cls.teacherId);
      const dates = weekDates();
      return '<div class="timetable-caption"><div><h3>' + u.escape(cls.name) + " · " + (state.view === "week" ? "Weekly timetable" : DAYS[state.dayIndex] + " agenda") + "</h3>" +
        "<p>" + u.escape(program ? program.name : "") + " · Semester " + cls.semester + " · " + u.escape(cls.room) + " · " + u.escape(cls.shift) + " shift</p></div>" +
        '<div class="row" style="gap:8px;flex-wrap:wrap"><span class="pill">' + ui.icon("calendar", 13) + " Week of " + u.formatDate(dates[0], "short") + "</span>" +
        '<span class="pill">' + ui.icon("clock", 13) + sessions.length + " " + u.plural(sessions.length, "session") + "</span>" +
        (teacher ? '<span class="pill">' + ui.icon("user-check", 13) + u.escape(teacher.name) + "</span>" : "") + "</div></div>";
    }

    function weekHTML(sessions) {
      const dates = weekDates();
      return '<div class="timetable-scroll"><div class="week-grid">' + DAYS.map(function (day, index) {
        const daySessions = sessions.filter(function (session) { return session.dayIndex === index; }).sort(function (a, b) { return a.start.localeCompare(b.start); });
        const isToday = isoDate(dates[index]) === u.todayISO();
        return '<section class="week-day ' + (isToday ? "is-today" : "") + '">' +
          '<div class="week-day-head"><strong>' + day.slice(0, 3) + '</strong><span>' + (isToday ? "Today · " : "") + u.formatDate(dates[index], "short") + "</span></div>" +
          '<div class="week-day-body">' +
            (daySessions.length ? daySessions.map(sessionCard).join("") :
              '<div class="day-empty">' + ui.icon("calendar", 18) + "<span>No classes<br />scheduled</span></div>") +
          "</div></section>";
      }).join("") + "</div></div>";
    }

    function dayHTML(sessions) {
      const dates = weekDates();
      const daySessions = sessions.filter(function (session) { return session.dayIndex === state.dayIndex; }).sort(function (a, b) { return a.start.localeCompare(b.start); });
      return '<div class="day-agenda">' +
        '<div class="day-agenda-head"><div class="day-pills" role="group" aria-label="Choose a weekday">' + DAYS.map(function (day, index) {
          const isToday = isoDate(dates[index]) === u.todayISO();
          return '<button class="day-pill ' + (state.dayIndex === index ? "is-active" : "") + '" type="button" data-day="' + index + '" aria-pressed="' + (state.dayIndex === index) + '">' + day.slice(0, 3) + " " + dates[index].getDate() + (isToday ? " · Today" : "") + "</button>";
        }).join("") + "</div>" +
        '<span class="pill" style="margin-left:auto">' + ui.icon("calendar", 13) + u.formatDate(dates[state.dayIndex], "long") + "</span></div>" +
        (daySessions.length ? '<div class="agenda-list">' + daySessions.map(function (session) {
          return '<article class="agenda-item"><div class="agenda-time">' + session.start + "<span>" + session.end + '</span></div><div class="agenda-body" style="--session-color:var(--tone-' + u.escape(session.tone) + '-strong)">' +
            "<h4>" + u.escape(session.course.title) + "</h4><p>" + u.escape(session.course.code) + " · " + u.escape(session.course.type) + " course</p>" +
            '<div class="agenda-meta"><span>' + ui.icon("user", 11) + u.escape(session.teacherName) + "</span><span>" + ui.icon("map-pin", 11) + u.escape(session.room) + "</span><span>" + ui.icon("clock", 11) + durationLabel(session) + "</span></div></div></article>";
        }).join("") + "</div>" :
          ui.emptyState({ icon: "calendar", title: "No classes scheduled", text: "There are no sessions for " + DAYS[state.dayIndex] + ". Choose another day or switch back to the week view.", compact: true })) +
      "</div>";
    }

    function paint() {
      const sessions = scheduleFor(state.classId);
      caption.innerHTML = captionHTML(sessions);
      body.innerHTML = sessions.length ? (state.view === "week" ? weekHTML(sessions) : dayHTML(sessions)) :
        '<div style="padding:30px 18px">' + ui.emptyState({ icon: "calendar", title: "No timetable to show", text: "This class has no subjects assigned for its programme and semester yet.", compact: true }) + "</div>";
      legend.innerHTML = sessions.length ? legendHTML(sessions) : "";
      root.querySelectorAll("[data-view]").forEach(function (button) {
        const active = button.getAttribute("data-view") === state.view;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      });
    }

    classSelect.addEventListener("change", function () {
      state.classId = classSelect.value;
      paint();
    });

    root.addEventListener("click", function (event) {
      const view = event.target.closest("[data-view]");
      if (view) {
        state.view = view.getAttribute("data-view");
        paint();
        return;
      }
      const day = event.target.closest("[data-day]");
      if (day) {
        state.dayIndex = Number(day.getAttribute("data-day"));
        paint();
      }
    });

    root.querySelector("#printTimetable").addEventListener("click", function () {
      printTimetable(state.classId, state.dayIndex, state.view);
    });

    paint();
  }

  CMS.views = CMS.views || {};
  CMS.views.timetable = { render: render };
})();
