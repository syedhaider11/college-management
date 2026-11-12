/* Academic structure: departments, courses & subjects, classes. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;
  const TONES = ["mint", "amber", "violet", "coral", "blue", "gold"];
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

  function teacherOptions(selected) {
    return '<option value="">Unassigned</option>' + CMS.data.teachers.map(function (teacher) {
      return '<option value="' + teacher.id + '"' + (selected === teacher.id ? " selected" : "") + ">" + u.escape(teacher.name) + "</option>";
    }).join("");
  }

  function setError(form, name, message) {
    const input = form.elements[name];
    const node = form.querySelector('[data-error-for="' + name + '"]');
    if (node) node.textContent = message || "";
    if (input) message ? input.setAttribute("aria-invalid", "true") : input.removeAttribute("aria-invalid");
  }
  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
    form.querySelectorAll("[aria-invalid='true']").forEach(function (node) { node.removeAttribute("aria-invalid"); });
  }

  /* ============================ Departments ============================ */
  function renderDepartments(root, params) {
    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Structure</p><h1 class="view-title">Departments</h1>' +
        '<p class="view-sub">Five academic departments bring programmes, faculty, and students together. Select a department to explore its courses.</p></div>' +
        '<div class="view-actions"><a class="btn btn-outline" href="app.html#/courses">' + ui.icon("book-open", 15) + ' All courses</a>' +
        '<button class="btn btn-primary" type="button" id="deptAdd">' + ui.icon("plus", 15) + " Add department</button></div></div>" +
      '<div class="mini-stats" style="margin-bottom:16px">' +
        '<div class="mini-stat"><span class="mini-stat-icon">' + ui.icon("building") + '</span><div class="mini-stat-copy"><span>Departments</span><strong id="deptStatCount">' + CMS.data.departments.length + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-amber">' + ui.icon("book-open") + '</span><div class="mini-stat-copy"><span>Programmes</span><strong>' + CMS.data.programs.length + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-violet">' + ui.icon("user-check") + '</span><div class="mini-stat-copy"><span>Faculty</span><strong>' + CMS.data.teachers.length + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-blue">' + ui.icon("users") + '</span><div class="mini-stat-copy"><span>Students</span><strong>' + CMS.data.students.length + "</strong></div></div>" +
      "</div>" +
      '<div class="dept-grid" id="departmentGrid"></div>';

    const grid = root.querySelector("#departmentGrid");

    function counts(deptId) {
      return {
        students: CMS.data.students.filter(function (s) { return s.departmentId === deptId; }).length,
        faculty: CMS.data.teachers.filter(function (t) { return t.departmentId === deptId; }).length,
        programs: CMS.data.programs.filter(function (p) { return p.departmentId === deptId; }).length
      };
    }

    function paint() {
      grid.innerHTML = CMS.data.departments.map(function (dept) {
        const head = CMS.teacher(dept.headId);
        const stats = counts(dept.id);
        return '<article class="dept-card">' +
          '<div class="dept-top"><div class="dept-heading"><span class="tone-tile tone-' + u.escape(dept.tone) + '">' + ui.icon(dept.icon || "building") + "</span>" +
          '<div class="dept-title"><h3>' + u.escape(dept.name) + "</h3><span>" + u.escape(dept.code) + " · Est. " + dept.established + "</span></div></div>" +
          '<button class="icon-action" type="button" data-dept-edit="' + dept.id + '" aria-label="Edit ' + u.escape(dept.name) + '" title="Edit department">' + ui.icon("edit") + "</button></div>" +
          '<p class="dept-desc">' + u.escape(dept.description) + "</p>" +
          '<div class="dept-metrics">' +
            '<div class="dept-metric"><strong>' + stats.students + "</strong><span>Students</span></div>" +
            '<div class="dept-metric"><strong>' + stats.faculty + "</strong><span>Faculty</span></div>" +
            '<div class="dept-metric"><strong>' + stats.programs + "</strong><span>Programmes</span></div>" +
          "</div>" +
          '<div class="dept-foot"><div class="dept-head">' + u.avatar(head ? head.name : "Unassigned", "sm") + "<span>" + u.escape(head ? head.name : "Head to be assigned") + "</span></div>" +
          '<a class="link-btn" href="app.html#/courses?dept=' + encodeURIComponent(dept.id) + '">View courses ' + ui.icon("arrow-right", 13) + "</a></div>" +
        "</article>";
      }).join("");
      const statCount = root.querySelector("#deptStatCount");
      if (statCount) statCount.textContent = CMS.data.departments.length;
    }

    function openForm(dept) {
      const editing = Boolean(dept);
      const body = '<form id="deptForm" novalidate><div class="form-grid">' +
        '<div class="field span-2"><label for="dpName">Department name <span class="text-danger">*</span></label><input id="dpName" name="name" type="text" autofocus value="' + u.escape(dept ? dept.name : "") + '" placeholder="e.g. Environmental Studies" /><p class="field-error" data-error-for="name" role="alert"></p></div>' +
        '<div class="field"><label for="dpCode">Short code <span class="text-danger">*</span></label><input id="dpCode" name="code" type="text" maxlength="6" value="' + u.escape(dept ? dept.code : "") + '" placeholder="ENV" /><p class="field-error" data-error-for="code" role="alert"></p></div>' +
        '<div class="field"><label for="dpShort">Display name</label><input id="dpShort" name="short" type="text" value="' + u.escape(dept ? dept.short : "") + '" placeholder="Environmental Studies" /></div>' +
        '<div class="field"><label for="dpHead">Department head <span class="text-danger">*</span></label><select id="dpHead" name="headId">' + teacherOptions(dept ? dept.headId : "") + '</select><p class="field-error" data-error-for="headId" role="alert"></p></div>' +
        '<div class="field"><label for="dpEstablished">Established</label><input id="dpEstablished" name="established" type="number" min="1900" max="' + new Date().getFullYear() + '" value="' + (dept ? dept.established : new Date().getFullYear()) + '" /></div>' +
        '<div class="field"><label for="dpTone">Colour theme</label><select id="dpTone" name="tone">' + TONES.map(function (tone) { return '<option value="' + tone + '"' + (dept && dept.tone === tone ? " selected" : "") + ">" + tone.charAt(0).toUpperCase() + tone.slice(1) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field span-2"><label for="dpDescription">Short description</label><textarea id="dpDescription" name="description" rows="3" placeholder="What does this department focus on?">' + u.escape(dept ? dept.description : "") + "</textarea></div>" +
      "</div></form>";

      ui.modal.open({
        title: editing ? "Edit department" : "Add a department",
        subtitle: "Departments group programmes, faculty, and students.",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="deptForm">' + ui.icon(editing ? "check" : "plus", 15) + (editing ? "Save changes" : "Add department") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#deptForm");
          form.addEventListener("input", function (event) { if (event.target.name) setError(form, event.target.name, ""); });
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearErrors(form);
            const values = {
              name: form.elements.name.value.trim(),
              code: form.elements.code.value.trim().toUpperCase(),
              short: form.elements.short.value.trim() || form.elements.name.value.trim(),
              headId: form.elements.headId.value,
              established: Number(form.elements.established.value) || new Date().getFullYear(),
              tone: form.elements.tone.value,
              description: form.elements.description.value.trim() || "A department focused on student success and academic excellence."
            };
            let valid = true;
            if (!values.name) { setError(form, "name", "Enter a department name."); valid = false; }
            else if (CMS.data.departments.some(function (d) { return d.name.toLowerCase() === values.name.toLowerCase() && (!dept || d.id !== dept.id); })) {
              setError(form, "name", "A department with that name already exists."); valid = false;
            }
            if (!values.code) { setError(form, "code", "Add a short code."); valid = false; }
            else if (CMS.data.departments.some(function (d) { return d.code.toLowerCase() === values.code.toLowerCase() && (!dept || d.id !== dept.id); })) {
              setError(form, "code", "That code is already used by another department."); valid = false;
            }
            if (!values.headId) { setError(form, "headId", "Choose a department head."); valid = false; }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            if (dept) {
              Object.assign(dept, values);
            } else {
              CMS.data.departments.push(Object.assign({ id: u.uid("dep"), icon: "building" }, values));
            }
            CMS.store.save();
            close();
            paint();
            ui.toast(dept ? "Department details updated." : values.name + " was added to the academic structure.", "success", dept ? "Changes saved" : "Department added");
          });
        }
      });
    }

    grid.addEventListener("click", function (event) {
      const edit = event.target.closest("[data-dept-edit]");
      if (edit) {
        const dept = CMS.department(edit.getAttribute("data-dept-edit"));
        if (dept) openForm(dept);
      }
    });
    root.querySelector("#deptAdd").addEventListener("click", function () { openForm(null); });
    paint();
  }

  /* ============================ Courses ============================ */
  function renderCourses(root, params) {
    const state = {
      q: params.get("q") || "",
      dept: params.get("dept") || "all",
      program: params.get("program") || "all",
      semester: "all",
      page: 1,
      pageSize: 9
    };

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Curriculum</p><h1 class="view-title">Courses & subjects</h1>' +
        '<p class="view-sub"><span id="courseResultCount">' + CMS.data.courses.length + "</span> subjects across " + CMS.data.programs.length + " programmes. Filter by programme or department to shape the curriculum view.</p></div>" +
        '<div class="view-actions"><button class="btn btn-primary" type="button" id="courseAdd">' + ui.icon("plus", 15) + " Add course</button></div></div>" +
      '<div class="section-head"><div><p class="section-label">Programmes</p><div class="program-strip" id="programStrip" style="margin-top:7px"></div></div></div>' +
      '<div class="card table-card">' +
        '<div class="table-toolbar">' +
          '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="courseSearch" value="' + u.escape(state.q) + '" placeholder="Search course code or title" aria-label="Search courses" /></div>' +
          '<select class="select-compact" id="courseDept" aria-label="Filter by department"><option value="all">All departments</option>' +
            CMS.data.departments.map(function (d) { return '<option value="' + d.id + '"' + (state.dept === d.id ? " selected" : "") + ">" + u.escape(d.short) + "</option>"; }).join("") + "</select>" +
          '<select class="select-compact" id="courseSemester" aria-label="Filter by semester"><option value="all">All semesters</option>' +
            SEMESTERS.map(function (semester) { return '<option value="' + semester + '"' + (state.semester === String(semester) ? " selected" : "") + ">Semester " + semester + "</option>"; }).join("") + "</select>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="courseReset">Reset</button>' +
        "</div><div id=\"coursesTableRegion\"></div></div>";

    const strip = root.querySelector("#programStrip");
    const search = root.querySelector("#courseSearch");
    const dept = root.querySelector("#courseDept");
    const semester = root.querySelector("#courseSemester");

    function availablePrograms() {
      return CMS.data.programs.filter(function (program) {
        return state.dept === "all" || program.departmentId === state.dept;
      });
    }

    function renderStrip() {
      const programs = availablePrograms();
      strip.innerHTML = '<button class="program-pill all ' + (state.program === "all" ? "is-active" : "") + '" type="button" data-program="all"><strong>All programmes</strong><span>' + CMS.data.courses.length + " subjects</span></button>" +
        programs.map(function (program) {
          const count = CMS.data.courses.filter(function (course) { return course.programId === program.id; }).length;
          return '<button class="program-pill ' + (state.program === program.id ? "is-active" : "") + '" type="button" data-program="' + program.id + '"><strong>' + u.escape(program.code) + "</strong><span>" + u.escape(program.name.replace(/^(BSc|BDes|BA|BBA)\s+/, "")) + " · " + count + "</span></button>";
        }).join("");
    }

    function filtered() {
      let list = CMS.data.courses.slice();
      if (state.dept !== "all") list = list.filter(function (course) { return course.departmentId === state.dept; });
      if (state.program !== "all") list = list.filter(function (course) { return course.programId === state.program; });
      if (state.semester !== "all") list = list.filter(function (course) { return String(course.semester) === String(state.semester); });
      const q = state.q.trim().toLowerCase();
      if (q) {
        list = list.filter(function (course) {
          return course.title.toLowerCase().includes(q) || course.code.toLowerCase().includes(q);
        });
      }
      list.sort(function (a, b) { return a.code.localeCompare(b.code); });
      return list;
    }

    function paint() {
      renderStrip();
      const list = filtered();
      const pages = Math.max(1, Math.ceil(list.length / state.pageSize));
      state.page = Math.min(state.page, pages);
      const rows = list.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
      const region = root.querySelector("#coursesTableRegion");
      const count = root.querySelector("#courseResultCount");
      if (count) count.textContent = list.length;

      if (!list.length) {
        region.innerHTML = ui.emptyState({
          icon: "book-open",
          title: "No courses match these filters",
          text: "Try clearing the programme, department, or semester filters.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-course-clear>Clear filters</button>'
        });
        return;
      }

      region.innerHTML = '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">Course catalogue with programme, department, semester, credits, instructor, and type</caption>' +
        '<thead><tr><th>Subject</th><th>Programme</th><th>Department</th><th>Semester</th><th>Credits</th><th>Instructor</th><th>Type</th><th class="cell-actions">Actions</th></tr></thead><tbody>' +
        rows.map(function (course) {
          const program = CMS.program(course.programId);
          const deptObj = CMS.department(course.departmentId);
          const teacher = CMS.teacher(course.teacherId);
          return "<tr>" +
            '<td><span class="cell-strong">' + u.escape(course.code) + " · " + u.escape(course.title) + '</span><span class="cell-sub">' + u.escape(course.description) + "</span></td>" +
            "<td>" + u.escape(program ? program.code : "—") + "</td>" +
            '<td><span class="tag">' + u.escape(deptObj ? deptObj.code : "—") + "</span></td>" +
            '<td class="cell-mono">Sem ' + course.semester + "</td>" +
            '<td class="cell-mono">' + course.credits + "</td>" +
            "<td>" + u.escape(teacher ? teacher.name : "Unassigned") + "</td>" +
            '<td><span class="badge ' + (course.type === "Core" ? "badge-success" : "badge-violet") + '">' + u.escape(course.type) + "</span></td>" +
            '<td class="cell-actions"><div class="row-actions">' +
              '<button class="icon-action" type="button" data-course-edit="' + course.id + '" aria-label="Edit ' + u.escape(course.title) + '" title="Edit course">' + ui.icon("edit") + "</button>" +
              '<button class="icon-action danger" type="button" data-course-delete="' + course.id + '" aria-label="Delete ' + u.escape(course.title) + '" title="Delete course">' + ui.icon("trash") + "</button>" +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>" +
        ui.pager({ page: state.page, pages: pages, total: list.length, pageSize: state.pageSize, label: "subjects" });
    }

    function openForm(course) {
      const editing = Boolean(course);
      const initialDept = course ? course.departmentId : (state.dept !== "all" ? state.dept : CMS.data.departments[0].id);
      const initialProgram = course ? course.programId : (state.program !== "all" ? state.program : (CMS.data.programs.find(function (p) { return p.departmentId === initialDept; }) || {}).id);
      const body = '<form id="courseForm" novalidate><div class="form-grid">' +
        '<div class="field span-2"><label for="crTitle">Course title <span class="text-danger">*</span></label><input id="crTitle" name="title" type="text" autofocus value="' + u.escape(course ? course.title : "") + '" placeholder="e.g. Web Development" /><p class="field-error" data-error-for="title" role="alert"></p></div>' +
        '<div class="field"><label for="crCode">Course code <span class="text-danger">*</span></label><input id="crCode" name="code" type="text" value="' + u.escape(course ? course.code : "") + '" placeholder="CS205" /><p class="field-error" data-error-for="code" role="alert"></p></div>' +
        '<div class="field"><label for="crType">Course type</label><select id="crType" name="type"><option' + (!course || course.type === "Core" ? " selected" : "") + '>Core</option><option' + (course && course.type === "Elective" ? " selected" : "") + '>Elective</option></select></div>' +
        '<div class="field"><label for="crDept">Department <span class="text-danger">*</span></label><select id="crDept" name="departmentId">' +
          CMS.data.departments.map(function (d) { return '<option value="' + d.id + '"' + (initialDept === d.id ? " selected" : "") + ">" + u.escape(d.name) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="crProgram">Programme <span class="text-danger">*</span></label><select id="crProgram" name="programId">' +
          CMS.data.programs.filter(function (p) { return p.departmentId === initialDept; }).map(function (p) { return '<option value="' + p.id + '"' + (initialProgram === p.id ? " selected" : "") + ">" + u.escape(p.name) + "</option>"; }).join("") + '</select><p class="field-error" data-error-for="programId" role="alert"></p></div>' +
        '<div class="field"><label for="crSemester">Semester <span class="text-danger">*</span></label><select id="crSemester" name="semester">' +
          SEMESTERS.map(function (semesterValue) { return '<option value="' + semesterValue + '"' + (course && course.semester === semesterValue ? " selected" : "") + ">Semester " + semesterValue + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="crCredits">Credits <span class="text-danger">*</span></label><input id="crCredits" name="credits" type="number" min="1" max="12" value="' + (course ? course.credits : 3) + '" /><p class="field-error" data-error-for="credits" role="alert"></p></div>' +
        '<div class="field span-2"><label for="crTeacher">Instructor</label><select id="crTeacher" name="teacherId">' + teacherOptions(course ? course.teacherId : "") + "</select></div>" +
        '<div class="field span-2"><label for="crDescription">Description</label><textarea id="crDescription" name="description" rows="3" placeholder="A short summary for the course catalogue.">' + u.escape(course ? course.description : "") + "</textarea></div>" +
      "</div></form>";

      ui.modal.open({
        title: editing ? "Edit course" : "Add a course",
        subtitle: "Subjects link programmes, semesters, instructors, and attendance.",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="courseForm">' + ui.icon(editing ? "check" : "plus", 15) + (editing ? "Save changes" : "Add course") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#courseForm");
          const deptSelect = form.elements.departmentId;
          const programSelect = form.elements.programId;
          deptSelect.addEventListener("change", function () {
            const programs = CMS.data.programs.filter(function (p) { return p.departmentId === deptSelect.value; });
            programSelect.innerHTML = programs.map(function (p) { return '<option value="' + p.id + '">' + u.escape(p.name) + "</option>"; }).join("");
          });
          form.addEventListener("input", function (event) { if (event.target.name) setError(form, event.target.name, ""); });
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearErrors(form);
            const values = {
              title: form.elements.title.value.trim(),
              code: form.elements.code.value.trim().toUpperCase(),
              type: form.elements.type.value,
              departmentId: form.elements.departmentId.value,
              programId: form.elements.programId.value,
              semester: Number(form.elements.semester.value),
              credits: Number(form.elements.credits.value),
              teacherId: form.elements.teacherId.value || null,
              description: form.elements.description.value.trim() || "A course within the college curriculum."
            };
            let valid = true;
            if (!values.title) { setError(form, "title", "Enter a course title."); valid = false; }
            if (!values.code) { setError(form, "code", "Add a course code."); valid = false; }
            else if (CMS.data.courses.some(function (c) { return c.code.toLowerCase() === values.code.toLowerCase() && (!course || c.id !== course.id); })) {
              setError(form, "code", "That course code is already in use."); valid = false;
            }
            if (!values.programId) { setError(form, "programId", "Choose a programme."); valid = false; }
            if (!values.credits || values.credits < 1 || values.credits > 12) { setError(form, "credits", "Credits must be between 1 and 12."); valid = false; }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            if (course) Object.assign(course, values);
            else CMS.data.courses.push(Object.assign({ id: u.uid("crs") }, values));
            CMS.store.save();
            close();
            paint();
            ui.toast(course ? "Course details updated." : values.title + " was added to the curriculum.", "success", course ? "Changes saved" : "Course added");
          });
        }
      });
    }

    strip.addEventListener("click", function (event) {
      const button = event.target.closest("[data-program]");
      if (!button) return;
      state.program = button.getAttribute("data-program");
      state.page = 1;
      paint();
    });
    search.addEventListener("input", function () { state.q = search.value; state.page = 1; paint(); });
    dept.addEventListener("change", function () {
      state.dept = dept.value;
      state.program = "all";
      state.page = 1;
      paint();
    });
    semester.addEventListener("change", function () { state.semester = semester.value; state.page = 1; paint(); });
    root.querySelector("#courseReset").addEventListener("click", function () {
      state.q = "";
      state.dept = "all";
      state.program = "all";
      state.semester = "all";
      state.page = 1;
      search.value = "";
      dept.value = "all";
      semester.value = "all";
      paint();
    });
    root.querySelector(".table-card").addEventListener("click", function (event) {
      const target = event.target.closest("[data-course-edit], [data-course-delete], [data-page], [data-course-clear]");
      if (!target) return;
      if (target.hasAttribute("data-course-edit")) {
        const course = CMS.course(target.getAttribute("data-course-edit"));
        if (course) openForm(course);
      } else if (target.hasAttribute("data-course-delete")) {
        const course = CMS.course(target.getAttribute("data-course-delete"));
        if (!course) return;
        ui.confirm({
          title: "Delete course?",
          heading: "Remove " + course.code + "?",
          message: "The course will be removed from the demo curriculum. Existing attendance and exam records are not changed.",
          confirmLabel: "Delete course",
          tone: "danger",
          icon: "trash"
        }).then(function (ok) {
          if (!ok) return;
          CMS.data.courses = CMS.data.courses.filter(function (c) { return c.id !== course.id; });
          CMS.store.save();
          paint();
          ui.toast(course.code + " was removed from the curriculum.", "success", "Course deleted");
        });
      } else if (target.hasAttribute("data-page")) {
        state.page = Number(target.getAttribute("data-page")) || 1;
        paint();
      } else if (target.hasAttribute("data-course-clear")) {
        state.q = "";
        state.dept = "all";
        state.program = "all";
        state.semester = "all";
        state.page = 1;
        search.value = "";
        dept.value = "all";
        semester.value = "all";
        paint();
      }
    });
    root.querySelector("#courseAdd").addEventListener("click", function () { openForm(null); });
    paint();
  }

  /* ============================ Classes ============================ */
  function renderClasses(root, params) {
    const state = {
      q: params.get("q") || "",
      dept: params.get("dept") || "all"
    };

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Academics · Class groups</p><h1 class="view-title">Classes & semesters</h1>' +
        '<p class="view-sub">Class groups connect a programme, semester, class teacher, and room. Open a class to see its subjects and roster.</p></div>' +
        '<div class="view-actions"><button class="btn btn-primary" type="button" id="classAdd">' + ui.icon("plus", 15) + " Add class</button></div></div>" +
      '<div class="card">' +
        '<div class="table-toolbar">' +
          '<div class="toolbar-search">' + ui.icon("search") + '<input id="classSearch" type="search" value="' + u.escape(state.q) + '" placeholder="Search class, programme, or room" aria-label="Search classes" /></div>' +
          '<select class="select-compact" id="classDept" aria-label="Filter by department"><option value="all">All departments</option>' +
            CMS.data.departments.map(function (d) { return '<option value="' + d.id + '"' + (state.dept === d.id ? " selected" : "") + ">" + u.escape(d.short) + "</option>"; }).join("") + "</select>" +
          '<button class="btn btn-ghost btn-sm" type="button" id="classReset">Reset</button>' +
          '<span class="toolbar-count">' + CMS.data.classes.length + " class groups</span>" +
        "</div>" +
        '<div class="card-body"><div class="class-grid" id="classGrid"></div></div>' +
      "</div>";

    const grid = root.querySelector("#classGrid");
    const search = root.querySelector("#classSearch");
    const dept = root.querySelector("#classDept");

    function filtered() {
      let list = CMS.data.classes.slice();
      if (state.dept !== "all") list = list.filter(function (c) { return c.departmentId === state.dept; });
      const q = state.q.trim().toLowerCase();
      if (q) {
        list = list.filter(function (c) {
          const program = CMS.program(c.programId);
          const teacher = CMS.teacher(c.teacherId);
          return c.name.toLowerCase().includes(q) ||
            c.room.toLowerCase().includes(q) ||
            (program && program.name.toLowerCase().includes(q)) ||
            (teacher && teacher.name.toLowerCase().includes(q));
        });
      }
      return list;
    }

    function paint() {
      const list = filtered();
      if (!list.length) {
        grid.innerHTML = ui.emptyState({
          icon: "layers",
          title: "No classes match this view",
          text: "Try clearing the search or department filter.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-class-clear>Clear filters</button>'
        });
        return;
      }
      grid.innerHTML = list.map(function (cls) {
        const program = CMS.program(cls.programId);
        const programDept = CMS.department(cls.departmentId);
        const teacher = CMS.teacher(cls.teacherId);
        const students = CMS.studentsInClass(cls.id);
        const pile = students.slice(0, 4).map(function (student) { return u.avatar(student.name, "sm"); }).join("") +
          (students.length > 4 ? '<span>+' + (students.length - 4) + "</span>" : "");
        return '<article class="class-card">' +
          '<div class="class-card-head"><span class="class-code">' + u.escape(cls.name) + "</span>" +
            '<button class="icon-action" type="button" data-class-edit="' + cls.id + '" aria-label="Edit ' + u.escape(cls.name) + '" title="Edit class">' + ui.icon("edit") + "</button></div>" +
          "<h3>" + u.escape(program ? program.name : "Programme") + "</h3>" +
          '<p class="class-program">' + u.escape(programDept ? programDept.short : "") + " · Semester " + cls.semester + " · " + u.escape(cls.shift) + " shift</p>" +
          '<div class="class-details">' +
            '<span class="class-detail">' + ui.icon("user-check", 13) + u.escape(teacher ? teacher.name : "Class teacher to be assigned") + "</span>" +
            '<span class="class-detail">' + ui.icon("map-pin", 13) + u.escape(cls.room) + "</span>" +
            '<span class="class-detail">' + ui.icon("users", 13) + students.length + " " + u.plural(students.length, "student") + "</span>" +
          "</div>" +
          '<div class="class-card-foot"><div class="student-pile">' + pile + "</div>" +
            '<button class="btn btn-secondary btn-sm" type="button" data-class-view="' + cls.id + '">View class ' + ui.icon("arrow-right", 13) + "</button></div>" +
        "</article>";
      }).join("");
    }

    function openForm(cls) {
      const editing = Boolean(cls);
      const initialProgram = cls ? cls.programId : CMS.data.programs[0].id;
      const body = '<form id="classForm" novalidate><div class="form-grid">' +
        '<div class="field"><label for="clName">Class name <span class="text-danger">*</span></label><input id="clName" name="name" type="text" autofocus value="' + u.escape(cls ? cls.name : "") + '" placeholder="e.g. CSE-27A" /><p class="field-error" data-error-for="name" role="alert"></p></div>' +
        '<div class="field"><label for="clSemester">Semester <span class="text-danger">*</span></label><select id="clSemester" name="semester">' +
          SEMESTERS.map(function (semester) { return '<option value="' + semester + '"' + (cls && cls.semester === semester ? " selected" : "") + ">Semester " + semester + "</option>"; }).join("") + "</select></div>" +
        '<div class="field span-2"><label for="clProgram">Programme <span class="text-danger">*</span></label><select id="clProgram" name="programId">' +
          CMS.data.programs.map(function (p) { return '<option value="' + p.id + '"' + (initialProgram === p.id ? " selected" : "") + ">" + u.escape(p.name) + " (" + u.escape(p.code) + ")</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label for="clRoom">Room</label><input id="clRoom" name="room" type="text" value="' + u.escape(cls ? cls.room : "") + '" placeholder="e.g. Room 118" /></div>' +
        '<div class="field"><label for="clShift">Shift</label><select id="clShift" name="shift"><option' + (cls && cls.shift === "Morning" ? " selected" : "") + '>Morning</option><option' + (cls && cls.shift === "Afternoon" ? " selected" : "") + '>Afternoon</option><option' + (cls && cls.shift === "Evening" ? " selected" : "") + ">Evening</option></select></div>" +
        '<div class="field span-2"><label for="clTeacher">Class teacher</label><select id="clTeacher" name="teacherId">' + teacherOptions(cls ? cls.teacherId : "") + "</select></div>" +
        '<div class="field span-2"><div class="form-note">' + ui.icon("info", 14) + "<span>The department is set automatically from the programme. Students are assigned to this group from the student form.</span></div></div>" +
      "</div></form>";

      ui.modal.open({
        title: editing ? "Edit class group" : "Add a class group",
        subtitle: "Set the programme, semester, room, and class teacher.",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="classForm">' + ui.icon(editing ? "check" : "plus", 15) + (editing ? "Save changes" : "Add class") + "</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#classForm");
          form.addEventListener("input", function (event) { if (event.target.name) setError(form, event.target.name, ""); });
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearErrors(form);
            const program = CMS.program(form.elements.programId.value);
            const values = {
              name: form.elements.name.value.trim().toUpperCase(),
              programId: form.elements.programId.value,
              departmentId: program ? program.departmentId : "dep-cse",
              semester: Number(form.elements.semester.value),
              room: form.elements.room.value.trim() || "Room to be assigned",
              teacherId: form.elements.teacherId.value || null,
              shift: form.elements.shift.value
            };
            let valid = true;
            if (!values.name) { setError(form, "name", "Enter a class name."); valid = false; }
            else if (CMS.data.classes.some(function (c) { return c.name.toLowerCase() === values.name.toLowerCase() && (!cls || c.id !== cls.id); })) {
              setError(form, "name", "A class with that name already exists."); valid = false;
            }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            if (cls) Object.assign(cls, values);
            else CMS.data.classes.push(Object.assign({ id: u.uid("cls") }, values));
            CMS.store.save();
            close();
            paint();
            ui.toast(cls ? "Class details updated." : values.name + " was added to the class list.", "success", cls ? "Changes saved" : "Class added");
          });
        }
      });
    }

    function openView(cls) {
      const program = CMS.program(cls.programId);
      const dept = CMS.department(cls.departmentId);
      const teacher = CMS.teacher(cls.teacherId);
      const students = CMS.studentsInClass(cls.id);
      const subjects = CMS.data.courses.filter(function (course) {
        return course.programId === cls.programId && course.semester === cls.semester;
      });
      const body = '<div class="detail-profile"><span class="class-code">' + u.escape(cls.name) + '</span><div style="margin-left:4px"><h3>' + u.escape(program ? program.name : "") + "</h3><p>Semester " + cls.semester + " · " + u.escape(cls.shift) + " shift · " + students.length + " students</p></div></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("layers", 12) + " Class details</p>" +
          '<dl class="detail-grid">' +
            '<div class="detail-item"><dt>Department</dt><dd>' + u.escape(dept ? dept.name : "—") + "</dd></div>" +
            '<div class="detail-item"><dt>Class teacher</dt><dd>' + u.escape(teacher ? teacher.name : "Unassigned") + "</dd></div>" +
            '<div class="detail-item"><dt>Room</dt><dd>' + u.escape(cls.room) + "</dd></div>" +
            '<div class="detail-item"><dt>Semester</dt><dd>Semester ' + cls.semester + "</dd></div>" +
          "</dl></div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("book-open", 12) + " Subjects this semester</p>" +
          (subjects.length ? '<div class="subject-list">' + subjects.map(function (course) { return '<span class="subject-chip"><strong>' + u.escape(course.code) + "</strong>" + u.escape(course.title) + "</span>"; }).join("") + "</div>" : '<p class="small muted">No subjects are linked to this programme and semester yet.</p>') +
        "</div>" +
        '<div class="detail-section"><p class="detail-section-title">' + ui.icon("users", 12) + " Class roster</p>" +
          (students.length ? '<div class="roster-list">' + students.map(function (student) {
            return '<div class="roster-item">' + u.avatar(student.name, "sm") + '<div class="roster-copy"><strong>' + u.escape(student.name) + "</strong><span>" + u.escape(student.admissionNo) + "</span></div>" + u.statusBadge(student.status) + "</div>";
          }).join("") + "</div>" : '<p class="small muted">No students are assigned to this class group.</p>') +
        "</div>" +
        '<div class="callout">' + ui.icon("info", 15) + "<span>Use the attendance module to record today's register for this class.</span></div>";

      ui.drawer.open({
        title: "Class details",
        subtitle: cls.name,
        wide: true,
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-class-edit-drawer>' + ui.icon("edit", 15) + "Edit class</button>" +
          '<a class="btn btn-primary" href="app.html#/attendance?class=' + encodeURIComponent(cls.id) + '">' + ui.icon("clipboard-check", 15) + "Take attendance</a>",
        onMount: function (drawer, close) {
          drawer.querySelector("[data-class-edit-drawer]").addEventListener("click", function () {
            close();
            openForm(cls);
          });
        }
      });
    }

    grid.addEventListener("click", function (event) {
      const edit = event.target.closest("[data-class-edit]");
      const view = event.target.closest("[data-class-view]");
      const clear = event.target.closest("[data-class-clear]");
      if (edit) {
        const cls = CMS.classInfo(edit.getAttribute("data-class-edit"));
        if (cls) openForm(cls);
      } else if (view) {
        const cls = CMS.classInfo(view.getAttribute("data-class-view"));
        if (cls) openView(cls);
      } else if (clear) {
        state.q = "";
        state.dept = "all";
        search.value = "";
        dept.value = "all";
        paint();
      }
    });
    search.addEventListener("input", function () { state.q = search.value; paint(); });
    dept.addEventListener("change", function () { state.dept = dept.value; paint(); });
    root.querySelector("#classReset").addEventListener("click", function () {
      state.q = "";
      state.dept = "all";
      search.value = "";
      dept.value = "all";
      paint();
    });
    root.querySelector("#classAdd").addEventListener("click", function () { openForm(null); });
    paint();
  }

  CMS.views = CMS.views || {};
  CMS.views.departments = { render: renderDepartments };
  CMS.views.courses = { render: renderCourses };
  CMS.views.classes = { render: renderClasses };
})();
