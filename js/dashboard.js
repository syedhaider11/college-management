/* Dashboard overview. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;

  function attendanceByDate() {
    const map = {};
    CMS.data.attendanceHistory.forEach(function (entry) {
      if (!map[entry.date]) map[entry.date] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      const row = map[entry.date];
      row.present += entry.present;
      row.absent += entry.absent;
      row.late += entry.late;
      row.excused += entry.excused;
      row.total += entry.total;
    });
    return Object.keys(map).sort().map(function (date) {
      const row = map[date];
      row.date = date;
      row.rate = row.total ? ((row.present + row.late) / row.total) * 100 : 0;
      return row;
    });
  }

  function feeTotals() {
    const totals = { billed: 0, collected: 0, outstanding: 0, overdue: 0 };
    CMS.data.fees.forEach(function (fee) {
      totals.billed += fee.amount;
      totals.collected += fee.paid;
      totals.outstanding += Math.max(0, fee.amount - fee.paid);
      if (CMS.feeStatus(fee) === "Overdue") totals.overdue += 1;
    });
    return totals;
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function chartMarkup(rows) {
    const width = 720;
    const height = 252;
    const pad = { left: 38, right: 14, top: 18, bottom: 30 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const values = rows.map(function (row) { return row.rate; });
    const minRaw = Math.min.apply(null, values);
    const maxRaw = Math.max.apply(null, values);
    const min = Math.max(0, Math.min(90, Math.floor((minRaw - 3) / 5) * 5));
    const max = Math.min(100, Math.max(96, Math.ceil((maxRaw + 1) / 2) * 2));
    const span = Math.max(1, max - min);

    const points = rows.map(function (row, index) {
      const x = rows.length === 1 ? pad.left + innerW / 2 : pad.left + (index / (rows.length - 1)) * innerW;
      const y = pad.top + innerH - ((row.rate - min) / span) * innerH;
      return { x: x, y: y, rate: row.rate, date: row.date };
    });

    let linePath = "";
    if (points.length) {
      linePath = "M" + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const mid = (prev.x + curr.x) / 2;
        linePath += " C" + mid.toFixed(1) + " " + prev.y.toFixed(1) + ", " + mid.toFixed(1) + " " + curr.y.toFixed(1) + ", " + curr.x.toFixed(1) + " " + curr.y.toFixed(1);
      }
    }
    const areaPath = points.length ? linePath + " L" + points[points.length - 1].x.toFixed(1) + " " + (pad.top + innerH) + " L" + points[0].x.toFixed(1) + " " + (pad.top + innerH) + " Z" : "";
    const targetY = pad.top + innerH - ((90 - min) / span) * innerH;
    const showTarget = 90 >= min && 90 <= max;

    let grid = "";
    for (let i = 0; i <= 4; i += 1) {
      const value = min + (span / 4) * i;
      const y = pad.top + innerH - ((value - min) / span) * innerH;
      grid += '<line class="chart-grid-line" x1="' + pad.left + '" y1="' + y.toFixed(1) + '" x2="' + (width - pad.right) + '" y2="' + y.toFixed(1) + '"/>';
      grid += '<text class="chart-axis" x="' + (pad.left - 8) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + Math.round(value) + "%</text>";
    }

    let labels = "";
    const interval = Math.max(1, Math.ceil(points.length / 7));
    points.forEach(function (point, index) {
      if (index % interval !== 0 && index !== points.length - 1) return;
      const d = u.date(point.date);
      const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
      labels += '<text class="chart-axis" x="' + point.x.toFixed(1) + '" y="' + (height - 8) + '" text-anchor="middle">' + label + "</text>";
    });

    const dots = points.map(function (point) {
      const title = u.formatDate(point.date, "weekday") + ", " + u.formatDate(point.date, "short") + " · " + point.rate.toFixed(1) + "% attendance";
      return '<circle class="chart-point" cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="3.6"><title>' + u.escape(title) + "</title></circle>";
    }).join("");

    const target = showTarget ? '<line class="chart-target" x1="' + pad.left + '" y1="' + targetY.toFixed(1) + '" x2="' + (width - pad.right) + '" y2="' + targetY.toFixed(1) + '"/>' +
      '<text class="chart-target-label" x="' + (width - pad.right) + '" y="' + (targetY - 5).toFixed(1) + '" text-anchor="end">90% target</text>' : "";

    const average = values.reduce(function (a, b) { return a + b; }, 0) / (values.length || 1);

    return '<svg class="chart-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="Attendance rate over the selected period. Average ' + average.toFixed(1) + ' percent." preserveAspectRatio="none">' +
      '<defs><linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#55b89a" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="#55b89a" stop-opacity="0.015"/>' +
      "</linearGradient></defs>" +
      grid + target +
      '<path class="chart-area" d="' + areaPath + '"/>' +
      '<path class="chart-line" d="' + linePath + '"/>' +
      dots + labels +
      "</svg>";
  }

  function render(root, params) {
    const students = CMS.data.students;
    const departments = CMS.data.departments;
    const byDate = attendanceByDate();
    const latest = byDate[byDate.length - 1] || { present: 0, late: 0, absent: 0, excused: 0, total: 0, rate: 0, date: u.todayISO() };
    const previous = byDate[byDate.length - 2];
    const todayRate = latest.total ? ((latest.present + latest.late) / latest.total) * 100 : 0;
    const yesterdayRate = previous && previous.total ? ((previous.present + previous.late) / previous.total) * 100 : null;
    const rateDiff = yesterdayRate == null ? null : todayRate - yesterdayRate;
    const supplied = rateDiff == null ? null : Math.abs(rateDiff).toFixed(1);
    const fees = feeTotals();
    const collectedPct = fees.billed ? Math.round((fees.collected / fees.billed) * 100) : 0;
    const year = new Date().getFullYear();
    const newStudents = students.filter(function (s) { return s.admissionDate >= year + "-08-01"; }).length;
    const latestDateLabel = u.formatDate(latest.date, "short");
    const sessionName = CMS.session ? CMS.session.name : "Maya";

    const upcoming = [];
    CMS.data.exams.forEach(function (exam) {
      if (exam.date >= u.todayISO()) {
        const cls = CMS.classInfo(exam.classId);
        upcoming.push({ date: exam.date, title: exam.name, meta: (cls ? cls.name : "Class") + " · Exam", type: "Exam", icon: "award" });
      }
    });
    CMS.data.events.forEach(function (event) {
      if (event.date >= u.todayISO()) {
        upcoming.push({ date: event.date, title: event.title, meta: event.time + " · " + event.location, type: event.type, icon: "calendar" });
      }
    });
    upcoming.sort(function (a, b) { return a.date.localeCompare(b.date); });
    const upcomingList = upcoming.slice(0, 4);

    const recentAdmissions = students.slice().sort(function (a, b) {
      return b.admissionDate.localeCompare(a.admissionDate) || b.id.localeCompare(a.id);
    }).slice(0, 5);

    const recentAnnouncements = CMS.data.announcements.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    }).slice(0, 3);

    const presentPct = latest.total ? (latest.present / latest.total) * 100 : 0;
    const latePct = latest.total ? ((latest.present + latest.late) / latest.total) * 100 : 0;
    const absentPct = latest.total ? ((latest.present + latest.late + latest.absent) / latest.total) * 100 : 0;

    root.innerHTML =
      '<div class="view-head">' +
        '<div class="view-head-copy"><p class="eyebrow">' + u.escape(u.formatDate(new Date(), "long")) + "</p>" +
        '<h1 class="view-title">' + greeting() + ", " + u.escape(u.firstName(sessionName)) + ".</h1>" +
        '<p class="view-sub">A clear view of what is happening across ' + u.escape(CMS.data.college.name) + " this week.</p></div>" +
        '<div class="view-actions"><span class="pill pill-demo">' + CMS.icon("sparkles", 13) + " Demo workspace</span>" +
        '<a class="btn btn-outline" href="app.html#/reports">' + CMS.icon("chart", 16) + " View reports</a>" +
        '<a class="btn btn-primary" href="app.html#/students?new=1">' + CMS.icon("plus", 16) + " Add student</a></div>" +
      "</div>" +

      '<div class="stat-grid">' +
        '<a class="stat-card" href="app.html#/students">' +
          '<div class="stat-top"><span class="stat-icon">' + CMS.icon("users") + '</span><span class="stat-trend">' + CMS.icon("arrow-up") + newStudents + " new</span></div>" +
          '<div><p class="stat-label">Students on roll</p><p class="stat-value">' + u.formatNumber(students.length) + '</p><p class="stat-meta">Across ' + departments.length + " departments</p></div>" +
        "</a>" +
        '<a class="stat-card" href="app.html#/teachers">' +
          '<div class="stat-top"><span class="stat-icon tone-violet">' + CMS.icon("user-check") + '</span><span class="stat-trend neutral">' + CMS.icon("building") + departments.length + " depts</span></div>" +
          '<div><p class="stat-label">Faculty & instructors</p><p class="stat-value">' + u.formatNumber(CMS.data.teachers.length) + '</p><p class="stat-meta">Teaching this semester</p></div>' +
        "</a>" +
        '<a class="stat-card" href="app.html#/attendance">' +
          '<div class="stat-top"><span class="stat-icon tone-blue">' + CMS.icon("clipboard-check") + '</span><span class="stat-trend ' + (rateDiff != null && rateDiff < 0 ? "down" : "") + '">' + CMS.icon(rateDiff != null && rateDiff < 0 ? "arrow-down" : "arrow-up") + (supplied != null ? supplied + "%" : "—") + "</span></div>" +
          '<div><p class="stat-label">Attendance today</p><p class="stat-value">' + todayRate.toFixed(1) + '%</p><p class="stat-meta">' + (latest.total ? (latest.present + latest.late) + " of " + latest.total + " attended · " + (latest.date === u.todayISO() ? "today" : u.formatDate(latest.date, "short")) : "No register recorded") + "</p></div>" +
        "</a>" +
        '<a class="stat-card" href="app.html#/fees">' +
          '<div class="stat-top"><span class="stat-icon tone-amber">' + CMS.icon("credit-card") + '</span><span class="stat-trend neutral">' + collectedPct + '% billed</span></div>' +
          '<div><p class="stat-label">Fees collected</p><p class="stat-value">' + u.formatMoney(fees.collected, true) + '</p><p class="stat-meta">' + u.formatMoney(fees.outstanding, true) + " outstanding</p></div>" +
        "</a>" +
      "</div>" +

      '<div class="dash-grid">' +
        '<section class="card chart-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Attendance overview</h2><p class="card-sub">Daily attendance across every class</p></div>' +
          '<div class="segmented" id="chartRange" role="group" aria-label="Chart period">' +
            '<button type="button" data-range="14" aria-pressed="true">14 days</button>' +
            '<button type="button" data-range="30" aria-pressed="false">30 days</button>' +
          "</div></div>" +
          '<div class="chart-wrap" id="attendanceChart"></div>' +
          '<div class="chart-footer"><div class="chart-legend"><span class="legend-item"><span class="legend-dot"></span>Attendance rate</span><span class="legend-item"><span class="legend-dash"></span>90% target</span></div>' +
          '<div class="chart-rate">Average <strong id="chartAverage">—</strong></div></div>' +
        "</section>" +

        '<aside class="card attendance-panel">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Today\'s attendance</h2><p class="card-sub">' + (latest.date === u.todayISO() ? "Live classroom snapshot" : "Latest recorded day · " + latestDateLabel) + "</p></div>" +
          '<span class="pill">' + latest.total + " students</span></div>" +
          '<div class="donut-wrap"><div class="donut" style="--seg-present:' + presentPct.toFixed(1) + "%;--seg-late:" + latePct.toFixed(1) + "%;--seg-absent:" + absentPct.toFixed(1) + '%">' +
          '<div class="donut-center"><strong>' + todayRate.toFixed(1) + '%</strong><span>Attendance</span></div></div></div>' +
          '<div class="breakdown">' +
            '<div class="breakdown-row"><span><span class="legend-dot"></span>Present</span><strong>' + latest.present + "</strong></div>" +
            '<div class="breakdown-row"><span><span class="legend-dot warning"></span>Late</span><strong>' + latest.late + "</strong></div>" +
            '<div class="breakdown-row"><span><span class="legend-dot blue"></span>Excused</span><strong>' + latest.excused + "</strong></div>" +
            '<div class="breakdown-row"><span><span class="legend-dot coral"></span>Absent</span><strong>' + latest.absent + "</strong></div>" +
          "</div>" +
          '<div class="card-foot"><span class="small muted">' + u.formatDate(latest.date, "medium") + '</span><a class="link-btn" href="app.html#/attendance">Take attendance ' + CMS.icon("arrow-right", 13) + "</a></div>" +
        "</aside>" +
      "</div>" +

      '<div class="dash-grid two-one">' +
        '<section class="card dashboard-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Recent admissions</h2><p class="card-sub">The newest students added to the roll</p></div><a class="link-btn card-head-link" href="app.html#/students">All students ' + CMS.icon("arrow-right", 13) + "</a></div>" +
          '<div class="compact-table-wrap"><div class="table-wrap"><table class="data-table dash-table">' +
            "<caption class=\"sr-only\">Five most recent student admissions</caption>" +
            "<thead><tr><th>Student</th><th>Programme</th><th>Class</th><th>Status</th><th></th></tr></thead><tbody>" +
            recentAdmissions.map(function (student) {
              const program = CMS.program(student.programId);
              const cls = CMS.classInfo(student.classId);
              return "<tr><td>" + u.avatarPair(student.name, student.admissionNo) + "</td>" +
                "<td>" + u.escape(program ? program.name : "—") + "</td>" +
                '<td><span class="cell-mono">' + u.escape(cls ? cls.name : "—") + "</span></td>" +
                "<td>" + u.statusBadge(student.status) + "</td>" +
                '<td class="cell-actions"><a class="icon-action" href="app.html#/students?q=' + encodeURIComponent(student.name) + '" aria-label="View ' + u.escape(student.name) + '">' + CMS.icon("arrow-up-right") + "</a></td></tr>";
            }).join("") +
          "</tbody></table></div></div>" +
        "</section>" +

        '<aside class="card dashboard-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Coming up</h2><p class="card-sub">Exams and campus events</p></div><a class="link-btn card-head-link" href="app.html#/exams">Exams ' + CMS.icon("arrow-right", 13) + "</a></div>" +
          '<div class="event-list">' + upcomingList.map(function (item) {
            const date = u.date(item.date);
            const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
            return '<div class="event-item"><div class="event-date"><span>' + u.escape(month) + "</span><strong>" + date.getDate() + "</strong></div>" +
              '<div class="event-copy"><strong>' + u.escape(item.title) + "</strong><span>" + CMS.icon(item.icon, 12) + u.escape(item.meta) + "</span></div></div>";
          }).join("") + "</div>" +
        "</aside>" +
      "</div>" +

      '<div class="dash-grid two-one">' +
        '<section class="card dashboard-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Campus announcements</h2><p class="card-sub">Notices for students and staff</p></div><a class="link-btn card-head-link" href="app.html#/announcements">View all ' + CMS.icon("arrow-right", 13) + "</a></div>" +
          '<div class="announce-list">' + recentAnnouncements.map(function (item) {
            return '<a class="announce-mini" href="app.html#/announcements"><span class="announce-mini-dot ' + item.priority.toLowerCase() + '"></span>' +
              '<span class="announce-mini-copy"><strong>' + u.escape(item.title) + "</strong><span>" + u.escape(item.audience) + " · " + u.formatDate(item.date, "short") + "</span></span></a>";
          }).join("") + "</div>" +
        "</section>" +
        '<aside class="card dashboard-card">' +
          '<div class="card-head"><div class="card-head-body"><h2 class="card-title">Quick actions</h2><p class="card-sub">Common tasks, one click away</p></div></div>' +
          '<div class="quick-actions">' +
            '<a class="quick-action" href="app.html#/students?new=1">' + CMS.icon("user", 15) + "<span>Add a new student</span>" + CMS.icon("arrow-right", 13) + "</a>" +
            '<a class="quick-action" href="app.html#/attendance">' + CMS.icon("clipboard-check", 15) + "<span>Take class attendance</span>" + CMS.icon("arrow-right", 13) + "</a>" +
            '<a class="quick-action" href="app.html#/announcements?new=1">' + CMS.icon("megaphone", 15) + "<span>Post an announcement</span>" + CMS.icon("arrow-right", 13) + "</a>" +
            '<a class="quick-action" href="app.html#/reports">' + CMS.icon("chart", 15) + "<span>Generate a report</span>" + CMS.icon("arrow-right", 13) + "</a>" +
          "</div>" +
        "</aside>" +
      "</div>";

    const chartContainer = root.querySelector("#attendanceChart");
    let range = 14;

    function paint() {
      const rows = byDate.slice(range > 0 ? -range : 0);
      chartContainer.innerHTML = chartMarkup(rows);
      const avg = rows.reduce(function (sum, row) { return sum + row.rate; }, 0) / (rows.length || 1);
      root.querySelector("#chartAverage").textContent = avg.toFixed(1) + "%";
      root.querySelectorAll("#chartRange button").forEach(function (button) {
        const active = Number(button.dataset.range) === range;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      });
    }

    paint();
    root.querySelectorAll("#chartRange button").forEach(function (button) {
      button.addEventListener("click", function () {
        range = Number(button.dataset.range);
        paint();
      });
    });
  }

  CMS.views = CMS.views || {};
  CMS.views.dashboard = { render: render };
})();
