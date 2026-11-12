/* Shared helpers and interface primitives. */
(function () {
  "use strict";

  const CMS = (window.CMS = window.CMS || {});
  const icon = CMS.icon;

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const TONES = [1, 2, 3, 4, 5, 6];

  function hashName(name) {
    return String(name || "").split("").reduce(function (total, char) {
      return (total * 31 + char.charCodeAt(0)) % 997;
    }, 7);
  }

  function initials(name) {
    return String(name || "?")
      .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (word) { return word[0]; })
      .join("")
      .toUpperCase();
  }

  function avatar(name, size, extraClass) {
    const tone = TONES[hashName(name) % TONES.length];
    const sizeClass = size === "sm" ? " avatar-sm" : size === "lg" ? " avatar-lg" : size === "xl" ? " xl" : "";
    return '<span class="avatar' + sizeClass + ' tone-' + tone + (extraClass ? " " + extraClass : "") + '" aria-hidden="true">' + escapeHTML(initials(name)) + "</span>";
  }

  function avatarPair(name, sub, href, extra) {
    const content = avatar(name, extra && extra.size ? extra.size : null) +
      '<span class="avatar-pair-copy"><strong>' + escapeHTML(name) + "</strong>" +
      (sub ? "<span>" + escapeHTML(sub) + "</span>" : "") + "</span>";
    if (href) return '<a class="avatar-pair" href="' + href + '">' + content + "</a>";
    return '<div class="avatar-pair">' + content + "</div>";
  }

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    const text = String(value);
    const date = new Date(text.length === 10 ? text + "T12:00:00" : text);
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value, style) {
    const date = parseDate(value);
    if (!date) return "—";
    const options = {
      short: { month: "short", day: "numeric" },
      medium: { month: "short", day: "numeric", year: "numeric" },
      long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
      weekday: { weekday: "short" },
      day: { day: "numeric" },
      month: { month: "short" },
      monthYear: { month: "long", year: "numeric" },
      time: { hour: "numeric", minute: "2-digit" }
    }[style || "medium"];
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  function formatMoney(value, compact) {
    const amount = Number(value) || 0;
    if (compact && Math.abs(amount) >= 1000) {
      const thousands = amount / 1000;
      return "$" + (Math.round(thousands * 10) / 10).toFixed(thousands >= 100 ? 0 : 1) + "k";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function addDaysISO(days, base) {
    const date = base ? parseDate(base) : new Date();
    date.setDate(date.getDate() + Number(days));
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(context, args); }, wait);
    };
  }

  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function plural(count, singular, pluralForm) {
    return count === 1 ? singular : (pluralForm || singular + "s");
  }

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    const map = {
      active: "badge-success",
      paid: "badge-paid",
      pending: "badge-pending",
      overdue: "badge-overdue",
      probation: "badge-probation",
      inactive: "badge-inactive",
      "full-time": "badge-success",
      "part-time": "badge-info",
      "on leave": "badge-warning",
      returned: "badge-neutral",
      available: "badge-success",
      borrowed: "badge-info",
      "low stock": "badge-warning",
      upcoming: "badge-info",
      completed: "badge-neutral",
      "in progress": "badge-warning",
      high: "badge-high",
      medium: "badge-medium",
      low: "badge-low",
      draft: "badge-neutral",
      excused: "badge-info",
      present: "badge-success",
      late: "badge-warning",
      absent: "badge-overdue"
    };
    return map[key] || "badge-neutral";
  }

  function statusBadge(status, extraClass) {
    return '<span class="badge ' + statusClass(status) + (extraClass ? " " + extraClass : "") + '">' + escapeHTML(status) + "</span>";
  }

  function gradeFor(percentage) {
    if (percentage == null || isNaN(percentage)) return null;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  }

  function gradeTone(letter) {
    if (!letter) return "neutral";
    if (letter === "F") return "danger";
    if (letter === "D" || letter === "C") return "warning";
    return "";
  }

  function toneClass(name) {
    const key = String(name || "");
    let sum = 0;
    for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
    return ["mint", "amber", "violet", "coral", "blue", "gold"][sum % 6];
  }

  function departmentTone(departmentId) {
    const dept = CMS.department(departmentId);
    return dept ? dept.tone : "mint";
  }

  function firstName(name) {
    return String(name || "").replace(/^(Dr\.|Prof\.)\s+/, "").split(" ")[0];
  }

  function emptyState(options) {
    const opts = options || {};
    return '<div class="empty-state ' + (opts.compact ? "compact" : "") + '">' +
      '<div class="empty-icon">' + icon(opts.icon || "search") + "</div>" +
      "<h4>" + escapeHTML(opts.title || "Nothing here yet") + "</h4>" +
      "<p>" + escapeHTML(opts.text || "Try adjusting your search or filters.") + "</p>" +
      (opts.action ? opts.action : "") +
      "</div>";
  }

  function pager(options) {
    const page = options.page || 1;
    const pages = Math.max(1, options.pages || 1);
    const total = options.total || 0;
    const pageSize = options.pageSize || 10;
    const label = options.label || "records";
    const from = total ? (page - 1) * pageSize + 1 : 0;
    const to = Math.min(page * pageSize, total);

    const numbers = [];
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    for (let i = start; i <= end; i += 1) numbers.push(i);

    let numberHTML = "";
    if (start > 1) numberHTML += '<button class="page-btn" type="button" data-page="1">1</button>' + (start > 2 ? '<span class="page-ellipsis">…</span>' : "");
    numbers.forEach(function (number) {
      numberHTML += '<button class="page-btn" type="button" data-page="' + number + '"' + (number === page ? ' aria-current="page"' : "") + ">" + number + "</button>";
    });
    if (end < pages) numberHTML += (end < pages - 1 ? '<span class="page-ellipsis">…</span>' : "") + '<button class="page-btn" type="button" data-page="' + pages + '">' + pages + "</button>";

    return '<div class="table-foot">' +
      '<p class="page-info">Showing <strong>' + from + "–" + to + "</strong> of <strong>" + formatNumber(total) + "</strong> " + label + "</p>" +
      '<div class="pager" role="navigation" aria-label="Table pagination">' +
      '<button class="page-btn" type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + ' aria-label="Previous page">' + icon("chevron-left", 14) + "</button>" +
      numberHTML +
      '<button class="page-btn" type="button" data-page="' + (page + 1) + '"' + (page >= pages ? " disabled" : "") + ' aria-label="Next page">' + icon("chevron-right", 14) + "</button>" +
      "</div></div>";
  }

  const toastTitles = {
    success: "Saved",
    danger: "Something went wrong",
    warning: "Please check",
    info: "Good to know"
  };
  const toastIcons = {
    success: "check-circle",
    danger: "alert-triangle",
    warning: "alert-triangle",
    info: "info"
  };

  function toast(message, type, title) {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const kind = type || "success";
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.innerHTML = '<span class="toast-icon">' + icon(toastIcons[kind] || toastIcons.info) + "</span>" +
      '<div class="toast-copy"><strong>' + escapeHTML(title || toastTitles[kind] || "Notice") + "</strong><p>" + escapeHTML(message) + "</p></div>" +
      '<button class="toast-close" type="button" aria-label="Dismiss notification">' + icon("close", 14) + "</button>";
    root.appendChild(el);
    const remove = function () {
      if (!el.isConnected) return;
      el.classList.add("is-leaving");
      setTimeout(function () { el.remove(); }, 190);
    };
    el.querySelector(".toast-close").addEventListener("click", remove);
    setTimeout(remove, kind === "danger" ? 6000 : 4200);
  }

  /* Focus trap and scroll lock */
  function focusables(container) {
    return Array.prototype.slice.call(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return node.offsetParent !== null || node === document.activeElement; });
  }

  function trapFocus(container, onEscape) {
    const previous = document.activeElement;
    const listener = function (event) {
      if (event.key === "Escape") {
        if (onEscape) onEscape();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables(container);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", listener);
    setTimeout(function () {
      // Respect a focus target chosen by the caller's onMount handler.
      if (container.contains(document.activeElement)) return;
      const autofocus = container.querySelector("[autofocus]");
      const items = focusables(container);
      const target = autofocus || items[0];
      if (target) target.focus();
    }, 60);
    return function () {
      document.removeEventListener("keydown", listener);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }

  function syncScrollLock() {
    const modalRoot = document.getElementById("modalRoot");
    const drawerRoot = document.getElementById("drawerRoot");
    const open = (modalRoot && modalRoot.children.length) || (drawerRoot && drawerRoot.children.length);
    document.body.classList.toggle("modal-open", Boolean(open));
  }

  /* Modal */
  const modalState = { close: null };

  function openModal(options) {
    const opts = options || {};
    const root = document.getElementById("modalRoot");
    if (!root) return { close: function () {} };
    if (modalState.close) modalState.close(true);

    root.innerHTML = "";
    const layer = document.createElement("div");
    layer.className = "modal-layer";
    layer.innerHTML =
      '<div class="modal-backdrop" data-modal-close></div>' +
      '<div class="modal ' + (opts.size || "") + '" role="dialog" aria-modal="true" aria-labelledby="cmsModalTitle">' +
        '<div class="modal-head">' +
          '<div class="modal-head-copy"><h2 class="modal-title" id="cmsModalTitle">' + escapeHTML(opts.title || "Dialog") + "</h2>" +
          (opts.subtitle ? '<p class="modal-sub">' + escapeHTML(opts.subtitle) + "</p>" : "") + "</div>" +
          '<button class="modal-close" type="button" aria-label="Close dialog" data-modal-close>' + icon("close") + "</button>" +
        "</div>" +
        '<div class="modal-body">' + (opts.body || "") + "</div>" +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + "</div>" : "") +
      "</div>";
    root.appendChild(layer);
    syncScrollLock();

    const modal = layer.querySelector(".modal");
    let released = false;
    const release = trapFocus(modal, function () { close(false); });

    function close(immediate) {
      if (released) return;
      released = true;
      release();
      layer.remove();
      modalState.close = null;
      syncScrollLock();
      if (!immediate && typeof opts.onClose === "function") opts.onClose();
      if (modalState.pendingResolve) {
        const resolve = modalState.pendingResolve;
        modalState.pendingResolve = null;
        resolve(false);
      }
    }

    layer.querySelectorAll("[data-modal-close]").forEach(function (node) {
      node.addEventListener("click", function () { close(false); });
    });

    modalState.close = close;
    if (typeof opts.onMount === "function") opts.onMount(modal, close);
    return { close: close, element: modal };
  }

  function confirmDialog(options) {
    const opts = options || {};
    return new Promise(function (resolve) {
      let settled = false;
      const finish = function (value) {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const ref = openModal({
        title: opts.title || "Are you sure?",
        size: "modal-sm",
        body: '<div class="confirm-copy">' +
          '<div class="confirm-icon ' + (opts.tone === "warning" ? "warning" : "") + '">' + icon(opts.icon || "alert-triangle") + "</div>" +
          "<h3>" + escapeHTML(opts.heading || opts.title || "Please confirm") + "</h3>" +
          "<p>" + escapeHTML(opts.message || "This action cannot be undone.") + "</p>" +
          "</div>",
        footer: '<button class="btn btn-outline" type="button" data-confirm-cancel>Cancel</button>' +
          '<button class="btn ' + (opts.tone === "warning" ? "btn-primary" : "btn-danger") + '" type="button" data-confirm-ok>' + escapeHTML(opts.confirmLabel || "Confirm") + "</button>",
        onMount: function (modal, close) {
          modal.querySelector("[data-confirm-cancel]").addEventListener("click", function () {
            finish(false);
            close(false);
          });
          modal.querySelector("[data-confirm-ok]").addEventListener("click", function () {
            finish(true);
            close(false);
          });
          modal.querySelector("[data-confirm-ok]").focus();
        },
        onClose: function () { finish(false); }
      });
      ref.element.addEventListener("click", function (event) {
        if (event.target.closest("[data-modal-close]")) finish(false);
      });
    });
  }

  /* Drawer */
  const drawerState = { close: null };

  function openDrawer(options) {
    const opts = options || {};
    const root = document.getElementById("drawerRoot");
    if (!root) return { close: function () {} };
    if (drawerState.close) drawerState.close(true);
    root.innerHTML = "";

    const layer = document.createElement("div");
    layer.className = "drawer-layer";
    layer.innerHTML =
      '<div class="drawer-backdrop" data-drawer-close></div>' +
      '<div class="drawer ' + (opts.wide ? "drawer-wide" : "") + '" role="dialog" aria-modal="true" aria-labelledby="cmsDrawerTitle">' +
        '<div class="drawer-head">' +
          '<div><h2 class="drawer-title" id="cmsDrawerTitle">' + escapeHTML(opts.title || "Details") + "</h2>" +
          (opts.subtitle ? '<p class="drawer-sub">' + escapeHTML(opts.subtitle) + "</p>" : "") + "</div>" +
          '<button class="drawer-close" type="button" aria-label="Close panel" data-drawer-close>' + icon("close") + "</button>" +
        "</div>" +
        '<div class="drawer-body">' + (opts.body || "") + "</div>" +
        (opts.footer ? '<div class="drawer-foot">' + opts.footer + "</div>" : "") +
      "</div>";
    root.appendChild(layer);
    syncScrollLock();

    const drawer = layer.querySelector(".drawer");
    let released = false;
    const release = trapFocus(drawer, function () { close(false); });

    function close(immediate) {
      if (released) return;
      released = true;
      release();
      layer.remove();
      drawerState.close = null;
      syncScrollLock();
      if (!immediate && typeof opts.onClose === "function") opts.onClose();
    }

    layer.querySelectorAll("[data-drawer-close]").forEach(function (node) {
      node.addEventListener("click", function () { close(false); });
    });

    drawerState.close = close;
    if (typeof opts.onMount === "function") opts.onMount(drawer, close);
    return { close: close, element: drawer };
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map(function (row) {
      return row.map(function (cell) {
        const text = String(cell == null ? "" : cell);
        return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
      }).join(",");
    }).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  const printStyles = `
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #1d2723; font-size: 11px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc-sheet { padding: 0; border: 0; border-radius: 0; }
    .doc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 14px; border-bottom: 2px solid #183c35; }
    .doc-brand { display: flex; align-items: center; gap: 10px; }
    .brand-mark { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; background: #d9efe6; color: #183c35; font-family: Georgia, serif; font-size: 22px; font-weight: 600; }
    .doc-brand strong { display: block; font-family: Georgia, serif; font-size: 18px; font-weight: 500; color: #183c35; line-height: 1.2; }
    .doc-brand span { display: block; font-size: 8.5px; color: #68736d; letter-spacing: .08em; text-transform: uppercase; margin-top: 2px; }
    .doc-meta { text-align: right; font-size: 9px; line-height: 1.6; color: #68736d; }
    .doc-meta strong { display: block; font-size: 10px; color: #1d2723; }
    .doc-title { margin: 18px 0 4px; font-family: Georgia, serif; font-size: 25px; font-weight: 500; letter-spacing: -.02em; color: #183c35; }
    .doc-subtitle { margin: 0 0 14px; font-size: 10.5px; color: #68736d; }
    .doc-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; padding: 11px 0; border-top: 1px solid #e1e7e3; border-bottom: 1px solid #e1e7e3; font-size: 10px; }
    .doc-info-row { display: flex; justify-content: space-between; gap: 12px; }
    .doc-info-row span { color: #68736d; }
    .doc-info-row strong { color: #1d2723; font-weight: 600; text-align: right; }
    .doc-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 9.5px; }
    .doc-table th { text-align: left; padding: 6px 7px; background: #f0f4f1; color: #68736d; font-size: 8px; letter-spacing: .06em; text-transform: uppercase; font-weight: 600; }
    .doc-table td { padding: 7px; border-bottom: 1px solid #e1e7e3; color: #3f4d47; }
    .doc-table .num, .doc-table .amount { text-align: right; font-variant-numeric: tabular-nums; }
    .doc-table tr.total-row td { font-weight: 650; background: #f7f9f7; border-top: 1px solid #cdd8d1; }
    .doc-total { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 16px; padding: 11px 13px; border-radius: 6px; background: #f0f4f1; font-size: 10.5px; }
    .doc-total .amount { font-size: 19px; font-weight: 650; color: #183c35; font-variant-numeric: tabular-nums; }
    .doc-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e1e7e3; font-size: 8.5px; color: #68736d; }
    .doc-signature { min-width: 150px; text-align: center; }
    .doc-signature span { display: block; padding-top: 6px; border-top: 1px solid #cdd8d1; font-size: 8.5px; }
    .doc-stamp { display: inline-block; padding: 3px 7px; border: 1px solid #bfe5d8; border-radius: 3px; background: #e3f4ed; color: #2f8b70; font-size: 8.5px; font-weight: 600; }
    .report-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin: 18px 0 14px; }
    .report-title-row h2 { margin: 0; font-family: Georgia, serif; font-size: 25px; font-weight: 500; letter-spacing: -.02em; color: #183c35; }
    .report-title-row p { margin: 4px 0 0; font-size: 9.5px; color: #68736d; }
    .report-badge { display: inline-block; padding: 3px 7px; border-radius: 3px; background: #e3f4ed; color: #2f8b70; font-size: 8px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
    .report-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e1e7e3; border: 1px solid #e1e7e3; border-radius: 5px; overflow: hidden; margin-bottom: 16px; }
    .report-summary-cell { padding: 9px 10px; background: #f7f9f7; }
    .report-summary-cell span { display: block; font-size: 8px; color: #68736d; text-transform: uppercase; letter-spacing: .05em; }
    .report-summary-cell strong { display: block; margin-top: 2px; font-size: 15px; font-weight: 650; letter-spacing: -.02em; color: #1d2723; }
    .report-note { margin-top: 12px; padding: 8px 9px; border-radius: 5px; background: #f7f9f7; border: 1px solid #e1e7e3; font-size: 8.5px; line-height: 1.6; color: #68736d; }
    .report-sheet { padding: 0; }
    .receipt-amount { font-family: Georgia, serif; font-size: 21px; color: #183c35; }
    .print-note { margin-top: 18px; font-size: 8.5px; color: #68736d; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    @media print { a { color: inherit; text-decoration: none; } }
  `;

  function printHTML(title, bodyHTML) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + escapeHTML(title || "Document") + "</title><style>" + printStyles + "</style></head><body>" + bodyHTML + "</body></html>");
    doc.close();

    let printed = false;
    const run = function () {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        toast("Your browser blocked the print preview. Try opening the page in a new tab.", "warning");
      }
      setTimeout(function () { iframe.remove(); }, 1500);
    };
    if (iframe.contentWindow.document.readyState === "complete") setTimeout(run, 250);
    else iframe.addEventListener("load", function () { setTimeout(run, 200); });
    // Some browsers do not fire load for a written iframe; keep a fallback.
    setTimeout(run, 1200);
  }

  CMS.utils = {
    escape: escapeHTML,
    escapeHTML: escapeHTML,
    initials: initials,
    avatar: avatar,
    avatarPair: avatarPair,
    formatDate: formatDate,
    date: parseDate,
    formatMoney: formatMoney,
    formatNumber: formatNumber,
    todayISO: todayISO,
    addDaysISO: addDaysISO,
    debounce: debounce,
    uid: uid,
    plural: plural,
    statusBadge: statusBadge,
    statusClass: statusClass,
    gradeFor: gradeFor,
    gradeTone: gradeTone,
    toneClass: toneClass,
    departmentTone: departmentTone,
    firstName: firstName,
    hashName: hashName
  };

  CMS.ui = {
    icon: icon,
    avatar: avatar,
    avatarPair: avatarPair,
    statusBadge: statusBadge,
    statusClass: statusClass,
    gradeFor: gradeFor,
    gradeTone: gradeTone,
    emptyState: emptyState,
    pager: pager,
    toast: toast,
    modal: {
      open: openModal,
      close: function () { if (modalState.close) modalState.close(true); }
    },
    drawer: {
      open: openDrawer,
      close: function () { if (drawerState.close) drawerState.close(true); }
    },
    confirm: confirmDialog,
    downloadCSV: downloadCSV,
    print: printHTML
  };
})();
