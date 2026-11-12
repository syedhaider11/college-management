/* Sample data for the Evergreen College frontend prototype. */
(function () {
  "use strict";

  const CMS = (window.CMS = window.CMS || {});

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function iso(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function shifted(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return iso(d);
  }

  function lastWeekdays(count) {
    const days = [];
    let cursor = 0;
    while (days.length < count && cursor < count * 3) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - cursor);
      if (d.getDay() !== 0 && d.getDay() !== 6) days.push(iso(d));
      cursor += 1;
    }
    return days.reverse();
  }

  function seed() {
    const college = {
      name: "Evergreen College",
      initials: "E",
      tagline: "Campus administration",
      address: "48 Cedar Hollow Road, Brookfield, VT 05036",
      email: "hello@evergreen.edu",
      phone: "+1 (802) 555-0140",
      website: "evergreen.edu",
      established: 1972,
      term: "Fall 2026",
      weekLabel: "Fall semester · Week 8"
    };

    const departments = [
      {
        id: "dep-cse",
        name: "Computer Science & Engineering",
        short: "Computer Science",
        code: "CSE",
        headId: "tch-1",
        icon: "code",
        tone: "mint",
        established: 1984,
        description: "Software, data, and systems thinking for a digital world."
      },
      {
        id: "dep-bm",
        name: "Business & Management",
        short: "Business",
        code: "BM",
        headId: "tch-2",
        icon: "briefcase",
        tone: "amber",
        established: 1979,
        description: "Management, finance, and enterprise in a changing economy."
      },
      {
        id: "dep-dma",
        name: "Design & Media Arts",
        short: "Design & Media",
        code: "DMA",
        headId: "tch-3",
        icon: "pen-tool",
        tone: "violet",
        established: 1996,
        description: "Visual communication, craft, and moving-image practice."
      },
      {
        id: "dep-hls",
        name: "Health & Life Sciences",
        short: "Health Sciences",
        code: "HLS",
        headId: "tch-4",
        icon: "heart",
        tone: "coral",
        established: 1988,
        description: "Care-centred health practice and life science research."
      },
      {
        id: "dep-ssh",
        name: "Social Sciences & Humanities",
        short: "Social Sciences",
        code: "SSH",
        headId: "tch-5",
        icon: "globe",
        tone: "blue",
        established: 1972,
        description: "People, societies, and the ideas that shape them."
      }
    ];

    const programs = [
      { id: "prog-bscs", name: "BSc Computer Science", code: "BSCS", departmentId: "dep-cse", duration: "4 years" },
      { id: "prog-bsds", name: "BSc Data Science", code: "BSDS", departmentId: "dep-cse", duration: "4 years" },
      { id: "prog-bba", name: "BBA Management", code: "BBA", departmentId: "dep-bm", duration: "4 years" },
      { id: "prog-bdvc", name: "BDes Visual Communication", code: "BDVC", departmentId: "dep-dma", duration: "4 years" },
      { id: "prog-bsn", name: "BSc Nursing", code: "BSN", departmentId: "dep-hls", duration: "4 years" },
      { id: "prog-bapsy", name: "BA Psychology", code: "BAPSY", departmentId: "dep-ssh", duration: "3 years" },
      { id: "prog-baeco", name: "BA Economics", code: "BAECO", departmentId: "dep-ssh", duration: "3 years" }
    ];

    const teacherRows = [
      ["tch-1", "Dr. Lena Ortiz", "EMP-1001", "dep-cse", "Full-time", "office-cse-1", "Data Structures, Algorithms, Calculus I", "Associate Professor · Department Head"],
      ["tch-2", "Prof. Marcus Webb", "EMP-1002", "dep-bm", "Full-time", "office-bm-2", "Principles of Management, Financial Accounting", "Professor · Department Head"],
      ["tch-3", "Dr. Asha Iyer", "EMP-1003", "dep-dma", "Full-time", "office-dma-1", "Design Foundations, Visual Systems", "Associate Professor · Department Head"],
      ["tch-4", "Dr. Henry Cole", "EMP-1004", "dep-hls", "Full-time", "office-hls-1", "Anatomy & Physiology, Public Health", "Professor · Department Head"],
      ["tch-5", "Dr. Elena Petrova", "EMP-1005", "dep-ssh", "Full-time", "office-ssh-3", "Introduction to Psychology, Research Methods, Sociology", "Associate Professor · Department Head"],
      ["tch-6", "Samuel Boateng", "EMP-1006", "dep-cse", "Full-time", "office-cse-4", "Programming Fundamentals, Database Systems, Web Development", "Senior Lecturer"],
      ["tch-7", "Mina Takahashi", "EMP-1007", "dep-dma", "Part-time", "office-dma-5", "Typography, Digital Imaging, Motion Design", "Lecturer"],
      ["tch-8", "Dr. Omar Farouk", "EMP-1008", "dep-bm", "Full-time", "office-bm-4", "Marketing Principles, Business Communication", "Assistant Professor"],
      ["tch-9", "Rebecca Stone", "EMP-1009", "dep-hls", "Part-time", "office-hls-6", "Nursing Fundamentals, Health Communication", "Clinical Instructor"],
      ["tch-10", "Victor Nguyen", "EMP-1010", "dep-ssh", "Full-time", "office-ssh-2", "Microeconomics, Econometrics, Development Economics", "Senior Lecturer"]
    ];

    const teachers = teacherRows.map(function (row, index) {
      const name = row[1].replace(/^(Dr\.|Prof\.)\s+/, "");
      const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
      return {
        id: row[0],
        name: row[1],
        employeeId: row[2],
        departmentId: row[3],
        status: row[4],
        office: row[5],
        subjects: row[6].split(", "),
        title: row[7],
        email: slug + "@evergreen.edu",
        phone: "+1 (802) 555-" + String(2000 + index * 13),
        joined: index % 3 === 0 ? "2016-08-15" : index % 3 === 1 ? "2019-01-08" : "2022-08-22"
      };
    });

    const classRows = [
      ["cls-cse-26a", "CSE-26A", "prog-bscs", "dep-cse", 1, "Lab 204", "tch-1", "Morning"],
      ["cls-cse-25b", "CSE-25B", "prog-bscs", "dep-cse", 3, "Room 118", "tch-6", "Morning"],
      ["cls-ds-26a", "DS-26A", "prog-bsds", "dep-cse", 1, "Lab 210", "tch-1", "Afternoon"],
      ["cls-bba-26a", "BBA-26A", "prog-bba", "dep-bm", 1, "Room 204", "tch-2", "Morning"],
      ["cls-bdvc-26a", "BDVC-26A", "prog-bdvc", "dep-dma", 1, "Studio 3", "tch-3", "Afternoon"],
      ["cls-bsn-26a", "BSN-26A", "prog-bsn", "dep-hls", 1, "Health Lab 1", "tch-4", "Morning"],
      ["cls-psy-26a", "PSY-26A", "prog-bapsy", "dep-ssh", 1, "Room 112", "tch-5", "Afternoon"],
      ["cls-eco-25a", "ECO-25A", "prog-baeco", "dep-ssh", 3, "Room 220", "tch-10", "Morning"]
    ];

    const classes = classRows.map(function (row) {
      return {
        id: row[0],
        name: row[1],
        programId: row[2],
        departmentId: row[3],
        semester: row[4],
        room: row[5],
        teacherId: row[6],
        shift: row[7]
      };
    });

    const names = [
      "Aarav Mehta", "Sofia Ramirez", "Ethan Brooks", "Amara Okafor",
      "Lucas Bennett", "Priya Nair", "Noah Kim", "Isabella Rossi",
      "Daniel Osei", "Mei Lin", "Jonah Fischer", "Zara Haddad",
      "Mateo Alvarez", "Hannah Whitfield", "Rohan Kapoor", "Elise Dubois",
      "Caleb Mensah", "Yuki Tanaka", "Layla Hassan", "Owen Gallagher",
      "Nia Thompson", "Arjun Reddy", "Clara Novak", "Samuel Adeyemi",
      "Grace Liu", "Leo Martins", "Fatima Rahman", "Ben Carter",
      "Anika Sharma", "Diego Herrera", "Ruby Osei", "Marcus Reed"
    ];

    const students = names.map(function (name, index) {
      const cls = classes[Math.floor(index / 4)];
      const year = cls.semester >= 3 ? 2025 : 2026;
      const parts = name.toLowerCase().split(" ");
      const email = parts[0] + "." + parts[parts.length - 1] + "@student.evergreen.edu";
      let status = "Active";
      if (index === 11) status = "Probation";
      if (index === 19) status = "Probation";
      if (index === 30) status = "Inactive";
      return {
        id: "stu-" + (index + 1),
        name: name,
        admissionNo: "EC-" + year + "-" + String(101 + index),
        email: email,
        phone: "+1 (802) 555-" + String(1000 + index * 7),
        departmentId: cls.departmentId,
        programId: cls.programId,
        classId: cls.id,
        semester: cls.semester,
        admissionDate: year + "-08-" + pad(10 + (index % 14)),
        status: status,
        address: ["12 Maple Row", "84 Birch Lane", "309 Willow Street", "7 Alder Court", "55 Quarry Road"][index % 5]
      };
    });

    const courseRows = [
      ["CS101", "Programming Fundamentals", "prog-bscs", 1, 4, "tch-6", "Core"],
      ["CS102", "Discrete Mathematics", "prog-bscs", 1, 3, "tch-1", "Core"],
      ["CS103", "Computing Ethics", "prog-bscs", 1, 2, "tch-1", "Elective"],
      ["MA101", "Calculus I", "prog-bscs", 1, 4, "tch-1", "Core"],
      ["CS201", "Data Structures", "prog-bscs", 3, 4, "tch-1", "Core"],
      ["CS202", "Database Systems", "prog-bscs", 3, 3, "tch-6", "Core"],
      ["CS203", "Object-Oriented Programming", "prog-bscs", 3, 3, "tch-6", "Core"],
      ["CS204", "Digital Logic", "prog-bscs", 3, 3, "tch-1", "Elective"],
      ["DS101", "Introduction to Data Science", "prog-bsds", 1, 3, "tch-1", "Core"],
      ["DS102", "Programming for Data", "prog-bsds", 1, 3, "tch-6", "Core"],
      ["ST101", "Probability & Statistics", "prog-bsds", 1, 4, "tch-1", "Core"],
      ["BM101", "Principles of Management", "prog-bba", 1, 3, "tch-2", "Core"],
      ["BM102", "Financial Accounting", "prog-bba", 1, 4, "tch-2", "Core"],
      ["BM103", "Business Communication", "prog-bba", 1, 2, "tch-8", "Core"],
      ["DM101", "Design Foundations", "prog-bdvc", 1, 4, "tch-3", "Core"],
      ["DM102", "Typography", "prog-bdvc", 1, 3, "tch-7", "Core"],
      ["DM103", "Digital Imaging", "prog-bdvc", 1, 3, "tch-7", "Core"],
      ["HS101", "Anatomy & Physiology", "prog-bsn", 1, 4, "tch-4", "Core"],
      ["HS102", "Nursing Fundamentals", "prog-bsn", 1, 4, "tch-9", "Core"],
      ["HS103", "Health Communication", "prog-bsn", 1, 2, "tch-9", "Core"],
      ["SS101", "Introduction to Psychology", "prog-bapsy", 1, 3, "tch-5", "Core"],
      ["SS102", "Research Methods", "prog-bapsy", 1, 3, "tch-5", "Core"],
      ["SS103", "Sociology", "prog-bapsy", 1, 2, "tch-5", "Elective"],
      ["SS201", "Microeconomics", "prog-baeco", 3, 4, "tch-10", "Core"],
      ["SS202", "Econometrics", "prog-baeco", 3, 4, "tch-10", "Core"],
      ["SS203", "Development Economics", "prog-baeco", 3, 3, "tch-5", "Elective"]
    ];

    const courses = courseRows.map(function (row, index) {
      const program = programs.find(function (p) { return p.id === row[2]; });
      return {
        id: "crs-" + row[0].toLowerCase(),
        code: row[0],
        title: row[1],
        programId: row[2],
        departmentId: program ? program.departmentId : "dep-cse",
        semester: row[3],
        credits: row[4],
        teacherId: row[5],
        type: row[6],
        description: "A " + (index % 3 === 0 ? "foundation" : "guided") + " course in the " + (program ? program.code : "college") + " programme."
      };
    });

    const feeBase = {
      "dep-cse": 4200,
      "dep-bm": 3400,
      "dep-dma": 3800,
      "dep-hls": 4400,
      "dep-ssh": 3200
    };

    const fees = students.map(function (student, index) {
      const amount = feeBase[student.departmentId] || 3600;
      const pattern = index % 8;
      let paid = 0;
      let dueDate = shifted(24);
      if (pattern === 0) {
        paid = 0;
        dueDate = shifted(-18);
      } else if (pattern === 1) {
        paid = Math.round(amount * 0.4);
        dueDate = shifted(8);
      } else if (pattern === 2 || pattern === 5) {
        paid = Math.round(amount * 0.65);
        dueDate = shifted(-8);
      } else if (pattern === 3) {
        paid = amount;
        dueDate = shifted(-25);
      } else {
        paid = Math.round(amount * 0.75);
        dueDate = shifted(14);
      }
      const methods = ["Bank transfer", "Card", "Cash"];
      const payments = paid > 0 ? [{
        id: "pay-" + (index + 1),
        date: shifted(-(9 + (index % 18))),
        amount: paid,
        method: methods[index % 3],
        receiptNo: "RCPT-2026-" + String(4100 + index)
      }] : [];
      return {
        id: "fee-" + (index + 1),
        studentId: student.id,
        type: "Tuition · " + college.term,
        term: college.term,
        amount: amount,
        paid: paid,
        dueDate: dueDate,
        payments: payments
      };
    });

    const days = lastWeekdays(24);
    const attendanceHistory = [];
    days.forEach(function (date, dayIndex) {
      classes.forEach(function (cls, classIndex) {
        const size = students.filter(function (s) { return s.classId === cls.id; }).length;
        if (!size) return;
        let absent = (dayIndex + classIndex * 2) % 6 === 0 ? 1 : 0;
        let late = (dayIndex * 3 + classIndex) % 11 === 0 ? 1 : 0;
        let excused = (dayIndex + classIndex * 3) % 19 === 0 ? 1 : 0;
        if (absent + late + excused > size - 1) {
          absent = 0;
          late = 0;
          excused = 0;
        }
        attendanceHistory.push({
          id: "att-" + date + "-" + cls.id,
          date: date,
          classId: cls.id,
          present: size - absent - late - excused,
          absent: absent,
          late: late,
          excused: excused,
          total: size
        });
      });
    });

    const exams = [
      {
        id: "exam-1",
        name: "Quiz 1 · Programming Fundamentals",
        classId: "cls-cse-26a",
        subject: "CS101 · Programming Fundamentals",
        date: shifted(-10),
        total: 50,
        type: "Quiz",
        marks: { "stu-1": 44, "stu-2": 38, "stu-3": 47, "stu-4": 41 }
      },
      {
        id: "exam-2",
        name: "Assignment 2 · Financial Accounting",
        classId: "cls-bba-26a",
        subject: "BM102 · Financial Accounting",
        date: shifted(-7),
        total: 100,
        type: "Assignment",
        marks: { "stu-13": 82, "stu-14": 76, "stu-15": 91, "stu-16": 68 }
      },
      {
        id: "exam-3",
        name: "Midterm · Data Structures",
        classId: "cls-cse-25b",
        subject: "CS201 · Data Structures",
        date: shifted(6),
        total: 100,
        type: "Midterm",
        marks: {}
      },
      {
        id: "exam-4",
        name: "Midterm · Financial Accounting",
        classId: "cls-bba-26a",
        subject: "BM102 · Financial Accounting",
        date: shifted(8),
        total: 100,
        type: "Midterm",
        marks: {}
      },
      {
        id: "exam-5",
        name: "Studio Portfolio Review",
        classId: "cls-bdvc-26a",
        subject: "DM101 · Design Foundations",
        date: shifted(12),
        total: 100,
        type: "Review",
        marks: {}
      },
      {
        id: "exam-6",
        name: "Anatomy Practical",
        classId: "cls-bsn-26a",
        subject: "HS101 · Anatomy & Physiology",
        date: shifted(14),
        total: 50,
        type: "Practical",
        marks: {}
      },
      {
        id: "exam-7",
        name: "Research Proposal Defence",
        classId: "cls-psy-26a",
        subject: "SS102 · Research Methods",
        date: shifted(18),
        total: 100,
        type: "Review",
        marks: {}
      },
      {
        id: "exam-8",
        name: "Midterm · Data Science Foundations",
        classId: "cls-ds-26a",
        subject: "DS101 · Introduction to Data Science",
        date: shifted(21),
        total: 100,
        type: "Midterm",
        marks: {}
      },
      {
        id: "exam-9",
        name: "Final Examination · Microeconomics",
        classId: "cls-eco-25a",
        subject: "SS201 · Microeconomics",
        date: shifted(53),
        total: 100,
        type: "Final",
        marks: {}
      }
    ];

    const bookRows = [
      ["Clean Code", "Robert C. Martin", "9780132350884", "Computer Science", 5, 2008, "CS-12", "mint", "A handbook of agile software craftsmanship and readable code."],
      ["Designing Data-Intensive Applications", "Martin Kleppmann", "9781449373320", "Computer Science", 3, 2017, "CS-14", "mint", "The big ideas behind reliable, scalable, and maintainable systems."],
      ["The Design of Everyday Things", "Don Norman", "9780465050659", "Design", 4, 2013, "DM-02", "violet", "A foundational study of human-centred design and usability."],
      ["Grid Systems in Graphic Design", "Josef Müller-Brockmann", "9783721201451", "Design", 2, 1996, "DM-05", "violet", "A classic guide to layout and typographic order."],
      ["Principles of Marketing", "Philip Kotler & Gary Armstrong", "9780134492513", "Business", 6, 2017, "BM-08", "amber", "A broad introduction to marketing strategy and practice."],
      ["Financial Accounting", "Weygandt, Kimmel & Kieso", "9781119594581", "Business", 4, 2019, "BM-10", "amber", "Core financial accounting principles with worked examples."],
      ["Anatomy & Physiology", "OpenStax", "9781938168130", "Health", 8, 2016, "HS-03", "coral", "An open textbook covering human anatomy and physiology."],
      ["Community Health Nursing", "Mary A. Stanhope", "9780323528787", "Health", 3, 2019, "HS-07", "coral", "Population-focused nursing practice in community settings."],
      ["Thinking, Fast and Slow", "Daniel Kahneman", "9780374533557", "Psychology", 4, 2011, "SS-11", "blue", "A tour of the two systems that drive how we think."],
      ["The Great Gatsby", "F. Scott Fitzgerald", "9780743273565", "Literature", 5, 2004, "LT-04", "gold", "A novel of ambition, longing, and the American dream."],
      ["A Brief History of Time", "Stephen Hawking", "9780553380163", "Science", 3, 1998, "SC-02", "blue", "A readable journey through cosmology and time."],
      ["The Lean Startup", "Eric Ries", "9780307887894", "Business", 4, 2011, "BM-13", "amber", "How today's entrepreneurs use continuous innovation."],
      ["Norwegian Wood", "Haruki Murakami", "9780375704024", "Literature", 2, 2000, "LT-09", "gold", "A quiet, coming-of-age story set in 1960s Tokyo."],
      ["Deep Learning", "Goodfellow, Bengio & Courville", "9780262035613", "Computer Science", 2, 2016, "CS-18", "mint", "A comprehensive text on deep learning foundations."]
    ];

    const books = bookRows.map(function (row, index) {
      return {
        id: "book-" + (index + 1),
        title: row[0],
        author: row[1],
        isbn: row[2],
        category: row[3],
        copies: row[4],
        year: row[5],
        shelf: row[6],
        tone: row[7],
        description: row[8]
      };
    });

    const loans = [
      { id: "loan-1", bookId: "book-1", studentId: "stu-2", borrowedOn: shifted(-5), dueOn: shifted(9), returnedOn: null },
      { id: "loan-2", bookId: "book-3", studentId: "stu-13", borrowedOn: shifted(-20), dueOn: shifted(-6), returnedOn: null },
      { id: "loan-3", bookId: "book-6", studentId: "stu-14", borrowedOn: shifted(-3), dueOn: shifted(11), returnedOn: null },
      { id: "loan-4", bookId: "book-9", studentId: "stu-24", borrowedOn: shifted(-15), dueOn: shifted(-1), returnedOn: shifted(-2) },
      { id: "loan-5", bookId: "book-8", studentId: "stu-21", borrowedOn: shifted(-1), dueOn: shifted(13), returnedOn: null }
    ];

    const announcements = [
      {
        id: "ann-1",
        title: "Mid-semester examinations begin 28 October",
        body: "The mid-semester examination period opens on Wednesday, 28 October and runs through Friday, 6 November. Students should review the published timetable on the portal and confirm their seat numbers with their programme office. Quiet study rooms will be available in the library from 08:00 each weekday during the examination period.",
        audience: "All college",
        priority: "High",
        date: shifted(-2),
        author: "Registrar's Office",
        pinned: true
      },
      {
        id: "ann-2",
        title: "Library extends opening hours for exam week",
        body: "From 26 October, the main library will open from 07:30 to 23:00 on weekdays, and from 09:00 to 20:00 on Saturdays. Research librarians will offer drop-in referencing support every afternoon between 14:00 and 16:00.",
        audience: "Students",
        priority: "Medium",
        date: shifted(-3),
        author: "Library Services",
        pinned: false
      },
      {
        id: "ann-3",
        title: "Faculty research showcase — call for abstracts",
        body: "Faculty members are invited to submit a 250-word abstract for the annual research showcase on 21 November. Work in progress and collaborative projects are warmly encouraged. Submissions close on 7 November.",
        audience: "Faculty",
        priority: "Medium",
        date: shifted(-5),
        author: "Office of Research",
        pinned: false
      },
      {
        id: "ann-4",
        title: "Student ID collection desk now open in the atrium",
        body: "Students who have not yet collected their campus ID can visit the atrium desk between 10:00 and 16:00, Monday to Friday. Please bring a photo ID and your admission number.",
        audience: "Students",
        priority: "Low",
        date: shifted(-7),
        author: "Student Services",
        pinned: false
      },
      {
        id: "ann-5",
        title: "Campus shuttle route changes from Monday",
        body: "The north campus shuttle will serve the new science building stop from Monday. Morning departures shift five minutes earlier. The revised route map is available at the reception desk and in the library lobby.",
        audience: "All college",
        priority: "High",
        date: shifted(-8),
        author: "Facilities & Transport",
        pinned: false
      },
      {
        id: "ann-6",
        title: "Wellbeing week — workshops and drop-in sessions",
        body: "Take a breath during wellbeing week. Counselling services are hosting drop-in sessions, guided walks, and short workshops on sleep, focus, and managing exam stress. Sign up at the student hub or simply drop in.",
        audience: "All college",
        priority: "Medium",
        date: shifted(-10),
        author: "Counselling Services",
        pinned: false
      },
      {
        id: "ann-7",
        title: "Design studios open their doors on Friday evening",
        body: "Join the Design & Media Arts department for an open studio evening from 17:30. Students will exhibit works in progress across typography, photography, and moving image. Refreshments provided in the courtyard.",
        audience: "Design & Media Arts",
        priority: "Low",
        date: shifted(-12),
        author: "Department of Design & Media Arts",
        pinned: false
      }
    ];

    const events = [
      { id: "evt-1", title: "Library research workshop", date: shifted(2), time: "14:00", location: "Library · Room 2", type: "Workshop" },
      { id: "evt-2", title: "Founders' Day assembly", date: shifted(5), time: "09:00", location: "Main Quad", type: "Campus" },
      { id: "evt-3", title: "Fall open studio", date: shifted(9), time: "17:30", location: "Design Studio 3", type: "Event" },
      { id: "evt-4", title: "Careers & internships fair", date: shifted(16), time: "10:00", location: "Sports Hall", type: "Campus" }
    ];

    return {
      version: 1,
      college: college,
      departments: departments,
      programs: programs,
      teachers: teachers,
      classes: classes,
      students: students,
      courses: courses,
      fees: fees,
      attendanceHistory: attendanceHistory,
      attendanceMarks: {},
      exams: exams,
      books: books,
      loans: loans,
      announcements: announcements,
      events: events
    };
  }

  CMS.seed = seed;
})();
