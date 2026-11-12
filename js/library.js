/* Library catalogue, borrowing, and returns. */
(function () {
  "use strict";
  const CMS = window.CMS;
  const u = CMS.utils;
  const ui = CMS.ui;

  function availableCopies(bookId) {
    return Math.max(0, (CMS.book(bookId) ? CMS.book(bookId).copies : 0) - CMS.activeLoans(bookId).length);
  }

  function loanStatusFor(loan) {
    if (loan.returnedOn) return "Returned";
    return loan.dueOn < u.todayISO() ? "Overdue" : "Active";
  }

  function bookStatus(book) {
    const available = availableCopies(book.id);
    if (available <= 0) return "Borrowed";
    if (available <= 1) return "Low stock";
    return "Available";
  }

  function cover(book, large) {
    return '<span class="book-cover tone-' + u.escape(book.tone || "mint") + '"' + (large ? ' style="width:58px;height:76px;font-size:23px"' : "") + ">" + u.escape(book.title.charAt(0)) + "</span>";
  }

  function bookCell(book) {
    return '<div class="book-cell">' + cover(book) + '<div class="book-title"><strong title="' + u.escape(book.title) + '">' + u.escape(book.title) + "</strong><span>" + u.escape(book.author) + "</span></div></div>";
  }

  function render(root, params) {
    const categories = Array.from(new Set(CMS.data.books.map(function (book) { return book.category; }))).sort();
    const state = {
      tab: params.get("tab") === "loans" ? "loans" : "catalogue",
      q: params.get("q") || "",
      category: "all",
      availability: "all",
      bookPage: 1,
      bookPageSize: 8,
      loanQ: "",
      loanStatus: "all"
    };

    function statsHTML() {
      const active = CMS.data.loans.filter(function (loan) { return !loan.returnedOn; });
      const overdue = active.filter(function (loan) { return loan.dueOn < u.todayISO(); });
      const totalCopies = CMS.data.books.reduce(function (sum, book) { return sum + (Number(book.copies) || 0); }, 0);
      return '<div class="mini-stats" style="margin-bottom:16px">' +
        '<div class="mini-stat"><span class="mini-stat-icon">' + ui.icon("book-open") + '</span><div class="mini-stat-copy"><span>Catalogued titles</span><strong>' + CMS.data.books.length + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-amber">' + ui.icon("library") + '</span><div class="mini-stat-copy"><span>Total copies</span><strong>' + totalCopies + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-violet">' + ui.icon("arrow-up-right") + '</span><div class="mini-stat-copy"><span>On loan</span><strong>' + active.length + "</strong></div></div>" +
        '<div class="mini-stat"><span class="mini-stat-icon tone-coral">' + ui.icon("clock") + '</span><div class="mini-stat-copy"><span>Overdue loans</span><strong>' + overdue.length + "</strong></div></div>" +
      "</div>";
    }

    function filteredBooks() {
      const q = state.q.trim().toLowerCase();
      let list = CMS.data.books.slice();
      if (q) {
        list = list.filter(function (book) {
          return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q) || book.isbn.includes(q) || book.category.toLowerCase().includes(q);
        });
      }
      if (state.category !== "all") list = list.filter(function (book) { return book.category === state.category; });
      if (state.availability !== "all") {
        list = list.filter(function (book) {
          const available = availableCopies(book.id);
          if (state.availability === "available") return available > 0;
          if (state.availability === "low") return available > 0 && available <= 1;
          return available === 0;
        });
      }
      return list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    }

    function booksHTML() {
      const list = filteredBooks();
      const pages = Math.max(1, Math.ceil(list.length / state.bookPageSize));
      state.bookPage = Math.min(state.bookPage, pages);
      const start = (state.bookPage - 1) * state.bookPageSize;
      const rows = list.slice(start, start + state.bookPageSize);

      if (!list.length) {
        return ui.emptyState({
          icon: "book-open",
          title: "No books match these filters",
          text: "Try a different title, author, ISBN, category, or availability filter.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-clear-book-filters>Clear filters</button>'
        });
      }

      return '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">Library catalogue with availability and borrowing status</caption>' +
        "<thead><tr><th>Book</th><th>ISBN</th><th>Category</th><th>Shelf</th><th>Copies</th><th>Availability</th><th>Status</th><th class=\"cell-actions\">Actions</th></tr></thead><tbody>" +
        rows.map(function (book) {
          const available = availableCopies(book.id);
          return '<tr><td>' + bookCell(book) + "</td>" +
            '<td><span class="cell-mono">' + u.escape(book.isbn) + "</span></td>" +
            '<td><span class="tag">' + u.escape(book.category) + "</span></td>" +
            '<td><span class="cell-mono">' + u.escape(book.shelf) + "</span></td>" +
            '<td class="cell-center">' + book.copies + "</td>" +
            '<td><div class="availability ' + (available === 0 ? "is-out" : "") + '"><strong>' + available + '</strong><span>of ' + book.copies + " available</span></div></td>" +
            "<td>" + ui.statusBadge(bookStatus(book)) + "</td>" +
            '<td class="cell-actions"><div class="row-actions">' +
              '<button class="icon-action" type="button" data-view-book="' + u.escape(book.id) + '" aria-label="View ' + u.escape(book.title) + '" title="View book record">' + ui.icon("eye") + "</button>" +
              '<button class="icon-action" type="button" data-borrow-book="' + u.escape(book.id) + '" aria-label="Borrow ' + u.escape(book.title) + '" title="Borrow this book"' + (available === 0 ? " disabled" : "") + ">" + ui.icon("arrow-up-right") + "</button>" +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>" +
        ui.pager({ page: state.bookPage, pages: pages, total: list.length, pageSize: state.bookPageSize, label: "books" });
    }

    function filteredLoans() {
      const q = state.loanQ.trim().toLowerCase();
      let list = CMS.data.loans.slice();
      if (q) {
        list = list.filter(function (loan) {
          const book = CMS.book(loan.bookId);
          const student = CMS.student(loan.studentId);
          return (book && (book.title.toLowerCase().includes(q) || book.isbn.includes(q))) ||
            (student && (student.name.toLowerCase().includes(q) || student.admissionNo.toLowerCase().includes(q)));
        });
      }
      if (state.loanStatus !== "all") {
        list = list.filter(function (loan) { return loanStatusFor(loan).toLowerCase() === state.loanStatus; });
      }
      return list.sort(function (a, b) {
        const activeA = a.returnedOn ? 1 : 0;
        const activeB = b.returnedOn ? 1 : 0;
        if (activeA !== activeB) return activeA - activeB;
        return b.borrowedOn.localeCompare(a.borrowedOn);
      });
    }

    function loansHTML() {
      const list = filteredLoans();
      if (!list.length) {
        return ui.emptyState({
          icon: "library",
          title: "No borrowing records match",
          text: "Try another student or book, or change the loan status filter.",
          action: '<button class="btn btn-outline btn-sm" type="button" data-clear-loan-filters>Clear filters</button>'
        });
      }
      return '<div class="table-wrap"><table class="data-table">' +
        '<caption class="sr-only">Book borrowing and return records</caption>' +
        "<thead><tr><th>Book</th><th>Student</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th><th class=\"cell-actions\">Actions</th></tr></thead><tbody>" +
        list.map(function (loan) {
          const book = CMS.book(loan.bookId);
          const student = CMS.student(loan.studentId);
          const status = loanStatusFor(loan);
          const dueTone = status === "Overdue" ? "danger" : status === "Active" ? "" : "neutral";
          return '<tr><td>' + (book ? '<div class="book-cell"><span class="book-cover tone-' + u.escape(book.tone || "mint") + '" style="width:26px;height:34px;font-size:11px">' + u.escape(book.title.charAt(0)) + '</span><div class="book-title"><strong>' + u.escape(book.title) + "</strong><span>" + u.escape(book.author) + "</span></div></div>" : "—") + "</td>" +
            "<td>" + (student ? u.avatarPair(student.name, student.admissionNo) : "—") + "</td>" +
            '<td><span class="cell-mono">' + u.formatDate(loan.borrowedOn, "short") + "</span></td>" +
            '<td><span class="rate-chip ' + dueTone + '">' + u.formatDate(loan.dueOn, "short") + "</span>" + (status === "Overdue" ? '<span class="cell-sub" style="color:var(--danger)">' + Math.max(0, Math.round((new Date(u.todayISO()) - new Date(loan.dueOn)) / 86400000)) + " days late</span>" : "") + "</td>" +
            '<td><span class="cell-mono">' + (loan.returnedOn ? u.formatDate(loan.returnedOn, "short") : "—") + "</span></td>" +
            "<td>" + ui.statusBadge(status) + "</td>" +
            '<td class="cell-actions"><div class="row-actions">' +
              (book ? '<button class="icon-action" type="button" data-view-book="' + u.escape(book.id) + '" aria-label="View ' + u.escape(book.title) + '" title="View book record">' + ui.icon("eye") + "</button>" : "") +
              (status !== "Returned" ? '<button class="btn btn-outline btn-sm" type="button" data-return-loan="' + u.escape(loan.id) + '">' + ui.icon("check", 13) + " Return</button>" : "") +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>";
    }

    function paintStats() {
      const holder = root.querySelector("#libraryStats");
      if (holder) holder.innerHTML = statsHTML();
    }

    function paintBooks() {
      const region = root.querySelector("#booksRegion");
      if (!region) return;
      region.innerHTML = booksHTML();
      const count = root.querySelector("#bookCount");
      const list = filteredBooks();
      if (count) count.textContent = list.length === CMS.data.books.length ? String(CMS.data.books.length) : list.length + " of " + CMS.data.books.length;
    }

    function paintLoans() {
      const region = root.querySelector("#loansRegion");
      if (!region) return;
      region.innerHTML = loansHTML();
      const count = root.querySelector("#loanCount");
      if (count) count.textContent = filteredLoans().length + " " + u.plural(filteredLoans().length, "record");
    }

    function paintAll() {
      paintStats();
      paintBooks();
      paintLoans();
    }

    function openBorrow(book, onSaved) {
      const available = CMS.data.books.filter(function (item) { return availableCopies(item.id) > 0; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
      if (!available.length) {
        ui.toast("Every copy is currently on loan. Return a copy before lending another.", "warning", "No copies available");
        return;
      }
      const selected = book || available[0];
      const bookField = book ?
        '<div class="field span-2"><label for="loanBook">Book</label><input id="loanBook" type="text" value="' + u.escape(selected.title + " · " + selected.author) + '" readonly /><input type="hidden" name="bookId" value="' + u.escape(selected.id) + '" /></div>' :
        '<div class="field span-2"><label for="loanBook">Book <span class="text-danger">*</span></label><select id="loanBook" name="bookId">' +
          available.map(function (item) { return '<option value="' + u.escape(item.id) + '">' + u.escape(item.title) + " · " + availableCopies(item.id) + " available</option>"; }).join("") +
          '</select><p class="field-error" data-error-for="bookId" role="alert"></p></div>';
      const studentOptions = CMS.data.students.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (student) {
        return '<option value="' + u.escape(student.id) + '">' + u.escape(student.name + " · " + student.admissionNo) + "</option>";
      }).join("");

      const body = '<form id="loanForm" novalidate><div class="form-grid">' + bookField +
        '<div class="field span-2"><label for="loanStudent">Student <span class="text-danger">*</span></label><select id="loanStudent" name="studentId"><option value="">Choose a student</option>' + studentOptions + '</select><p class="field-error" data-error-for="studentId" role="alert"></p></div>' +
        '<div class="field"><label for="loanBorrowed">Borrowed on <span class="text-danger">*</span></label><input id="loanBorrowed" name="borrowedOn" type="date" max="' + u.todayISO() + '" value="' + u.todayISO() + '" /><p class="field-error" data-error-for="borrowedOn" role="alert"></p></div>' +
        '<div class="field"><label for="loanDue">Due back <span class="text-danger">*</span></label><input id="loanDue" name="dueOn" type="date" value="' + u.addDaysISO(14) + '" /><p class="field-error" data-error-for="dueOn" role="alert"></p></div>' +
        '<div class="field span-2"><div class="form-note">' + ui.icon("info", 14) + "<span>The standard loan period is 14 days. This demo records borrowing in your browser; no late fees are calculated.</span></div></div>" +
      "</div></form>";

      ui.modal.open({
        title: "Borrow a library book",
        subtitle: selected.title + " · " + availableCopies(selected.id) + " " + u.plural(availableCopies(selected.id), "copy") + " available",
        body: body,
        footer: '<button class="btn btn-outline" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit" form="loanForm">' + ui.icon("arrow-up-right", 15) + " Record loan</button>",
        onMount: function (modal, close) {
          const form = modal.querySelector("#loanForm");
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
              bookId: form.elements.bookId.value,
              studentId: form.elements.studentId.value,
              borrowedOn: form.elements.borrowedOn.value,
              dueOn: form.elements.dueOn.value
            };
            let valid = true;
            if (!values.bookId) { setError("bookId", "Choose a book to lend."); valid = false; }
            if (!values.studentId) { setError("studentId", "Choose the student borrowing this book."); valid = false; }
            if (!values.borrowedOn) { setError("borrowedOn", "Choose the borrowing date."); valid = false; }
            else if (values.borrowedOn > u.todayISO()) { setError("borrowedOn", "The borrowing date cannot be in the future."); valid = false; }
            if (!values.dueOn) { setError("dueOn", "Choose a due date."); valid = false; }
            else if (values.dueOn <= values.borrowedOn) { setError("dueOn", "The due date must be after the borrowing date."); valid = false; }
            const target = CMS.book(values.bookId);
            if (target && availableCopies(target.id) <= 0) {
              setError("bookId", "This title has no available copies right now.");
              valid = false;
            }
            if (!valid) {
              const first = form.querySelector("[aria-invalid='true']");
              if (first) first.focus();
              return;
            }
            const loan = {
              id: u.uid("loan"),
              bookId: values.bookId,
              studentId: values.studentId,
              borrowedOn: values.borrowedOn,
              dueOn: values.dueOn,
              returnedOn: null
            };
            CMS.data.loans.push(loan);
            CMS.store.save();
            close();
            paintAll();
            if (typeof onSaved === "function") onSaved();
            const student = CMS.student(values.studentId);
            const title = target ? target.title : "The book";
            ui.toast(title + " was lent to " + (student ? student.name : "the student") + " until " + u.formatDate(values.dueOn, "medium") + ".", "success", "Loan recorded");
          });
        }
      });
    }

    function openBook(book) {
      const available = availableCopies(book.id);
      const loans = CMS.data.loans.filter(function (loan) { return loan.bookId === book.id; }).sort(function (a, b) { return b.borrowedOn.localeCompare(a.borrowedOn); });
      const activeLoans = loans.filter(function (loan) { return !loan.returnedOn; });
      const body = '<div class="book-meta-card">' + cover(book, true) +
          '<div class="book-meta-copy"><h3>' + u.escape(book.title) + "</h3><p>" + u.escape(book.author) + " · " + book.year + '</p><span class="tag">' + u.escape(book.category) + "</span></div></div>" +
        '<p class="book-description">' + u.escape(book.description || "No description is available for this title.") + "</p>" +
        '<div class="detail-section" style="margin-top:18px"><h4 class="detail-section-title">' + ui.icon("library", 13) + " Catalogue record</h4>" +
          '<div class="info-list">' +
            '<div class="info-row"><span>ISBN</span><strong>' + u.escape(book.isbn) + "</strong></div>" +
            '<div class="info-row"><span>Shelf</span><strong>' + u.escape(book.shelf) + "</strong></div>" +
            '<div class="info-row"><span>Total copies</span><strong>' + book.copies + "</strong></div>" +
            '<div class="info-row"><span>Available now</span><strong>' + available + " of " + book.copies + "</strong></div>" +
            '<div class="info-row"><span>On loan</span><strong>' + activeLoans.length + "</strong></div>" +
          "</div></div>" +
        '<div class="detail-section"><h4 class="detail-section-title">' + ui.icon("clock", 13) + " Recent borrowing</h4>" +
          (loans.length ? '<div class="loan-list">' + loans.slice(0, 5).map(function (loan) {
            const student = CMS.student(loan.studentId);
            const status = loanStatusFor(loan);
            return '<div class="loan-item"><div class="loan-item-top"><strong>' + u.escape(student ? student.name : "Unknown student") + "</strong>" + ui.statusBadge(status) + "</div>" +
              '<div class="loan-dates"><span>Borrowed ' + u.formatDate(loan.borrowedOn, "short") + "</span><span>Due " + u.formatDate(loan.dueOn, "short") + "</span>" +
              (loan.returnedOn ? "<span>Returned " + u.formatDate(loan.returnedOn, "short") + "</span>" : "") + "</div></div>";
          }).join("") + "</div>" : ui.emptyState({ icon: "book", title: "No borrowing history", text: "This title has not been lent in the demo records.", compact: true })) +
        "</div>";

      const footer = '<button class="btn btn-outline" type="button" data-drawer-close>Close</button>' +
        '<button class="btn btn-primary" type="button" data-borrow-book="' + u.escape(book.id) + '"' + (available === 0 ? " disabled" : "") + ">" + ui.icon(available === 0 ? "clock" : "arrow-up-right", 15) + (available === 0 ? " All copies on loan" : " Borrow this book") + "</button>";

      ui.drawer.open({
        title: "Book record",
        subtitle: book.isbn,
        body: body,
        footer: footer,
        onMount: function (drawer, close) {
          drawer.addEventListener("click", function (event) {
            const borrow = event.target.closest("[data-borrow-book]");
            if (borrow && !borrow.disabled) {
              const target = CMS.book(borrow.getAttribute("data-borrow-book"));
              // The drawer shows live availability, so close it once the loan is recorded.
              if (target) openBorrow(target, close);
            }
          });
        }
      });
    }

    function returnLoan(loan) {
      const book = CMS.book(loan.bookId);
      const student = CMS.student(loan.studentId);
      ui.confirm({
        title: "Mark this book as returned?",
        heading: (book ? book.title : "Book") + " · " + (student ? student.name : "Student"),
        message: "The loan will be closed with a return date of " + u.formatDate(u.todayISO(), "medium") + " and the copy will become available again.",
        confirmLabel: "Return book",
        icon: "check-circle",
        tone: "warning"
      }).then(function (ok) {
        if (!ok) return;
        loan.returnedOn = u.todayISO();
        CMS.store.save();
        paintAll();
        ui.toast((book ? book.title : "The book") + " was returned to the library.", "success", "Book returned");
      });
    }

    root.innerHTML =
      '<div class="view-head"><div class="view-head-copy"><p class="eyebrow">Administration · Library services</p><h1 class="view-title">Library</h1>' +
        '<p class="view-sub">Browse the catalogue, check availability, and manage demo borrowing records. Loans are stored in this browser.</p></div>' +
        '<div class="view-actions"><button class="btn btn-outline" type="button" id="borrowNew">' + ui.icon("library", 15) + ' Borrow a book</button>' +
        '<a class="btn btn-primary" href="app.html#/library?tab=loans">' + ui.icon("arrow-up-right", 15) + " Manage loans</a></div></div>" +
      '<div id="libraryStats"></div>' +
      '<div class="card table-card">' +
        '<div class="tab-list" role="tablist" aria-label="Library sections">' +
          '<button class="tab-btn ' + (state.tab === "catalogue" ? "is-active" : "") + '" type="button" role="tab" id="tabCatalogue" aria-selected="' + (state.tab === "catalogue") + '" aria-controls="panelCatalogue" data-tab="catalogue">' + ui.icon("book-open", 14) + " Catalogue</button>" +
          '<button class="tab-btn ' + (state.tab === "loans" ? "is-active" : "") + '" type="button" role="tab" id="tabLoans" aria-selected="' + (state.tab === "loans") + '" aria-controls="panelLoans" data-tab="loans">' + ui.icon("clock", 14) + " Borrowing records</button>" +
        "</div>" +
        '<div role="tabpanel" id="panelCatalogue" aria-labelledby="tabCatalogue"' + (state.tab === "catalogue" ? "" : " hidden") + ">" +
          '<div class="table-toolbar">' +
            '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="librarySearch" value="' + u.escape(state.q) + '" placeholder="Search title, author, ISBN, or category" aria-label="Search the library catalogue" /></div>' +
            '<select class="select-compact" id="libraryCategory" aria-label="Filter by category"><option value="all">All categories</option>' +
              categories.map(function (category) { return '<option value="' + u.escape(category) + '">' + u.escape(category) + "</option>"; }).join("") + "</select>" +
            '<select class="select-compact" id="libraryAvailability" aria-label="Filter by availability"><option value="all">All availability</option><option value="available">Available</option><option value="low">Low stock</option><option value="out">Out on loan</option></select>' +
            '<div class="toolbar-divider" aria-hidden="true"></div>' +
            '<span class="toolbar-count"><strong id="bookCount">' + CMS.data.books.length + "</strong> titles</span>" +
          "</div>" +
          '<div id="booksRegion"></div>' +
        "</div>" +
        '<div role="tabpanel" id="panelLoans" aria-labelledby="tabLoans"' + (state.tab === "loans" ? "" : " hidden") + ">" +
          '<div class="table-toolbar">' +
            '<div class="toolbar-search">' + ui.icon("search") + '<input type="search" id="loanSearch" placeholder="Search by student or book" aria-label="Search borrowing records" /></div>' +
            '<select class="select-compact" id="loanStatus" aria-label="Filter by loan status"><option value="all">All loan statuses</option><option value="active">Active</option><option value="overdue">Overdue</option><option value="returned">Returned</option></select>' +
            '<div class="toolbar-divider" aria-hidden="true"></div>' +
            '<span class="toolbar-count" id="loanCount"></span>' +
          "</div>" +
          '<div id="loansRegion"></div>' +
        "</div>" +
      "</div>";

    const search = root.querySelector("#librarySearch");
    const category = root.querySelector("#libraryCategory");
    const availability = root.querySelector("#libraryAvailability");
    const loanSearch = root.querySelector("#loanSearch");
    const loanStatus = root.querySelector("#loanStatus");
    const booksRegion = root.querySelector("#booksRegion");
    const loansRegion = root.querySelector("#loansRegion");

    search.addEventListener("input", u.debounce(function () {
      state.q = search.value;
      state.bookPage = 1;
      paintBooks();
    }, 140));
    category.addEventListener("change", function () {
      state.category = category.value;
      state.bookPage = 1;
      paintBooks();
    });
    availability.addEventListener("change", function () {
      state.availability = availability.value;
      state.bookPage = 1;
      paintBooks();
    });
    loanSearch.addEventListener("input", u.debounce(function () {
      state.loanQ = loanSearch.value;
      paintLoans();
    }, 140));
    loanStatus.addEventListener("change", function () {
      state.loanStatus = loanStatus.value;
      paintLoans();
    });

    root.querySelector(".tab-list").addEventListener("click", function (event) {
      const tab = event.target.closest("[data-tab]");
      if (!tab) return;
      state.tab = tab.getAttribute("data-tab");
      root.querySelectorAll("[data-tab]").forEach(function (button) {
        const active = button.getAttribute("data-tab") === state.tab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      root.querySelector("#panelCatalogue").hidden = state.tab !== "catalogue";
      root.querySelector("#panelLoans").hidden = state.tab !== "loans";
      if (state.tab === "loans") paintLoans();
      else paintBooks();
    });

    root.addEventListener("click", function (event) {
      const bookButton = event.target.closest("[data-view-book]");
      const borrowButton = event.target.closest("[data-borrow-book]");
      const returnButton = event.target.closest("[data-return-loan]");
      if (bookButton) {
        const book = CMS.book(bookButton.getAttribute("data-view-book"));
        if (book) openBook(book);
        return;
      }
      if (borrowButton && !borrowButton.disabled) {
        const book = CMS.book(borrowButton.getAttribute("data-borrow-book"));
        if (book) openBorrow(book);
        return;
      }
      if (returnButton) {
        const loan = CMS.byId("loans", returnButton.getAttribute("data-return-loan"));
        if (loan) returnLoan(loan);
        return;
      }
      if (event.target.closest("[data-clear-book-filters]")) {
        state.q = "";
        state.category = "all";
        state.availability = "all";
        state.bookPage = 1;
        search.value = "";
        category.value = "all";
        availability.value = "all";
        paintBooks();
      }
      if (event.target.closest("[data-clear-loan-filters]")) {
        state.loanQ = "";
        state.loanStatus = "all";
        loanSearch.value = "";
        loanStatus.value = "all";
        paintLoans();
      }
    });

    booksRegion.addEventListener("click", function (event) {
      const pageBtn = event.target.closest("[data-page]");
      if (!pageBtn || pageBtn.disabled) return;
      state.bookPage = Number(pageBtn.getAttribute("data-page"));
      paintBooks();
      root.querySelector(".table-card").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    root.querySelector("#borrowNew").addEventListener("click", function () { openBorrow(null); });

    paintAll();
  }

  CMS.views = CMS.views || {};
  CMS.views.library = { render: render };
})();
