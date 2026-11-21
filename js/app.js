document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initMenuToggle();
    initBackButtons();
    initSubmenu();
    loadBranchInfo();
    loadDashboardStats();
    loadAboutUs();
    bindAboutUsEvents();
    bindBranchSetupEvents();
    bindMemberFormEvents();
    bindSthanantorEvents();
    bindDhajjoEvents();
    initCommittee();
    initUpashakhaSetup();
    initUpashakhaDhajjo();
    initUpashakhaEntry();
    initJonoshoktiIncome();
    initUpashakhaIncome();
    initAnnannoIncome();
    initByayForm();
    initMashikAyByay();
    initMashikAyByayReport();
    initMashikNirbachon();
    initMonthlyReportWizard();
    initPrakashonaKroy();
    initPrakashonaBikroy();
    initPrakashonaBili();
    initPrakashonaBatil();
    initEyanatIncrease();
    initNisabIncrease();
    initJonoshoktiReport();
    initUpashakhaReport();
    loadPrakashonaTalikaList();
    initPrakashonaTalika();
    initKormoParishad();
    initShuraSodossho();
    initMainZone();
    initTransferredList();
    initMemberListPrint();
    initFormToggles();
    initPeriodPrintModal_();
    setMemberFormMode('new');
  });

  // ==================== উপশাখা তালিকা (সদস্য ফরম ও উপশাখা ধার্য্য ফরমের জন্য) ====================
  let _upashakhaList = [];
  let _upashakhaListWithMain = [];
  let _mainBranchName = '';

  function loadUpashakhaListForSelects() {
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          _upashakhaList = res.data;
          _upashakhaListWithMain = _mainBranchName
            ? [{ id: 'MAIN', name: _mainBranchName, level: 'মূল শাখা', amirName: '', amirMobile: '' }].concat(_upashakhaList)
            : _upashakhaList;

          populateBranchSelect();
          populateUpashakhaDhajjoSelect();
          populateUpashakhaSetupPicker();
          renderUentryList();
          populateSimpleUpashakhaSelect('ji-branch', true);
          populateSimpleUpashakhaSelect('ui-upashakha', false);
          populateSimpleUpashakhaSelect('pd-upashakha', false);
          populateSimpleUpashakhaSelect('pb-upashakha-picker', true);
          populateSimpleUpashakhaSelect('ei-branch', true);
          populateSimpleUpashakhaSelect('mlp-branch', true);
          populateSimpleUpashakhaSelect('jrep-branch', true);
          populateSimpleUpashakhaSelect('urepInd-upashakha', false);
        }
      })
      .withFailureHandler(function () { /* নীরবে ব্যর্থ */ })
      .getAllUpashakha();
  }

  function populateBranchSelect() {
    const select = document.getElementById('member-branch');
    const currentValue = select.value;
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _upashakhaListWithMain.forEach(function (u) {
      const opt = document.createElement('option');
      opt.value = u.name;
      opt.textContent = u.name + (u.level ? ' (' + u.level + ')' : '');
      select.appendChild(opt);
    });
    if (currentValue) ensureAndSetBranchValue(currentValue);
  }

  function ensureAndSetBranchValue(branchName) {
    const select = document.getElementById('member-branch');
    if (!branchName) { select.value = ''; return; }
    const exists = Array.from(select.options).some(function (o) { return o.value === branchName; });
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = branchName;
      opt.textContent = branchName;
      select.appendChild(opt);
    }
    select.value = branchName;
  }

  function populateUpashakhaDhajjoSelect() {
    const select = document.getElementById('upashakhaDhajja-select');
    if (!select) return;
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _upashakhaListWithMain.forEach(function (u) {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name;
      opt.dataset.amirName = u.amirName || '';
      opt.dataset.amirMobile = u.amirMobile || '';
      select.appendChild(opt);
    });
  }

  function initSubmenu() {
    const groups = [
      { toggle: document.getElementById('jonoshoktiToggle'), submenu: document.getElementById('jonoshoktiSubmenu') },
      { toggle: document.getElementById('upashakhaToggle'), submenu: document.getElementById('upashakhaSubmenu') },
      { toggle: document.getElementById('baitulmalToggle'), submenu: document.getElementById('baitulmalSubmenu') },
      { toggle: document.getElementById('prakashonaToggle'), submenu: document.getElementById('prakashonaSubmenu') },
      { toggle: document.getElementById('branchExtraToggle'), submenu: document.getElementById('branchExtraSubmenu') }
    ];

    groups.forEach(function (g) {
      g.toggle.setAttribute('aria-expanded', 'false');
      g.toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !g.submenu.classList.contains('open');

        // অন্য সব মেনু গ্রুপ বন্ধ করা
        groups.forEach(function (other) {
          other.toggle.classList.remove('open');
          other.submenu.classList.remove('open');
        });

        // নির্বাচিত মেনুটি টগল করা
        if (willOpen) {
          g.toggle.classList.add('open');
          g.submenu.classList.add('open');
        }
        groups.forEach(function (o) { o.toggle.setAttribute('aria-expanded', o.submenu.classList.contains('open') ? 'true' : 'false'); });
      });
    });
  }

  // ==================== টোস্ট নোটিফিকেশন ====================
  function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(function () {
      toast.className = 'toast';
    }, 2800);
  }

  // ==================== প্রিন্ট (নতুন উইন্ডোতে — মোবাইলে ফাঁকা পেইজ প্রিন্ট হওয়া বাগ ঠিক করার জন্য) ====================
  var PRINT_WINDOW_CSS = "body{font-family:'Noto Sans Bengali','Kalpurush',Arial,sans-serif;color:#1a1a1a;margin:0;padding:20px;background:#fff;}"
    + "h2{color:#0a2456;text-align:center;margin-bottom:4px;}"
    + "h3{text-align:center;margin-top:0;color:#444;font-weight:500;}"
    + ".print-table{width:100%;border-collapse:collapse;margin-top:20px;}"
    + ".print-table td{border:1px solid #333;padding:10px 14px;font-size:14px;}"
    + ".print-table .p-label{font-weight:700;width:200px;}"
    + ".print-table .col-serial{width:50px !important;text-align:center;}"
    + ".print-footer{text-align:center;margin-top:30px;font-size:12px;color:#555;}"
    + "table{border-collapse:collapse;}"
    + ".shop-receipt{width:320px;margin:0 auto;font-family:'Courier New',monospace;color:#000;}"
    + ".shop-receipt .r-header{text-align:center;margin-bottom:10px;}"
    + ".shop-receipt .r-header h2{font-size:16px;margin:0 0 4px;}"
    + ".shop-receipt .r-header .r-subtitle{font-size:12px;margin:0;}"
    + ".shop-receipt .r-divider{border:none;border-top:1px dashed #000;margin:8px 0;}"
    + ".shop-receipt .r-meta{font-size:12px;margin-bottom:6px;}"
    + ".shop-receipt .r-meta div{display:flex;justify-content:space-between;margin:2px 0;}"
    + ".shop-receipt table.r-items{width:100%;border-collapse:collapse;font-size:12px;}"
    + ".shop-receipt table.r-items th{border-bottom:1px dashed #000;text-align:left;padding:4px 2px;font-weight:700;}"
    + ".shop-receipt table.r-items td{padding:4px 2px;vertical-align:top;}"
    + ".shop-receipt table.r-items .r-num{text-align:right;}"
    + ".shop-receipt .r-summary{font-size:12.5px;margin-top:8px;}"
    + ".shop-receipt .r-summary div{display:flex;justify-content:space-between;margin:3px 0;}"
    + ".shop-receipt .r-summary .r-grand{font-weight:700;font-size:14px;border-top:1px dashed #000;padding-top:5px;margin-top:5px;}"
    + ".shop-receipt .r-thanks{text-align:center;margin-top:16px;font-size:12px;}"
    + ".mab-print-grid{display:flex;gap:20px;margin-top:6px;}"
    + ".mab-print-grid .mab-print-col{flex:1;margin-top:0;}"
    + ".mab-official-table{font-size:11px;}"
    + ".mab-official-table td{padding:6px 8px;}"
    + ".off-head{text-align:center;border-bottom:2px solid #0a2456;padding-bottom:6px;margin-bottom:8px;}"
    + ".off-head h2{font-size:20px;margin:0;}"
    + ".off-head .off-sub{margin:3px 0 0;font-size:12px;color:#333;}"
    + ".off-title{text-align:center;font-size:15px;font-weight:700;margin:8px 0 4px;text-decoration:underline;}"
    + ".off-meta{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;}"
    + ".print-table.off-table{margin-top:4px;}"
    + ".print-table.off-table th,.print-table.off-table td{border:1px solid #000;padding:2px 6px;font-size:12px;line-height:1.25;}"
    + ".print-table.off-table th{background:#e8ecf4;text-align:center;font-weight:700;}"
    + ".print-table.off-table thead{display:table-header-group;}"
    + ".print-table.off-table tr{page-break-inside:avoid;}"
    + ".off-total{font-size:12px;font-weight:700;margin:8px 0;}"
    + ".off-sign{display:flex;justify-content:space-between;margin-top:56px;font-size:12px;}"
    + ".off-sign div{width:28%;text-align:center;border-top:1px solid #000;padding-top:3px;}"
    + "@page{margin:12mm;}";

  // মোবাইল ব্রাউজারে (বিশেষত অ্যাপস স্ক্রিপ্টের ভেতরের iframe থেকে) সরাসরি window.print()
  // কল করলে অনেক সময় প্রিভিউ ঠিক দেখালেও আসল প্রিন্ট আউটপুট ফাঁকা আসে। এড়াতে প্রিন্ট
  // কনটেন্ট আলাদা একটি নতুন উইন্ডো/ট্যাবে খুলে সেখান থেকে প্রিন্ট করা হয়।
  function printViaWindow(templateId) {
    const src = document.getElementById(templateId);
    if (!src) { return; }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      showToast('পপ-আপ ব্লক করা আছে — ব্রাউজারের সেটিংস থেকে পপ-আপ অনুমতি দিন', 'error');
      return;
    }

    printWin.document.open();
    printWin.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>প্রিন্ট</title>' +
      '<style>' + PRINT_WINDOW_CSS + '</style></head><body>' + src.innerHTML + '</body></html>'
    );
    printWin.document.close();

    var printed = false;
    function doPrint() {
      if (printed) return;
      printed = true;
      try {
        printWin.focus();
        printWin.print();
      } catch (e) { /* ignore */ }
      setTimeout(function () {
        try { printWin.close(); } catch (e) { /* ignore */ }
      }, 300);
    }

    if (printWin.document.readyState === 'complete') {
      setTimeout(doPrint, 250);
    } else {
      printWin.onload = function () { setTimeout(doPrint, 250); };
      setTimeout(doPrint, 800); // ফলব্যাক, যদি onload না ফায়ার করে
    }
  }

  // ==================== ফরম টগল (বাটনে ক্লিক করলে ফরম খোলে, আবার ক্লিক করলে বন্ধ হয়) ====================
  function setFormCardOpen_(cardId, btnId, open, doScroll) {
    const card = document.getElementById(cardId);
    const btn = document.getElementById(btnId);
    if (card) card.style.display = open ? 'block' : 'none';
    if (btn) btn.classList.toggle('is-open', !!open);
    // ফরম খুললে সংশ্লিষ্ট তালিকা লুকাবে, ফরম বন্ধ হলে আবার দেখাবে
    const viewId = FORM_LIST_PAIRS_[cardId];
    const viewCard = viewId ? document.getElementById(viewId) : null;
    if (viewCard) viewCard.style.display = open ? 'none' : '';
    // শাখা সেটাপ পেজ: একটি ফরম খুললে বাকি সব ফরম ও সব তালিকা লুকাবে, বন্ধ হলে সব তালিকা দেখাবে
    if (BRANCH_FORM_GROUP_.some(function (p) { return p[0] === cardId; })) {
      BRANCH_FORM_GROUP_.forEach(function (p) {
        if (p[0] !== cardId && open) {
          const oc = document.getElementById(p[0]);
          const ob = document.getElementById(p[1]);
          if (oc) oc.style.display = 'none';
          if (ob) ob.classList.remove('is-open');
        }
        const v = document.getElementById(FORM_LIST_PAIRS_[p[0]]);
        if (v) v.style.display = open ? 'none' : '';
      });
    }
    if (open && doScroll && card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const BRANCH_FORM_GROUP_ = [['branchFormCard', 'branchFormToggleBtn'], ['committeeCard', 'committeeFormToggleBtn'], ['mainZoneCard', 'zoneFormToggleBtn']];

  const FORM_LIST_PAIRS_ = {
    kpFormCard: 'kpViewCard',
    ssFormCard: 'ssViewCard',
    branchFormCard: 'branchViewCard',
    committeeCard: 'committeeViewCard',
    mainZoneCard: 'zoneViewCard'
  };

  function bindFormToggle_(btnId, cardId) {
    document.getElementById(btnId).addEventListener('click', function () {
      const card = document.getElementById(cardId);
      setFormCardOpen_(cardId, btnId, card.style.display !== 'block', true);
    });
  }

  // প্রতিটি পেজের ফরম-টগল জোড়া (বাটন, ফরম) — পেজে ঢুকলে ফরম বন্ধ থাকে, সরাসরি তালিকা/তথ্য দেখায়
  function pageFormToggles_() {
    return {
    'member-form': [['memberFormToggleBtn', 'memberFormCard']],
    'branch': [['branchFormToggleBtn', 'branchFormCard'], ['committeeFormToggleBtn', 'committeeCard'], ['zoneFormToggleBtn', 'mainZoneCard']],
    'kormo-parishad': [['kpFormToggleBtn', 'kpFormCard']],
    'shura-sodossho': [['ssFormToggleBtn', 'ssFormCard']],
    'sthanantor-form': [['transferNewToggleBtn', 'transferNewWrap']],
    'upashakha-entry': [['uentryFormToggleBtn', 'uentryFormCard']],
    'byay-form': [['byayFormToggleBtn', 'byayFormCard']],
    'prakashona-talika': [['ptFormToggleBtn', 'ptFormCard']],
    'prakashona-kroy': [['pkFormToggleBtn', 'pkFormCard']],
    'prakashona-bikroy': [['pbFormToggleBtn', 'pbFormCard']],
    'prakashona-bili': [['pdFormToggleBtn', 'pdFormCard']],
    'prakashona-batil': [['pcFormToggleBtn', 'pcFormCard']]
  };
  }

  function initFormToggles() {
    const map = pageFormToggles_();
    Object.keys(map).forEach(function (page) {
      map[page].forEach(function (pair) {
        if (pair[0] === 'memberFormToggleBtn') return; // সদস্য বাটনের আলাদা আচরণ (bindMemberFormEvents)
        bindFormToggle_(pair[0], pair[1]);
      });
    });
  }

  function closePageForms_(page) {
    (pageFormToggles_()[page] || []).forEach(function (pair) {
      setFormCardOpen_(pair[1], pair[0], false, false);
    });
  }

  // ==================== বায়তুলমাল: সার্চ/রিপোর্ট ডাটা খোলা-বন্ধ ও পেজে ঢুকলে রিসেট ====================
  // লোড/সার্চ বাটন: ডাটা দেখানো থাকলে ক্লিকে বন্ধ করে, না থাকলে লোড করে
  function bindDataToggle_(btnId, isShownFn, hideFn, loadFn, openLabel, closeLabel) {
    const btn = document.getElementById(btnId);
    btn.addEventListener('click', function () {
      if (isShownFn()) {
        hideFn();
        btn.textContent = openLabel;
        return;
      }
      loadFn();
      if (isShownFn()) btn.textContent = closeLabel;
    });
  }

  function isBlockShown_(id) {
    return document.getElementById(id).style.display === 'block';
  }

  function hasContent_(id) {
    return document.getElementById(id).innerHTML.trim() !== '';
  }

  // রিপোর্ট মোড বন্ধ করে ফরমে ফেরা (রিপোর্ট বাটনের লেখা আগের অবস্থায়)
  function closeReportMode_(reportBtnId, reportCardId, formCardId) {
    document.getElementById(reportCardId).style.display = 'none';
    document.getElementById(formCardId).style.display = 'block';
    document.getElementById(reportBtnId).textContent = '📊 রিপোর্ট';
  }

  // যে পেজে ঢুকলে আগের সার্চ করা/লোড করা ডাটা মুছে পরিষ্কার অবস্থায় দেখাবে
  function pageEnterResetters_() {
    return {
      'jonoshokti-income': function () {
        closeReportMode_('jiReportToggleBtn', 'jiReportCard', 'jiFormCard');
        document.getElementById('jiMemberListWrap').style.display = 'none';
        document.getElementById('jiMemberList').innerHTML = '';
        document.getElementById('jiLoadBtn').textContent = '🔍 তালিকা দেখুন';
        document.getElementById('jrepTableWrap').innerHTML = '';
        document.getElementById('jrepLoadBtn').textContent = '🔍 রিপোর্ট দেখুন';
        document.getElementById('jrepIndResultWrap').style.display = 'none';
        document.getElementById('jrepIndSearchResults').innerHTML = '';
        document.getElementById('jrepIndSearchInput').value = '';
      },
      'upashakha-income': function () {
        closeReportMode_('uiReportToggleBtn', 'uiReportCard', 'uiFormCard');
        document.getElementById('uiTableWrap').style.display = 'none';
        document.getElementById('ui-upashakha').value = '';
        _uiSelectedId = '';
        document.getElementById('urepTableWrap').innerHTML = '';
        document.getElementById('urepLoadBtn').textContent = '🔍 রিপোর্ট দেখুন';
        document.getElementById('urepIndResultWrap').style.display = 'none';
        document.getElementById('urepInd-upashakha').value = '';
      },
      'annanno-income': function () {
        _oaRows = [{ id: '', date: '', khat: '', serial: '', description: '', amount: '' }];
        renderOaTable();
      },
      'byay-form': function () {
        resetByayForm();
      },
      'prakashona-talika': function () { resetPtForm_(); refreshTalika_(); },
      'prakashona-kroy': function () { resetPkForm(); loadPkList(); },
      'prakashona-bikroy': function () { resetPbForm(); loadPbList(); },
      'prakashona-bili': function () { resetPdForm(); loadPdList(); },
      'mashik-ay-byay': function () {
        closeReportMode_('mabReportToggleBtn', 'mabReportCard', 'mabFormCard');
        document.getElementById('mabrepResultWrap').style.display = 'none';
        document.getElementById('mabrepLoadBtn').textContent = '🔍 রিপোর্ট দেখুন';
        resetMabForm();
      }
    };
  }

  // ==================== নেভিগেশন ====================
  function goToPage(targetPage) {
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    const activeLink = document.querySelector('.nav-link[data-page="' + targetPage + '"]');
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    const targetSection = document.getElementById('page-' + targetPage);
    if (targetSection) targetSection.classList.add('active');

    // পেজে ঢুকলে ফরম বন্ধ রেখে সরাসরি তালিকা দেখানো
    closePageForms_(targetPage);
    if (targetPage === 'member-form') loadMemberList();
    if (targetPage === 'sthanantor-form') loadTransferredList();
    const resetFn = pageEnterResetters_()[targetPage];
    if (resetFn) resetFn();

    // খোলা থাকা সব ড্রপডাউন সাবমেনু বন্ধ করা (হোম/আমাদের সম্পর্কের মতো টপ-লেভেল লিংকে গেলেও)
    document.querySelectorAll('.nav-group-toggle').forEach(function (t) { t.classList.remove('open'); });
    document.querySelectorAll('.nav-submenu').forEach(function (s) { s.classList.remove('open'); });

    // মোবাইলে মেনু বন্ধ করা
    document.getElementById('sideNav').classList.remove('open');
    window.scrollTo(0, 0);
  }

  function initNavigation() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(function (link) {
      // সাবমেনু খোলা/বন্ধ করার বাটনে (data-page নেই) পেজ বদলানো হবে না — ওটা initSubmenu() সামলায়
      if (!link.getAttribute('data-page')) return;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        goToPage(link.getAttribute('data-page'));
      });
    });
  }

  // ==================== প্রতিটি ফরমে "পেছনে" বাটন ====================
  function initBackButtons() {
    document.querySelectorAll('.page').forEach(function (page) {
      if (page.id === 'page-home') return; // হোম পেজে ব্যাক বাটনের দরকার নেই

      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'btn btn-outline back-btn';
      backBtn.innerHTML = '⬅️ পেছনে যান';
      backBtn.addEventListener('click', function () { goToPage('home'); });

      page.insertBefore(backBtn, page.firstChild);
    });
  }

  function initMenuToggle() {
    document.getElementById('menuToggle').addEventListener('click', function () {
      document.getElementById('sideNav').classList.toggle('open');
    });
  }

  // ==================== হেডার / ফুটার - শাখার তথ্য ====================
  let _mainBranchLevel = '';

  function loadBranchInfo() {
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          const d = res.data;
          if (d.name) {
            document.getElementById('headerBranchName').textContent = d.name;
          }
          document.getElementById('headerBranchLevel').textContent = d.level ? (d.level + ' শাখা') : 'বাংলাদেশ জামায়াতে ইসলামী';

          _mainBranchName = d.name || '';
          _mainBranchLevel = d.level || '';
          loadUpashakhaListForSelects();
          updateUpashakhaZoneVisibility();

          if (d.logoUrl) {
            const logoImg = document.getElementById('headerLogo');
            logoImg.src = d.logoUrl;
            logoImg.style.display = 'block';

            // লোগোকে সার্চ-লিংক (গুগল ড্রাইভ থাম্বনেইল) এর সাথে সরাসরি ফেভিকন হিসেবে সেট করা
            const favicon = document.getElementById('faviconLink');
            const faviconShortcut = document.getElementById('faviconLinkShortcut');
            if (favicon) favicon.href = d.logoUrl;
            if (faviconShortcut) faviconShortcut.href = d.logoUrl;
          }

          document.getElementById('footerAddress').textContent = d.address || 'ঠিকানা শাখা সেটাপ থেকে আসবে';
          document.getElementById('footerPhone').textContent = d.phone ? ('ফোনঃ ' + d.phone) : '—';
          document.getElementById('footerEmail').textContent = d.email ? ('ইমেইলঃ ' + d.email) : '—';

          // ফরম প্রি-ফিল
          document.getElementById('branch-name').value = d.name || '';
          document.getElementById('branch-level').value = d.level || '';
          document.getElementById('branch-address').value = d.address || '';
          document.getElementById('branch-phone').value = d.phone || '';
          document.getElementById('branch-email').value = d.email || '';

          if (d.logoUrl) {
            const lp = document.getElementById('logoPreview');
            lp.src = d.logoUrl; lp.style.display = 'block';
          }
          if (d.symbolUrl) {
            const sp = document.getElementById('symbolPreview');
            sp.src = d.symbolUrl; sp.style.display = 'block';
          }

          window._currentLogoUrl = d.logoUrl || '';
          window._currentSymbolUrl = d.symbolUrl || '';
          _branchViewData = d;
          renderBranchView_();

          // মূল শাখার অঞ্চল তথ্য লোড
          _mainZoneRows = (d.zones && d.zones.length) ? d.zones : [];
          const zoneCountInput = document.getElementById('mainZoneCount');
          if (zoneCountInput) {
            zoneCountInput.value = _mainZoneRows.length;
            renderMainZoneTable();
          }
          renderZoneView_();
          populateMemberZoneSelect();

          document.getElementById('branch-level').addEventListener('change', function () {
            _mainBranchLevel = this.value;
            updateUpashakhaZoneVisibility();
          });
        }
      })
      .withFailureHandler(function (err) {
        console.error(err);
      })
      .getBranchInfo();
  }

  function updateUpashakhaZoneVisibility() {
    const section = document.getElementById('upashakhaZoneSection');
    if (!section) return;
    const showZones = (_mainBranchLevel === 'উপজেলা / থানা' || _mainBranchLevel === 'পৌরসভা');
    section.style.display = showZones ? 'block' : 'none';
  }

  function populateMemberZoneSelect() {
    const select = document.getElementById('member-zone');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">প্রযোজ্য নয়</option>';
    if (_mainBranchName) {
      const mainOpt = document.createElement('option');
      mainOpt.value = _mainBranchName;
      mainOpt.textContent = _mainBranchName + ' (মূল শাখা)';
      select.appendChild(mainOpt);
    }
    _mainZoneRows.forEach(function (z) {
      if (!z.name) return;
      const opt = document.createElement('option');
      opt.value = z.name;
      opt.textContent = z.name;
      select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
  }

  // ==================== হোম ড্যাশবোর্ড ====================
  function loadDashboardStats() {
    const loadingEl = document.getElementById('homeLoading');
    loadingEl.style.display = 'block';

    google.script.run
      .withSuccessHandler(function (res) {
        loadingEl.style.display = 'none';
        if (res.success) {
          const d = res.data;
          document.getElementById('stat-jonoshokti').textContent = toBnNumber(d.totalJonoshokti);
          document.getElementById('stat-rukon').textContent = toBnNumber(d.totalRukon);
          document.getElementById('stat-agroshor').textContent = toBnNumber(d.totalAgroshorKormi);
          document.getElementById('stat-kormi').textContent = toBnNumber(d.totalKormi);
          document.getElementById('stat-sohojogi').textContent = toBnNumber(d.totalSohojogi);
          document.getElementById('stat-wardshakha').textContent = toBnNumber(d.totalWardShakha);
          document.getElementById('stat-unit').textContent = toBnNumber(d.totalUnit);
          document.getElementById('stat-boi').textContent = toBnNumber(d.totalBoi);
        } else {
          showToast('পরিসংখ্যান লোড করতে সমস্যা হয়েছে', 'error');
        }
      })
      .withFailureHandler(function (err) {
        loadingEl.style.display = 'none';
        showToast('পরিসংখ্যান লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getDashboardStats();
  }

  // ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর
  function toBnNumber(num) {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, function (d) { return bnDigits[d]; });
  }

  // বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর (ইনপুট বক্সে বাংলা/ইংরেজি উভয় সংখ্যা যাতে কাজ করে)
  function toEnglishDigits(str) {
    if (str === null || str === undefined) return str;
    const bnDigits = '০১২৩৪৫৬৭৮৯';
    return String(str).replace(/[০-৯]/g, function (d) { return String(bnDigits.indexOf(d)); });
  }

  // সংখ্যা ইনপুট নিরাপদে parse করে (বাংলা/ইংরেজি উভয় সংখ্যা সাপোর্ট করে)
  function parseNum(str) {
    return parseFloat(toEnglishDigits(str)) || 0;
  }

  // ==================== আমাদের সম্পর্কে ====================
  function loadAboutUs() {
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          const d = res.data;
          document.getElementById('view-foundingDate').textContent = d.foundingDate || 'তথ্য যুক্ত করা হয়নি';
          document.getElementById('view-purpose').textContent = d.purpose || 'তথ্য যুক্ত করা হয়নি';
          document.getElementById('view-history').textContent = d.history || 'তথ্য যুক্ত করা হয়নি';

          document.getElementById('input-foundingDate').value = d.foundingDate || '';
          document.getElementById('input-purpose').value = d.purpose || '';
          document.getElementById('input-history').value = d.history || '';
        }
      })
      .withFailureHandler(function (err) {
        showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
      })
      .getAboutUs();
  }

  function bindAboutUsEvents() {
    document.getElementById('aboutEditBtn').addEventListener('click', function () {
      document.getElementById('aboutViewMode').style.display = 'none';
      document.getElementById('aboutEditMode').style.display = 'block';
    });

    document.getElementById('aboutCancelBtn').addEventListener('click', function () {
      document.getElementById('aboutEditMode').style.display = 'none';
      document.getElementById('aboutViewMode').style.display = 'block';
    });

    document.getElementById('aboutPrintBtn').addEventListener('click', function () {
      document.getElementById('aprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
      document.getElementById('aprint-foundingDate').textContent = document.getElementById('view-foundingDate').textContent || '—';
      document.getElementById('aprint-purpose').textContent = document.getElementById('view-purpose').textContent || '—';
      document.getElementById('aprint-history').textContent = document.getElementById('view-history').textContent || '—';
      printViaWindow('aboutPrintTemplate');
    });

    document.getElementById('aboutSaveBtn').addEventListener('click', function () {
      const formData = {
        foundingDate: document.getElementById('input-foundingDate').value,
        purpose: document.getElementById('input-purpose').value,
        history: document.getElementById('input-history').value
      };

      const btn = document.getElementById('aboutSaveBtn');
      btn.disabled = true;
      btn.textContent = 'সংরক্ষণ হচ্ছে...';

      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          btn.textContent = '💾 সংরক্ষণ করুন';
          if (res.success) {
            showToast(res.message, 'success');
            loadAboutUs();
            document.getElementById('aboutEditMode').style.display = 'none';
            document.getElementById('aboutViewMode').style.display = 'block';
          } else {
            showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + res.error, 'error');
          }
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          btn.textContent = '💾 সংরক্ষণ করুন';
          showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
        })
        .saveAboutUs(formData);
    });
  }

  // ==================== শাখা সেটাপ ====================

  // ==================== শাখা সেটাপ পেজের তথ্য প্রদর্শন (শাখা / কমিটি / অঞ্চল) ====================
  let _branchViewData = null;
  let _committeeSaved = [];

  function attrEsc_(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function renderBranchView_() {
    const el = document.getElementById('branchViewBody');
    const d = _branchViewData;
    if (!d || !(d.name || d.level || d.address || d.phone || d.email || d.logoUrl || d.symbolUrl)) {
      el.innerHTML = '<div class="no-result">এখনো শাখার তথ্য দেওয়া হয়নি</div>';
      return;
    }
    function row(label, val) {
      return '<tr><td class="info-label">' + label + '</td><td>' + val + '</td></tr>';
    }
    function img(url) {
      return url ? '<img class="info-img" src="' + attrEsc_(url) + '" alt="">' : '—';
    }
    el.innerHTML = '<table class="info-table"><tbody>' +
      row('শাখার নাম', escapeHtml(d.name || '—')) +
      row('মান', escapeHtml(d.level || '—')) +
      row('ঠিকানা', escapeHtml(d.address || '—')) +
      row('ফোন নম্বর', escapeHtml(d.phone || '—')) +
      row('ইমেইল', escapeHtml(d.email || '—')) +
      row('লোগো', img(d.logoUrl)) +
      row('প্রতীক', img(d.symbolUrl)) +
      '</tbody></table>';
  }

  function renderCommitteeView_() {
    const el = document.getElementById('committeeViewBody');
    const rows = (_committeeSaved || []).filter(function (r) { return r.name; });
    if (!rows.length) {
      el.innerHTML = '<div class="no-result">এখনো কমিটির তথ্য দেওয়া হয়নি</div>';
      return;
    }
    let html = '<div class="list-scroll"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>পদবি</th><th>নাম</th><th>মোবাইল নং</th></tr></thead><tbody>';
    rows.forEach(function (r, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(r.position || '—') + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.mobile || '—') + '</td></tr>';
    });
    el.innerHTML = html + '</tbody></table></div>';
  }

  function renderZoneView_() {
    const el = document.getElementById('zoneViewBody');
    const rows = (_mainZoneRows || []).filter(function (z) { return z.name; });
    if (!rows.length) {
      el.innerHTML = '<div class="no-result">এখনো অঞ্চলের তথ্য দেওয়া হয়নি</div>';
      return;
    }
    let html = '<div class="list-scroll"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>অঞ্চলের নাম</th><th>পরিচালকের নাম</th><th>মোবাইল</th><th>সহকারী পরিচালকের নাম</th><th>মোবাইল</th></tr></thead><tbody>';
    rows.forEach(function (z, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(z.name) + '</td><td>' + escapeHtml(z.directorName || '—') + '</td><td>' + escapeHtml(z.directorMobile || '—') + '</td><td>' + escapeHtml(z.assistantName || '—') + '</td><td>' + escapeHtml(z.assistantMobile || '—') + '</td></tr>';
    });
    el.innerHTML = html + '</tbody></table></div>';
  }

  function bindBranchListActions_() {
    // ---- শাখা তথ্য ----
    document.getElementById('bvEditBtn').addEventListener('click', function () {
      const d = _branchViewData || {};
      document.getElementById('branch-name').value = d.name || '';
      document.getElementById('branch-level').value = d.level || '';
      document.getElementById('branch-address').value = d.address || '';
      document.getElementById('branch-phone').value = d.phone || '';
      document.getElementById('branch-email').value = d.email || '';
      setFormCardOpen_('branchFormCard', 'branchFormToggleBtn', true, true);
    });
    document.getElementById('bvPrintBtn').addEventListener('click', function () {
      const d = _branchViewData;
      if (!d || !(d.name || d.level || d.address || d.phone || d.email)) { showToast('প্রিন্ট করার মতো কোনো তথ্য নেই', 'error'); return; }
      printOfficialList_('শাখা তথ্য', '', ['বিষয়', 'তথ্য'], [
        ['শাখার নাম', d.name || '—'], ['মান', d.level || '—'], ['ঠিকানা', d.address || '—'],
        ['ফোন নম্বর', d.phone || '—'], ['ইমেইল', d.email || '—']
      ], '');
    });
    document.getElementById('bvDeleteBtn').addEventListener('click', function () {
      const d = _branchViewData;
      if (!d || !(d.name || d.level || d.address || d.phone || d.email || d.logoUrl || d.symbolUrl)) { showToast('মুছে ফেলার মতো কোনো তথ্য নেই', 'error'); return; }
      if (!confirm('আপনি কি নিশ্চিত শাখার তথ্য মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
      const formData = { name: '', level: '', address: '', phone: '', email: '', logoUrl: '', symbolUrl: '', zones: (_mainZoneRows || []).filter(function (z) { return z.name; }) };
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast('শাখার তথ্য মুছে ফেলা হয়েছে', 'success');
            ['logoPreview', 'symbolPreview'].forEach(function (id) { const p = document.getElementById(id); p.src = ''; p.style.display = 'none'; });
            document.getElementById('branch-logo-file').value = '';
            document.getElementById('branch-symbol-file').value = '';
            _branchViewData = { name: '', level: '', address: '', phone: '', email: '', logoUrl: '', symbolUrl: '', zones: formData.zones };
            window._currentLogoUrl = ''; window._currentSymbolUrl = '';
            document.getElementById('branch-name').value = '';
            document.getElementById('branch-level').value = '';
            document.getElementById('branch-address').value = '';
            document.getElementById('branch-phone').value = '';
            document.getElementById('branch-email').value = '';
            renderBranchView_();
            loadBranchInfo();
          } else { showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error'); }
        })
        .withFailureHandler(function (err) { showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveBranchSetup(formData);
    });

    // ---- কমিটি তথ্য ----
    document.getElementById('cvEditBtn').addEventListener('click', function () {
      buildCommitteeRowsFromSaved_(_committeeSaved);
      renderCommitteeTable();
      setFormCardOpen_('committeeCard', 'committeeFormToggleBtn', true, true);
    });
    document.getElementById('cvPrintBtn').addEventListener('click', function () {
      const rows = (_committeeSaved || []).filter(function (r) { return r.name; });
      if (!rows.length) { showToast('প্রিন্ট করার মতো কোনো তথ্য নেই', 'error'); return; }
      printCommitteeForm(rows);
    });
    document.getElementById('cvDeleteBtn').addEventListener('click', function () {
      if (!(_committeeSaved || []).filter(function (r) { return r.name; }).length) { showToast('মুছে ফেলার মতো কোনো তথ্য নেই', 'error'); return; }
      if (!confirm('আপনি কি নিশ্চিত কমিটির পুরো তালিকা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast('কমিটির তথ্য মুছে ফেলা হয়েছে', 'success');
            _committeeSaved = [];
            buildCommitteeRowsFromSaved_([]);
            renderCommitteeTable();
            renderCommitteeView_();
          } else { showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error'); }
        })
        .withFailureHandler(function (err) { showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveCommittee([]);
    });

    // ---- অঞ্চল তথ্য ----
    document.getElementById('zvEditBtn').addEventListener('click', function () {
      document.getElementById('mainZoneCount').value = _mainZoneRows.length;
      renderMainZoneTable();
      setFormCardOpen_('mainZoneCard', 'zoneFormToggleBtn', true, true);
    });
    document.getElementById('zvPrintBtn').addEventListener('click', function () {
      const zones = (_mainZoneRows || []).filter(function (z) { return z.name; });
      if (!zones.length) { showToast('প্রিন্ট করার মতো কোনো তথ্য নেই', 'error'); return; }
      printOfficialList_('অঞ্চল তথ্য', '',
        ['ক্রম', 'অঞ্চলের নাম', 'পরিচালক', 'মোবাইল', 'সহকারী পরিচালক', 'মোবাইল'],
        zones.map(function (z, i) { return [toBnNumber(i + 1), z.name, z.directorName || '—', z.directorMobile || '—', z.assistantName || '—', z.assistantMobile || '—']; }), '');
    });
    document.getElementById('zvDeleteBtn').addEventListener('click', function () {
      if (!(_mainZoneRows || []).filter(function (z) { return z.name; }).length) { showToast('মুছে ফেলার মতো কোনো তথ্য নেই', 'error'); return; }
      if (!confirm('আপনি কি নিশ্চিত অঞ্চলের পুরো তথ্য মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
      const d = _branchViewData || {};
      const formData = { name: d.name || '', level: d.level || '', address: d.address || '', phone: d.phone || '', email: d.email || '', logoUrl: d.logoUrl || '', symbolUrl: d.symbolUrl || '', zones: [] };
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast('অঞ্চলের তথ্য মুছে ফেলা হয়েছে', 'success');
            _mainZoneRows = [];
            document.getElementById('mainZoneCount').value = 0;
            renderMainZoneTable();
            renderZoneView_();
            populateMemberZoneSelect();
          } else { showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error'); }
        })
        .withFailureHandler(function (err) { showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveBranchSetup(formData);
    });
  }

  function bindBranchSetupEvents() {
    bindBranchListActions_();
    document.getElementById('branch-logo-file').addEventListener('change', function (e) {
      handleImagePreview(e.target, 'logoPreview');
    });

    document.getElementById('branch-symbol-file').addEventListener('change', function (e) {
      handleImagePreview(e.target, 'symbolPreview');
    });

    document.getElementById('branchSaveBtn').addEventListener('click', saveBranchSetupForm);
  }

  function handleImagePreview(fileInput, previewId) {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById(previewId);
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function saveBranchSetupForm() {
    const btn = document.getElementById('branchSaveBtn');
    btn.disabled = true;
    btn.textContent = 'সংরক্ষণ হচ্ছে...';

    const baseData = {
      name: document.getElementById('branch-name').value,
      level: document.getElementById('branch-level').value,
      address: document.getElementById('branch-address').value,
      phone: document.getElementById('branch-phone').value,
      email: document.getElementById('branch-email').value,
      logoUrl: window._currentLogoUrl || '',
      symbolUrl: window._currentSymbolUrl || ''
    };

    const logoFile = document.getElementById('branch-logo-file').files[0];
    const symbolFile = document.getElementById('branch-symbol-file').files[0];

    const uploads = [];
    if (logoFile) uploads.push({ type: 'logo', file: logoFile });
    if (symbolFile) uploads.push({ type: 'symbol', file: symbolFile });

    if (uploads.length === 0) {
      finalizeBranchSave(baseData, btn);
      return;
    }

    let completed = 0;
    uploads.forEach(function (item) {
      const reader = new FileReader();
      reader.onload = function (e) {
        google.script.run
          .withSuccessHandler(function (res) {
            if (res.success) {
              if (item.type === 'logo') baseData.logoUrl = res.url;
              if (item.type === 'symbol') baseData.symbolUrl = res.url;
            } else {
              showToast('ছবি আপলোডে সমস্যা: ' + res.error, 'error');
            }
            completed++;
            if (completed === uploads.length) {
              finalizeBranchSave(baseData, btn);
            }
          })
          .withFailureHandler(function (err) {
            showToast('ছবি আপলোডে সমস্যা: ' + err.message, 'error');
            completed++;
            if (completed === uploads.length) {
              finalizeBranchSave(baseData, btn);
            }
          })
          .uploadImage(e.target.result, item.type);
      };
      reader.readAsDataURL(item.file);
    });
  }

  function finalizeBranchSave(formData, btn) {
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ করুন';
        if (res.success) {
          showToast(res.message, 'success');
          setFormCardOpen_('branchFormCard', 'branchFormToggleBtn', false, false);
          loadBranchInfo();
        } else {
          showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ করুন';
        showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveBranchSetup(formData);
  }

  // ==================== জনশক্তি: সদস্য ফরম ====================
  function bindMemberFormEvents() {
    // "➕ নতুন সদস্য" বাটন: বন্ধ থাকলে খালি ফরম খোলে, খোলা থাকলে ফরম বন্ধ করে
    document.getElementById('memberFormToggleBtn').addEventListener('click', function () {
      const card = document.getElementById('memberFormCard');
      if (card.style.display === 'block') {
        setFormCardOpen_('memberFormCard', 'memberFormToggleBtn', false, false);
      } else {
        clearMemberForm();
        setFormCardOpen_('memberFormCard', 'memberFormToggleBtn', true, true);
      }
    });

    // সকল সদস্য তালিকার সার্চ আইকন (ক্লিকে দেখায়, আবার ক্লিকে বন্ধ হয়) ও লাইভ সার্চ
    document.getElementById('memberListSearchBtn').addEventListener('click', function () {
      const box = document.getElementById('memberListSearchBox');
      const input = document.getElementById('memberListSearchInput');
      const willOpen = box.style.display !== 'block';
      box.style.display = willOpen ? 'block' : 'none';
      this.classList.toggle('is-open', willOpen);
      if (willOpen) { input.focus(); } else { input.value = ''; renderMemberList(); }
    });
    document.getElementById('memberListSearchInput').addEventListener('input', renderMemberList);
    document.getElementById('memberClearBtn').addEventListener('click', clearMemberForm);
    document.getElementById('memberSaveBtn').addEventListener('click', saveMemberForm);
    document.getElementById('memberEditBtn').addEventListener('click', enableMemberEdit);
    document.getElementById('memberDeleteBtn').addEventListener('click', deleteMemberForm);
    document.getElementById('memberPrintBtn').addEventListener('click', printMemberForm);
  }


  // ==================== সকল সদস্য তালিকা ====================
  let _memberAll = [];

  function loadMemberList() {
    const wrap = document.getElementById('memberListWrap');
    wrap.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) { wrap.innerHTML = '<div class="no-result">তালিকা লোড করতে সমস্যা হয়েছে</div>'; return; }
        _memberAll = res.data || [];
        renderMemberList();
      })
      .withFailureHandler(function (err) {
        wrap.innerHTML = '<div class="no-result">তালিকা লোড করতে সমস্যা হয়েছে: ' + escapeHtml(err.message) + '</div>';
      })
      .getAllMembers();
  }

  function renderMemberList() {
    const wrap = document.getElementById('memberListWrap');
    const countEl = document.getElementById('memberListCount');
    if (!_memberAll.length) {
      wrap.innerHTML = '<div class="no-result">এখনো কোনো সদস্য যোগ করা হয়নি</div>';
      countEl.textContent = '';
      return;
    }
    const q = (document.getElementById('memberListSearchInput').value || '').trim().toLowerCase();
    const shown = [];
    _memberAll.forEach(function (m, idx) {
      if (!q || String(m.name || '').toLowerCase().indexOf(q) !== -1 || String(m.mobile || '').toLowerCase().indexOf(q) !== -1) {
        shown.push({ m: m, idx: idx });
      }
    });
    countEl.textContent = q
      ? '(' + toBnNumber(shown.length) + ' জন / মোট ' + toBnNumber(_memberAll.length) + ' জন)'
      : '(মোট ' + toBnNumber(_memberAll.length) + ' জন)';
    if (!shown.length) {
      wrap.innerHTML = '<div class="no-result">কোনো সদস্য পাওয়া যায়নি</div>';
      return;
    }
    let html = '<div class="list-scroll compact"><table class="dhajjo-table"><thead><tr>' +
      '<th>ক্রম</th><th>নাম</th><th>মোবাইল</th><th>শাখা</th><th>মান</th><th>অঞ্চল</th><th>সদস্য হওয়ার তারিখ</th><th>পেশা</th><th>ঠিকানা</th><th></th>' +
      '</tr></thead><tbody>';
    shown.forEach(function (it, n) {
      const m = it.m;
      html += '<tr>' +
        '<td>' + toBnNumber(n + 1) + '</td>' +
        '<td>' + escapeHtml(m.name) + '</td>' +
        '<td>' + escapeHtml(m.mobile || '—') + '</td>' +
        '<td>' + escapeHtml(m.branch || '—') + '</td>' +
        '<td>' + escapeHtml(m.maan || '—') + '</td>' +
        '<td>' + escapeHtml(m.zone || '—') + '</td>' +
        '<td>' + escapeHtml(m.joinDate || '—') + '</td>' +
        '<td>' + escapeHtml(m.profession || '—') + '</td>' +
        '<td class="col-wrap">' + escapeHtml(m.address || '—') + '</td>' +
        '<td><button type="button" class="btn btn-outline btn-sm" data-idx="' + it.idx + '">👁️ দেখুন</button></td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
    wrap.querySelectorAll('button[data-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const m = _memberAll[parseInt(btn.getAttribute('data-idx'), 10)];
        if (!m) return;
        fillMemberForm(m);
        setFormCardOpen_('memberFormCard', 'memberFormToggleBtn', true, true);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function fillMemberForm(m) {
    document.getElementById('member-id').value = m.id;
    document.getElementById('member-name').value = m.name || '';
    document.getElementById('member-mobile').value = m.mobile || '';
    ensureAndSetBranchValue(m.branch || '');
    document.getElementById('member-maan').value = m.maan || '';
    document.getElementById('member-joinDate').value = toInputDate(m.joinDate);
    document.getElementById('member-profession').value = m.profession || '';
    document.getElementById('member-address').value = m.address || '';
    document.getElementById('member-zone').value = m.zone || '';

    setMemberFormMode('view');
  }

  function toInputDate(dateStr) {
    // "dd/MM/yyyy" থেকে "yyyy-MM-dd" ফরম্যাটে রূপান্তর (date input এর জন্য)
    if (!dateStr) return '';
    const parts = String(dateStr).split('/');
    if (parts.length === 3) {
      return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return dateStr;
  }

  function setMemberFormMode(mode) {
    const isNew = mode === 'new';
    const inputs = document.querySelectorAll('#memberForm input, #memberForm select, #memberForm textarea');
    inputs.forEach(function (el) { el.disabled = !isNew; });

    document.getElementById('memberSaveBtn').style.display = isNew ? 'inline-block' : 'none';
    document.getElementById('memberEditBtn').style.display = isNew ? 'none' : 'inline-block';
    document.getElementById('memberDeleteBtn').style.display = isNew ? 'none' : 'inline-block';
    document.getElementById('memberPrintActionWrap').style.display = isNew ? 'none' : 'block';
  }

  function enableMemberEdit() {
    const inputs = document.querySelectorAll('#memberForm input, #memberForm select, #memberForm textarea');
    inputs.forEach(function (el) { el.disabled = false; });
    document.getElementById('memberSaveBtn').style.display = 'inline-block';
    document.getElementById('memberEditBtn').style.display = 'none';
  }

  function clearMemberForm() {
    document.getElementById('memberForm').reset();
    document.getElementById('member-id').value = '';
    setMemberFormMode('new');
  }

  function saveMemberForm() {
    const formData = {
      id: document.getElementById('member-id').value,
      name: document.getElementById('member-name').value,
      mobile: document.getElementById('member-mobile').value,
      branch: document.getElementById('member-branch').value,
      maan: document.getElementById('member-maan').value,
      joinDate: formatDateForSheet(document.getElementById('member-joinDate').value),
      profession: document.getElementById('member-profession').value,
      address: document.getElementById('member-address').value,
      zone: document.getElementById('member-zone').value
    };

    if (!formData.name) {
      showToast('অনুগ্রহ করে নাম লিখুন', 'error');
      return;
    }

    const btn = document.getElementById('memberSaveBtn');
    btn.disabled = true;
    btn.textContent = 'সংরক্ষণ হচ্ছে...';

    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ';
        if (res.success) {
          showToast(res.message, 'success');
          document.getElementById('member-id').value = res.id;
          setMemberFormMode('view');
          loadDashboardStats();
          loadMemberList();
        } else {
          showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ';
        showToast('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveMember(formData);
  }

  function formatDateForSheet(inputDate) {
    // "yyyy-MM-dd" থেকে "dd/MM/yyyy" ফরম্যাটে রূপান্তর
    if (!inputDate) return '';
    const parts = inputDate.split('-');
    if (parts.length === 3) {
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return inputDate;
  }

  function deleteMemberForm() {
    const id = document.getElementById('member-id').value;
    if (!id) return;
    if (!confirm('আপনি কি নিশ্চিত এই সদস্যকে মুছে ফেলতে চান?')) return;

    const btn = document.getElementById('memberDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'মুছে ফেলা হচ্ছে...';

    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = '🗑️ ডিলেট';
        if (res.success) {
          showToast(res.message, 'success');
          clearMemberForm();
          setFormCardOpen_('memberFormCard', 'memberFormToggleBtn', false, false);
          loadDashboardStats();
          loadMemberList();
        } else {
          showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '🗑️ ডিলেট';
        showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .deleteMember(id);
  }

  function printMemberForm() {
    document.getElementById('print-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('print-name').textContent = document.getElementById('member-name').value || '—';
    document.getElementById('print-mobile').textContent = document.getElementById('member-mobile').value || '—';
    document.getElementById('print-branch').textContent = document.getElementById('member-branch').value || '—';
    document.getElementById('print-maan').textContent = document.getElementById('member-maan').value || '—';
    document.getElementById('print-joinDate').textContent = document.getElementById('member-joinDate').value || '—';
    document.getElementById('print-profession').textContent = document.getElementById('member-profession').value || '—';
    document.getElementById('print-address').textContent = document.getElementById('member-address').value || '—';

    printViaWindow('memberPrintTemplate');
  }

  // ==================== জনশক্তি: স্থানান্তর ফরম ====================
  let _transferSelectedMember = null;

  function bindSthanantorEvents() {
    document.getElementById('transferSearchBtn').addEventListener('click', doTransferSearch);
    document.getElementById('transferSearchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doTransferSearch(); }
    });
    document.getElementById('sthanantorSaveBtn').addEventListener('click', saveSthanantorForm);
    document.getElementById('sthanantorResetBtn').addEventListener('click', resetTransferForm);
    document.getElementById('sthanantorPrintBtn').addEventListener('click', printTransferForm);
  }

  function resetTransferForm() {
    _transferSelectedMember = null;
    document.getElementById('transferSearchInput').value = '';
    document.getElementById('transferSearchResults').innerHTML = '';
    document.getElementById('transferSelectedCard').style.display = 'none';
    document.getElementById('transferHistoryCard').style.display = 'none';
    document.getElementById('sthanantorForm').reset();
  }

  function printTransferForm() {
    document.getElementById('tprint-name').textContent = document.getElementById('t-view-name').textContent;
    document.getElementById('tprint-mobile').textContent = document.getElementById('t-view-mobile').textContent;
    document.getElementById('tprint-fromBranch').textContent = document.getElementById('t-view-branch').textContent;
    document.getElementById('tprint-toBranch').textContent = document.getElementById('sthanantor-toBranch').value || '—';
    document.getElementById('tprint-toBranchAddress').textContent = document.getElementById('sthanantor-toBranchAddress').value || '—';
    document.getElementById('tprint-date').textContent = document.getElementById('sthanantor-date').value || '—';

    printViaWindow('transferPrintTemplate');
  }

  function doTransferSearch() {
    const query = document.getElementById('transferSearchInput').value.trim();
    const resultsBox = document.getElementById('transferSearchResults');
    if (!query) {
      resultsBox.innerHTML = '<div class="no-result">নাম লিখে সার্চ করুন</div>';
      return;
    }
    resultsBox.innerHTML = '<div class="no-result">খোঁজা হচ্ছে...</div>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          renderGenericSearchResults(res.data, resultsBox, selectTransferMember);
        } else {
          resultsBox.innerHTML = '<div class="no-result">সার্চে সমস্যা হয়েছে</div>';
        }
      })
      .withFailureHandler(function (err) {
        resultsBox.innerHTML = '<div class="no-result">সার্চে সমস্যা হয়েছে: ' + err.message + '</div>';
      })
      .searchMembersByName(query);
  }

  function renderGenericSearchResults(members, resultsBox, onSelect) {
    if (!members.length) {
      resultsBox.innerHTML = '<div class="no-result">কোনো সদস্য পাওয়া যায়নি</div>';
      return;
    }
    resultsBox.innerHTML = '';
    members.forEach(function (m) {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML =
        '<div><div class="search-result-name">' + escapeHtml(m.name) + (m.maan ? '<span class="maan-badge">' + escapeHtml(m.maan) + '</span>' : '') + '</div>' +
        '<div class="search-result-meta">' + escapeHtml(m.branch || '') + ' • ' + escapeHtml(m.mobile || '') + '</div></div>' +
        '<div>▶</div>';
      item.addEventListener('click', function () { onSelect(m); });
      resultsBox.appendChild(item);
    });
  }

  function selectTransferMember(m) {
    _transferSelectedMember = m;
    document.getElementById('t-view-name').textContent = m.name || '—';
    document.getElementById('t-view-mobile').textContent = m.mobile || '—';
    document.getElementById('t-view-branch').textContent = m.branch || '—';
    document.getElementById('t-view-maan').textContent = m.maan || '—';
    document.getElementById('t-view-zone').textContent = m.zone || '—';
    document.getElementById('sthanantor-memberId').value = m.id;
    document.getElementById('transferSelectedCard').style.display = 'block';
    document.getElementById('sthanantorForm').reset();
    document.getElementById('sthanantor-memberId').value = m.id;
    document.getElementById('transferSearchResults').innerHTML = '';

    // ফরম আনলক করা (আগের কোনো স্থানান্তরের পর লক থাকলে)
    const inputs = document.querySelectorAll('#sthanantorForm input, #sthanantorForm textarea');
    inputs.forEach(function (el) { el.disabled = false; });
    const saveBtn = document.getElementById('sthanantorSaveBtn');
    saveBtn.style.display = 'inline-block';
    saveBtn.textContent = '💾 সংরক্ষণ';

    document.getElementById('transferHistoryCard').style.display = 'block';
    loadSthanantorList(m.id);
  }

  function saveSthanantorForm() {
    if (!_transferSelectedMember) {
      showToast('অনুগ্রহ করে প্রথমে সদস্য সার্চ করে নির্বাচন করুন', 'error');
      return;
    }
    const formData = {
      memberId: _transferSelectedMember.id,
      memberName: _transferSelectedMember.name,
      mobile: _transferSelectedMember.mobile,
      fromBranch: _transferSelectedMember.branch,
      fromMaan: _transferSelectedMember.maan,
      fromZone: _transferSelectedMember.zone,
      toBranch: document.getElementById('sthanantor-toBranch').value,
      toBranchAddress: document.getElementById('sthanantor-toBranchAddress').value,
      transferDate: formatDateForSheet(document.getElementById('sthanantor-date').value)
    };
    if (!formData.toBranch) {
      showToast('অনুগ্রহ করে নতুন শাখার নাম লিখুন', 'error');
      return;
    }
    if (!confirm('নিশ্চিত করুন: "' + formData.memberName + '" কে "' + formData.toBranch + '" শাখায় স্থানান্তর করা হবে এবং জনশক্তি তালিকা থেকে মুছে ফেলা হবে। এগিয়ে যাবেন?')) {
      return;
    }
    const btn = document.getElementById('sthanantorSaveBtn');
    btn.disabled = true;
    btn.textContent = 'সংরক্ষণ হচ্ছে...';
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ';
        if (res.success) {
          showToast(res.message, 'success');
          loadTransferredList();
          loadSthanantorList(_transferSelectedMember.id);
          // সদস্য এখন জনশক্তি শীট থেকে মুছে গেছে, তাই ফরম লক করা হচ্ছে
          lockTransferForm();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '💾 সংরক্ষণ';
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveSthanantor(formData);
  }

  function lockTransferForm() {
    const inputs = document.querySelectorAll('#sthanantorForm input, #sthanantorForm textarea');
    inputs.forEach(function (el) { el.disabled = true; });
    document.getElementById('sthanantorSaveBtn').style.display = 'none';
    _transferSelectedMember = null;
  }

  function loadSthanantorList(memberId) {
    const box = document.getElementById('sthanantorList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success || !res.data.length) {
          box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
          return;
        }
        box.innerHTML = '';
        res.data.slice().reverse().forEach(function (t) {
          const div = document.createElement('div');
          div.className = 'simple-list-item';
          div.innerHTML =
            '<span><b>পূর্বের শাখা:</b> ' + escapeHtml(t.fromBranch) + '</span>' +
            '<span><b>নতুন শাখা:</b> ' + escapeHtml(t.toBranch) + '</span>' +
            '<span><b>নতুন ঠিকানা:</b> ' + escapeHtml(t.toBranchAddress) + '</span>' +
            '<span><b>তারিখ:</b> ' + escapeHtml(t.transferDate) + '</span>';
          box.appendChild(div);
        });
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getSthanantorByMember(memberId);
  }

  // ==================== জনশক্তি: ধার্য্য ফরম (খাত-ভিত্তিক টেবিল) ====================
  let _dhajjoSelectedMember = null;
  let _dhajjoCurrentItems = [];
  let _dhajjoRecordId = '';

  const DHAJJO_DEFAULT_ITEMS = [
    { name: 'এয়ানত', amount: '', date: '' },
    { name: 'এককালীন', amount: '', date: '' },
    { name: 'নির্বাচনী ওয়াদা', amount: '', date: '' },
    { name: 'যাকাত', amount: '', date: '' }
  ];

  function bindDhajjoEvents() {
    document.getElementById('dhajjoSearchBtn').addEventListener('click', doDhajjoSearch);
    document.getElementById('dhajjoSearchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doDhajjoSearch(); }
    });

    document.getElementById('dhajjo-year').addEventListener('change', function () {
      if (_dhajjoSelectedMember) loadDhajjoYearRecord();
    });

    document.getElementById('dhajjoAddRowBtn').addEventListener('click', function () {
      addDhajjoRow({ name: '', amount: '', date: '' });
    });

    document.getElementById('dhajjoSaveBtn').addEventListener('click', function () { submitDhajjoForm('সংরক্ষণ'); });
    document.getElementById('dhajjoUpdateBtn').addEventListener('click', function () { submitDhajjoForm('আপডেট'); });
    document.getElementById('dhajjoResetBtn').addEventListener('click', resetDhajjoForm);
    document.getElementById('dhajjoCloseBtn').addEventListener('click', function () {
      _dhajjoSelectedMember = null;
      document.getElementById('dhajjoSelectedCard').style.display = 'none';
      document.getElementById('dhajjoHistoryCard').style.display = 'none';
      document.getElementById('dhajjoSearchResults').innerHTML = '';
      document.getElementById('dhajjoSearchInput').value = '';
    });
    document.getElementById('dhajjoPrintBtn').addEventListener('click', printDhajjoForm);
  }

  function doDhajjoSearch() {
    const query = document.getElementById('dhajjoSearchInput').value.trim();
    const resultsBox = document.getElementById('dhajjoSearchResults');
    if (!query) {
      resultsBox.innerHTML = '<div class="no-result">নাম লিখে সার্চ করুন</div>';
      return;
    }
    resultsBox.innerHTML = '<div class="no-result">খোঁজা হচ্ছে...</div>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          renderGenericSearchResults(res.data, resultsBox, selectDhajjoMember);
        } else {
          resultsBox.innerHTML = '<div class="no-result">সার্চে সমস্যা হয়েছে</div>';
        }
      })
      .withFailureHandler(function (err) {
        resultsBox.innerHTML = '<div class="no-result">সার্চে সমস্যা হয়েছে: ' + err.message + '</div>';
      })
      .searchMembersByName(query);
  }

  function selectDhajjoMember(m) {
    _dhajjoSelectedMember = m;
    document.getElementById('d-view-name').textContent = m.name || '—';
    document.getElementById('d-view-mobile').textContent = m.mobile || '—';
    document.getElementById('d-view-branch').textContent = m.branch || '—';
    document.getElementById('d-view-maan').textContent = m.maan || '—';
    document.getElementById('dhajjoSelectedCard').style.display = 'block';
    document.getElementById('dhajjoSearchResults').innerHTML = '';

    if (!document.getElementById('dhajjo-year').value) {
      document.getElementById('dhajjo-year').value = new Date().getFullYear();
    }

    document.getElementById('dhajjoHistoryCard').style.display = 'block';
    loadDhajjoYearRecord();
    loadDhajjoYearSummary();
  }

  function loadDhajjoYearRecord() {
    if (!_dhajjoSelectedMember) return;
    const year = document.getElementById('dhajjo-year').value;
    const loadingEl = document.getElementById('dhajjoYearLoading');
    loadingEl.style.display = 'inline';

    google.script.run
      .withSuccessHandler(function (res) {
        loadingEl.style.display = 'none';
        if (!res.success) {
          showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
          return;
        }
        _dhajjoRecordId = res.data.id || '';
        _dhajjoCurrentItems = res.data.items && res.data.items.length ? res.data.items : JSON.parse(JSON.stringify(DHAJJO_DEFAULT_ITEMS));
        renderDhajjoTable();
      })
      .withFailureHandler(function (err) {
        loadingEl.style.display = 'none';
        showToast('তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getDhajjoRecord(_dhajjoSelectedMember.id, _dhajjoSelectedMember.name, _dhajjoSelectedMember.branch, year);
  }

  function renderDhajjoTable() {
    const body = document.getElementById('dhajjoItemsBody');
    body.innerHTML = '';
    _dhajjoCurrentItems.forEach(function (item, idx) {
      body.appendChild(buildDhajjoRow(item, idx));
    });
  }

  function buildDhajjoRow(item, idx) {
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;

    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'খাতের নাম');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'খাতের নাম';
    nameInput.value = item.name || '';
    nameInput.addEventListener('input', function () { _dhajjoCurrentItems[idx].name = this.value; });
    nameTd.appendChild(nameInput);

    const amountTd = document.createElement('td');
    amountTd.setAttribute('data-label', 'পরিমাণ (৳)');
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.className = 'amount-input';
    amountInput.placeholder = 'পরিমাণ';
    amountInput.value = item.amount || '';
    amountInput.addEventListener('input', function () { _dhajjoCurrentItems[idx].amount = this.value; });
    amountTd.appendChild(amountInput);

    const dateTd = document.createElement('td');
    dateTd.setAttribute('data-label', 'তারিখ');
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = toInputDate(formatDateForDisplay_(item.date));
    dateInput.addEventListener('input', function () { _dhajjoCurrentItems[idx].date = formatDateForSheet(this.value); });
    dateTd.appendChild(dateInput);

    const actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', '');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', function () {
      _dhajjoCurrentItems.splice(idx, 1);
      renderDhajjoTable();
    });
    actionTd.appendChild(removeBtn);

    tr.appendChild(nameTd);
    tr.appendChild(amountTd);
    tr.appendChild(dateTd);
    tr.appendChild(actionTd);
    return tr;
  }

  // dd/MM/yyyy ইনপুট হিসেবে ইতিমধ্যে থাকলে তা date input এর জন্য উপযুক্ত ফরম্যাটে রূপান্তর দরকার নেই যদি ফাঁকা থাকে
  function formatDateForDisplay_(dateStr) {
    return dateStr || '';
  }

  function addDhajjoRow(item) {
    _dhajjoCurrentItems.push(item);
    renderDhajjoTable();
  }

  function submitDhajjoForm(actionLabel) {
    if (!_dhajjoSelectedMember) {
      showToast('অনুগ্রহ করে প্রথমে সদস্য সার্চ করে নির্বাচন করুন', 'error');
      return;
    }
    const year = document.getElementById('dhajjo-year').value;
    if (!year) {
      showToast('অনুগ্রহ করে বছর লিখুন', 'error');
      return;
    }

    const formData = {
      memberId: _dhajjoSelectedMember.id,
      memberName: _dhajjoSelectedMember.name,
      branch: _dhajjoSelectedMember.branch,
      year: year,
      items: _dhajjoCurrentItems
    };

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadDhajjoYearRecord();
          loadDhajjoYearSummary();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveDhajjoRecord(formData);
  }

  function resetDhajjoForm() {
    _dhajjoCurrentItems = JSON.parse(JSON.stringify(DHAJJO_DEFAULT_ITEMS));
    renderDhajjoTable();
  }

  function printDhajjoForm() {
    document.getElementById('dprint-name').textContent = _dhajjoSelectedMember ? _dhajjoSelectedMember.name : '—';
    document.getElementById('dprint-branch').textContent = _dhajjoSelectedMember ? (_dhajjoSelectedMember.branch || '—') : '—';
    document.getElementById('dprint-year').textContent = document.getElementById('dhajjo-year').value || '';

    const table = document.getElementById('dprint-table');
    table.innerHTML = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td><td class="p-label">তারিখ</td></tr>';
    _dhajjoCurrentItems.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td>৳' + escapeHtml(String(item.amount || 0)) + '</td>' +
        '<td>' + escapeHtml(item.date || '—') + '</td>';
      table.appendChild(tr);
    });

    printViaWindow('dhajjoPrintTemplate');
  }

  function loadDhajjoYearSummary() {
    if (!_dhajjoSelectedMember) return;
    const box = document.getElementById('dhajjoYearSummaryList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success || !res.data.length) {
          box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
          return;
        }
        box.innerHTML = '';
        res.data.forEach(function (rec) {
          const total = (rec.items || []).reduce(function (sum, it) { return sum + (parseFloat(it.amount) || 0); }, 0);
          const div = document.createElement('div');
          div.className = 'year-summary-item';
          div.innerHTML =
            '<span class="ys-year">' + escapeHtml(String(rec.year)) + '</span>' +
            '<span>' + (rec.items || []).length + 'টি খাত</span>' +
            '<span class="ys-total">মোট: ৳' + escapeHtml(String(total)) + '</span>';
          box.appendChild(div);
        });
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getDhajjoByMember(_dhajjoSelectedMember.id);
  }

  // ==================== শাখা সেটাপ: কমিটি তথ্য ====================
  let _rukonList = [];
  let _committeeRows = []; // { position, memberId, name, mobile, removable }

  function initCommittee() {
    google.script.run
      .withSuccessHandler(function (rukonRes) {
        _rukonList = rukonRes.success ? rukonRes.data : [];
        google.script.run
          .withSuccessHandler(function (res) {
            if (!res.success) {
              showToast('কমিটির তথ্য লোড করতে সমস্যা হয়েছে', 'error');
              return;
            }
            buildCommitteeRowsFromSaved_(res.data);
            renderCommitteeTable();
            _committeeSaved = res.data || [];
            renderCommitteeView_();
          })
          .withFailureHandler(function (err) {
            showToast('কমিটির তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
          })
          .getCommittee();
      })
      .withFailureHandler(function (err) {
        showToast('রুকনদের তালিকা লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getRukonList();

    document.getElementById('committeeAddRowBtn').addEventListener('click', function () {
      _committeeRows.push({ position: '', memberId: '', name: '', mobile: '', removable: true });
      renderCommitteeTable();
    });
    document.getElementById('committeeSaveBtn').addEventListener('click', function () { submitCommitteeForm('সংরক্ষণ'); });
    document.getElementById('committeeUpdateBtn').addEventListener('click', function () { submitCommitteeForm('আপডেট'); });
    document.getElementById('committeeResetBtn').addEventListener('click', resetCommitteeForm);
    document.getElementById('committeePrintBtn').addEventListener('click', function () { printCommitteeForm(); });
  }

  const COMMITTEE_STANDARD_POSITIONS = [
    'আমীর / সভাপতি', 'নায়েবে আমীর / সহ-সভাপতি', 'সেক্রেটারী', 'সহকারী সেক্রেটারী',
    'বায়তুলমাল সেক্রেটারী', 'অফিস সম্পাদক', 'প্রকাশনা সম্পাদক', 'সংস্কৃতি সম্পাদক',
    'তালিমুল কুরআন পরিচালক', 'মিডিয়া সম্পাদক', 'যুব সম্পাদক'
  ];
  const COMMITTEE_MULTI_POSITIONS = ['নায়েবে আমীর / সহ-সভাপতি', 'সহকারী সেক্রেটারী'];

  function buildCommitteeRowsFromSaved_(savedItems) {
    if (savedItems && savedItems.length) {
      _committeeRows = savedItems.map(function (it) {
        return {
          position: it.position, memberId: it.memberId, name: it.name, mobile: it.mobile,
          removable: COMMITTEE_STANDARD_POSITIONS.indexOf(it.position) === -1
        };
      });
      // নিশ্চিত করা যে সব স্ট্যান্ডার্ড পদবি অন্তত একবার আছে
      COMMITTEE_STANDARD_POSITIONS.forEach(function (pos) {
        const exists = _committeeRows.some(function (r) { return r.position === pos; });
        if (!exists) {
          _committeeRows.push({ position: pos, memberId: '', name: '', mobile: '', removable: false });
        }
      });
      // ক্রম ঠিক রাখা: স্ট্যান্ডার্ড পদবি অনুযায়ী সাজানো, কাস্টম পদবি শেষে
      _committeeRows.sort(function (a, b) {
        const ai = COMMITTEE_STANDARD_POSITIONS.indexOf(a.position);
        const bi = COMMITTEE_STANDARD_POSITIONS.indexOf(b.position);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    } else {
      _committeeRows = COMMITTEE_STANDARD_POSITIONS.map(function (pos) {
        return { position: pos, memberId: '', name: '', mobile: '', removable: false };
      });
    }
  }

  function renderCommitteeTable() {
    const body = document.getElementById('committeeBody');
    body.innerHTML = '';
    _committeeRows.forEach(function (row, idx) {
      body.appendChild(buildCommitteeRow(row, idx));
    });
  }

  function buildCommitteeRow(row, idx) {
    const tr = document.createElement('tr');

    const posTd = document.createElement('td');
    posTd.setAttribute('data-label', 'পদবি');
    const posInput = document.createElement('input');
    posInput.type = 'text';
    posInput.placeholder = 'পদবির নাম লিখুন';
    posInput.value = row.position || '';
    posInput.addEventListener('input', function () { _committeeRows[idx].position = this.value; });
    posTd.appendChild(posInput);

    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'নাম');
    const select = document.createElement('select');
    const blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = 'নির্বাচন করুন';
    select.appendChild(blankOpt);
    _rukonList.forEach(function (r) {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      if (String(r.id) === String(row.memberId)) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', function () {
      const selectedId = this.value;
      const rukon = _rukonList.find(function (r) { return String(r.id) === String(selectedId); });
      _committeeRows[idx].memberId = selectedId;
      _committeeRows[idx].name = rukon ? rukon.name : '';
      _committeeRows[idx].mobile = rukon ? rukon.mobile : '';
      renderCommitteeTable();
    });
    nameTd.appendChild(select);

    const mobileTd = document.createElement('td');
    mobileTd.setAttribute('data-label', 'মোবাইল নং');
    mobileTd.textContent = row.mobile || '—';

    const actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', '');
    if (row.removable || COMMITTEE_MULTI_POSITIONS.indexOf(row.position) !== -1) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _committeeRows.splice(idx, 1);
        renderCommitteeTable();
      });
      actionTd.appendChild(removeBtn);
    }
    if (COMMITTEE_MULTI_POSITIONS.indexOf(row.position) !== -1) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-outline btn-sm';
      addBtn.textContent = '➕';
      addBtn.title = 'আরেকজন ' + row.position + ' যোগ করুন';
      addBtn.style.marginLeft = '6px';
      addBtn.addEventListener('click', function () {
        _committeeRows.splice(idx + 1, 0, { position: row.position, memberId: '', name: '', mobile: '', removable: true });
        renderCommitteeTable();
      });
      actionTd.appendChild(addBtn);
    }

    tr.appendChild(posTd);
    tr.appendChild(nameTd);
    tr.appendChild(mobileTd);
    tr.appendChild(actionTd);
    return tr;
  }

  function submitCommitteeForm(actionLabel) {
    const items = _committeeRows.filter(function (r) { return r.position && r.name; });
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          _committeeSaved = items.slice();
          renderCommitteeView_();
          setFormCardOpen_('committeeCard', 'committeeFormToggleBtn', false, false);
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveCommittee(items);
  }

  function resetCommitteeForm() {
    _committeeRows = COMMITTEE_STANDARD_POSITIONS.map(function (pos) {
      return { position: pos, memberId: '', name: '', mobile: '', removable: false };
    });
    renderCommitteeTable();
  }

  function printCommitteeForm(rows) {
    const src = Array.isArray(rows) ? rows : _committeeRows;
    const table = document.getElementById('cprint-table');
    table.innerHTML = '<tr><td class="p-label">পদবি</td><td class="p-label">নাম</td><td class="p-label">মোবাইল</td></tr>';
    src.filter(function (r) { return r.position && r.name; }).forEach(function (row) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(row.position) + '</td>' +
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td>' + escapeHtml(row.mobile || '—') + '</td>';
      table.appendChild(tr);
    });

    printViaWindow('committeePrintTemplate');
  }

  // ==================== উপশাখা সেটাপ ====================
  let _officerList = [];
  let _upashakhaId = '';
  let _amirOfficer = { memberId: '', name: '', mobile: '' };
  let _secretaryOfficer = { memberId: '', name: '', mobile: '' };
  let _nayebeAmirRows = [];
  let _assistantSecRows = [];
  let _zoneRows = [];

  function initUpashakhaSetup() {
    google.script.run
      .withSuccessHandler(function (res) {
        _officerList = res.success ? res.data : [];
        renderOfficerTable();
      })
      .withFailureHandler(function () { /* নীরবে ব্যর্থ */ })
      .getOfficerNameList();

    document.getElementById('upashakha-zoneCount').addEventListener('input', function () {
      const count = parseInt(this.value, 10) || 0;
      while (_zoneRows.length < count) _zoneRows.push({ name: '', directorId: '', directorName: '', directorMobile: '' });
      while (_zoneRows.length > count) _zoneRows.pop();
      renderZoneRows();
    });

    document.getElementById('upashakha-select-picker').addEventListener('change', function () {
      if (this.value) {
        loadUpashakhaForEdit(this.value);
      } else {
        resetUpashakhaForm();
      }
    });

    document.getElementById('upashakhaSaveBtn').addEventListener('click', function () { submitUpashakhaForm('সংরক্ষণ'); });
    document.getElementById('upashakhaUpdateBtn').addEventListener('click', function () { submitUpashakhaForm('আপডেট'); });
    document.getElementById('upashakhaDeleteBtn').addEventListener('click', deleteUpashakhaForm);
    document.getElementById('upashakhaResetBtn').addEventListener('click', resetUpashakhaForm);
    document.getElementById('upashakhaPrintBtn').addEventListener('click', printUpashakhaForm);
  }

  function populateUpashakhaSetupPicker() {
    const select = document.getElementById('upashakha-select-picker');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _upashakhaList.forEach(function (u) {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name + (u.level ? ' (' + u.level + ')' : '');
      select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
  }

  function buildOfficerSelectCell(officerObj, onChange) {
    const td = document.createElement('td');
    td.setAttribute('data-label', 'নাম');
    const select = document.createElement('select');
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _officerList.forEach(function (o) {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.name;
      if (String(o.id) === String(officerObj.memberId)) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', function () {
      const selectedId = this.value;
      const o = _officerList.find(function (x) { return String(x.id) === String(selectedId); });
      onChange(selectedId, o);
    });
    td.appendChild(select);
    return td;
  }

  function renderOfficerTable() {
    const body = document.getElementById('upashakha-officer-body');
    body.innerHTML = '';

    // ---- আমীর / সভাপতি (fixed) + নায়েবে আমীর যোগ করার বাটন ----
    const amirTr = document.createElement('tr');
    const amirLabelTd = document.createElement('td');
    amirLabelTd.className = 'khat-name';
    amirLabelTd.setAttribute('data-label', 'পদবি');
    amirLabelTd.textContent = 'আমীর / সভাপতি';
    amirTr.appendChild(amirLabelTd);
    amirTr.appendChild(buildOfficerSelectCell(_amirOfficer, function (id, o) {
      _amirOfficer.memberId = id;
      _amirOfficer.name = o ? o.name : '';
      _amirOfficer.mobile = o ? o.mobile : '';
      renderOfficerTable();
    }));
    const amirMobileTd = document.createElement('td');
    amirMobileTd.setAttribute('data-label', 'মোবাইল');
    amirMobileTd.textContent = _amirOfficer.mobile || '—';
    amirTr.appendChild(amirMobileTd);
    const amirActionTd = document.createElement('td');
    amirActionTd.setAttribute('data-label', '');
    const addNayebeBtn = document.createElement('button');
    addNayebeBtn.type = 'button';
    addNayebeBtn.className = 'btn btn-outline btn-sm';
    addNayebeBtn.textContent = '➕ নায়েবে আমীর';
    addNayebeBtn.title = 'নায়েবে আমীর / সহ-সভাপতি যোগ করুন';
    addNayebeBtn.addEventListener('click', function () {
      _nayebeAmirRows.push({ memberId: '', name: '', mobile: '' });
      renderOfficerTable();
    });
    amirActionTd.appendChild(addNayebeBtn);
    amirTr.appendChild(amirActionTd);
    body.appendChild(amirTr);

    // ---- নায়েবে আমীর / সহ-সভাপতি (dynamic) ----
    _nayebeAmirRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');
      const labelTd = document.createElement('td');
      labelTd.className = 'khat-name';
      labelTd.setAttribute('data-label', 'পদবি');
      labelTd.innerHTML = 'নায়েবে আমীর / সহ-সভাপতি<span class="khat-sub"></span>';
      tr.appendChild(labelTd);
      tr.appendChild(buildOfficerSelectCell(row, function (id, o) {
        _nayebeAmirRows[idx].memberId = id;
        _nayebeAmirRows[idx].name = o ? o.name : '';
        _nayebeAmirRows[idx].mobile = o ? o.mobile : '';
        renderOfficerTable();
      }));
      const mobileTd = document.createElement('td');
      mobileTd.setAttribute('data-label', 'মোবাইল');
      mobileTd.textContent = row.mobile || '—';
      tr.appendChild(mobileTd);
      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _nayebeAmirRows.splice(idx, 1);
        renderOfficerTable();
      });
      actionTd.appendChild(removeBtn);
      tr.appendChild(actionTd);
      body.appendChild(tr);
    });

    // ---- সেক্রেটারী (fixed) + সহকারী সেক্রেটারী যোগ করার বাটন ----
    const secTr = document.createElement('tr');
    const secLabelTd = document.createElement('td');
    secLabelTd.className = 'khat-name';
    secLabelTd.setAttribute('data-label', 'পদবি');
    secLabelTd.textContent = 'সেক্রেটারী';
    secTr.appendChild(secLabelTd);
    secTr.appendChild(buildOfficerSelectCell(_secretaryOfficer, function (id, o) {
      _secretaryOfficer.memberId = id;
      _secretaryOfficer.name = o ? o.name : '';
      _secretaryOfficer.mobile = o ? o.mobile : '';
      renderOfficerTable();
    }));
    const secMobileTd = document.createElement('td');
    secMobileTd.setAttribute('data-label', 'মোবাইল');
    secMobileTd.textContent = _secretaryOfficer.mobile || '—';
    secTr.appendChild(secMobileTd);
    const secActionTd = document.createElement('td');
    secActionTd.setAttribute('data-label', '');
    const addAssistantBtn = document.createElement('button');
    addAssistantBtn.type = 'button';
    addAssistantBtn.className = 'btn btn-outline btn-sm';
    addAssistantBtn.textContent = '➕ সহকারী সেক্রেটারী';
    addAssistantBtn.title = 'সহকারী সেক্রেটারী যোগ করুন';
    addAssistantBtn.addEventListener('click', function () {
      _assistantSecRows.push({ memberId: '', name: '', mobile: '' });
      renderOfficerTable();
    });
    secActionTd.appendChild(addAssistantBtn);
    secTr.appendChild(secActionTd);
    body.appendChild(secTr);

    // ---- সহকারী সেক্রেটারী (dynamic) ----
    _assistantSecRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');
      const labelTd = document.createElement('td');
      labelTd.className = 'khat-name';
      labelTd.setAttribute('data-label', 'পদবি');
      labelTd.textContent = 'সহকারী সেক্রেটারী';
      tr.appendChild(labelTd);
      tr.appendChild(buildOfficerSelectCell(row, function (id, o) {
        _assistantSecRows[idx].memberId = id;
        _assistantSecRows[idx].name = o ? o.name : '';
        _assistantSecRows[idx].mobile = o ? o.mobile : '';
        renderOfficerTable();
      }));
      const mobileTd = document.createElement('td');
      mobileTd.setAttribute('data-label', 'মোবাইল');
      mobileTd.textContent = row.mobile || '—';
      tr.appendChild(mobileTd);
      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _assistantSecRows.splice(idx, 1);
        renderOfficerTable();
      });
      actionTd.appendChild(removeBtn);
      tr.appendChild(actionTd);
      body.appendChild(tr);
    });
  }

  function renderZoneRows() {
    const body = document.getElementById('upashakha-zones-body');
    body.innerHTML = '';
    _zoneRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.setAttribute('data-label', 'অঞ্চলের নাম');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'অঞ্চলের নাম';
      nameInput.value = row.name || '';
      nameInput.addEventListener('input', function () { _zoneRows[idx].name = this.value; });
      nameTd.appendChild(nameInput);

      const directorTd = document.createElement('td');
      directorTd.setAttribute('data-label', 'পরিচালকের নাম');
      const select = document.createElement('select');
      select.innerHTML = '<option value="">নির্বাচন করুন</option>';
      _officerList.forEach(function (o) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.name;
        if (String(o.id) === String(row.directorId)) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', function () {
        const selectedId = this.value;
        const o = _officerList.find(function (x) { return String(x.id) === String(selectedId); });
        _zoneRows[idx].directorId = selectedId;
        _zoneRows[idx].directorName = o ? o.name : '';
        _zoneRows[idx].directorMobile = o ? o.mobile : '';
        renderZoneRows();
      });
      directorTd.appendChild(select);

      const mobileTd = document.createElement('td');
      mobileTd.setAttribute('data-label', 'মোবাইল');
      mobileTd.textContent = row.directorMobile || '—';

      const blankTd = document.createElement('td');
      blankTd.setAttribute('data-label', '');

      tr.appendChild(nameTd);
      tr.appendChild(directorTd);
      tr.appendChild(mobileTd);
      tr.appendChild(blankTd);
      body.appendChild(tr);
    });
  }

  function loadUpashakhaForEdit(id) {
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
          return;
        }
        const d = res.data;
        _upashakhaId = d.id;
        document.getElementById('upashakha-name').value = d.name || '';
        document.getElementById('upashakha-level').value = d.level || '';
        document.getElementById('upashakha-select-picker').value = d.id;

        const details = d.details || {};
        _amirOfficer = details.amir ? { memberId: details.amir.memberId, name: details.amir.name, mobile: details.amir.mobile } : { memberId: '', name: '', mobile: '' };
        _secretaryOfficer = details.secretary ? { memberId: details.secretary.memberId, name: details.secretary.name, mobile: details.secretary.mobile } : { memberId: '', name: '', mobile: '' };
        _nayebeAmirRows = details.nayebeAmirs || [];
        _assistantSecRows = details.assistantSecretaries || [];
        _zoneRows = details.zones || [];
        renderOfficerTable();
        document.getElementById('upashakha-zoneCount').value = _zoneRows.length;
        renderZoneRows();

        showToast('উপশাখার তথ্য লোড করা হয়েছে', 'success');
      })
      .withFailureHandler(function (err) {
        showToast('তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getUpashakhaById(id);
  }

  function collectUpashakhaFormData() {
    return {
      id: _upashakhaId,
      name: document.getElementById('upashakha-name').value,
      level: document.getElementById('upashakha-level').value,
      details: {
        amir: _amirOfficer,
        secretary: _secretaryOfficer,
        nayebeAmirs: _nayebeAmirRows.filter(function (r) { return r.name; }),
        assistantSecretaries: _assistantSecRows.filter(function (r) { return r.name; }),
        zones: _zoneRows.filter(function (r) { return r.name; })
      }
    };
  }

  function submitUpashakhaForm(actionLabel) {
    if (!_upashakhaId) {
      showToast('অনুগ্রহ করে উপরে থেকে একটি উপশাখা নির্বাচন করুন (নতুন উপশাখা যোগ করতে "উপশাখা এন্ট্রি" ফরম ব্যবহার করুন)', 'error');
      return;
    }
    const formData = collectUpashakhaFormData();
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          _upashakhaId = res.id;
          loadUpashakhaListForSelects();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveUpashakha(formData);
  }

  function deleteUpashakhaForm() {
    if (!_upashakhaId) {
      showToast('মুছে ফেলার জন্য প্রথমে একটি উপশাখা নির্বাচন করুন', 'error');
      return;
    }
    if (!confirm('আপনি কি নিশ্চিত এই উপশাখাকে মুছে ফেলতে চান?')) return;

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          resetUpashakhaForm();
          loadUpashakhaListForSelects();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .deleteUpashakha(_upashakhaId);
  }

  function resetUpashakhaForm() {
    _upashakhaId = '';
    document.getElementById('upashakha-select-picker').value = '';
    document.getElementById('upashakha-name').value = '';
    document.getElementById('upashakha-level').value = '';
    _amirOfficer = { memberId: '', name: '', mobile: '' };
    _secretaryOfficer = { memberId: '', name: '', mobile: '' };
    _nayebeAmirRows = [];
    _assistantSecRows = [];
    _zoneRows = [];
    renderOfficerTable();
    document.getElementById('upashakha-zoneCount').value = 0;
    renderZoneRows();
  }

  function printUpashakhaForm() {
    const formData = collectUpashakhaFormData();
    const table = document.getElementById('uprint-table');
    let rows = '<tr><td class="p-label">উপশাখার নাম</td><td>' + escapeHtml(formData.name) + '</td></tr>';
    rows += '<tr><td class="p-label">মান</td><td>' + escapeHtml(formData.level || '—') + '</td></tr>';
    rows += '<tr><td class="p-label">আমীর / সভাপতি</td><td>' + escapeHtml(formData.details.amir.name || '—') + ' (' + escapeHtml(formData.details.amir.mobile || '—') + ')</td></tr>';
    formData.details.nayebeAmirs.forEach(function (r) {
      rows += '<tr><td class="p-label">নায়েবে আমীর / সহ-সভাপতি</td><td>' + escapeHtml(r.name) + ' (' + escapeHtml(r.mobile || '—') + ')</td></tr>';
    });
    rows += '<tr><td class="p-label">সেক্রেটারী</td><td>' + escapeHtml(formData.details.secretary.name || '—') + ' (' + escapeHtml(formData.details.secretary.mobile || '—') + ')</td></tr>';
    formData.details.assistantSecretaries.forEach(function (r) {
      rows += '<tr><td class="p-label">সহকারী সেক্রেটারী</td><td>' + escapeHtml(r.name) + ' (' + escapeHtml(r.mobile || '—') + ')</td></tr>';
    });
    formData.details.zones.forEach(function (z) {
      rows += '<tr><td class="p-label">অঞ্চলঃ ' + escapeHtml(z.name) + '</td><td>' + escapeHtml(z.directorName || '—') + ' (' + escapeHtml(z.directorMobile || '—') + ')</td></tr>';
    });
    table.innerHTML = rows;

    printViaWindow('upashakhaPrintTemplate');
  }

  // ==================== উপশাখা ধার্য্য ====================
  let _selectedUpashakha = null;
  let _upashakhaDhajjoItems = [];

  const UPASHAKHA_DHAJJO_DEFAULT_ITEMS = [
    { name: 'উর্ধতন নিসাব', amount: '', date: '' },
    { name: 'এককালীন', amount: '', date: '' },
    { name: 'নির্বাচনী ফান্ড', amount: '', date: '' },
    { name: 'যাকাত', amount: '', date: '' }
  ];

  function initUpashakhaDhajjo() {
    document.getElementById('upashakhaDhajja-select').addEventListener('change', function () {
      const selectedOption = this.options[this.selectedIndex];
      if (!this.value) {
        document.getElementById('upashakhaDhajjoInfo').style.display = 'none';
        document.getElementById('upashakhaDhajjoHistoryCard').style.display = 'none';
        _selectedUpashakha = null;
        return;
      }
      _selectedUpashakha = {
        id: this.value,
        name: selectedOption.textContent,
        amirName: selectedOption.dataset.amirName || '',
        amirMobile: selectedOption.dataset.amirMobile || ''
      };
      document.getElementById('ud-view-amirName').textContent = _selectedUpashakha.amirName || '—';
      document.getElementById('ud-view-amirMobile').textContent = _selectedUpashakha.amirMobile || '—';
      document.getElementById('upashakhaDhajjoInfo').style.display = 'block';
      document.getElementById('upashakhaDhajjoHistoryCard').style.display = 'block';

      if (!document.getElementById('upashakhaDhajjo-year').value) {
        document.getElementById('upashakhaDhajjo-year').value = new Date().getFullYear();
      }
      loadUpashakhaDhajjoYearRecord();
      loadUpashakhaDhajjoYearSummary();
    });

    document.getElementById('upashakhaDhajjo-year').addEventListener('change', function () {
      if (_selectedUpashakha) loadUpashakhaDhajjoYearRecord();
    });

    document.getElementById('upashakhaDhajjoAddRowBtn').addEventListener('click', function () {
      _upashakhaDhajjoItems.push({ name: '', amount: '', date: '' });
      renderUpashakhaDhajjoTable();
    });

    document.getElementById('upashakhaDhajjoSaveBtn').addEventListener('click', function () { submitUpashakhaDhajjoForm('সংরক্ষণ'); });
    document.getElementById('upashakhaDhajjoUpdateBtn').addEventListener('click', function () { submitUpashakhaDhajjoForm('আপডেট'); });
    document.getElementById('upashakhaDhajjoResetBtn').addEventListener('click', function () {
      _upashakhaDhajjoItems = JSON.parse(JSON.stringify(UPASHAKHA_DHAJJO_DEFAULT_ITEMS));
      renderUpashakhaDhajjoTable();
    });
    document.getElementById('upashakhaDhajjoDeleteBtn').addEventListener('click', deleteUpashakhaDhajjoForm);
    document.getElementById('upashakhaDhajjoPrintBtn').addEventListener('click', printUpashakhaDhajjoForm);
  }

  function loadUpashakhaDhajjoYearRecord() {
    if (!_selectedUpashakha) return;
    const year = document.getElementById('upashakhaDhajjo-year').value;
    const loadingEl = document.getElementById('upashakhaDhajjoLoading');
    loadingEl.style.display = 'inline';

    google.script.run
      .withSuccessHandler(function (res) {
        loadingEl.style.display = 'none';
        if (!res.success) {
          showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
          return;
        }
        _upashakhaDhajjoItems = res.data.items && res.data.items.length ? res.data.items : JSON.parse(JSON.stringify(UPASHAKHA_DHAJJO_DEFAULT_ITEMS));
        renderUpashakhaDhajjoTable();
      })
      .withFailureHandler(function (err) {
        loadingEl.style.display = 'none';
        showToast('তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getUpashakhaDhajjoRecord(_selectedUpashakha.id, _selectedUpashakha.name, year);
  }

  function renderUpashakhaDhajjoTable() {
    const body = document.getElementById('upashakhaDhajjoItemsBody');
    body.innerHTML = '';
    _upashakhaDhajjoItems.forEach(function (item, idx) {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.setAttribute('data-label', 'খাতের নাম');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'খাতের নাম';
      nameInput.value = item.name || '';
      nameInput.addEventListener('input', function () { _upashakhaDhajjoItems[idx].name = this.value; });
      nameTd.appendChild(nameInput);

      const amountTd = document.createElement('td');
      amountTd.setAttribute('data-label', 'পরিমাণ (৳)');
      const amountInput = document.createElement('input');
      amountInput.type = 'text';
      amountInput.className = 'amount-input';
      amountInput.placeholder = 'পরিমাণ';
      amountInput.value = item.amount || '';
      amountInput.addEventListener('input', function () { _upashakhaDhajjoItems[idx].amount = this.value; });
      amountTd.appendChild(amountInput);

      const dateTd = document.createElement('td');
      dateTd.setAttribute('data-label', 'তারিখ');
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = toInputDate(item.date || '');
      dateInput.addEventListener('input', function () { _upashakhaDhajjoItems[idx].date = formatDateForSheet(this.value); });
      dateTd.appendChild(dateInput);

      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _upashakhaDhajjoItems.splice(idx, 1);
        renderUpashakhaDhajjoTable();
      });
      actionTd.appendChild(removeBtn);

      tr.appendChild(nameTd);
      tr.appendChild(amountTd);
      tr.appendChild(dateTd);
      tr.appendChild(actionTd);
      body.appendChild(tr);
    });
  }

  function submitUpashakhaDhajjoForm(actionLabel) {
    if (!_selectedUpashakha) {
      showToast('অনুগ্রহ করে উপশাখা নির্বাচন করুন', 'error');
      return;
    }
    const year = document.getElementById('upashakhaDhajjo-year').value;
    if (!year) {
      showToast('অনুগ্রহ করে বছর লিখুন', 'error');
      return;
    }
    const formData = {
      upashakhaId: _selectedUpashakha.id,
      upashakhaName: _selectedUpashakha.name,
      year: year,
      items: _upashakhaDhajjoItems
    };
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadUpashakhaDhajjoYearRecord();
          loadUpashakhaDhajjoYearSummary();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveUpashakhaDhajjoRecord(formData);
  }

  function deleteUpashakhaDhajjoForm() {
    if (!_selectedUpashakha) return;
    const year = document.getElementById('upashakhaDhajjo-year').value;
    if (!confirm('এই বছরের (' + year + ') ধার্য্যের তথ্য মুছে ফেলা হবে। নিশ্চিত?')) return;

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          _upashakhaDhajjoItems = JSON.parse(JSON.stringify(UPASHAKHA_DHAJJO_DEFAULT_ITEMS));
          renderUpashakhaDhajjoTable();
          loadUpashakhaDhajjoYearSummary();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .deleteUpashakhaDhajjoRecord(_selectedUpashakha.id, year);
  }

  function loadUpashakhaDhajjoYearSummary() {
    if (!_selectedUpashakha) return;
    const box = document.getElementById('upashakhaDhajjoYearSummaryList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success || !res.data.length) {
          box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
          return;
        }
        box.innerHTML = '';
        res.data.forEach(function (rec) {
          const total = (rec.items || []).reduce(function (sum, it) { return sum + (parseFloat(it.amount) || 0); }, 0);
          const div = document.createElement('div');
          div.className = 'year-summary-item';
          div.innerHTML =
            '<span class="ys-year">' + escapeHtml(String(rec.year)) + '</span>' +
            '<span>' + (rec.items || []).length + 'টি খাত</span>' +
            '<span class="ys-total">মোট: ৳' + escapeHtml(String(total)) + '</span>';
          box.appendChild(div);
        });
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getUpashakhaDhajjoByUpashakha(_selectedUpashakha.id);
  }

  function printUpashakhaDhajjoForm() {
    document.getElementById('udprint-name').textContent = _selectedUpashakha ? _selectedUpashakha.name : '—';
    document.getElementById('udprint-year').textContent = document.getElementById('upashakhaDhajjo-year').value || '';

    const table = document.getElementById('udprint-table');
    table.innerHTML = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td><td class="p-label">তারিখ</td></tr>';
    _upashakhaDhajjoItems.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td>৳' + escapeHtml(String(item.amount || 0)) + '</td>' +
        '<td>' + escapeHtml(item.date || '—') + '</td>';
      table.appendChild(tr);
    });

    printViaWindow('upashakhaDhajjoPrintTemplate');
  }

  // ==================== উপশাখা এন্ট্রি ফরম ====================
  function initUpashakhaEntry() {
    document.getElementById('uentrySaveBtn').addEventListener('click', saveUentry_);
    document.getElementById('uentryResetBtn').addEventListener('click', resetUentryForm);
    document.getElementById('uentryPrintBtn').addEventListener('click', printUentryList);
  }

  // সংরক্ষণ বাটন: নতুন হলে "সংরক্ষণ", তালিকা থেকে এডিট করলে "আপডেট"
  function setUentryMode_(isEdit) {
    document.getElementById('uentrySaveBtn').textContent = isEdit ? '🔄 আপডেট' : '💾 সংরক্ষণ';
  }

  function saveUentry_() {
    const id = document.getElementById('uentry-id').value;
    const formData = {
      id: id,
      name: document.getElementById('uentry-name').value,
      level: document.getElementById('uentry-level').value
    };
    if (!formData.name) { showToast('অনুগ্রহ করে উপশাখার নাম লিখুন', 'error'); return; }
    if (!formData.level) { showToast('অনুগ্রহ করে মান নির্বাচন করুন', 'error'); return; }

    const btn = document.getElementById('uentrySaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast(res.message, 'success');
          resetUentryForm();
          // আপডেটের পর ফরম বন্ধ; নতুন এন্ট্রির পর খোলা থাকে যাতে পরপর আরও যোগ করা যায়
          if (id) setFormCardOpen_('uentryFormCard', 'uentryFormToggleBtn', false, false);
          loadUpashakhaListForSelects();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveUpashakhaEntry(formData);
  }

  function resetUentryForm() {
    document.getElementById('uentry-id').value = '';
    document.getElementById('uentry-name').value = '';
    document.getElementById('uentry-level').value = '';
    setUentryMode_(false);
  }

  function renderUentryList() {
    const box = document.getElementById('uentryList');
    const countEl = document.getElementById('uentryCount');
    if (!box) return;
    if (!_upashakhaList.length) {
      box.innerHTML = '<div class="no-result">কোনো উপশাখা নেই</div>';
      countEl.textContent = '';
      return;
    }
    countEl.textContent = '(মোট ' + toBnNumber(_upashakhaList.length) + 'টি)';
    let html = '<div class="list-scroll compact"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>উপশাখার নাম</th><th>মান</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _upashakhaList.forEach(function (u, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(u.name) + '</td><td>' + escapeHtml(u.level || '—') + '</td>' +
        '<td><button type="button" class="icon-btn" data-act="edit" data-idx="' + idx + '" title="এডিট" aria-label="এডিট">✏️</button> ' +
        '<button type="button" class="icon-btn" data-act="delete" data-idx="' + idx + '" title="ডিলেট" aria-label="ডিলেট">🗑️</button></td></tr>';
    });
    box.innerHTML = html + '</tbody></table></div>';
    box.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const u = _upashakhaList[parseInt(btn.getAttribute('data-idx'), 10)];
        if (!u) return;
        if (btn.getAttribute('data-act') === 'edit') {
          document.getElementById('uentry-id').value = u.id;
          document.getElementById('uentry-name').value = u.name || '';
          document.getElementById('uentry-level').value = u.level || '';
          setUentryMode_(true);
          setFormCardOpen_('uentryFormCard', 'uentryFormToggleBtn', true, true);
        } else {
          deleteUentry_(u);
        }
      });
    });
  }

  function deleteUentry_(u) {
    if (!confirm('আপনি কি নিশ্চিত "' + u.name + '" উপশাখাটি মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (document.getElementById('uentry-id').value === String(u.id)) resetUentryForm();
          loadUpashakhaListForSelects();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deleteUpashakha(u.id);
  }

  function printUentryList() {
    if (!_upashakhaList.length) { showToast('প্রিন্ট করার মতো কোনো উপশাখা নেই', 'error'); return; }
    document.getElementById('uentryprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    const subParts = [_mainBranchLevel, (_branchViewData && _branchViewData.address) || ''].filter(Boolean);
    const subEl = document.getElementById('uentryprint-sub');
    subEl.textContent = subParts.join(' | ');
    subEl.style.display = subParts.length ? 'block' : 'none';
    document.getElementById('uentryprint-date').textContent = 'তারিখ: ' + new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    let rows = '<thead><tr><th class="col-serial">ক্রম</th><th>উপশাখার নাম</th><th>মান</th></tr></thead><tbody>';
    _upashakhaList.forEach(function (u, idx) {
      rows += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(u.name) + '</td><td>' + escapeHtml(u.level || '—') + '</td></tr>';
    });
    document.getElementById('uentryprint-table').innerHTML = rows + '</tbody>';
    document.getElementById('uentryprint-total').textContent = 'মোট উপশাখা: ' + toBnNumber(_upashakhaList.length) + 'টি';
    printViaWindow('uentryPrintTemplate');
  }

  // ==================== বায়তুলমাল: সাধারণ হেল্পার ====================
  function populateSimpleUpashakhaSelect(selectId, useNameAsValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _upashakhaListWithMain.forEach(function (u) {
      const opt = document.createElement('option');
      opt.value = useNameAsValue ? u.name : u.id;
      opt.textContent = u.name + (u.level ? ' (' + u.level + ')' : '');
      select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
  }

  // ==================== বায়তুলমাল: জনশক্তি আয় ====================
  let _jiData = [];

  function initJonoshoktiIncome() {
    bindDataToggle_('jiLoadBtn',
      function () { return isBlockShown_('jiMemberListWrap'); },
      function () { document.getElementById('jiMemberListWrap').style.display = 'none'; },
      loadJonoshoktiIncomeList, '🔍 তালিকা দেখুন', '✖ তালিকা বন্ধ করুন');
    document.getElementById('jiSaveBtn').addEventListener('click', function () { submitJonoshoktiIncome('সংরক্ষণ'); });
    document.getElementById('jiUpdateBtn').addEventListener('click', function () { submitJonoshoktiIncome('আপডেট'); });
    document.getElementById('jiResetBtn').addEventListener('click', loadJonoshoktiIncomeList);
    document.getElementById('jiPrintBtn').addEventListener('click', printJonoshoktiIncome);
  }

  function loadJonoshoktiIncomeList() {
    const branch = document.getElementById('ji-branch').value;
    const maan = document.getElementById('ji-maan').value;
    const year = document.getElementById('ji-year').value;
    const month = document.getElementById('ji-month').value;
    if (!branch || !maan || !year || !month) {
      showToast('অনুগ্রহ করে মাস/বছর, শাখা ও মান নির্বাচন করুন', 'error');
      return;
    }
    const listBox = document.getElementById('jiMemberList');
    listBox.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    document.getElementById('jiMemberListWrap').style.display = 'block';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          listBox.innerHTML = '<div class="no-result">তথ্য লোড করতে সমস্যা হয়েছে</div>';
          return;
        }
        _jiData = res.data;
        renderJonoshoktiIncomeList();
      })
      .withFailureHandler(function (err) {
        listBox.innerHTML = '<div class="no-result">সমস্যা হয়েছে: ' + err.message + '</div>';
      })
      .getJonoshoktiIncomeList(branch, maan, year, month);
  }

  function renderJonoshoktiIncomeList() {
    const listBox = document.getElementById('jiMemberList');
    if (!_jiData.length) {
      listBox.innerHTML = '<div class="no-result">এই শাখা ও মানের কোনো সদস্য পাওয়া যায়নি</div>';
      return;
    }
    listBox.innerHTML = '';
    _jiData.forEach(function (m, mIdx) {
      const wrap = document.createElement('div');
      wrap.style.marginBottom = '18px';
      wrap.innerHTML = '<h4 class="sub-title" style="font-size:14px;">' + toBnNumber(mIdx + 1) + '. ' + escapeHtml(m.name) + '</h4>';

      const table = document.createElement('table');
      table.className = 'dhajjo-table';
      table.innerHTML = '<thead><tr><th>খাতের নাম</th><th>ধার্য্য</th><th>পরিশোধ</th><th>বকেয়া</th><th>এখন পরিশোধ</th></tr></thead>';
      const tbody = document.createElement('tbody');

      if (!m.khats.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" data-label="">এই সদস্যের কোনো ধার্য্য নেই</td>';
        tbody.appendChild(tr);
      }

      m.khats.forEach(function (k, kIdx) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td data-label="খাতের নাম">' + escapeHtml(k.khatName) + (k.readOnly ? '<span class="khat-sub">(প্রকাশনা বিক্রয় থেকে)</span>' : '') + '</td>' +
          '<td data-label="ধার্য্য">৳' + escapeHtml(String(k.dhajjo)) + '</td>' +
          '<td data-label="পরিশোধ">৳' + escapeHtml(String(k.paid)) + '</td>' +
          '<td data-label="বকেয়া">৳' + escapeHtml(String(k.due)) + '</td>';
        if (k.readOnly) {
          const naTd = document.createElement('td');
          naTd.setAttribute('data-label', 'এখন পরিশোধ');
          naTd.innerHTML = '<span style="color:#888; font-size:12px;">বিক্রয় ফরমে সমন্বয় করুন</span>';
          tr.appendChild(naTd);
          tbody.appendChild(tr);
          return;
        }
        const payTd = document.createElement('td');
        payTd.setAttribute('data-label', 'এখন পরিশোধ');
        const payInput = document.createElement('input');
        payInput.type = 'text';
        payInput.className = 'amount-input';
        payInput.placeholder = 'পরিমাণ';
        payInput.dataset.memberIdx = mIdx;
        payInput.dataset.khatIdx = kIdx;
        payTd.appendChild(payInput);
        tr.appendChild(payTd);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrap.appendChild(table);
      listBox.appendChild(wrap);
    });
  }

  function submitJonoshoktiIncome(actionLabel) {
    const branch = document.getElementById('ji-branch').value;
    const maan = document.getElementById('ji-maan').value;
    const year = document.getElementById('ji-year').value;
    const month = document.getElementById('ji-month').value;
    const today = new Date().toISOString().split('T')[0];
    const dateStr = formatDateForSheet(today);

    const payments = [];
    document.querySelectorAll('#jiMemberList input[data-member-idx]').forEach(function (input) {
      const amount = input.value;
      if (amount && parseFloat(amount) > 0) {
        const mIdx = parseInt(input.dataset.memberIdx, 10);
        const kIdx = parseInt(input.dataset.khatIdx, 10);
        const member = _jiData[mIdx];
        const khat = member.khats[kIdx];
        payments.push({ memberId: member.memberId, memberName: member.name, khatName: khat.khatName, amount: amount, date: dateStr });
      }
    });

    if (!payments.length) {
      showToast('অনুগ্রহ করে অন্তত একটি "এখন পরিশোধ" ঘরে পরিমাণ লিখুন', 'error');
      return;
    }

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadJonoshoktiIncomeList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveJonoshoktiIncomePayments({ branch: branch, maan: maan, year: year, month: month, payments: payments });
  }

  function printJonoshoktiIncome() {
    document.getElementById('jiprint-monthYear').textContent = document.getElementById('ji-month').value + ' ' + document.getElementById('ji-year').value;
    document.getElementById('jiprint-branch').textContent = document.getElementById('ji-branch').value || '—';
    document.getElementById('jiprint-maan').textContent = document.getElementById('ji-maan').value || '—';

    const content = document.getElementById('jiprint-content');
    let html = '';
    _jiData.forEach(function (m, idx) {
      html += '<h4 style="margin:14px 0 6px;">' + (idx + 1) + '. ' + escapeHtml(m.name) + '</h4>';
      html += '<table class="print-table"><tr><td class="p-label">খাতের নাম</td><td class="p-label">ধার্য্য</td><td class="p-label">পরিশোধ</td><td class="p-label">বকেয়া</td></tr>';
      m.khats.forEach(function (k) {
        html += '<tr><td>' + escapeHtml(k.khatName) + '</td><td>৳' + k.dhajjo + '</td><td>৳' + k.paid + '</td><td>৳' + k.due + '</td></tr>';
      });
      html += '</table>';
    });
    content.innerHTML = html;

    printViaWindow('jiPrintTemplate');
  }

  // ==================== বায়তুলমাল: উপশাখা আয় ====================
  let _uiSelectedId = '';
  let _uiSelectedName = '';
  let _uiItems = [];

  function initUpashakhaIncome() {
    document.getElementById('ui-upashakha').addEventListener('change', function () {
      const selectedOption = this.options[this.selectedIndex];
      if (!this.value) {
        document.getElementById('uiTableWrap').style.display = 'none';
        _uiSelectedId = '';
        return;
      }
      _uiSelectedId = this.value;
      _uiSelectedName = selectedOption.textContent;
      document.getElementById('uiTableWrap').style.display = 'block';
      loadUpashakhaIncomeList();
    });
    document.getElementById('ui-month').addEventListener('change', function () { if (_uiSelectedId) loadUpashakhaIncomeList(); });
    document.getElementById('ui-year').addEventListener('change', function () { if (_uiSelectedId) loadUpashakhaIncomeList(); });

    document.getElementById('uiCloseBtn').addEventListener('click', function () {
      document.getElementById('uiTableWrap').style.display = 'none';
      document.getElementById('ui-upashakha').value = '';
      _uiSelectedId = '';
    });
    document.getElementById('uiSaveBtn').addEventListener('click', function () { submitUpashakhaIncome('সংরক্ষণ'); });
    document.getElementById('uiUpdateBtn').addEventListener('click', function () { submitUpashakhaIncome('আপডেট'); });
    document.getElementById('uiResetBtn').addEventListener('click', loadUpashakhaIncomeList);
    document.getElementById('uiPrintBtn').addEventListener('click', printUpashakhaIncome);
  }

  function loadUpashakhaIncomeList() {
    const year = document.getElementById('ui-year').value;
    const month = document.getElementById('ui-month').value;
    const body = document.getElementById('uiItemsBody');
    body.innerHTML = '<tr><td colspan="5" data-label="">লোড হচ্ছে...</td></tr>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          body.innerHTML = '<tr><td colspan="5" data-label="">তথ্য লোড করতে সমস্যা হয়েছে</td></tr>';
          return;
        }
        _uiItems = res.data;
        renderUpashakhaIncomeTable();
      })
      .withFailureHandler(function (err) {
        body.innerHTML = '<tr><td colspan="5" data-label="">সমস্যা হয়েছে: ' + err.message + '</td></tr>';
      })
      .getUpashakhaIncomeList(_uiSelectedId, _uiSelectedName, year, month);
  }

  function renderUpashakhaIncomeTable() {
    const body = document.getElementById('uiItemsBody');
    body.innerHTML = '';
    if (!_uiItems.length) {
      body.innerHTML = '<tr><td colspan="5" data-label="">এই উপশাখার কোনো ধার্য্য নেই</td></tr>';
      return;
    }
    _uiItems.forEach(function (item, idx) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="খাতের নাম">' + escapeHtml(item.khatName) + (item.readOnly ? '<span class="khat-sub">(প্রকাশনা বিক্রয় থেকে)</span>' : '') + '</td>' +
        '<td data-label="ধার্য্য">৳' + escapeHtml(String(item.dhajjo)) + '</td>' +
        '<td data-label="পরিশোধ">৳' + escapeHtml(String(item.paid)) + '</td>' +
        '<td data-label="বকেয়া">৳' + escapeHtml(String(item.due)) + '</td>';
      if (item.readOnly) {
        const naTd = document.createElement('td');
        naTd.setAttribute('data-label', 'এখন পরিশোধ');
        naTd.innerHTML = '<span style="color:#888; font-size:12px;">বিক্রয় ফরমে সমন্বয় করুন</span>';
        tr.appendChild(naTd);
        body.appendChild(tr);
        return;
      }
      const payTd = document.createElement('td');
      payTd.setAttribute('data-label', 'এখন পরিশোধ');
      const payInput = document.createElement('input');
      payInput.type = 'text';
      payInput.className = 'amount-input';
      payInput.placeholder = 'পরিমাণ';
      payInput.dataset.idx = idx;
      payTd.appendChild(payInput);
      tr.appendChild(payTd);
      body.appendChild(tr);
    });
  }

  function submitUpashakhaIncome(actionLabel) {
    if (!_uiSelectedId) {
      showToast('অনুগ্রহ করে উপশাখা নির্বাচন করুন', 'error');
      return;
    }
    const year = document.getElementById('ui-year').value;
    const month = document.getElementById('ui-month').value;
    const today = new Date().toISOString().split('T')[0];
    const dateStr = formatDateForSheet(today);

    const payments = [];
    document.querySelectorAll('#uiItemsBody input[data-idx]').forEach(function (input) {
      const amount = input.value;
      if (amount && parseFloat(amount) > 0) {
        const idx = parseInt(input.dataset.idx, 10);
        payments.push({ khatName: _uiItems[idx].khatName, amount: amount, date: dateStr });
      }
    });

    if (!payments.length) {
      showToast('অনুগ্রহ করে অন্তত একটি "এখন পরিশোধ" ঘরে পরিমাণ লিখুন', 'error');
      return;
    }

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadUpashakhaIncomeList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveUpashakhaIncomePayments({ upashakhaId: _uiSelectedId, upashakhaName: _uiSelectedName, year: year, month: month, payments: payments });
  }

  function printUpashakhaIncome() {
    document.getElementById('uiprint-monthYear').textContent = document.getElementById('ui-month').value + ' ' + document.getElementById('ui-year').value;
    document.getElementById('uiprint-name').textContent = _uiSelectedName || '—';

    const table = document.getElementById('uiprint-table');
    let rows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">ধার্য্য</td><td class="p-label">পরিশোধ</td><td class="p-label">বকেয়া</td></tr>';
    _uiItems.forEach(function (item) {
      rows += '<tr><td>' + escapeHtml(item.khatName) + '</td><td>৳' + item.dhajjo + '</td><td>৳' + item.paid + '</td><td>৳' + item.due + '</td></tr>';
    });
    table.innerHTML = rows;

    printViaWindow('uiPrintTemplate');
  }

  // ==================== বায়তুলমাল: অন্যান্য আয় ====================
  let _oaRows = [];

  function initAnnannoIncome() {
    _oaRows = [{ id: '', date: '', khat: '', serial: '', description: '', amount: '' }];
    renderOaTable();
    loadOaList();

    document.getElementById('oaAddRowBtn').addEventListener('click', function () {
      _oaRows.push({ id: '', date: '', khat: '', serial: '', description: '', amount: '' });
      renderOaTable();
    });
    document.getElementById('oaSaveBtn').addEventListener('click', function () { submitOaForm('সংরক্ষণ'); });
    document.getElementById('oaUpdateBtn').addEventListener('click', function () { submitOaForm('আপডেট'); });
    document.getElementById('oaResetBtn').addEventListener('click', function () {
      _oaRows = [{ id: '', date: '', khat: '', serial: '', description: '', amount: '' }];
      renderOaTable();
    });
    document.getElementById('oaPrintBtn').addEventListener('click', printOaReceipt);
  }

  function renderOaTable() {
    const body = document.getElementById('oaItemsBody');
    body.innerHTML = '';
    _oaRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');

      const dateTd = document.createElement('td');
      dateTd.setAttribute('data-label', 'তারিখ');
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = toInputDate(row.date || '');
      dateInput.addEventListener('input', function () { _oaRows[idx].date = formatDateForSheet(this.value); });
      dateTd.appendChild(dateInput);

      const khatTd = document.createElement('td');
      khatTd.setAttribute('data-label', 'আয়ের খাত');
      const khatInput = document.createElement('input');
      khatInput.type = 'text';
      khatInput.placeholder = 'আয়ের খাত';
      khatInput.value = row.khat || '';
      khatInput.addEventListener('input', function () { _oaRows[idx].khat = this.value; });
      khatTd.appendChild(khatInput);

      const serialTd = document.createElement('td');
      serialTd.setAttribute('data-label', 'ক্রম');
      const serialInput = document.createElement('input');
      serialInput.type = 'text';
      serialInput.placeholder = 'ক্রম';
      serialInput.value = row.serial || '';
      serialInput.addEventListener('input', function () { _oaRows[idx].serial = this.value; });
      serialTd.appendChild(serialInput);

      const descTd = document.createElement('td');
      descTd.setAttribute('data-label', 'বিবরণ');
      const descInput = document.createElement('input');
      descInput.type = 'text';
      descInput.placeholder = 'বিবরণ';
      descInput.value = row.description || '';
      descInput.addEventListener('input', function () { _oaRows[idx].description = this.value; });
      descTd.appendChild(descInput);

      const amountTd = document.createElement('td');
      amountTd.setAttribute('data-label', 'পরিমাণ');
      const amountInput = document.createElement('input');
      amountInput.type = 'text';
      amountInput.className = 'amount-input';
      amountInput.placeholder = 'পরিমাণ';
      amountInput.value = row.amount || '';
      amountInput.addEventListener('input', function () { _oaRows[idx].amount = this.value; });
      amountTd.appendChild(amountInput);

      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _oaRows.splice(idx, 1);
        if (!_oaRows.length) _oaRows.push({ id: '', date: '', khat: '', serial: '', description: '', amount: '' });
        renderOaTable();
      });
      actionTd.appendChild(removeBtn);

      tr.appendChild(dateTd);
      tr.appendChild(khatTd);
      tr.appendChild(serialTd);
      tr.appendChild(descTd);
      tr.appendChild(amountTd);
      tr.appendChild(actionTd);
      body.appendChild(tr);
    });
  }

  function submitOaForm(actionLabel) {
    const validRows = _oaRows.filter(function (r) { return r.khat || r.description; });
    if (!validRows.length) {
      showToast('অনুগ্রহ করে অন্তত একটি সারি পূরণ করুন', 'error');
      return;
    }
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          _oaRows = [{ id: '', date: '', khat: '', serial: '', description: '', amount: '' }];
          renderOaTable();
          loadOaList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveAnnannoAyEntries(validRows);
  }

  function loadOaList() {
    const box = document.getElementById('oaList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success || !res.data.length) {
          box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
          return;
        }
        box.innerHTML = '';
        res.data.slice().reverse().forEach(function (e) {
          const div = document.createElement('div');
          div.className = 'simple-list-item';
          div.style.cursor = 'pointer';
          div.innerHTML =
            '<span><b>তারিখ:</b> ' + escapeHtml(e.date) + '</span>' +
            '<span><b>খাত:</b> ' + escapeHtml(e.khat) + '</span>' +
            '<span><b>ক্রম:</b> ' + escapeHtml(String(e.serial || '')) + '</span>' +
            '<span><b>বিবরণ:</b> ' + escapeHtml(e.description) + '</span>' +
            '<span><b>পরিমাণ:</b> ৳' + escapeHtml(String(e.amount)) + '</span>';
          div.addEventListener('click', function () {
            _oaRows = [{ id: e.id, date: e.date, khat: e.khat, serial: e.serial, description: e.description, amount: e.amount }];
            renderOaTable();
            showToast('এন্ট্রি ফরমে লোড করা হয়েছে', 'success');
          });
          box.appendChild(div);
        });
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getAnnannoAyList();
  }

  function printOaReceipt() {
    const table = document.getElementById('oaprint-table');
    let rows = '<tr><td class="p-label">তারিখ</td><td class="p-label">খাত</td><td class="p-label col-serial">ক্রম</td><td class="p-label">বিবরণ</td><td class="p-label">পরিমাণ</td></tr>';
    _oaRows.filter(function (r) { return r.khat || r.description; }).forEach(function (r) {
      rows += '<tr><td>' + escapeHtml(r.date || '—') + '</td><td>' + escapeHtml(r.khat) + '</td><td class="col-serial">' + escapeHtml(String(r.serial || '')) + '</td><td>' + escapeHtml(r.description) + '</td><td>৳' + escapeHtml(String(r.amount || 0)) + '</td></tr>';
    });
    table.innerHTML = rows;

    printViaWindow('oaPrintTemplate');
  }

  // ==================== বায়তুলমাল: ব্যয় ফরম ====================
  let _byayId = '';
  let _byayVoucherNo = '';

  let _byayAll = [];

  function initByayForm() {
    refreshByayVoucherPreview();
    loadByayList();

    document.getElementById('byaySaveBtn').addEventListener('click', submitByayForm);
    document.getElementById('byayResetBtn').addEventListener('click', resetByayForm);
  }

  function refreshByayVoucherPreview() {
    google.script.run
      .withSuccessHandler(function (res) {
        // এডিটের সময় আসল ভাউচার নম্বর থাকে, তাই শুধু নতুন এন্ট্রির সময় প্রস্তাবিত নম্বর দেখানো হয়
        if (res.success && !_byayVoucherNo) {
          document.getElementById('byay-voucherNo').value = res.voucherNo + ' (প্রস্তাবিত)';
        }
      })
      .withFailureHandler(function () { /* নীরবে ব্যর্থ */ })
      .getNextVoucherNumber();
  }

  // সংরক্ষণ বাটন: নতুন হলে "সংরক্ষণ", তালিকা থেকে এডিট করলে "আপডেট"
  function setByayMode_(isEdit) {
    document.getElementById('byaySaveBtn').textContent = isEdit ? '🔄 আপডেট' : '💾 সংরক্ষণ';
  }

  function submitByayForm() {
    const isEdit = !!_byayId;
    const formData = {
      id: _byayId,
      voucherNo: _byayVoucherNo,
      date: formatDateForSheet(document.getElementById('byay-date').value),
      khat: document.getElementById('byay-khat').value,
      serial: document.getElementById('byay-serial').value,
      description: document.getElementById('byay-description').value,
      amount: document.getElementById('byay-amount').value
    };
    if (!formData.khat) {
      showToast('অনুগ্রহ করে ব্যয়ের খাত লিখুন', 'error');
      return;
    }
    if (!formData.amount) {
      showToast('অনুগ্রহ করে পরিমাণ লিখুন', 'error');
      return;
    }

    const btn = document.getElementById('byaySaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast((isEdit ? 'আপডেট' : 'সংরক্ষণ') + ' সম্পন্ন হয়েছে (ভাউচার নং: ' + res.voucherNo + ')', 'success');
          resetByayForm();
          // আপডেটের পর ফরম বন্ধ; নতুন এন্ট্রির পর খোলা থাকে যাতে পরপর আরও যোগ করা যায়
          if (isEdit) setFormCardOpen_('byayFormCard', 'byayFormToggleBtn', false, false);
          loadByayList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveByay(formData);
  }

  function resetByayForm() {
    _byayId = '';
    _byayVoucherNo = '';
    document.getElementById('byay-voucherNo').value = '';
    document.getElementById('byay-date').value = '';
    document.getElementById('byay-khat').value = '';
    document.getElementById('byay-serial').value = '';
    document.getElementById('byay-description').value = '';
    document.getElementById('byay-amount').value = '';
    setByayMode_(false);
    refreshByayVoucherPreview();
  }

  function loadByayList() {
    const box = document.getElementById('byayList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _byayAll = (res.success && res.data) ? res.data : [];
        renderByayList();
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getByayList();
  }

  function renderByayList() {
    const box = document.getElementById('byayList');
    const countEl = document.getElementById('byayCount');
    if (!_byayAll.length) {
      box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
      countEl.textContent = '';
      return;
    }
    countEl.textContent = '(মোট ' + toBnNumber(_byayAll.length) + 'টি)';
    let html = '<div class="list-scroll compact"><table class="dhajjo-table"><thead><tr><th>ভাউচার নং</th><th>তারিখ</th><th>ব্যয়ের খাত</th><th>ক্রম</th><th>বিবরণ</th><th>পরিমাণ (৳)</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _byayAll.forEach(function (b, idx) {
      html += '<tr><td>' + escapeHtml(b.voucherNo) + '</td><td>' + escapeHtml(b.date || '—') + '</td><td>' + escapeHtml(b.khat || '—') + '</td><td>' + escapeHtml(String(b.serial || '—')) + '</td>' +
        '<td class="col-wrap">' + escapeHtml(b.description || '—') + '</td><td>৳' + escapeHtml(String(b.amount)) + '</td>' +
        '<td><button type="button" class="icon-btn" data-act="edit" data-idx="' + idx + '" title="এডিট" aria-label="এডিট">✏️</button> ' +
        '<button type="button" class="icon-btn" data-act="print" data-idx="' + idx + '" title="প্রিন্ট" aria-label="প্রিন্ট">🖨️</button> ' +
        '<button type="button" class="icon-btn" data-act="delete" data-idx="' + idx + '" title="ডিলেট" aria-label="ডিলেট">🗑️</button></td></tr>';
    });
    box.innerHTML = html + '</tbody></table></div>';
    box.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const b = _byayAll[parseInt(btn.getAttribute('data-idx'), 10)];
        if (!b) return;
        const act = btn.getAttribute('data-act');
        if (act === 'edit') {
          _byayId = b.id;
          _byayVoucherNo = b.voucherNo;
          document.getElementById('byay-voucherNo').value = b.voucherNo;
          document.getElementById('byay-date').value = toInputDate(b.date);
          document.getElementById('byay-khat').value = b.khat || '';
          document.getElementById('byay-serial').value = b.serial || '';
          document.getElementById('byay-description').value = b.description || '';
          document.getElementById('byay-amount').value = b.amount || '';
          setByayMode_(true);
          setFormCardOpen_('byayFormCard', 'byayFormToggleBtn', true, true);
        } else if (act === 'print') {
          printByayReceipt(b);
        } else {
          deleteByayVoucher_(b);
        }
      });
    });
  }

  function deleteByayVoucher_(b) {
    if (!confirm('আপনি কি নিশ্চিত ভাউচার "' + b.voucherNo + '" মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (_byayId === b.id) resetByayForm();
          loadByayList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deleteByay(b.id);
  }

  function printByayReceipt(b) {
    document.getElementById('byayprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('byayprint-voucherNo').textContent = b.voucherNo || '—';
    document.getElementById('byayprint-date').textContent = b.date || '—';
    document.getElementById('byayprint-khat').textContent = b.khat || '—';
    document.getElementById('byayprint-serial').textContent = b.serial || '—';
    document.getElementById('byayprint-description').textContent = b.description || '—';
    document.getElementById('byayprint-amount').textContent = '৳' + (b.amount || '0');

    printViaWindow('byayPrintTemplate');
  }

  // ==================== বায়তুলমাল: মাসিক আয়-ব্যয় ====================
  let _mabId = '';
  let _mabIncomeItems = [];
  let _mabExpenseItems = [];

  const MAB_DEFAULT_INCOME_ITEMS = [
    { name: 'প্রাপ্ত নিছাব', amount: '' },
    { name: 'সরাসরি ইয়ানত', amount: '' },
    { name: 'এককালীন', amount: '' },
    { name: 'যাকাত', amount: '' },
    { name: 'নির্বাচনী ফান্ড', amount: '' },
    { name: 'প্রকাশনা / বই বিক্রি', amount: '' }
  ];

  const MAB_DEFAULT_EXPENSE_ITEMS = [
    { name: 'নিছাব পরিশোধ', amount: '' },
    { name: 'এককালীন', amount: '' },
    { name: 'স্থানীয় খরচ', amount: '' },
    { name: 'যাতায়াত', amount: '' },
    { name: 'মোবাইল বিল', amount: '' },
    { name: 'যাকাত', amount: '' },
    { name: 'নির্বাচনী ফান্ড', amount: '' },
    { name: 'প্রকাশনা ক্রয় / ঘাটতি', amount: '' }
  ];

  function initMashikAyByay() {
    _mabIncomeItems = JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
    _mabExpenseItems = JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
    renderMabIncomeTable();
    renderMabExpenseTable();

    if (!document.getElementById('mab-year').value) {
      document.getElementById('mab-year').value = new Date().getFullYear();
    }

    document.getElementById('mab-month').addEventListener('change', refreshMabPrevBalance);
    document.getElementById('mab-year').addEventListener('change', refreshMabPrevBalance);

    document.getElementById('mabIncomeAddRowBtn').addEventListener('click', function () {
      _mabIncomeItems.push({ name: '', amount: '' });
      renderMabIncomeTable();
    });
    document.getElementById('mabExpenseAddRowBtn').addEventListener('click', function () {
      _mabExpenseItems.push({ name: '', amount: '' });
      renderMabExpenseTable();
    });

    document.getElementById('mabSaveBtn').addEventListener('click', function () { submitMabForm('সংরক্ষণ'); });
    document.getElementById('mabUpdateBtn').addEventListener('click', function () { submitMabForm('আপডেট'); });
    document.getElementById('mabResetBtn').addEventListener('click', resetMabForm);
    document.getElementById('mabDeleteBtn').addEventListener('click', deleteMabForm);
    document.getElementById('mabPrintBtn').addEventListener('click', printMabForm);

    refreshMabPrevBalance();
    loadMabList();
  }

  function renderMabIncomeTable() {
    const body = document.getElementById('mabIncomeBody');
    body.innerHTML = '';
    _mabIncomeItems.forEach(function (item, idx) {
      body.appendChild(buildMabRow(item, idx, _mabIncomeItems, renderMabIncomeTable));
    });
    updateMabTotals();
  }

  function renderMabExpenseTable() {
    const body = document.getElementById('mabExpenseBody');
    body.innerHTML = '';
    _mabExpenseItems.forEach(function (item, idx) {
      body.appendChild(buildMabRow(item, idx, _mabExpenseItems, renderMabExpenseTable));
    });
    updateMabTotals();
  }

  function buildMabRow(item, idx, arrRef, rerenderFn) {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'খাতের নাম');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'খাতের নাম';
    nameInput.value = item.name || '';
    nameInput.addEventListener('input', function () { arrRef[idx].name = this.value; });
    nameTd.appendChild(nameInput);

    const amountTd = document.createElement('td');
    amountTd.setAttribute('data-label', 'পরিমাণ (৳)');
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.className = 'amount-input';
    amountInput.placeholder = 'পরিমাণ';
    amountInput.value = item.amount || '';
    amountInput.addEventListener('input', function () { arrRef[idx].amount = this.value; updateMabTotals(); });
    amountTd.appendChild(amountInput);

    const actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', '');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', function () {
      arrRef.splice(idx, 1);
      rerenderFn();
    });
    actionTd.appendChild(removeBtn);

    tr.appendChild(nameTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionTd);
    return tr;
  }

  function mabSumItems_(items) {
    return items.reduce(function (sum, it) { return sum + (parseNum(it.amount) || 0); }, 0);
  }

  function updateMabTotals() {
    const totalIncome = mabSumItems_(_mabIncomeItems);
    const totalExpense = mabSumItems_(_mabExpenseItems);
    const prevSurplus = parseNum(document.getElementById('mab-prevSurplus').dataset.value || '0');
    const prevDeficit = parseNum(document.getElementById('mab-prevDeficit').dataset.value || '0');
    const grandTotalIncome = totalIncome + prevSurplus;
    const grandTotalExpense = totalExpense + prevDeficit;
    const netBalance = grandTotalIncome - totalExpense;

    document.getElementById('mab-totalIncome').textContent = '৳' + totalIncome;
    document.getElementById('mab-grandTotalIncome').innerHTML = '<b>৳' + grandTotalIncome + '</b>';
    document.getElementById('mab-totalExpense').textContent = '৳' + totalExpense;
    document.getElementById('mab-grandTotalExpense').innerHTML = '<b>৳' + grandTotalExpense + '</b>';

    const netLabel = netBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি';
    document.getElementById('mab-netBalance').innerHTML = '<b>৳' + Math.abs(netBalance) + ' (' + netLabel + ')</b>';
  }

  // নির্বাচিত মাস/বছরের ঠিক আগের মাসের সর্বশেষ উদ্বৃত্ত/ঘাটতি স্বয়ংক্রিয়ভাবে নিয়ে আসে
  function refreshMabPrevBalance() {
    const month = document.getElementById('mab-month').value;
    const year = document.getElementById('mab-year').value;
    if (!month || !year) return;

    google.script.run
      .withSuccessHandler(function (res) {
        let surplus = 0, deficit = 0;
        if (res.success && res.found) {
          if (res.balance >= 0) surplus = res.balance;
          else deficit = Math.abs(res.balance);
        }
        document.getElementById('mab-prevSurplus').textContent = '৳' + surplus;
        document.getElementById('mab-prevSurplus').dataset.value = surplus;
        document.getElementById('mab-prevDeficit').textContent = '৳' + deficit;
        document.getElementById('mab-prevDeficit').dataset.value = deficit;
        updateMabTotals();
      })
      .withFailureHandler(function () {
        document.getElementById('mab-prevSurplus').dataset.value = 0;
        document.getElementById('mab-prevDeficit').dataset.value = 0;
        updateMabTotals();
      })
      .getPreviousMashikBalance(month, year, _mabId);
  }

  function submitMabForm(actionLabel) {
    const month = document.getElementById('mab-month').value;
    const year = document.getElementById('mab-year').value;
    if (!month || !year) {
      showToast('অনুগ্রহ করে মাস ও বছর নির্বাচন করুন', 'error');
      return;
    }

    const totalIncome = mabSumItems_(_mabIncomeItems);
    const totalExpense = mabSumItems_(_mabExpenseItems);
    const prevSurplus = parseNum(document.getElementById('mab-prevSurplus').dataset.value || '0');
    const prevDeficit = parseNum(document.getElementById('mab-prevDeficit').dataset.value || '0');

    const formData = {
      id: _mabId,
      month: month,
      year: year,
      dhorjoNisab: parseNum(document.getElementById('mab-dhorjoNisab').value),
      incomeItems: _mabIncomeItems.filter(function (r) { return r.name; }),
      expenseItems: _mabExpenseItems.filter(function (r) { return r.name; }),
      totalIncome: totalIncome,
      prevSurplus: prevSurplus,
      grandTotalIncome: totalIncome + prevSurplus,
      totalExpense: totalExpense,
      prevDeficit: prevDeficit,
      grandTotalExpense: totalExpense + prevDeficit,
      balanceDetails: document.getElementById('mab-balanceDetails').value
    };

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          _mabId = res.id;
          loadMabList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveMashikAyByay(formData);
  }

  function resetMabForm() {
    _mabId = '';
    document.getElementById('mab-dhorjoNisab').value = '';
    document.getElementById('mab-balanceDetails').value = '';
    _mabIncomeItems = JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
    _mabExpenseItems = JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
    renderMabIncomeTable();
    renderMabExpenseTable();
    refreshMabPrevBalance();
  }

  function deleteMabForm() {
    if (!_mabId) {
      showToast('প্রথমে তালিকা থেকে একটি এন্ট্রি নির্বাচন করুন', 'error');
      return;
    }
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast('মুছে ফেলা হয়েছে', 'success');
          resetMabForm();
          loadMabList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .deleteMashikAyByay(_mabId);
  }

  function loadMabList() {
    const box = document.getElementById('mabList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success || !res.data.length) {
          box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>';
          return;
        }
        box.innerHTML = '';
        res.data.forEach(function (m) {
          const div = document.createElement('div');
          div.className = 'simple-list-item';
          div.style.cursor = 'pointer';
          div.innerHTML =
            '<span><b>মাস:</b> ' + escapeHtml(m.month) + ' ' + escapeHtml(String(m.year)) + '</span>' +
            '<span><b>সর্বমোট আয়:</b> ৳' + escapeHtml(String(m.grandTotalIncome)) + '</span>' +
            '<span><b>সর্বমোট ব্যয়:</b> ৳' + escapeHtml(String(m.grandTotalExpense)) + '</span>' +
            '<span><b>নীট:</b> ৳' + escapeHtml(String(m.closingBalance)) + '</span>';
          div.addEventListener('click', function () { loadMabRecord(m.id); });
          box.appendChild(div);
        });
      })
      .withFailureHandler(function () {
        box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>';
      })
      .getMashikAyByayList();
  }

  function loadMabRecord(id) {
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
          return;
        }
        const d = res.data;
        _mabId = d.id;
        document.getElementById('mab-month').value = d.month || '';
        document.getElementById('mab-year').value = d.year || '';
        document.getElementById('mab-dhorjoNisab').value = d.dhorjoNisab || '';
        document.getElementById('mab-balanceDetails').value = d.balanceDetails || '';
        _mabIncomeItems = d.incomeItems && d.incomeItems.length ? d.incomeItems : JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
        _mabExpenseItems = d.expenseItems && d.expenseItems.length ? d.expenseItems : JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
        document.getElementById('mab-prevSurplus').textContent = '৳' + (d.prevSurplus || 0);
        document.getElementById('mab-prevSurplus').dataset.value = d.prevSurplus || 0;
        document.getElementById('mab-prevDeficit').textContent = '৳' + (d.prevDeficit || 0);
        document.getElementById('mab-prevDeficit').dataset.value = d.prevDeficit || 0;
        renderMabIncomeTable();
        renderMabExpenseTable();
        showToast('ফরমে লোড করা হয়েছে', 'success');
      })
      .withFailureHandler(function (err) {
        showToast('তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getMashikAyByayById(id);
  }

  function printMabForm() {
    document.getElementById('mabprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('mabprint-monthYear').textContent = 'মাস: ' + (document.getElementById('mab-month').value || '—') + '   বছর: ' + (document.getElementById('mab-year').value || '—');
    document.getElementById('mabprint-dhorjoNisab').textContent = document.getElementById('mab-dhorjoNisab').value ? ('৳' + document.getElementById('mab-dhorjoNisab').value) : '—';

    // নির্বাচনভিত্তিক কার্যক্রম সেকশন পূরণ (ফরমের একই কার্ড থেকে)
    MABEL_FIELD_IDS.forEach(function (key) {
      const suffix = MABEL_ID_MAP[key].replace('mabel-', '');
      const target = document.getElementById('mabprint-' + suffix);
      const source = document.getElementById(MABEL_ID_MAP[key]);
      if (target) target.textContent = (source && source.value) ? source.value : '—';
    });

    const totalIncome = mabSumItems_(_mabIncomeItems);
    const totalExpense = mabSumItems_(_mabExpenseItems);
    const prevSurplus = parseNum(document.getElementById('mab-prevSurplus').dataset.value || '0');
    const prevDeficit = parseNum(document.getElementById('mab-prevDeficit').dataset.value || '0');

    let incomeRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    _mabIncomeItems.filter(function (r) { return r.name; }).forEach(function (r) {
      incomeRows += '<tr><td>' + escapeHtml(r.name) + '</td><td>৳' + escapeHtml(String(r.amount || 0)) + '</td></tr>';
    });
    incomeRows += '<tr><td><b>মোট আয়</b></td><td><b>৳' + totalIncome + '</b></td></tr>';
    incomeRows += '<tr><td>গত মাসের উদ্বৃত্ত</td><td>৳' + prevSurplus + '</td></tr>';
    incomeRows += '<tr><td><b>সর্বমোট আয়</b></td><td><b>৳' + (totalIncome + prevSurplus) + '</b></td></tr>';
    document.getElementById('mabprint-incomeTable').innerHTML = incomeRows;

    let expenseRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    _mabExpenseItems.filter(function (r) { return r.name; }).forEach(function (r) {
      expenseRows += '<tr><td>' + escapeHtml(r.name) + '</td><td>৳' + escapeHtml(String(r.amount || 0)) + '</td></tr>';
    });
    expenseRows += '<tr><td><b>মোট ব্যয়</b></td><td><b>৳' + totalExpense + '</b></td></tr>';
    expenseRows += '<tr><td>গত মাসের ঘাটতি</td><td>৳' + prevDeficit + '</td></tr>';
    expenseRows += '<tr><td><b>সর্বমোট ব্যয়</b></td><td><b>৳' + (totalExpense + prevDeficit) + '</b></td></tr>';
    document.getElementById('mabprint-expenseTable').innerHTML = expenseRows;

    document.getElementById('mabprint-balanceDetails').textContent = document.getElementById('mab-balanceDetails').value || '—';

    printViaWindow('mabPrintTemplate');
  }

  // ==================== জাতীয় ও স্থানীয় নির্বাচনভিত্তিক কার্যক্রম ====================
  const MABEL_FIELD_IDS = [
    'pouWard', 'pouCandidate', 'pouParticipation', 'pouMayor', 'pouCouncillor', 'pouRunnerup',
    'uniWard', 'uniCandidate', 'uniParticipation', 'uniMayor', 'uniCouncillor', 'uniRunnerup',
    'centerTotal', 'centerGrowth', 'unitTotal', 'unitGrowth', 'unitTarget', 'meetingCount'
  ];

  const MABEL_ID_MAP = {
    pouWard: 'mabel-pou-ward', pouCandidate: 'mabel-pou-candidate', pouParticipation: 'mabel-pou-participation',
    pouMayor: 'mabel-pou-mayor', pouCouncillor: 'mabel-pou-councillor', pouRunnerup: 'mabel-pou-runnerup',
    uniWard: 'mabel-uni-ward', uniCandidate: 'mabel-uni-candidate', uniParticipation: 'mabel-uni-participation',
    uniMayor: 'mabel-uni-mayor', uniCouncillor: 'mabel-uni-councillor', uniRunnerup: 'mabel-uni-runnerup',
    centerTotal: 'mabel-center-total', centerGrowth: 'mabel-center-growth',
    unitTotal: 'mabel-unit-total', unitGrowth: 'mabel-unit-growth', unitTarget: 'mabel-unit-target',
    meetingCount: 'mabel-meetingCount'
  };

  function initMashikNirbachon() {
    if (!document.getElementById('mabel-year').value) {
      document.getElementById('mabel-year').value = new Date().getFullYear();
    }

    document.getElementById('mabel-month').addEventListener('change', loadMashikNirbachon);
    document.getElementById('mabel-year').addEventListener('change', loadMashikNirbachon);
    document.getElementById('mabelSaveBtn').addEventListener('click', saveMashikNirbachonForm);
    document.getElementById('mabelResetBtn').addEventListener('click', resetMashikNirbachonForm);

    loadMashikNirbachon();
  }

  function loadMashikNirbachon() {
    const month = document.getElementById('mabel-month').value;
    const year = document.getElementById('mabel-year').value;
    if (!month || !year) return;

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success && res.data) {
          MABEL_FIELD_IDS.forEach(function (key) {
            document.getElementById(MABEL_ID_MAP[key]).value = res.data[key] || '';
          });
        } else {
          resetMashikNirbachonForm(true);
        }
      })
      .withFailureHandler(function () {
        resetMashikNirbachonForm(true);
      })
      .getMashikNirbachonByMonth(month, year);
  }

  function resetMashikNirbachonForm(skipMonthYear) {
    MABEL_FIELD_IDS.forEach(function (key) {
      document.getElementById(MABEL_ID_MAP[key]).value = '';
    });
    if (!skipMonthYear) {
      showToast('রিসেট করা হয়েছে', 'success');
    }
  }

  function saveMashikNirbachonForm() {
    const month = document.getElementById('mabel-month').value;
    const year = document.getElementById('mabel-year').value;
    if (!month || !year) {
      showToast('অনুগ্রহ করে মাস ও বছর নির্বাচন করুন', 'error');
      return;
    }

    const formData = { month: month, year: year };
    MABEL_FIELD_IDS.forEach(function (key) {
      formData[key] = document.getElementById(MABEL_ID_MAP[key]).value;
    });

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast('সংরক্ষণ সম্পন্ন হয়েছে', 'success');
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveMashikNirbachon(formData);
  }

  // ==================== ধাপ ৭ (উইজার্ড): নির্বাচনভিত্তিক কার্যক্রম ও বায়তুলমাল ====================
  // এই ধাপের ডাটা "বায়তুলমাল ➜ মাসিক আয়-ব্যয়" পেজের সাথে অভিন্ন (একই MashikNirbachonKarjokrom ও
  // MashikAyByay শীট, একই মাস/বছর দিয়ে খোঁজা হয়) — শুধু উইজার্ডের নিজস্ব mrep-month/mrep-year ব্যবহার করে।
  const MREP7EL_ID_MAP = {
    pouWard: 'mrep7el-pou-ward', pouCandidate: 'mrep7el-pou-candidate', pouParticipation: 'mrep7el-pou-participation',
    pouMayor: 'mrep7el-pou-mayor', pouCouncillor: 'mrep7el-pou-councillor', pouRunnerup: 'mrep7el-pou-runnerup',
    uniWard: 'mrep7el-uni-ward', uniCandidate: 'mrep7el-uni-candidate', uniParticipation: 'mrep7el-uni-participation',
    uniMayor: 'mrep7el-uni-mayor', uniCouncillor: 'mrep7el-uni-councillor', uniRunnerup: 'mrep7el-uni-runnerup',
    centerTotal: 'mrep7el-center-total', centerGrowth: 'mrep7el-center-growth',
    unitTotal: 'mrep7el-unit-total', unitGrowth: 'mrep7el-unit-growth', unitTarget: 'mrep7el-unit-target',
    meetingCount: 'mrep7el-meetingCount'
  };

  let _mrep7MabId = '';
  let _mrep7IncomeItems = [];
  let _mrep7ExpenseItems = [];

  function initMrep7Bayt_() {
    _mrep7IncomeItems = JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
    _mrep7ExpenseItems = JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
    renderMrep7IncomeTable();
    renderMrep7ExpenseTable();

    document.getElementById('mrep7IncomeAddRowBtn').addEventListener('click', function () {
      _mrep7IncomeItems.push({ name: '', amount: '' });
      renderMrep7IncomeTable();
    });
    document.getElementById('mrep7ExpenseAddRowBtn').addEventListener('click', function () {
      _mrep7ExpenseItems.push({ name: '', amount: '' });
      renderMrep7ExpenseTable();
    });
  }

  function renderMrep7IncomeTable() {
    const body = document.getElementById('mrep7IncomeBody');
    body.innerHTML = '';
    _mrep7IncomeItems.forEach(function (item, idx) {
      body.appendChild(buildMabRow(item, idx, _mrep7IncomeItems, renderMrep7IncomeTable));
    });
    updateMrep7Totals();
  }

  function renderMrep7ExpenseTable() {
    const body = document.getElementById('mrep7ExpenseBody');
    body.innerHTML = '';
    _mrep7ExpenseItems.forEach(function (item, idx) {
      body.appendChild(buildMabRow(item, idx, _mrep7ExpenseItems, renderMrep7ExpenseTable));
    });
    updateMrep7Totals();
  }

  function updateMrep7Totals() {
    const totalIncome = mabSumItems_(_mrep7IncomeItems);
    const totalExpense = mabSumItems_(_mrep7ExpenseItems);
    const prevSurplus = parseNum(document.getElementById('mrep7-prevSurplus').dataset.value || '0');
    const prevDeficit = parseNum(document.getElementById('mrep7-prevDeficit').dataset.value || '0');
    const grandTotalIncome = totalIncome + prevSurplus;
    const grandTotalExpense = totalExpense + prevDeficit;
    const netBalance = grandTotalIncome - totalExpense;

    document.getElementById('mrep7-totalIncome').textContent = '৳' + totalIncome;
    document.getElementById('mrep7-grandTotalIncome').innerHTML = '<b>৳' + grandTotalIncome + '</b>';
    document.getElementById('mrep7-totalExpense').textContent = '৳' + totalExpense;
    document.getElementById('mrep7-grandTotalExpense').innerHTML = '<b>৳' + grandTotalExpense + '</b>';

    const netLabel = netBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি';
    document.getElementById('mrep7-netBalance').innerHTML = '<b>৳' + Math.abs(netBalance) + ' (' + netLabel + ')</b>';
  }

  function refreshMrep7PrevBalance_(month, year) {
    return gsRun_('getPreviousMashikBalance', [month, year, _mrep7MabId]).then(function (res) {
      let surplus = 0, deficit = 0;
      if (res.success && res.found) {
        if (res.balance >= 0) surplus = res.balance;
        else deficit = Math.abs(res.balance);
      }
      document.getElementById('mrep7-prevSurplus').textContent = '৳' + surplus;
      document.getElementById('mrep7-prevSurplus').dataset.value = surplus;
      document.getElementById('mrep7-prevDeficit').textContent = '৳' + deficit;
      document.getElementById('mrep7-prevDeficit').dataset.value = deficit;
      updateMrep7Totals();
    }).catch(function () {
      document.getElementById('mrep7-prevSurplus').dataset.value = 0;
      document.getElementById('mrep7-prevDeficit').dataset.value = 0;
      updateMrep7Totals();
    });
  }

  function resetMrep7Bayt_() {
    MABEL_FIELD_IDS.forEach(function (key) {
      document.getElementById(MREP7EL_ID_MAP[key]).value = '';
    });
    _mrep7MabId = '';
    document.getElementById('mrep7-dhorjoNisab').value = '';
    document.getElementById('mrep7-balanceDetails').value = '';
    _mrep7IncomeItems = JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
    _mrep7ExpenseItems = JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
    renderMrep7IncomeTable();
    renderMrep7ExpenseTable();
    document.getElementById('mrep7-prevSurplus').textContent = '৳0';
    document.getElementById('mrep7-prevSurplus').dataset.value = 0;
    document.getElementById('mrep7-prevDeficit').textContent = '৳0';
    document.getElementById('mrep7-prevDeficit').dataset.value = 0;
    updateMrep7Totals();
  }

  function loadMrep7Bayt_() {
    const month = document.getElementById('mrep-month').value;
    const year = document.getElementById('mrep-year').value;
    if (!month || !year) { resetMrep7Bayt_(); return; }

    gsRun_('getMashikNirbachonByMonth', [month, year]).then(function (res) {
      MABEL_FIELD_IDS.forEach(function (key) {
        document.getElementById(MREP7EL_ID_MAP[key]).value = (res.success && res.data) ? (res.data[key] || '') : '';
      });
    }).catch(function () {
      MABEL_FIELD_IDS.forEach(function (key) {
        document.getElementById(MREP7EL_ID_MAP[key]).value = '';
      });
    });

    gsRun_('getMashikAyByayByMonth', [month, year]).then(function (res) {
      const d = (res && res.success) ? res.data : null;
      _mrep7MabId = d ? d.id : '';
      document.getElementById('mrep7-dhorjoNisab').value = d ? (d.dhorjoNisab || '') : '';
      document.getElementById('mrep7-balanceDetails').value = d ? (d.balanceDetails || '') : '';
      _mrep7IncomeItems = (d && d.incomeItems && d.incomeItems.length) ? d.incomeItems : JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
      _mrep7ExpenseItems = (d && d.expenseItems && d.expenseItems.length) ? d.expenseItems : JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
      renderMrep7IncomeTable();
      renderMrep7ExpenseTable();
      refreshMrep7PrevBalance_(month, year);
    }).catch(function () {
      _mrep7MabId = '';
      _mrep7IncomeItems = JSON.parse(JSON.stringify(MAB_DEFAULT_INCOME_ITEMS));
      _mrep7ExpenseItems = JSON.parse(JSON.stringify(MAB_DEFAULT_EXPENSE_ITEMS));
      renderMrep7IncomeTable();
      renderMrep7ExpenseTable();
      refreshMrep7PrevBalance_(month, year);
    });
  }

  function saveMrep7Bayt_() {
    const month = document.getElementById('mrep-month').value;
    const year = document.getElementById('mrep-year').value;
    if (!month || !year) {
      showToast('অনুগ্রহ করে মাস ও সন নির্বাচন করুন', 'error');
      return;
    }

    const elFormData = { month: month, year: year };
    MABEL_FIELD_IDS.forEach(function (key) {
      elFormData[key] = document.getElementById(MREP7EL_ID_MAP[key]).value;
    });
    gsRun_('saveMashikNirbachon', [elFormData]).then(function (res) {
      if (!res.success) showToast('নির্বাচনভিত্তিক কার্যক্রম সংরক্ষণে সমস্যা হয়েছে: ' + res.error, 'error');
    }).catch(function (err) {
      showToast('নির্বাচনভিত্তিক কার্যক্রম সংরক্ষণে সমস্যা হয়েছে: ' + err.message, 'error');
    });

    const totalIncome = mabSumItems_(_mrep7IncomeItems);
    const totalExpense = mabSumItems_(_mrep7ExpenseItems);
    const prevSurplus = parseNum(document.getElementById('mrep7-prevSurplus').dataset.value || '0');
    const prevDeficit = parseNum(document.getElementById('mrep7-prevDeficit').dataset.value || '0');

    const formData = {
      id: _mrep7MabId || '',
      month: month,
      year: year,
      dhorjoNisab: parseNum(document.getElementById('mrep7-dhorjoNisab').value),
      incomeItems: _mrep7IncomeItems.filter(function (r) { return r.name; }),
      expenseItems: _mrep7ExpenseItems.filter(function (r) { return r.name; }),
      totalIncome: totalIncome,
      prevSurplus: prevSurplus,
      grandTotalIncome: totalIncome + prevSurplus,
      totalExpense: totalExpense,
      prevDeficit: prevDeficit,
      grandTotalExpense: totalExpense + prevDeficit,
      balanceDetails: document.getElementById('mrep7-balanceDetails').value
    };

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          _mrep7MabId = res.id || _mrep7MabId;
          showToast('৭ম ধাপ (নির্বাচনভিত্তিক কার্যক্রম ও বায়তুলমাল) সংরক্ষণ সম্পন্ন হয়েছে', 'success');
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveMashikAyByay(formData);
  }

  // ==================== সাংগঠনিক রিপোর্ট (উইজার্ড, ৭ ধাপ) ====================
  let _mrepCurrentStep = 1;

  // প্রতিটি ইনপুট আইডি — ধাপ ১ এর সব ইনপুট এখান থেকে সংরক্ষণ/লোড হয়
  const MREP_STEP1_IDS = [
    'mrep1-totalDawat', 'mrep1-totalJonoshokti', 'mrep1-target',
    'mrep1-g1-total', 'mrep1-g1-male', 'mrep1-g1-female',
    'mrep1-g2-total', 'mrep1-g2-male', 'mrep1-g2-female',
    'mrep1-g3-total', 'mrep1-g3-male', 'mrep1-g3-female',
    'mrep1-g4-total', 'mrep1-g4-male', 'mrep1-g4-female',
    'mrep1-h1-pm', 'mrep1-h1-pk', 'mrep1-h1-mm', 'mrep1-h1-mk',
    'mrep1-h2-pm', 'mrep1-h2-pk', 'mrep1-h2-mm', 'mrep1-h2-mk',
    'mrep1-h3-total', 'mrep1-h3-male', 'mrep1-h3-female',
    'mrep1-h4-total', 'mrep1-h4-male', 'mrep1-h4-female',
    'mrep1-i1-total', 'mrep1-i1-male', 'mrep1-i1-female',
    'mrep1-i2-total', 'mrep1-i2-male', 'mrep1-i2-female',
    'mrep1-j1-group-m', 'mrep1-j1-group-f', 'mrep1-j1-part-m', 'mrep1-j1-part-f', 'mrep1-j1-dawat-m', 'mrep1-j1-dawat-f', 'mrep1-j1-sohojogi-m', 'mrep1-j1-sohojogi-f',
    'mrep1-j2-group', 'mrep1-j2-part', 'mrep1-j2-dawat', 'mrep1-j2-sohojogi',
    'mrep1-j3-group-m', 'mrep1-j3-group-f', 'mrep1-j3-part-m', 'mrep1-j3-part-f', 'mrep1-j3-dawat-m', 'mrep1-j3-dawat-f', 'mrep1-j3-sohojogi-m', 'mrep1-j3-sohojogi-f',
    'mrep1-j4-group-m', 'mrep1-j4-group-f', 'mrep1-j4-part-m', 'mrep1-j4-part-f', 'mrep1-j4-dawat-m', 'mrep1-j4-dawat-f', 'mrep1-j4-sohojogi-m', 'mrep1-j4-sohojogi-f',
    'mrep1-j5-group', 'mrep1-j5-part', 'mrep1-j5-dawat', 'mrep1-j5-sohojogi',
    'mrep1-a1-rp', 'mrep1-a1-rm', 'mrep1-a1-kp', 'mrep1-a1-km', 'mrep1-a1-total',
    'mrep1-a2-rp', 'mrep1-a2-rm', 'mrep1-a2-kp', 'mrep1-a2-km', 'mrep1-a2-total',
    'mrep1-a3-total', 'mrep1-a3-students', 'mrep1-a3-tilawat', 'mrep1-a3-dawat-m', 'mrep1-a3-dawat-f',
    'mrep1-a4-total', 'mrep1-a4-students', 'mrep1-a4-sohojogi-m', 'mrep1-a4-sohojogi-f',
    'mrep1-a5-total', 'mrep1-a5-male', 'mrep1-a5-female', 'mrep1-a5-growthTotal', 'mrep1-a5-growth-male', 'mrep1-a5-growth-female'
  ];

  // "মোট" = পুরুষ + মহিলা অটো-সমষ্টি হওয়া তিন-কলাম টেবিলের (মোট/পুরুষ/মহিলা) মোট ফিল্ড ও সোর্স ফিল্ডগুলোর তালিকা
  const MREP1_MF_SUM_ROWS = [
    ['mrep1-g1-total', 'mrep1-g1-male', 'mrep1-g1-female'],
    ['mrep1-g2-total', 'mrep1-g2-male', 'mrep1-g2-female'],
    ['mrep1-g3-total', 'mrep1-g3-male', 'mrep1-g3-female'],
    ['mrep1-g4-total', 'mrep1-g4-male', 'mrep1-g4-female'],
    ['mrep1-h3-total', 'mrep1-h3-male', 'mrep1-h3-female'],
    ['mrep1-h4-total', 'mrep1-h4-male', 'mrep1-h4-female'],
    ['mrep1-i1-total', 'mrep1-i1-male', 'mrep1-i1-female'],
    ['mrep1-i2-total', 'mrep1-i2-male', 'mrep1-i2-female'],
    ['mrep1-a5-growthTotal', 'mrep1-a5-growth-male', 'mrep1-a5-growth-female']
  ];

  // দাওয়াত ও তাবলীগের 'ক' এর অধীনে ক্রমিক ১-৪ নং টেবিলের "কতজনের নিকট দাওয়াত পৌঁছানো হয়েছে" এর মোট মান যোগ করে সর্বমোট বসে
  const MREP1_DAWAT_SOURCE_IDS = ['mrep1-g3-total', 'mrep1-h3-total', 'mrep1-i1-total', 'mrep1-j1-dawat-m', 'mrep1-j1-dawat-f', 'mrep1-j2-dawat', 'mrep1-j3-dawat-m', 'mrep1-j3-dawat-f', 'mrep1-j4-dawat-m', 'mrep1-j4-dawat-f', 'mrep1-j5-dawat'];

  // "সর্বমোট মুয়াল্লিম/মুয়াল্লিমা সংখ্যা" = পুরুষ + মহিলা + বৃদ্ধি সংখ্যা (পুরুষ) + বৃদ্ধি সংখ্যা (মহিলা) — অর্থাৎ ২,৩,৪,৫ নং ইনপুট কলামের যোগফল
  function updateMrep1A5Total_() {
    const sum = parseNum(document.getElementById('mrep1-a5-male').value)
      + parseNum(document.getElementById('mrep1-a5-female').value)
      + parseNum(document.getElementById('mrep1-a5-growth-male').value)
      + parseNum(document.getElementById('mrep1-a5-growth-female').value);
    document.getElementById('mrep1-a5-total').value = sum;
  }

  function initMrep1AutoSums() {
    // "মোট" = পুরুষ + মহিলা — মান বসানোর সাথে সাথেই উপরের সর্বমোট দাওয়াত সংখ্যাও রিফ্রেশ হবে
    MREP1_MF_SUM_ROWS.forEach(function (row) {
      const totalId = row[0], maleId = row[1], femaleId = row[2];
      [maleId, femaleId].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () {
          document.getElementById(totalId).value = parseNum(document.getElementById(maleId).value) + parseNum(document.getElementById(femaleId).value);
          updateMrep1TotalDawat();
        });
      });
    });

    ['mrep1-a5-male', 'mrep1-a5-female', 'mrep1-a5-growth-male', 'mrep1-a5-growth-female'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', updateMrep1A5Total_);
    });
  }

  const MREP_STEP3_IDS = ['mrep3-c1-total', 'mrep3-c1-target', 'mrep3-c1-avg', 'mrep3-c2-total', 'mrep3-c2-target', 'mrep3-c2-avg', 'mrep3-c3-total', 'mrep3-c3-target', 'mrep3-c3-avg', 'mrep3-c4-total', 'mrep3-c4-target', 'mrep3-c4-avg', 'mrep3-c5-total', 'mrep3-c5-target', 'mrep3-c5-avg', 'mrep3-c6-total', 'mrep3-c6-target', 'mrep3-c6-avg', 'mrep3-c7-total', 'mrep3-c7-target', 'mrep3-c7-avg', 'mrep3-c8-total', 'mrep3-c8-target', 'mrep3-c8-avg', 'mrep3-c9-total', 'mrep3-c9-target', 'mrep3-c9-avg'];

  function collectMrepStep3Data_() {
    const data = {};
    MREP_STEP3_IDS.forEach(function (id) { data[id] = document.getElementById(id).value; });
    mrep4JonoshoktiFieldIds_().forEach(function (id) { data[id] = document.getElementById(id).value; });
    return data;
  }
  function applyMrepStep3Data_(data) {
    MREP_STEP3_IDS.forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
    mrep4JonoshoktiFieldIds_().forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
    updateMrep4B3Total();
  }
  function resetMrepStep3_() {
    MREP_STEP3_IDS.forEach(function (id) { document.getElementById(id).value = ''; });
    mrep4JonoshoktiFieldIds_().forEach(function (id) { document.getElementById(id).value = ''; });
  }

  // ---------- ধাপ ৩-এ (জনশক্তি/সহযোগী সদস্য/বিভাগভিত্তিক), ধাপ ৪-এ (সাংগঠনিক কাঠামো), ধাপ ৫-এ (বৈঠকাদি) — গতিশীল টেবিল রেন্ডার ----------
  const MREP4_C_CATEGORIES = [
    { key: 'mohila', label: 'মহিলা', types: ['sodossho', 'kormi', 'sohojogi'] },
    { key: 'shrom', label: 'শ্রম', types: ['sodossho', 'kormi', 'sohojogi'] },
    { key: 'ulama', label: 'উলামা', types: ['sodossho', 'kormi', 'sohojogi'] },
    { key: 'peshajibi', label: 'পেশাজীবী', types: ['sodossho', 'kormi', 'sohojogi'] },
    { key: 'jubo', label: 'যুব', types: ['sodossho', 'kormi', 'sohojogi'] },
    { key: 'vinnodhormo', label: 'ভিন্নধর্মাবলম্বী', types: ['kormi', 'sohojogi'] }
  ];
  const MREP4_TYPE_LABELS = { sodossho: 'সদস্য (রুকন)', kormi: 'কর্মী', sohojogi: 'সহযোগী সদস্য' };

  const MREP4_D_ROWS = [
    { key: 'd1', label: 'পৌরসভা/ইউনিয়নের মোট প্রশাসনিক ওয়ার্ড' },
    { key: 'd2', label: 'পৌরসভা/ইউনিয়নের মোট সংগঠিত ওয়ার্ড' },
    { key: 'd3', label: 'পৌর:/ইউ: মোট সাংগঠনিক ওয়ার্ড (পুরুষ)' },
    { key: 'd4', label: 'পৌর:/ইউ: মোট সাংগঠনিক ওয়ার্ড (মহিলা)' },
    { key: 'd5', label: 'অন্যান্য সাংগঠনিক ওয়ার্ড' },
    { key: 'd6', label: 'সাংগঠনিক ওয়ার্ড (উলামা)' },
    { key: 'd7', label: 'সাংগঠনিক ওয়ার্ড (পেশাজীবী)' },
    { key: 'd8', label: 'সাংগঠনিক ওয়ার্ড (যুব)' },
    { key: 'd9', label: 'সাংগঠনিক ওয়ার্ড (শ্রম)' },
    { key: 'd10', label: 'সাংগঠনিক ওয়ার্ড (মিডিয়া)' },
    { key: 'd11', label: 'সাধারণ ইউনিট (পুরুষ)', isUnit: true },
    { key: 'd12', label: 'সাধারণ ইউনিট (মহিলা)', isUnit: true },
    { key: 'd13', label: 'উলামা ইউনিট', isUnit: true },
    { key: 'd14', label: 'পেশাজীবী ইউনিট (পুরুষ)', isUnit: true },
    { key: 'd15', label: 'পেশাজীবী ইউনিট (মহিলা)', isUnit: true },
    { key: 'd16', label: 'কর্মজীবী ইউনিট (মহিলা)', isUnit: true },
    { key: 'd17', label: 'যুব ইউনিট', isUnit: true },
    { key: 'd18', label: 'শ্রম ইউনিট (পুরুষ)', isUnit: true },
    { key: 'd19', label: 'শ্রম ইউনিট (মহিলা)', isUnit: true },
    { key: 'd20', label: 'মিডিয়া ইউনিট', isUnit: true }
  ];
  const MREP4_D_UNIT_KEYS = MREP4_D_ROWS.filter(function (r) { return r.isUnit; }).map(function (r) { return r.key; });

  const MREP4_J_ROWS = [
    { key: 'j1', label: 'মজলিসে শূরা বৈঠক' },
    { key: 'j2', label: 'কর্মপরিষদ/টিম বৈঠক' },
    { key: 'j3', label: 'মাসিক সদস্য (রুকন) বৈঠক' },
    { key: 'j4', label: 'পৌরসভা/ইউনিয়ন বৈঠক' },
    { key: 'j5', label: 'ইউনিটে মোট কর্মী বৈঠক' },
    { key: 'j6', label: 'উলামা/শ্রমিক/যুব বৈঠক/সমাবেশ' }
  ];

  // ধাপ ৩-এ সংরক্ষিত হয় (জনশক্তি + সহযোগী সদস্য + বিভাগভিত্তিক তথ্য)
  const MREP4_JONOSHOKTI_STATIC_IDS = [
    'mrep4-a1-prev', 'mrep4-a1-now', 'mrep4-a1-growth', 'mrep4-a1-shortage', 'mrep4-a1-target', 'mrep4-a1-rate',
    'mrep4-a2-prev', 'mrep4-a2-now', 'mrep4-a2-growth', 'mrep4-a2-shortage', 'mrep4-a2-target', 'mrep4-a2-rate',
    'mrep4-b1-prev', 'mrep4-b1-now', 'mrep4-b1-growth', 'mrep4-b1-shortage', 'mrep4-b1-target', 'mrep4-b1-rate',
    'mrep4-b2-prev', 'mrep4-b2-now', 'mrep4-b2-growth', 'mrep4-b2-shortage', 'mrep4-b2-target', 'mrep4-b2-rate',
    'mrep4-b3-prev', 'mrep4-b3-now'
  ];

  // ধাপ ৪-এ সংরক্ষিত হয় (সাংগঠনিক কাঠামো ওয়ার্ড/ইউনিট + দাওয়াতি-পারিবারিক ইউনিট + এমারত + বিদায়ী ছাত্র-ছাত্রী + সফর + এয়ানত দাতা)
  const MREP4_KATHAMO_STATIC_IDS = [
    'mrep4-e1-prev', 'mrep4-e1-now', 'mrep4-e1-growth', 'mrep4-e1-shortage', 'mrep4-e1-target', 'mrep4-e1-rate',
    'mrep4-e2-prev', 'mrep4-e2-now', 'mrep4-e2-growth', 'mrep4-e2-shortage', 'mrep4-e2-target', 'mrep4-e2-rate',
    'mrep4-f1-count', 'mrep4-f1-growth',
    'mrep4-g1', 'mrep4-g2', 'mrep4-g3',
    'mrep4-h1', 'mrep4-h2', 'mrep4-h3',
    'mrep4-i1-count', 'mrep4-i1-amount', 'mrep4-i2-count', 'mrep4-i2-amount'
  ];

  function mrep4JonoshoktiFieldIds_() {
    const ids = MREP4_JONOSHOKTI_STATIC_IDS.slice();
    MREP4_C_CATEGORIES.forEach(function (cat) {
      cat.types.forEach(function (type) {
        const base = 'mrep4-c-' + cat.key + '-' + type;
        ['prev', 'now', 'growth', 'shortage', 'target', 'rate'].forEach(function (f) { ids.push(base + '-' + f); });
      });
    });
    return ids;
  }

  function mrep4KathamoFieldIds_() {
    const ids = MREP4_KATHAMO_STATIC_IDS.slice();
    MREP4_D_ROWS.forEach(function (row) {
      const base = 'mrep4-' + row.key;
      ['prev', 'now', 'growth', 'shortage', 'target', 'rate'].forEach(function (f) { ids.push(base + '-' + f); });
    });
    ids.push('mrep4-d-unitTotal');
    return ids;
  }

  function mrep4BoithokFieldIds_() {
    const ids = [];
    MREP4_J_ROWS.forEach(function (row) {
      const base = 'mrep4-' + row.key;
      ['mp', 'mf', 'tp', 'tf', 'ap', 'af'].forEach(function (f) { ids.push(base + '-' + f); });
    });
    return ids;
  }

  function mrepDiffCell_(base) {
    return '<td><input type="text" id="' + base + '-prev" class="mrep-diff-src" data-target="' + base + '"></td>'
      + '<td><input type="text" id="' + base + '-now" class="mrep-diff-src" data-target="' + base + '"></td>'
      + '<td><input type="text" id="' + base + '-growth" readonly style="background:#f3f4f6;"></td>'
      + '<td><input type="text" id="' + base + '-shortage" readonly style="background:#f3f4f6;"></td>'
      + '<td><input type="text" id="' + base + '-target" class="mrep-rate-src" data-actual="' + base + '-now" data-target-rate="' + base + '-rate"></td>'
      + '<td><input type="text" id="' + base + '-rate" readonly style="background:#f3f4f6;"></td>';
  }

  function renderMrep4CTable() {
    let html = '';
    MREP4_C_CATEGORIES.forEach(function (cat) {
      cat.types.forEach(function (type, idx) {
        const base = 'mrep4-c-' + cat.key + '-' + type;
        html += '<tr>';
        if (idx === 0) html += '<td rowspan="' + cat.types.length + '"><b>' + cat.label + '</b></td>';
        html += '<td>' + MREP4_TYPE_LABELS[type] + '</td>';
        html += mrepDiffCell_(base);
        html += '</tr>';
      });
    });
    document.getElementById('mrep4-c-body').innerHTML = html;
  }

  function renderMrep4DTable() {
    let html = '';
    MREP4_D_ROWS.forEach(function (row) {
      const base = 'mrep4-' + row.key;
      html += '<tr><td>' + row.label + '</td>' + mrepDiffCell_(base) + '</tr>';
    });
    html += '<tr><td><b>সর্বমোট ইউনিট</b></td><td>—</td><td><input type="text" id="mrep4-d-unitTotal" readonly style="background:#f3f4f6;"></td><td colspan="4">—</td></tr>';
    document.getElementById('mrep4-d-body').innerHTML = html;
  }

  function renderMrep4JTable() {
    let html = '';
    MREP4_J_ROWS.forEach(function (row) {
      const base = 'mrep4-' + row.key;
      html += '<tr><td>' + row.label + '</td>'
        + '<td><input type="text" id="' + base + '-mp"></td>'
        + '<td><input type="text" id="' + base + '-mf"></td>'
        + '<td><input type="text" id="' + base + '-tp"></td>'
        + '<td><input type="text" id="' + base + '-tf"></td>'
        + '<td><input type="text" id="' + base + '-ap"></td>'
        + '<td><input type="text" id="' + base + '-af"></td></tr>';
    });
    document.getElementById('mrep4-j-body').innerHTML = html;
  }

  function updateMrep4DUnitTotal() {
    let sum = 0;
    MREP4_D_UNIT_KEYS.forEach(function (key) {
      sum += parseNum(document.getElementById('mrep4-' + key + '-now').value);
    });
    document.getElementById('mrep4-d-unitTotal').value = sum;
  }

  function updateMrep4B3Total() {
    const sum = parseNum(document.getElementById('mrep1-g4-total').value)
      + parseNum(document.getElementById('mrep1-h4-total').value)
      + parseNum(document.getElementById('mrep1-i2-total').value);
    document.getElementById('mrep4-b3-now').value = sum;
  }

  function initMrepStep4Calc() {
    renderMrep4CTable();
    renderMrep4DTable();
    renderMrep4JTable();

    MREP4_D_UNIT_KEYS.forEach(function (key) {
      document.getElementById('mrep4-' + key + '-now').addEventListener('input', updateMrep4DUnitTotal);
    });

    ['mrep1-g4-total', 'mrep1-h4-total', 'mrep1-i2-total'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', updateMrep4B3Total);
    });
  }

  function collectMrepStep4Data_() {
    const data = {};
    mrep4KathamoFieldIds_().forEach(function (id) { data[id] = document.getElementById(id).value; });
    return data;
  }
  function applyMrepStep4Data_(data) {
    mrep4KathamoFieldIds_().forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
    updateMrep4DUnitTotal();
  }
  function resetMrepStep4_() {
    mrep4KathamoFieldIds_().forEach(function (id) { document.getElementById(id).value = ''; });
  }
  const MREP_STEP2_IDS = ['mrep2-b1-total', 'mrep2-b1-growth', 'mrep2-b1-dawat', 'mrep2-b1-sohojogi', 'mrep2-b2-total', 'mrep2-b2-growth', 'mrep2-b3-total', 'mrep2-b3-growth', 'mrep2-c1', 'mrep2-c2', 'mrep2-c2-growth', 'mrep2-c3', 'mrep2-c4', 'mrep2-c4-growth', 'mrep2-c5', 'mrep2-c5-growth', 'mrep2-d1-dawat', 'mrep2-d1-sohojogi', 'mrep2-d1-target', 'mrep2-d1-rate', 'mrep2-d2-dawat', 'mrep2-d2-sohojogi', 'mrep2-d2-target', 'mrep2-d2-rate', 'mrep2-d3-dawat', 'mrep2-d3-sohojogi', 'mrep2-d3-target', 'mrep2-d3-rate', 'mrep2-d4-dawat', 'mrep2-d4-sohojogi', 'mrep2-d4-target', 'mrep2-d4-rate', 'mrep2-d5-dawat', 'mrep2-d5-sohojogi', 'mrep2-d5-target', 'mrep2-d5-rate', 'mrep2-d6-dawat', 'mrep2-d6-sohojogi', 'mrep2-d6-target', 'mrep2-d6-rate', 'mrep2-e1', 'mrep2-e2', 'mrep2-f1-total', 'mrep2-f1-growth', 'mrep2-f2-total', 'mrep2-f2-growth', 'mrep2-f3-total', 'mrep2-f3-growth', 'mrep2-f4-total', 'mrep2-f4-growth', 'mrep2-f5-total', 'mrep2-f5-growth', 'mrep2-g1', 'mrep2-g2', 'mrep2-h1', 'mrep2-h2', 'mrep2-h3', 'mrep3-a1-total', 'mrep3-a1-growth', 'mrep3-a1-target', 'mrep3-a2-total', 'mrep3-a2-growth', 'mrep3-a2-target', 'mrep3-a3-total', 'mrep3-a3-growth', 'mrep3-a3-target', 'mrep3-a4-total', 'mrep3-a4-growth', 'mrep3-a4-target', 'mrep3-a5-total', 'mrep3-a5-growth', 'mrep3-a5-target', 'mrep3-a6-total', 'mrep3-a6-growth', 'mrep3-a6-target', 'mrep3-b1-total', 'mrep3-b1-growth', 'mrep3-b2-total', 'mrep3-b2-growth', 'mrep3-b3-total', 'mrep3-b3-growth', 'mrep3-b4-total', 'mrep3-b4-growth'];

  function updateMrepDiff_(basePrefix) {
    const prev = parseNum(document.getElementById(basePrefix + '-prev').value);
    const now = parseNum(document.getElementById(basePrefix + '-now').value);
    const diff = now - prev;
    document.getElementById(basePrefix + '-growth').value = diff >= 0 ? diff : 0;
    document.getElementById(basePrefix + '-shortage').value = diff < 0 ? Math.abs(diff) : 0;
  }

  function updateMrepRate_(actualId, targetId, rateId) {
    const actual = parseNum(document.getElementById(actualId).value);
    const target = parseNum(document.getElementById(targetId).value);
    const rateEl = document.getElementById(rateId);
    if (!target) { rateEl.value = ''; return; }
    rateEl.value = Math.round((actual / target) * 100) + '%';
  }

  // ---------- ধাপ ৫: প্রশিক্ষণ + সাংগঠনিক বৈঠকাদি + সমাজ সংস্কার সমাজসেবা (১-২) ----------
  const MREP_STEP5_IDS = ['mrep5-a1-mp', 'mrep5-a1-mf', 'mrep5-a1-tp', 'mrep5-a1-tf', 'mrep5-a1-ap', 'mrep5-a1-af', 'mrep5-a2-mp', 'mrep5-a2-mf', 'mrep5-a2-tp', 'mrep5-a2-tf', 'mrep5-a2-ap', 'mrep5-a2-af', 'mrep5-a3-mp', 'mrep5-a3-mf', 'mrep5-a3-tp', 'mrep5-a3-tf', 'mrep5-a3-ap', 'mrep5-a3-af', 'mrep5-a4-mp', 'mrep5-a4-mf', 'mrep5-a4-tp', 'mrep5-a4-tf', 'mrep5-a4-ap', 'mrep5-a4-af', 'mrep5-b1-gp', 'mrep5-b1-gf', 'mrep5-b1-sp', 'mrep5-b1-sf', 'mrep5-b1-ap', 'mrep5-b1-af', 'mrep5-b2-gp', 'mrep5-b2-gf', 'mrep5-b2-sp', 'mrep5-b2-sf', 'mrep5-b2-ap', 'mrep5-b2-af', 'mrep5-b3-gp', 'mrep5-b3-gf', 'mrep5-b3-sp', 'mrep5-b3-sf', 'mrep5-b3-ap', 'mrep5-b3-af', 'mrep5-b4-count', 'mrep5-c1-p', 'mrep5-c1-f', 'mrep5-c2-p', 'mrep5-c2-f', 'mrep5-c3-p', 'mrep5-c3-f', 'mrep6-a1', 'mrep6-a2', 'mrep6-a3', 'mrep6-a4', 'mrep6-a5', 'mrep6-b1', 'mrep6-b2'];

  function collectMrepStep5Data_() {
    const data = {};
    MREP_STEP5_IDS.forEach(function (id) { data[id] = document.getElementById(id).value; });
    mrep4BoithokFieldIds_().forEach(function (id) { data[id] = document.getElementById(id).value; });
    return data;
  }
  function applyMrepStep5Data_(data) {
    MREP_STEP5_IDS.forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
    mrep4BoithokFieldIds_().forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
  }
  function resetMrepStep5_() {
    MREP_STEP5_IDS.forEach(function (id) { document.getElementById(id).value = ''; });
    mrep4BoithokFieldIds_().forEach(function (id) { document.getElementById(id).value = ''; });
  }

  // ---------- ধাপ ৬: সমাজসেবা (৩-৬) ও রাষ্ট্রীয় সংস্কার ----------
  const MREP6_C_ITEMS = [
    'ছোট ছোট উন্নয়নমূলক কাজ', 'শিক্ষা সহায়তা প্রদান (কতজনকে)',
    'সামাজিক অনুষ্ঠানে অংশগ্রহণ/সহায়তা প্রদান', 'টেকনিক্যাল সেবা প্রদান (কতজন/কতজনকে)',
    'সামাজিক বিরোধ মীমাংসা', 'অনলাইনে সেবা প্রদান (কতজনকে)',
    'মানবিক সহায়তা প্রদান (কতজনকে)', 'বৃক্ষরোপণ (কতটি)',
    'কর্জে হাসানাহ প্রদান (কতজনকে)', 'জনসচেতনতামূলক প্রোগ্রাম (কতটি)',
    'পরিষ্কার পরিচ্ছন্নতা অভিযান', 'দুর্যোগকালীন সহায়তা প্রদান (কতজনকে)',
    'রোগীর পরিচর্যা/সহায়তা প্রদান (কতজনকে)', 'ত্রাণ বিতরণ (কতজনকে)',
    'স্বেচ্ছায় রক্ত দান (কতজন/কতজনকে)', 'ভিন্নধর্মাবলম্বীদের সেবা প্রদান (কতজন/কতজনকে)',
    'মাতৃত্বকালীন সময়ে সেবা প্রদান (কতজনকে)', 'মাইয়্যেতের গোসল (কতজনকে)',
    'নবজাতককে গিফট প্রদান (কতজনকে)', 'জানাযায় অংশগ্রহণ/সহায়তা',
    'মেডিকেল ক্যাম্প (কতটি)', 'স্বল্প পুঁজিতে কর্মসংস্থানের সহায়তা (কতজনকে)',
    'ভ্রাম্যমান স্কুল/মক্তব চালু', 'অন্যান্য'
  ];

  const MREP6_STATIC_IDS = [
    'mrep6-c1', 'mrep6-c2', 'mrep6-c3',
    'mrep6-d1', 'mrep6-d2', 'mrep6-d3', 'mrep6-d4',
    'mrep6-e1-count', 'mrep6-e1-part', 'mrep6-e2-count', 'mrep6-e2-part', 'mrep6-e3-count', 'mrep6-e3-part',
    'mrep6-f1',
    'mrep6-g1-by', 'mrep6-g1-with', 'mrep6-g2-by', 'mrep6-g2-with',
    'mrep6-h1-total', 'mrep6-h1-avg', 'mrep6-h2-total', 'mrep6-h2-avg', 'mrep6-h3-total', 'mrep6-h4-total', 'mrep6-h4-avg',
    'mrep6-i1-total', 'mrep6-i1-avg', 'mrep6-i2-total', 'mrep6-i2-avg', 'mrep6-i3-total', 'mrep6-i3-avg',
    'mrep6-i4-total', 'mrep6-i4-avg', 'mrep6-i5-total', 'mrep6-i5-avg', 'mrep6-i6-total', 'mrep6-i6-avg'
  ];

  function mrep6AllFieldIds_() {
    const ids = MREP6_STATIC_IDS.slice();
    MREP6_C_ITEMS.forEach(function (label, idx) { ids.push('mrep6-citem-' + idx); });
    return ids;
  }

  function renderMrep6CTable() {
    // MREP6_C_ITEMS অ্যারেটি পর্যায়ক্রমে বাম/ডান কলামের আইটেম ধারণ করে (item0=বাম১, item1=ডান১, item2=বাম২, ...)
    let html = '';
    for (let i = 0; i < MREP6_C_ITEMS.length; i += 2) {
      const leftIdx = i;
      const rightIdx = i + 1;
      const leftLabel = MREP6_C_ITEMS[leftIdx];
      const rightLabel = MREP6_C_ITEMS[rightIdx];
      html += '<tr>'
        + '<td data-label="বিবরণ">' + leftLabel + '</td>'
        + '<td><input type="text" id="mrep6-citem-' + leftIdx + '"></td>'
        + (rightLabel !== undefined
            ? '<td data-label="বিবরণ">' + rightLabel + '</td><td><input type="text" id="mrep6-citem-' + rightIdx + '"></td>'
            : '<td></td><td></td>')
        + '</tr>';
    }
    document.getElementById('mrep6-c-body').innerHTML = html;
  }

  function collectMrepStep6Data_() {
    const data = {};
    mrep6AllFieldIds_().forEach(function (id) { data[id] = document.getElementById(id).value; });
    return data;
  }
  function applyMrepStep6Data_(data) {
    mrep6AllFieldIds_().forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
  }
  function resetMrepStep6_() {
    mrep6AllFieldIds_().forEach(function (id) { document.getElementById(id).value = ''; });
  }

  function initMrepStep2Calc() {
    document.querySelectorAll('.mrep-diff-src').forEach(function (el) {
      el.addEventListener('input', function () { updateMrepDiff_(this.getAttribute('data-target')); });
    });
    document.querySelectorAll('.mrep-rate-src').forEach(function (el) {
      el.addEventListener('input', function () {
        updateMrepRate_(this.getAttribute('data-actual'), this.id, this.getAttribute('data-target-rate'));
      });
    });

    // ব্যক্তিগত উদ্যোগ টেবিলের "মোট" = সদস্য(পু/ম) + কর্মী(পু/ম) এর যোগফল, অটো
    [['mrep1-a1-total', ['mrep1-a1-rp', 'mrep1-a1-rm', 'mrep1-a1-kp', 'mrep1-a1-km']],
     ['mrep1-a2-total', ['mrep1-a2-rp', 'mrep1-a2-rm', 'mrep1-a2-kp', 'mrep1-a2-km']]].forEach(function (row) {
      const totalId = row[0], srcIds = row[1];
      srcIds.forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () {
          let sum = 0;
          srcIds.forEach(function (sid) { sum += parseNum(document.getElementById(sid).value); });
          document.getElementById(totalId).value = sum;
        });
      });
    });
  }

  function collectMrepStep2Data_() {
    const data = {};
    MREP_STEP2_IDS.forEach(function (id) { data[id] = document.getElementById(id).value; });
    return data;
  }

  function applyMrepStep2Data_(data) {
    MREP_STEP2_IDS.forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
  }

  function resetMrepStep2_() {
    MREP_STEP2_IDS.forEach(function (id) { document.getElementById(id).value = ''; });
  }

  function initMonthlyReportWizard() {
    if (!document.getElementById('mrep-year').value) {
      document.getElementById('mrep-year').value = new Date().getFullYear();
    }

    document.querySelectorAll('.mrep-step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToMrepStep(parseInt(btn.getAttribute('data-step'), 10));
      });
    });
    document.querySelectorAll('.mrep-next-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToMrepStep(parseInt(btn.getAttribute('data-next'), 10));
      });
    });
    document.querySelectorAll('.mrep-prev-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToMrepStep(parseInt(btn.getAttribute('data-prev'), 10));
      });
    });

    document.getElementById('mrep-month').addEventListener('change', loadMrepCurrentStep);
    document.getElementById('mrep-year').addEventListener('change', loadMrepCurrentStep);

    MREP1_DAWAT_SOURCE_IDS.forEach(function (id) {
      document.getElementById(id).addEventListener('input', updateMrep1TotalDawat);
    });
    initMrep1AutoSums();

    initMrepStep2Calc();
    initMrepStep4Calc();
    renderMrep6CTable();
    initMrep7Bayt_();

    document.getElementById('mrepSaveBtn').addEventListener('click', saveMrepCurrentStep);
    document.getElementById('mrepResetBtn').addEventListener('click', resetMrepCurrentStep);

    document.getElementById('mrepEditBtn').addEventListener('click', function () {
      loadMrepCurrentStep();
      showToast('বর্তমান ধাপের তথ্য এডিটের জন্য পুনরায় লোড করা হয়েছে', 'success');
    });

    document.getElementById('mrepFullPrintBtn').addEventListener('click', printFullMrepReport);

    loadMrepCurrentStep();
  }

  // GAS google.script.run কে Promise আকারে ব্যবহার করার সহায়ক ফাংশন
  function gsRun_(fnName, args) {
    return new Promise(function (resolve, reject) {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[fnName].apply(null, args);
    });
  }

  // ধাপ ১-৬ এর একটি প্যানেল ক্লোন করে, ফরম ইনপুটগুলোকে সংরক্ষিত ডাটা (stepData) থেকে প্লেইন টেক্সটে রূপান্তর করে প্রিন্ট-উপযোগী HTML তৈরি করে
  function clonePanelForPrint_(panelId, stepData) {
    const original = document.getElementById(panelId);
    if (!original) return '';
    const clone = original.cloneNode(true);
    clone.style.display = 'block';
    clone.querySelectorAll('.form-actions').forEach(function (el) { el.remove(); });
    clone.querySelectorAll('input, select, textarea').forEach(function (el) {
      const id = el.id;
      let val = '';
      if (stepData && id && stepData[id] !== undefined) val = stepData[id];
      const span = document.createElement('span');
      span.textContent = (val !== '' && val !== undefined && val !== null) ? val : '';
      let extraClass = '';
      if (el.classList.contains('mrep-slash-input')) extraClass = ' mrep-slash-input';
      else if (el.classList.contains('normal-input')) extraClass = ' normal-input';
      span.className = 'mrep-print-val' + extraClass;
      if (el.parentNode) el.parentNode.replaceChild(span, el);
    });
    clone.querySelectorAll('button').forEach(function (b) { b.remove(); });
    return clone.innerHTML;
  }

  // পৃষ্ঠা ৭ (নির্বাচনভিত্তিক কার্যক্রম ও বায়তুলমাল) — সংরক্ষিত সিট-ডাটা দিয়ে mabPrintTemplate পূরণ করে
  // সংরক্ষিত আয়/ব্যয় আইটেমের সাথে ডিফল্ট খাত-তালিকা মিলিয়ে একটি সম্পূর্ণ তালিকা তৈরি করে —
  // যাতে প্রিন্টে প্রতিটি খাত সবসময় দেখা যায় (এমাউন্ট থাক বা না থাক), কোনো খাত বাদ না পড়ে
  function mergeWithDefaultItems_(savedItems, defaultItems) {
    const savedByName = {};
    (savedItems || []).forEach(function (it) {
      if (it && it.name) savedByName[it.name] = it.amount;
    });
    const defaultNames = {};
    const merged = defaultItems.map(function (d) {
      defaultNames[d.name] = true;
      return { name: d.name, amount: savedByName.hasOwnProperty(d.name) ? savedByName[d.name] : '' };
    });
    (savedItems || []).forEach(function (it) {
      if (it && it.name && !defaultNames[it.name]) merged.push({ name: it.name, amount: it.amount });
    });
    return merged;
  }

  function populateMabPrintFromData_(nirbachonData, mabData, month, year) {
    document.getElementById('mabprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('mabprint-monthYear').textContent = 'মাস: ' + month + '   বছর: ' + year;
    document.getElementById('mabprint-dhorjoNisab').textContent = (mabData && mabData.dhorjoNisab) ? ('৳' + mabData.dhorjoNisab) : '';

    MABEL_FIELD_IDS.forEach(function (key) {
      const suffix = MABEL_ID_MAP[key].replace('mabel-', '');
      const target = document.getElementById('mabprint-' + suffix);
      const val = nirbachonData ? nirbachonData[key] : '';
      if (target) target.textContent = (val !== undefined && val !== null) ? val : '';
    });

    const incomeItems = mergeWithDefaultItems_(mabData ? mabData.incomeItems : [], MAB_DEFAULT_INCOME_ITEMS);
    const expenseItems = mergeWithDefaultItems_(mabData ? mabData.expenseItems : [], MAB_DEFAULT_EXPENSE_ITEMS);
    const totalIncome = mabSumItems_(incomeItems);
    const totalExpense = mabSumItems_(expenseItems);
    const prevSurplus = parseNum(mabData ? mabData.prevSurplus : 0);
    const prevDeficit = parseNum(mabData ? mabData.prevDeficit : 0);

    let incomeRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    incomeItems.filter(function (r) { return r.name; }).forEach(function (r) {
      incomeRows += '<tr><td>' + escapeHtml(r.name) + '</td><td>৳' + escapeHtml(String(r.amount || 0)) + '</td></tr>';
    });
    incomeRows += '<tr><td><b>মোট আয়</b></td><td><b>৳' + totalIncome + '</b></td></tr>';
    incomeRows += '<tr><td>গত মাসের উদ্বৃত্ত</td><td>৳' + prevSurplus + '</td></tr>';
    incomeRows += '<tr><td><b>সর্বমোট আয়</b></td><td><b>৳' + (totalIncome + prevSurplus) + '</b></td></tr>';
    document.getElementById('mabprint-incomeTable').innerHTML = incomeRows;

    let expenseRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    expenseItems.filter(function (r) { return r.name; }).forEach(function (r) {
      expenseRows += '<tr><td>' + escapeHtml(r.name) + '</td><td>৳' + escapeHtml(String(r.amount || 0)) + '</td></tr>';
    });
    expenseRows += '<tr><td><b>মোট ব্যয়</b></td><td><b>৳' + totalExpense + '</b></td></tr>';
    expenseRows += '<tr><td>গত মাসের ঘাটতি</td><td>৳' + prevDeficit + '</td></tr>';
    expenseRows += '<tr><td><b>সর্বমোট ব্যয়</b></td><td><b>৳' + (totalExpense + prevDeficit) + '</b></td></tr>';
    document.getElementById('mabprint-expenseTable').innerHTML = expenseRows;

    document.getElementById('mabprint-balanceDetails').textContent = (mabData && mabData.balanceDetails) ? mabData.balanceDetails : '';
  }

  // শাখা তথ্য হেডার (নাম, মাস/বছর, পৌরসভা/ইউনিয়নের নাম, উপজেলা, আমীর) — শুধু ১ম পৃষ্ঠায় দেখানো হয়, লোগো নেই
  // ধরণ (মাসিক/ত্রৈমাসিক/ষান্মাসিক/নয় মাসিক/বার্ষিক) অনুযায়ী মাসের ঘরে যা বসবে তা নির্ধারণ করে
  function mrepMonthDisplayForPeriod_(periodType, selectedMonth) {
    if (periodType === 'ত্রৈমাসিক') return 'জানুয়ারি - মার্চ';
    if (periodType === 'ষান্মাসিক') return 'জানুয়ারি - জুন';
    if (periodType === 'নয় মাসিক') return 'জানুয়ারি - সেপ্টেম্বর';
    if (periodType === 'বার্ষিক') return 'জানুয়ারি - ডিসেম্বর';
    return selectedMonth; // মাসিক হলে নির্বাচিত একক মাস
  }

  // ১ম পৃষ্ঠার হেডার — ছবির অফিসিয়াল ফরম্যাট অনুযায়ী হুবহু (বিসমিল্লাহ, শিরোনাম, ধরণ-চেকমার্ক, মাস/সন/নাম/উপজেলা/আমীর, ডাবল আন্ডারলাইন)
  function buildMrepPrintHeader_(month, year) {
    const unionName = document.getElementById('mrep-unionName').value || '';
    const upazila = document.getElementById('mrep-upazila').value || '';
    const amirName = document.getElementById('mrep-amirName').value || '';
    const periodType = document.getElementById('mrep-periodType').value || 'মাসিক';
    const monthDisplay = mrepMonthDisplayForPeriod_(periodType, month);

    const periods = ['মাসিক', 'ত্রৈমাসিক', 'ষান্মাসিক', 'নয় মাসিক', 'বার্ষিক'];
    const periodSpans = periods.map(function (p) {
      const cls = 'mrep-period-word' + (p === periodType ? ' selected' : '');
      return '<span class="' + cls + '">' + p + '</span>';
    }).join('/');

    let html = '<div class="mrep-print-header">'
      + '<p class="mrep-bismillah">বিসমিল্লাহির রাহমানির রাহীম</p>'
      + '<h1 class="mrep-title-main">পৌরসভা*/ ইউনিয়ন সংগঠনের</h1>'
      + '<h2 class="mrep-title-sub">' + periodSpans + ' রিপোর্ট</h2>'
      + '<p class="mrep-title-note">(*যে সকল পৌরসভা সাংগঠনিক থানার মানে উন্নীত নয়)</p>'
      + '<div class="mrep-header-row"><span>মাস: <b>' + escapeHtml(monthDisplay) + '</b></span><span>সন: <b>' + escapeHtml(String(year)) + '</b></span></div>'
      + '<div class="mrep-header-row"><span>পৌরসভা/ইউনিয়নের নাম : <b>' + escapeHtml(unionName) + '</b></span><span>উপজেলা/থানা : <b>' + escapeHtml(upazila) + '</b></span></div>'
      + '<div class="mrep-header-row-full">আমীর/সভাপতির নাম: <b>' + escapeHtml(amirName) + '</b></div>'
      + '<div class="mrep-header-divider"></div>'
      + '</div>';
    return html;
  }

  const MREP_PRINT_EXTRA_CSS = "@page{size:A4;margin:0.5in;}"
    + "*{box-sizing:border-box;}"
    + "html, body{background:#fff !important;}"
    + "body{font-size:10px !important;width:100%;margin:0 !important;padding:0 !important;}"
    + ".mrep-print-page{page-break-after:always;position:relative;min-height:265mm;background:#fff;}"
    + ".mrep-print-page:last-child{page-break-after:auto;}"
    + ".mrep-print-page-inner{width:100%;}"
    + ".mrep-print-page *{overflow:visible !important;}"
    + "*::-webkit-scrollbar{display:none !important;width:0 !important;height:0 !important;}"
    + ".mrep-print-footer{margin-top:10px;}"
    + ".mrep-print-footer .mrep-footer-line{border-top:1px solid #000;border-bottom:1px solid #000;height:1.5px;margin-bottom:5px; padding-top:1.5px;}"
    + ".mrep-print-footer .mrep-footer-row{position:relative;min-height:14px;}"
    + ".mrep-print-footer .mrep-footer-num{display:block;text-align:center;font-size:10px;color:#000;}"
    + ".mrep-print-footer .mrep-footer-formno{position:absolute;top:0;right:0;font-size:7px;color:#000;}"
    + ".mrep-print-header{text-align:center;padding-bottom:6px;margin-bottom:8px;}"
    + ".mrep-bismillah{margin:0 0 4px;font-size:11px;color:#000;}"
    + ".mrep-title-main{margin:0;font-size:18px;color:#000;}"
    + ".mrep-title-sub{margin:2px 0;font-size:14px;color:#000;font-weight:600;}"
    + ".mrep-title-note{margin:0 0 8px;font-size:9px;color:#000;}"
    + ".mrep-period-word{position:relative;display:inline-block;}"
    + ".mrep-period-word.selected::before{content:'\\2713';position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:9px;color:#000;}"
    + ".mrep-header-row{display:grid;grid-template-columns:78% 45%;text-align:left;font-size:11px;margin:4px 0;color:#000;}"
    + ".mrep-header-row-full{text-align:left;font-size:11px;margin:4px 0;color:#000;}"
    + ".mrep-header-divider{border-bottom:3px double #000;margin-top:6px;}"
    + ".mrep-print-page .sub-title{font-size:12px;font-weight:600; text-align:left;margin:5px 0 3px;color:#000;}"
    + ".mrep-print-page .mrep-sub-h{font-size:11px;margin:5px 0 2px;padding-top:0;border:none !important;color:#000;}"
    + ".mrep-print-page hr, .mrep-print-page .divider{display:none !important;}"
    + ".mrep-print-page label{display:block;font-size:9px;font-weight:600;color:#000;margin:0 0 1px;}"
    + ".mrep-print-page .form-group{margin-bottom:3px;display:inline-block;width:32%;vertical-align:top;margin-right:1%;}"
    + ".mrep-print-page .form-group-row{display:block;}"
    + ".mrep-print-page .form-group-row.mrep-side-by-side{display:flex !important;gap:2%;align-items:flex-start;}"
    + ".mrep-print-page .form-group-row.mrep-side-by-side > *{width:49% !important;display:block !important;margin-right:0 !important;}"
    + ".mrep-print-page .mrep-label-inline-row{display:block;margin:2px 0;}"
    + ".mrep-print-page .mrep-label-inline{display:inline-flex;align-items:center;gap:4px;width:48%;margin-right:1%;vertical-align:top;}"
    + ".mrep-print-page .mrep-label-inline-full{width:98%;}"
    + ".mrep-print-page .mrep-label-inline label{display:inline;font-size:9px;font-weight:600;color:#000;margin:0;white-space:nowrap;}"
    + ".mrep-print-page .no-result{font-size:9px;color:#000;padding:2px 0;}"
    + ".mrep-print-page .mrep-print-val{font-weight:700;border-bottom:1px dotted #000;padding:0 4px;display:inline-block;min-width:20px;color:#000;}"
    + ".mrep-print-page h2, .mrep-print-page h3{color:#000 !important;}"
    + ".mrep-print-page .print-footer{color:#000 !important;}"
    + "table{border-collapse:collapse !important;width:100%;table-layout:fixed !important;margin-bottom:4px;background:#fff !important;}"
    + "table, th, td{border:1px solid #000 !important;}"
    + "th, td{padding:4.5px 5px !important;font-size:10px !important;line-height:1.3;vertical-align:middle;background:#fff !important;color:#000 !important;word-wrap:break-word;text-align:center;}"
    // ১ম পৃষ্ঠায় কন্টেন্ট সবচেয়ে বেশি (৮টি টেবিল + ৫টি সাব-হেডিং), তাই এই পৃষ্ঠায় বাকি পৃষ্ঠাগুলোর
    // মতো বড় রো-হাইট দিলে ২য় ফিজিক্যাল পৃষ্ঠায় উপচে পড়ে — তাই শুধু ১ম পৃষ্ঠার জন্য প্যাডিং ও হেডিং
    // মার্জিন কিছুটা কম রাখা হয়েছে (headless Chromium দিয়ে বাস্তব উচ্চতা মেপে ক্যালিব্রেট করা)
    + ".mrep-print-page-1 th, .mrep-print-page-1 td{padding:10px 5px !important;}"
    + ".mrep-print-page-2 th, .mrep-print-page-2 td{padding:12px 5px !important;}"
    + ".mrep-print-page-3 th, .mrep-print-page-3 td{padding:11.2px 5px !important;}"
    + ".mrep-print-page-4 th, .mrep-print-page-4 td{padding:13.2px 5px !important;}"
    + ".mrep-print-page-5 th, .mrep-print-page-5 td{padding:16.4px 5px !important;}"
    + ".mrep-print-page-6 th, .mrep-print-page-6 td{padding:11.7px 5px !important;}"
    + ".mrep-print-page-7 th, .mrep-print-page-7 td{padding:12px 5px !important;}"
    + ".mrep-print-page-1 .mrep-sub-h{margin:2px 0 1px !important;}"
    + ".mrep-print-page-1 table{margin-bottom:1.5px !important;}"
    + "td:first-child{text-align:left;}"
    + ".mrep-alldata-table td:first-child{text-align:center;}"
    + ".mrep-campaign-table .category-cell{width:60% !important;text-align:left;}"
    + ".mrep-campaign-table .data-cell{width:auto !important;text-align:center;}"
    + ".mrep-campaign-table .category-label{display:block;font-weight:700;color:#000;padding:2px 4px;text-align:left;}"
    + ".mrep-campaign-table .slash-input{display:flex;align-items:center;justify-content:center;gap:2px;white-space:nowrap;}"
    + ".mrep-campaign-table .slash{font-weight:700;color:#000;}"
    + ".mrep-campaign-table .normal-input.mrep-print-val, .mrep-campaign-table .mrep-slash-input.mrep-print-val{display:inline-block;min-width:14px;text-align:center;border-bottom:none;font-weight:700;}"
    + "th{white-space:normal;}";

  function buildMrepFullPrintHtml_(month, year, reportRes, nirbachonRes, mabRes) {
    const stepsData = (reportRes && reportRes.success && reportRes.data) ? reportRes.data.steps : {};
    const headerHtml = buildMrepPrintHeader_(month, year);

    let pages = '';
    for (let s = 1; s <= 6; s++) {
      const panelHtml = clonePanelForPrint_('mrep-panel-' + s, stepsData[s]);
      const pageHeader = (s === 1) ? headerHtml : ''; // হেডার শুধু ১ম পৃষ্ঠায়
      // ডিভাইডার লাইন শুধু সর্বশেষ (৭ম) পৃষ্ঠায় থাকবে, বাকি পৃষ্ঠায় থাকবে না
      pages += '<div class="mrep-print-page mrep-print-page-' + s + '"><div class="mrep-print-page-inner">' + pageHeader + panelHtml + '</div>'
        + '<div class="mrep-print-footer"><div class="mrep-footer-row"><span class="mrep-footer-num">' + toBnNumber(s) + '</span><span class="mrep-footer-formno">পৌরসভা/ইউনিয়ন&nbsp;&nbsp;&nbsp;&nbsp;ফরম নং ৫</span></div></div>'
        + '</div>';
    }

    const nirbachonData = (nirbachonRes && nirbachonRes.success) ? nirbachonRes.data : null;
    const mabData = (mabRes && mabRes.success) ? mabRes.data : null;
    populateMabPrintFromData_(nirbachonData, mabData, month, year);
    document.getElementById('mabprint-orgName').textContent = '';
    document.getElementById('mabprint-monthYear').textContent = '';
    const page7Content = document.getElementById('mabPrintTemplate').innerHTML;
    pages += '<div class="mrep-print-page mrep-print-page-7"><div class="mrep-print-page-inner">' + page7Content + '</div>'
      + '<div class="mrep-print-footer"><div class="mrep-footer-line"></div><div class="mrep-footer-row"><span class="mrep-footer-num">' + toBnNumber(7) + '</span><span class="mrep-footer-formno">পৌরসভা/ইউনিয়ন&nbsp;&nbsp;&nbsp;&nbsp;ফরম নং ৫</span></div></div>'
      + '</div>';

    return pages;
  }

  function printHtmlDocument_(bodyHtml, title) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      showToast('পপ-আপ ব্লক করা আছে — ব্রাউজারের সেটিংস থেকে পপ-আপ অনুমতি দিন', 'error');
      return;
    }
    printWin.document.open();
    printWin.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>'
      + '<style>' + PRINT_WINDOW_CSS + MREP_PRINT_EXTRA_CSS + '</style></head><body>' + bodyHtml + '</body></html>'
    );
    printWin.document.close();

    var printed = false;
    function doPrint() {
      if (printed) return;
      printed = true;
      try { printWin.focus(); printWin.print(); } catch (e) { /* ignore */ }
      setTimeout(function () { try { printWin.close(); } catch (e) { /* ignore */ } }, 300);
    }
    if (printWin.document.readyState === 'complete') {
      setTimeout(doPrint, 400);
    } else {
      printWin.onload = function () { setTimeout(doPrint, 400); };
      setTimeout(doPrint, 1200); // ফলব্যাক, ৭ পৃষ্ঠার কনটেন্ট বড় হওয়ায় বেশি সময় দেওয়া হলো
    }
  }

  function printFullMrepReport() {
    const month = document.getElementById('mrep-month').value;
    const year = document.getElementById('mrep-year').value;
    if (!month || !year) {
      showToast('অনুগ্রহ করে মাস ও সন নির্বাচন করুন', 'error');
      return;
    }

    showToast('৭ পৃষ্ঠার প্রিন্ট তৈরি হচ্ছে...', 'success');

    Promise.all([
      gsRun_('getSangghothonikReportByMonth', [month, year]),
      gsRun_('getMashikNirbachonByMonth', [month, year]),
      gsRun_('getMashikAyByayByMonth', [month, year])
    ]).then(function (results) {
      const pagesHtml = buildMrepFullPrintHtml_(month, year, results[0], results[1], results[2]);
      printHtmlDocument_(pagesHtml, 'সাংগঠনিক রিপোর্ট');
    }).catch(function () {
      showToast('প্রিন্ট তৈরি করতে সমস্যা হয়েছে', 'error');
    });
  }

  function goToMrepStep(stepNum) {
    document.querySelectorAll('.mrep-step-btn').forEach(function (b) { b.classList.remove('active'); });
    const activeBtn = document.querySelector('.mrep-step-btn[data-step="' + stepNum + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.mrep-step-panel').forEach(function (p) { p.style.display = 'none'; });
    const panel = document.getElementById('mrep-panel-' + stepNum);
    if (panel) panel.style.display = 'block';

    _mrepCurrentStep = stepNum;
    loadMrepCurrentStep();
    window.scrollTo(0, 0);
  }

  function updateMrep1TotalDawat() {
    let sum = 0;
    MREP1_DAWAT_SOURCE_IDS.forEach(function (id) {
      sum += parseNum(document.getElementById(id).value);
    });
    document.getElementById('mrep1-totalDawat').value = sum;
  }

  function collectMrepStep1Data_() {
    const data = {};
    MREP_STEP1_IDS.forEach(function (id) {
      data[id] = document.getElementById(id).value;
    });
    return data;
  }

  function applyMrepStep1Data_(data) {
    MREP_STEP1_IDS.forEach(function (id) {
      document.getElementById(id).value = (data && data[id] !== undefined) ? data[id] : '';
    });
  }

  function resetMrepStep1_() {
    MREP_STEP1_IDS.forEach(function (id) {
      document.getElementById(id).value = '';
    });
  }

  function loadMrepCurrentStep() {
    const month = document.getElementById('mrep-month').value;
    const year = document.getElementById('mrep-year').value;
    if (!month || !year) return;

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success && res.data) {
          document.getElementById('mrep-periodType').value = res.data.periodType || 'মাসিক';
          document.getElementById('mrep-unionName').value = res.data.unionName || '';
          document.getElementById('mrep-upazila').value = res.data.upazila || '';
          document.getElementById('mrep-amirName').value = res.data.amirName || '';

          if (_mrepCurrentStep === 1) {
            applyMrepStep1Data_(res.data.steps[1]);
            updateMrep1TotalDawat();
          } else if (_mrepCurrentStep === 2) {
            applyMrepStep2Data_(res.data.steps[2]);
          } else if (_mrepCurrentStep === 3) {
            applyMrepStep3Data_(res.data.steps[3]);
          } else if (_mrepCurrentStep === 4) {
            applyMrepStep4Data_(res.data.steps[4]);
          } else if (_mrepCurrentStep === 5) {
            applyMrepStep5Data_(res.data.steps[5]);
          } else if (_mrepCurrentStep === 6) {
            applyMrepStep6Data_(res.data.steps[6]);
          }
        } else {
          if (_mrepCurrentStep === 1) resetMrepStep1_();
          else if (_mrepCurrentStep === 2) resetMrepStep2_();
          else if (_mrepCurrentStep === 3) resetMrepStep3_();
          else if (_mrepCurrentStep === 4) resetMrepStep4_();
          else if (_mrepCurrentStep === 5) resetMrepStep5_();
          else if (_mrepCurrentStep === 6) resetMrepStep6_();
        }
        // ধাপ ৭-এর ডাটা আলাদা শীট (MashikNirbachonKarjokrom/MashikAyByay) থেকে আসে বিধায় স্বতন্ত্রভাবে লোড হয়
        if (_mrepCurrentStep === 7) loadMrep7Bayt_();
      })
      .withFailureHandler(function () {
        if (_mrepCurrentStep === 1) resetMrepStep1_();
        else if (_mrepCurrentStep === 2) resetMrepStep2_();
        else if (_mrepCurrentStep === 3) resetMrepStep3_();
        else if (_mrepCurrentStep === 4) resetMrepStep4_();
        else if (_mrepCurrentStep === 5) resetMrepStep5_();
        else if (_mrepCurrentStep === 6) resetMrepStep6_();
        else if (_mrepCurrentStep === 7) loadMrep7Bayt_();
      })
      .getSangghothonikReportByMonth(month, year);
  }

  function saveMrepCurrentStep() {
    const month = document.getElementById('mrep-month').value;
    const year = document.getElementById('mrep-year').value;
    const periodType = document.getElementById('mrep-periodType').value;
    const unionName = document.getElementById('mrep-unionName').value;
    const upazila = document.getElementById('mrep-upazila').value;
    const amirName = document.getElementById('mrep-amirName').value;

    if (!month || !year) {
      showToast('অনুগ্রহ করে মাস ও সন নির্বাচন করুন', 'error');
      return;
    }

    if (_mrepCurrentStep === 7) {
      saveMrep7Bayt_();
      return;
    }

    let stepData = {};
    if (_mrepCurrentStep === 1) {
      updateMrep1TotalDawat();
      stepData = collectMrepStep1Data_();
    } else if (_mrepCurrentStep === 2) {
      stepData = collectMrepStep2Data_();
    } else if (_mrepCurrentStep === 3) {
      stepData = collectMrepStep3Data_();
    } else if (_mrepCurrentStep === 4) {
      updateMrep4DUnitTotal();
      updateMrep4B3Total();
      stepData = collectMrepStep4Data_();
    } else if (_mrepCurrentStep === 5) {
      stepData = collectMrepStep5Data_();
    } else if (_mrepCurrentStep === 6) {
      stepData = collectMrepStep6Data_();
    }

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message || 'সংরক্ষণ সম্পন্ন হয়েছে', 'success');
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .saveSangghothonikReportStep(month, year, periodType, unionName, upazila, amirName, _mrepCurrentStep, stepData);
  }

  function resetMrepCurrentStep() {
    if (_mrepCurrentStep === 1) {
      resetMrepStep1_();
      showToast('ধাপ ১ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 2) {
      resetMrepStep2_();
      showToast('ধাপ ২ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 3) {
      resetMrepStep3_();
      showToast('ধাপ ৩ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 4) {
      resetMrepStep4_();
      showToast('ধাপ ৪ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 5) {
      resetMrepStep5_();
      showToast('ধাপ ৫ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 6) {
      resetMrepStep6_();
      showToast('ধাপ ৬ রিসেট করা হয়েছে', 'success');
    } else if (_mrepCurrentStep === 7) {
      resetMrep7Bayt_();
      showToast('ধাপ ৭ রিসেট করা হয়েছে', 'success');
    }
  }

  // ==================== বায়তুলমাল: মাসিক আয়-ব্যয় রিপোর্ট ====================
  let _mabrepData = null;

  function initMashikAyByayReport() {
    toggleFormReportCard_('mabReportToggleBtn', 'mabReportCard', 'mabFormCard');

    if (!document.getElementById('mabrep-year').value) {
      document.getElementById('mabrep-year').value = new Date().getFullYear();
    }

    document.getElementById('mabrep-periodType').addEventListener('change', updateMabrepMonthField);
    bindDataToggle_('mabrepLoadBtn',
      function () { return isBlockShown_('mabrepResultWrap'); },
      function () { document.getElementById('mabrepResultWrap').style.display = 'none'; },
      loadMabrepReport, '🔍 রিপোর্ট দেখুন', '✖ রিপোর্ট বন্ধ করুন');
    document.getElementById('mabrepPrintBtn').addEventListener('click', printMabrepReport);

    updateMabrepMonthField();
  }

  function updateMabrepMonthField() {
    const type = document.getElementById('mabrep-periodType').value;
    const wrap = document.getElementById('mabrep-monthWrap');
    wrap.style.display = (type === 'মাসিক') ? 'block' : 'none';
  }

  function loadMabrepReport() {
    const periodType = document.getElementById('mabrep-periodType').value;
    const year = document.getElementById('mabrep-year').value;
    const month = document.getElementById('mabrep-month').value;

    if (!year) {
      showToast('অনুগ্রহ করে বছর লিখুন', 'error');
      return;
    }

    document.getElementById('mabrepResultWrap').style.display = 'none';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          showToast('রিপোর্ট লোড করতে সমস্যা হয়েছে: ' + res.error, 'error');
          return;
        }
        _mabrepData = res;
        renderMabrepReport();
      })
      .withFailureHandler(function (err) {
        showToast('সমস্যা হয়েছে: ' + err.message, 'error');
      })
      .getMashikAyByayReport(periodType, year, month);
  }

  function mabrepPeriodLabel_(d) {
    if (d.periodType === 'মাসিক') {
      return d.startMonth + ' ' + d.year;
    }
    return d.periodType + ' রিপোর্ট: ' + d.startMonth + ' - ' + d.endMonth + ' ' + d.year;
  }

  function renderMabrepReport() {
    const d = _mabrepData;
    if (!d) return;

    document.getElementById('mabrepResultWrap').style.display = 'block';
    document.getElementById('mabrepLoadBtn').textContent = '✖ রিপোর্ট বন্ধ করুন';
    document.getElementById('mabrep-periodLabel').textContent = mabrepPeriodLabel_(d);

    const missingNote = document.getElementById('mabrep-missingNote');
    if (d.missingMonths && d.missingMonths.length) {
      missingNote.style.display = 'block';
      missingNote.textContent = 'যে মাসগুলোর তথ্য এখনো এন্ট্রি করা হয়নি: ' + d.missingMonths.join(', ');
    } else {
      missingNote.style.display = 'none';
    }

    const incomeBody = document.getElementById('mabrepIncomeBody');
    incomeBody.innerHTML = '';
    const incomeKeys = Object.keys(d.incomeTotals);
    if (!incomeKeys.length) {
      incomeBody.innerHTML = '<tr><td colspan="2" class="no-result">কোনো তথ্য নেই</td></tr>';
    } else {
      incomeKeys.forEach(function (k) {
        incomeBody.innerHTML += '<tr><td data-label="খাতের নাম">' + escapeHtml(k) + '</td><td data-label="মোট পরিমাণ (৳)">৳' + d.incomeTotals[k] + '</td></tr>';
      });
    }

    const expenseBody = document.getElementById('mabrepExpenseBody');
    expenseBody.innerHTML = '';
    const expenseKeys = Object.keys(d.expenseTotals);
    if (!expenseKeys.length) {
      expenseBody.innerHTML = '<tr><td colspan="2" class="no-result">কোনো তথ্য নেই</td></tr>';
    } else {
      expenseKeys.forEach(function (k) {
        expenseBody.innerHTML += '<tr><td data-label="খাতের নাম">' + escapeHtml(k) + '</td><td data-label="মোট পরিমাণ (৳)">৳' + d.expenseTotals[k] + '</td></tr>';
      });
    }

    document.getElementById('mabrep-opening').textContent = '৳' + Math.abs(d.openingBalance) + ' (' + (d.openingBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি') + ')';
    document.getElementById('mabrep-totalIncome').textContent = '৳' + d.totalIncome;
    document.getElementById('mabrep-closing').innerHTML = '<b>৳' + Math.abs(d.closingBalance) + ' (' + (d.closingBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি') + ')</b>';
    document.getElementById('mabrep-totalExpense').textContent = '৳' + d.totalExpense;
  }

  function printMabrepReport() {
    const d = _mabrepData;
    if (!d) {
      showToast('অনুগ্রহ করে প্রথমে রিপোর্ট দেখুন', 'error');
      return;
    }

    document.getElementById('mabrepprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('mabrepprint-periodLabel').textContent = mabrepPeriodLabel_(d);

    let incomeRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    Object.keys(d.incomeTotals).forEach(function (k) {
      incomeRows += '<tr><td>' + escapeHtml(k) + '</td><td>৳' + d.incomeTotals[k] + '</td></tr>';
    });
    incomeRows += '<tr><td><b>মোট আয়</b></td><td><b>৳' + d.totalIncome + '</b></td></tr>';
    document.getElementById('mabrepprint-incomeTable').innerHTML = incomeRows;

    let expenseRows = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">পরিমাণ (৳)</td></tr>';
    Object.keys(d.expenseTotals).forEach(function (k) {
      expenseRows += '<tr><td>' + escapeHtml(k) + '</td><td>৳' + d.expenseTotals[k] + '</td></tr>';
    });
    expenseRows += '<tr><td><b>মোট ব্যয়</b></td><td><b>৳' + d.totalExpense + '</b></td></tr>';
    document.getElementById('mabrepprint-expenseTable').innerHTML = expenseRows;

    document.getElementById('mabrepprint-opening').textContent = '৳' + Math.abs(d.openingBalance) + ' (' + (d.openingBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি') + ')';
    document.getElementById('mabrepprint-closing').textContent = '৳' + Math.abs(d.closingBalance) + ' (' + (d.closingBalance >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি') + ')';

    printViaWindow('mabrepPrintTemplate');
  }

  // ==================== প্রকাশনা: শেয়ার্ড হেল্পার ====================
  let _prakashonaTalikaList = [];

  function loadPrakashonaTalikaList(afterLoadCallback) {
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          _prakashonaTalikaList = res.data;
        }
        if (afterLoadCallback) afterLoadCallback();
      })
      .withFailureHandler(function () { if (afterLoadCallback) afterLoadCallback(); })
      .getPrakashonaTalika();
  }

  function buildPriceItemRow(rowsArray, idx, onRemove, onRecalc) {
    const tr = document.createElement('tr');

    const serialTd = document.createElement('td');
    serialTd.setAttribute('data-label', 'ক্রম');
    serialTd.textContent = toBnNumber(idx + 1);
    tr.appendChild(serialTd);

    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'বইয়ের নাম');
    const nameSelect = document.createElement('select');
    nameSelect.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _prakashonaTalikaList.forEach(function (book) {
      const opt = document.createElement('option');
      opt.value = book.name;
      opt.textContent = book.name + ' (স্টক: ' + toBnNumber(book.qty) + ')';
      opt.dataset.price = book.price;
      if (book.name === rowsArray[idx].bookName) opt.selected = true;
      nameSelect.appendChild(opt);
    });
    nameSelect.addEventListener('change', function () {
      rowsArray[idx].bookName = this.value;
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption && selectedOption.dataset.price && !priceInput.value) {
        priceInput.value = selectedOption.dataset.price;
        recalcRow();
      }
    });
    nameTd.appendChild(nameSelect);
    tr.appendChild(nameTd);

    const qtyTd = document.createElement('td');
    qtyTd.setAttribute('data-label', 'সংখ্যা');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'text';
    qtyInput.className = 'amount-input';
    qtyInput.placeholder = 'সংখ্যা';
    qtyInput.value = rowsArray[idx].qty || '';
    qtyTd.appendChild(qtyInput);
    tr.appendChild(qtyTd);

    const priceTd = document.createElement('td');
    priceTd.setAttribute('data-label', 'একক মূল্য');
    const priceInput = document.createElement('input');
    priceInput.type = 'text';
    priceInput.className = 'amount-input';
    priceInput.placeholder = 'একক মূল্য';
    priceInput.value = rowsArray[idx].unitPrice || '';
    priceTd.appendChild(priceInput);
    tr.appendChild(priceTd);

    const totalTd = document.createElement('td');
    totalTd.setAttribute('data-label', 'মোট');
    const currentTotal = (parseNum(rowsArray[idx].qty) || 0) * (parseNum(rowsArray[idx].unitPrice) || 0);
    totalTd.textContent = '৳' + currentTotal;
    tr.appendChild(totalTd);

    function recalcRow() {
      rowsArray[idx].qty = qtyInput.value;
      rowsArray[idx].unitPrice = priceInput.value;
      const total = (parseNum(qtyInput.value) || 0) * (parseNum(priceInput.value) || 0);
      totalTd.textContent = '৳' + total;
      onRecalc();
    }
    qtyInput.addEventListener('input', recalcRow);
    priceInput.addEventListener('input', recalcRow);

    const actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', '');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', onRemove);
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);

    return tr;
  }

  function buildQtyOnlyItemRow(rowsArray, idx, onRemove, onRecalc) {
    const tr = document.createElement('tr');

    const serialTd = document.createElement('td');
    serialTd.setAttribute('data-label', 'ক্রম');
    serialTd.textContent = toBnNumber(idx + 1);
    tr.appendChild(serialTd);

    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'বইয়ের নাম');
    const nameSelect = document.createElement('select');
    nameSelect.innerHTML = '<option value="">নির্বাচন করুন</option>';
    _prakashonaTalikaList.forEach(function (book) {
      const opt = document.createElement('option');
      opt.value = book.name;
      opt.textContent = book.name + ' (স্টক: ' + toBnNumber(book.qty) + ')';
      if (book.name === rowsArray[idx].bookName) opt.selected = true;
      nameSelect.appendChild(opt);
    });
    nameSelect.addEventListener('change', function () { rowsArray[idx].bookName = this.value; });
    nameTd.appendChild(nameSelect);
    tr.appendChild(nameTd);

    const qtyTd = document.createElement('td');
    qtyTd.setAttribute('data-label', 'সংখ্যা');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'text';
    qtyInput.className = 'amount-input';
    qtyInput.placeholder = 'সংখ্যা';
    qtyInput.value = rowsArray[idx].qty || '';
    qtyInput.addEventListener('input', function () {
      rowsArray[idx].qty = this.value;
      onRecalc();
    });
    qtyTd.appendChild(qtyInput);
    tr.appendChild(qtyTd);

    const actionTd = document.createElement('td');
    actionTd.setAttribute('data-label', '');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', onRemove);
    actionTd.appendChild(removeBtn);
    tr.appendChild(actionTd);

    return tr;
  }

  function sumPriceItems(rowsArray) {
    return rowsArray.reduce(function (sum, r) {
      return sum + ((parseNum(r.qty) || 0) * (parseNum(r.unitPrice) || 0));
    }, 0);
  }

  function sumQtyItems(rowsArray) {
    return rowsArray.reduce(function (sum, r) { return sum + (parseNum(r.qty) || 0); }, 0);
  }

  // ==================== প্রকাশনা: শেয়ার্ড (এডিট মোড, অ্যাকশন আইকন, পিরিয়ড প্রিন্ট) ====================
  function setSaveMode_(btnId, isEdit) {
    document.getElementById(btnId).textContent = isEdit ? '🔄 আপডেট' : '💾 সংরক্ষণ';
  }

  function actionIcons_(idx, acts) {
    const defs = {
      edit: ['✏️', 'এডিট'],
      print: ['🖨️', 'প্রিন্ট'],
      delete: ['🗑️', 'ডিলেট']
    };
    return acts.map(function (a) {
      return '<button type="button" class="icon-btn" data-act="' + a + '" data-idx="' + idx + '" title="' + defs[a][1] + '" aria-label="' + defs[a][1] + '">' + defs[a][0] + '</button>';
    }).join(' ');
  }

  function bindRowActions_(box, records, handlers) {
    box.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const rec = records[parseInt(btn.getAttribute('data-idx'), 10)];
        const fn = handlers[btn.getAttribute('data-act')];
        if (rec && fn) fn(rec);
      });
    });
  }

  // স্টক বদলালে বই তালিকা ও ফরমের ড্রপডাউন নতুন করে লোড
  function refreshTalika_() {
    loadPrakashonaTalikaList(function () {
      renderPtList();
      if (typeof renderPkTable === 'function') { renderPkTable(); renderPbTable(); renderPdTable(); }
    });
  }

  function itemsSummary_(items, withQty) {
    return (items || []).filter(function (i) { return i.bookName; }).map(function (i) {
      return i.bookName + (withQty ? ' (' + (i.qty || 0) + ')' : '');
    }).join(', ');
  }

  // dd/MM/yyyy থেকে {m, y}
  function parseListDate_(str) {
    const p = String(str || '').split('/');
    if (p.length !== 3) return { m: '', y: '' };
    return { m: ('0' + p[1]).slice(-2), y: p[2] };
  }

  // পপআপ: নির্দিষ্ট মাস (মাস+বছর) / বছর / সকল — তারপর ফিল্টার করা রেকর্ড দিয়ে printFn(records, periodLabel) কল
  let _ppState = null;
  function openPeriodPrint_(title, getRecords, printFn) {
    _ppState = { getRecords: getRecords, printFn: printFn };
    document.getElementById('ppTitle').textContent = title;
    document.getElementById('ppType').value = 'month';
    const now = new Date();
    document.getElementById('ppMonth').value = ('0' + (now.getMonth() + 1)).slice(-2);
    document.getElementById('ppYear').value = now.getFullYear();
    syncPeriodPrintFields_();
    document.getElementById('periodPrintModal').style.display = 'flex';
  }

  function syncPeriodPrintFields_() {
    const type = document.getElementById('ppType').value;
    document.getElementById('ppMonthRow').style.display = type === 'all' ? 'none' : 'grid';
    document.getElementById('ppMonth').parentNode.style.display = type === 'month' ? 'block' : 'none';
    document.getElementById('ppYearGroup').style.display = type === 'all' ? 'none' : 'block';
  }

  function initPeriodPrintModal_() {
    const modal = document.getElementById('periodPrintModal');
    document.getElementById('ppType').addEventListener('change', syncPeriodPrintFields_);
    document.getElementById('ppCancelBtn').addEventListener('click', function () { modal.style.display = 'none'; });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
    document.getElementById('ppConfirmBtn').addEventListener('click', function () {
      if (!_ppState) return;
      const type = document.getElementById('ppType').value;
      const month = document.getElementById('ppMonth').value;
      const year = String(document.getElementById('ppYear').value || '').trim();
      if (type !== 'all' && !year) { showToast('অনুগ্রহ করে বছর লিখুন', 'error'); return; }
      const monthNames = { '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল', '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট', '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর' };
      let label = 'সকল';
      const all = _ppState.getRecords();
      const list = all.filter(function (r) {
        if (type === 'all') return true;
        const d = parseListDate_(r.date);
        if (type === 'year') return d.y === year;
        return d.y === year && d.m === month;
      });
      if (type === 'year') label = toBnNumber(year) + ' সাল';
      if (type === 'month') label = monthNames[month] + ' ' + toBnNumber(year);
      if (!list.length) { showToast('এই সময়ের কোনো তথ্য পাওয়া যায়নি', 'error'); return; }
      modal.style.display = 'none';
      _ppState.printFn(list, label);
    });
  }

  // অফিসিয়াল ফরম্যাটে জেনেরিক তালিকা প্রিন্ট
  function printOfficialList_(title, metaText, headers, rows, totalText) {
    document.getElementById('lp-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('lp-sub').textContent = document.getElementById('headerBranchLevel').textContent;
    document.getElementById('lp-title').textContent = title;
    document.getElementById('lp-meta').textContent = metaText || '';
    document.getElementById('lp-date').textContent = 'প্রিন্টের তারিখ: ' + new Date().toLocaleDateString('bn-BD');
    let html = '<thead><tr>' + headers.map(function (h) { return '<th>' + escapeHtml(h) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>' + r.map(function (c) { return '<td>' + escapeHtml(String(c)) + '</td>'; }).join('') + '</tr>';
    });
    document.getElementById('lp-table').innerHTML = html + '</tbody>';
    document.getElementById('lp-total').textContent = totalText || '';
    printViaWindow('listPrintTemplate');
  }

  // রশিদ প্রিন্টে (ক্রয়/বিক্রয়) আইটেম সারি বসানো
  function fillReceiptItems_(tbodyId, items, withPrice) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    (items || []).filter(function (r) { return r.bookName; }).forEach(function (item, idx) {
      const tr = document.createElement('tr');
      let html = '<td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(item.bookName) + '</td><td class="r-num">' + escapeHtml(String(item.qty || 0)) + '</td>';
      if (withPrice) {
        const total = (parseNum(item.qty) || 0) * (parseNum(item.unitPrice) || 0);
        html += '<td class="r-num">' + escapeHtml(String(item.unitPrice || 0)) + '</td><td class="r-num">' + total + '</td>';
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  // ==================== প্রকাশনা: ক্রয় ফরম ====================
  let _pkId = '';
  let _pkItems = [];
  let _pkAll = [];

  function initPrakashonaKroy() {
    _pkItems = [{ bookName: '', qty: '', unitPrice: '' }];
    renderPkTable();
    loadPkList();

    document.getElementById('pkAddRowBtn').addEventListener('click', function () {
      _pkItems.push({ bookName: '', qty: '', unitPrice: '' });
      renderPkTable();
    });
    document.getElementById('pk-discount').addEventListener('input', recalcPkSummary);
    document.getElementById('pk-paid').addEventListener('input', recalcPkSummary);
    document.getElementById('pkSaveBtn').addEventListener('click', submitPkForm);
    document.getElementById('pkResetBtn').addEventListener('click', resetPkForm);
  }

  function renderPkTable() {
    const body = document.getElementById('pkItemsBody');
    body.innerHTML = '';
    _pkItems.forEach(function (item, idx) {
      body.appendChild(buildPriceItemRow(_pkItems, idx, function () {
        _pkItems.splice(idx, 1);
        if (!_pkItems.length) _pkItems.push({ bookName: '', qty: '', unitPrice: '' });
        renderPkTable();
      }, recalcPkSummary));
    });
    recalcPkSummary();
  }

  function recalcPkSummary() {
    const subtotal = sumPriceItems(_pkItems);
    const discount = parseNum(document.getElementById('pk-discount').value) || 0;
    const paid = parseNum(document.getElementById('pk-paid').value) || 0;
    document.getElementById('pk-subtotal').textContent = '৳' + subtotal;
    document.getElementById('pk-due').textContent = '৳' + (subtotal - discount - paid);
  }

  function submitPkForm() {
    const isEdit = !!_pkId;
    const validItems = _pkItems.filter(function (r) { return r.bookName; });
    if (!validItems.length) { showToast('অনুগ্রহ করে অন্তত একটি বইয়ের তথ্য দিন', 'error'); return; }
    const subtotal = sumPriceItems(_pkItems);
    const discount = parseNum(document.getElementById('pk-discount').value) || 0;
    const paid = parseNum(document.getElementById('pk-paid').value) || 0;
    const formData = {
      id: _pkId,
      date: formatDateForSheet(document.getElementById('pk-date').value),
      items: validItems, subtotal: subtotal, discount: discount, paid: paid, due: subtotal - discount - paid
    };
    const btn = document.getElementById('pkSaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast((isEdit ? 'আপডেট' : 'সংরক্ষণ') + ' সম্পন্ন হয়েছে', 'success');
          resetPkForm();
          if (isEdit) setFormCardOpen_('pkFormCard', 'pkFormToggleBtn', false, false);
          loadPkList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { btn.disabled = false; showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .savePrakashonaKroy(formData);
  }

  function resetPkForm() {
    _pkId = '';
    document.getElementById('pk-date').value = '';
    document.getElementById('pk-discount').value = '0';
    document.getElementById('pk-paid').value = '0';
    _pkItems = [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pkSaveBtn', false);
    renderPkTable();
  }

  function loadPkList() {
    const box = document.getElementById('pkList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _pkAll = (res.success && res.data) ? res.data : [];
        renderPkList();
      })
      .withFailureHandler(function () { box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>'; })
      .getPrakashonaKroyList();
  }

  function renderPkList() {
    const box = document.getElementById('pkList');
    const countEl = document.getElementById('pkCount');
    if (!_pkAll.length) { box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>'; countEl.textContent = ''; return; }
    countEl.textContent = '(মোট ' + toBnNumber(_pkAll.length) + 'টি)';
    let html = '<table class="dhajjo-table"><thead><tr><th>তারিখ</th><th>বই</th><th>সাবটোটাল</th><th>ডিসকাউন্ট</th><th>পরিশোধ</th><th>বকেয়া</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _pkAll.forEach(function (r, idx) {
      html += '<tr><td>' + escapeHtml(r.date || '—') + '</td><td class="col-wrap">' + escapeHtml(itemsSummary_(r.items, true) || '—') + '</td>' +
        '<td>৳' + escapeHtml(String(r.subtotal)) + '</td><td>৳' + escapeHtml(String(r.discount || 0)) + '</td><td>৳' + escapeHtml(String(r.paid || 0)) + '</td><td>৳' + escapeHtml(String(r.due)) + '</td>' +
        '<td>' + actionIcons_(idx, ['edit', 'print', 'delete']) + '</td></tr>';
    });
    box.innerHTML = html + '</tbody></table>';
    bindRowActions_(box, _pkAll, { edit: loadPkForEdit, print: printPkReceipt, delete: deletePkRecord_ });
  }

  function loadPkForEdit(r) {
    _pkId = r.id;
    document.getElementById('pk-date').value = toInputDate(r.date);
    document.getElementById('pk-discount').value = r.discount || 0;
    document.getElementById('pk-paid').value = r.paid || 0;
    _pkItems = (r.items && r.items.length) ? JSON.parse(JSON.stringify(r.items)) : [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pkSaveBtn', true);
    renderPkTable();
    setFormCardOpen_('pkFormCard', 'pkFormToggleBtn', true, true);
  }

  function deletePkRecord_(r) {
    if (!confirm('আপনি কি নিশ্চিত এই ক্রয়ের এন্ট্রি মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (_pkId === r.id) resetPkForm();
          loadPkList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deletePrakashonaKroy(r.id);
  }

  function printPkReceipt(r) {
    document.getElementById('pkr-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('pkr-date').textContent = r.date || '—';
    fillReceiptItems_('pkr-items', r.items, true);
    document.getElementById('pkr-subtotal').textContent = '৳' + (r.subtotal || 0);
    document.getElementById('pkr-discount').textContent = '৳' + (r.discount || 0);
    document.getElementById('pkr-paid').textContent = '৳' + (r.paid || 0);
    document.getElementById('pkr-due').textContent = '৳' + (r.due || 0);
    printViaWindow('pkPrintTemplate');
  }

  // ==================== প্রকাশনা: বিক্রয় ফরম ====================
  let _pbId = '';
  let _pbItems = [];
  let _pbAll = [];

  function initPrakashonaBikroy() {
    _pbItems = [{ bookName: '', qty: '', unitPrice: '' }];
    renderPbTable();
    loadPbList();

    document.getElementById('pb-upashakha-picker').addEventListener('change', function () {
      if (this.value) document.getElementById('pb-customer').value = this.value;
    });
    document.getElementById('pbAddRowBtn').addEventListener('click', function () {
      _pbItems.push({ bookName: '', qty: '', unitPrice: '' });
      renderPbTable();
    });
    document.getElementById('pb-discount').addEventListener('input', recalcPbSummary);
    document.getElementById('pb-paid').addEventListener('input', recalcPbSummary);
    document.getElementById('pbSaveBtn').addEventListener('click', submitPbForm);
    document.getElementById('pbResetBtn').addEventListener('click', resetPbForm);
    document.getElementById('pbListPrintBtn').addEventListener('click', function () {
      openPeriodPrint_('বিক্রয় তালিকা প্রিন্ট', function () { return _pbAll; }, printPbList_);
    });
  }

  function renderPbTable() {
    const body = document.getElementById('pbItemsBody');
    body.innerHTML = '';
    _pbItems.forEach(function (item, idx) {
      body.appendChild(buildPriceItemRow(_pbItems, idx, function () {
        _pbItems.splice(idx, 1);
        if (!_pbItems.length) _pbItems.push({ bookName: '', qty: '', unitPrice: '' });
        renderPbTable();
      }, recalcPbSummary));
    });
    recalcPbSummary();
  }

  function recalcPbSummary() {
    const subtotal = sumPriceItems(_pbItems);
    const discount = parseNum(document.getElementById('pb-discount').value) || 0;
    const paid = parseNum(document.getElementById('pb-paid').value) || 0;
    document.getElementById('pb-subtotal').textContent = '৳' + subtotal;
    document.getElementById('pb-due').textContent = '৳' + (subtotal - discount - paid);
  }

  function submitPbForm() {
    const isEdit = !!_pbId;
    const validItems = _pbItems.filter(function (r) { return r.bookName; });
    if (!validItems.length) { showToast('অনুগ্রহ করে অন্তত একটি বইয়ের তথ্য দিন', 'error'); return; }
    const subtotal = sumPriceItems(_pbItems);
    const discount = parseNum(document.getElementById('pb-discount').value) || 0;
    const paid = parseNum(document.getElementById('pb-paid').value) || 0;
    const formData = {
      id: _pbId,
      date: formatDateForSheet(document.getElementById('pb-date').value),
      customer: document.getElementById('pb-customer').value,
      items: validItems, subtotal: subtotal, discount: discount, paid: paid, due: subtotal - discount - paid
    };
    const btn = document.getElementById('pbSaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast((isEdit ? 'আপডেট' : 'সংরক্ষণ') + ' সম্পন্ন হয়েছে', 'success');
          resetPbForm();
          if (isEdit) setFormCardOpen_('pbFormCard', 'pbFormToggleBtn', false, false);
          loadPbList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { btn.disabled = false; showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .savePrakashonaBikroy(formData);
  }

  function resetPbForm() {
    _pbId = '';
    document.getElementById('pb-date').value = '';
    document.getElementById('pb-customer').value = '';
    document.getElementById('pb-upashakha-picker').value = '';
    document.getElementById('pb-discount').value = '0';
    document.getElementById('pb-paid').value = '0';
    _pbItems = [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pbSaveBtn', false);
    renderPbTable();
  }

  function loadPbList() {
    const box = document.getElementById('pbList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _pbAll = (res.success && res.data) ? res.data : [];
        renderPbList();
      })
      .withFailureHandler(function () { box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>'; })
      .getPrakashonaBikroyList();
  }

  function renderPbList() {
    const box = document.getElementById('pbList');
    const countEl = document.getElementById('pbCount');
    if (!_pbAll.length) { box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>'; countEl.textContent = ''; return; }
    countEl.textContent = '(মোট ' + toBnNumber(_pbAll.length) + 'টি)';
    let html = '<table class="dhajjo-table"><thead><tr><th>তারিখ</th><th>গ্রাহক</th><th>বই</th><th>সাবটোটাল</th><th>ডিসকাউন্ট</th><th>আদায়</th><th>বকেয়া</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _pbAll.forEach(function (r, idx) {
      html += '<tr><td>' + escapeHtml(r.date || '—') + '</td><td>' + escapeHtml(r.customer || '—') + '</td><td class="col-wrap">' + escapeHtml(itemsSummary_(r.items, true) || '—') + '</td>' +
        '<td>৳' + escapeHtml(String(r.subtotal)) + '</td><td>৳' + escapeHtml(String(r.discount || 0)) + '</td><td>৳' + escapeHtml(String(r.paid || 0)) + '</td><td>৳' + escapeHtml(String(r.due)) + '</td>' +
        '<td>' + actionIcons_(idx, ['edit', 'print', 'delete']) + '</td></tr>';
    });
    box.innerHTML = html + '</tbody></table>';
    bindRowActions_(box, _pbAll, { edit: loadPbForEdit, print: printPbReceipt, delete: deletePbRecord_ });
  }

  function loadPbForEdit(r) {
    _pbId = r.id;
    document.getElementById('pb-date').value = toInputDate(r.date);
    document.getElementById('pb-customer').value = r.customer || '';
    document.getElementById('pb-discount').value = r.discount || 0;
    document.getElementById('pb-paid').value = r.paid || 0;
    _pbItems = (r.items && r.items.length) ? JSON.parse(JSON.stringify(r.items)) : [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pbSaveBtn', true);
    renderPbTable();
    setFormCardOpen_('pbFormCard', 'pbFormToggleBtn', true, true);
  }

  function deletePbRecord_(r) {
    if (!confirm('আপনি কি নিশ্চিত এই বিক্রয়ের এন্ট্রি মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (_pbId === r.id) resetPbForm();
          loadPbList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deletePrakashonaBikroy(r.id);
  }

  function printPbReceipt(r) {
    document.getElementById('pbr-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('pbr-date').textContent = r.date || '—';
    document.getElementById('pbr-customer').textContent = r.customer || '—';
    fillReceiptItems_('pbr-items', r.items, true);
    document.getElementById('pbr-subtotal').textContent = '৳' + (r.subtotal || 0);
    document.getElementById('pbr-discount').textContent = '৳' + (r.discount || 0);
    document.getElementById('pbr-paid').textContent = '৳' + (r.paid || 0);
    document.getElementById('pbr-due').textContent = '৳' + (r.due || 0);
    printViaWindow('pbPrintTemplate');
  }

  function printPbList_(list, label) {
    let sub = 0, disc = 0, paid = 0, due = 0;
    const rows = list.map(function (r, i) {
      sub += parseNum(r.subtotal) || 0; disc += parseNum(r.discount) || 0; paid += parseNum(r.paid) || 0; due += parseNum(r.due) || 0;
      return [toBnNumber(i + 1), r.date || '', r.customer || '', itemsSummary_(r.items, true), '৳' + (r.subtotal || 0), '৳' + (r.discount || 0), '৳' + (r.paid || 0), '৳' + (r.due || 0)];
    });
    printOfficialList_('প্রকাশনা বিক্রয় তালিকা', 'সময়কাল: ' + label,
      ['ক্রম', 'তারিখ', 'গ্রাহক', 'বই (সংখ্যা)', 'সাবটোটাল', 'ডিসকাউন্ট', 'আদায়', 'বকেয়া'], rows,
      'মোট: বিক্রয় ৳' + sub + ' | ডিসকাউন্ট ৳' + disc + ' | আদায় ৳' + paid + ' | বকেয়া ৳' + due);
  }

  // ==================== প্রকাশনা: বিলি ফরম ====================
  let _pdId = '';
  let _pdItems = [];
  let _pdAll = [];

  function initPrakashonaBili() {
    _pdItems = [{ bookName: '', qty: '' }];
    renderPdTable();
    loadPdList();

    document.getElementById('pdAddRowBtn').addEventListener('click', function () {
      _pdItems.push({ bookName: '', qty: '' });
      renderPdTable();
    });
    document.getElementById('pdSaveBtn').addEventListener('click', submitPdForm);
    document.getElementById('pdResetBtn').addEventListener('click', resetPdForm);
    document.getElementById('pdListPrintBtn').addEventListener('click', function () {
      openPeriodPrint_('বিলি তালিকা প্রিন্ট', function () { return _pdAll; }, printPdList_);
    });
  }

  function renderPdTable() {
    const body = document.getElementById('pdItemsBody');
    body.innerHTML = '';
    _pdItems.forEach(function (item, idx) {
      body.appendChild(buildQtyOnlyItemRow(_pdItems, idx, function () {
        _pdItems.splice(idx, 1);
        if (!_pdItems.length) _pdItems.push({ bookName: '', qty: '' });
        renderPdTable();
      }, recalcPdSummary));
    });
    recalcPdSummary();
  }

  function recalcPdSummary() {
    document.getElementById('pd-subtotal').textContent = toBnNumber(sumQtyItems(_pdItems));
  }

  function submitPdForm() {
    const isEdit = !!_pdId;
    const validItems = _pdItems.filter(function (r) { return r.bookName; });
    if (!validItems.length) { showToast('অনুগ্রহ করে অন্তত একটি বইয়ের তথ্য দিন', 'error'); return; }
    const sel = document.getElementById('pd-upashakha');
    const formData = {
      id: _pdId,
      date: formatDateForSheet(document.getElementById('pd-date').value),
      upashakhaId: sel.value,
      upashakhaName: sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : '',
      items: validItems,
      subtotal: sumQtyItems(_pdItems)
    };
    const btn = document.getElementById('pdSaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast((isEdit ? 'আপডেট' : 'সংরক্ষণ') + ' সম্পন্ন হয়েছে', 'success');
          resetPdForm();
          if (isEdit) setFormCardOpen_('pdFormCard', 'pdFormToggleBtn', false, false);
          loadPdList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { btn.disabled = false; showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .savePrakashonaBili(formData);
  }

  function resetPdForm() {
    _pdId = '';
    document.getElementById('pd-date').value = '';
    document.getElementById('pd-upashakha').value = '';
    _pdItems = [{ bookName: '', qty: '' }];
    setSaveMode_('pdSaveBtn', false);
    renderPdTable();
  }

  function loadPdList() {
    const box = document.getElementById('pdList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _pdAll = (res.success && res.data) ? res.data : [];
        renderPdList();
      })
      .withFailureHandler(function () { box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>'; })
      .getPrakashonaBiliList();
  }

  function renderPdList() {
    const box = document.getElementById('pdList');
    const countEl = document.getElementById('pdCount');
    if (!_pdAll.length) { box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>'; countEl.textContent = ''; return; }
    countEl.textContent = '(মোট ' + toBnNumber(_pdAll.length) + 'টি)';
    let html = '<table class="dhajjo-table"><thead><tr><th>তারিখ</th><th>উপশাখা</th><th>বই (সংখ্যা)</th><th>মোট সংখ্যা</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _pdAll.forEach(function (r, idx) {
      html += '<tr><td>' + escapeHtml(r.date || '—') + '</td><td>' + escapeHtml(r.upashakhaName || '—') + '</td><td class="col-wrap">' + escapeHtml(itemsSummary_(r.items, true) || '—') + '</td>' +
        '<td>' + escapeHtml(String(r.subtotal)) + '</td><td>' + actionIcons_(idx, ['edit', 'delete']) + '</td></tr>';
    });
    box.innerHTML = html + '</tbody></table>';
    bindRowActions_(box, _pdAll, { edit: loadPdForEdit, delete: deletePdRecord_ });
  }

  function loadPdForEdit(r) {
    _pdId = r.id;
    document.getElementById('pd-date').value = toInputDate(r.date);
    document.getElementById('pd-upashakha').value = r.upashakhaId || '';
    _pdItems = (r.items && r.items.length) ? JSON.parse(JSON.stringify(r.items)) : [{ bookName: '', qty: '' }];
    setSaveMode_('pdSaveBtn', true);
    renderPdTable();
    setFormCardOpen_('pdFormCard', 'pdFormToggleBtn', true, true);
  }

  function deletePdRecord_(r) {
    if (!confirm('আপনি কি নিশ্চিত এই বিলির এন্ট্রি মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (_pdId === r.id) resetPdForm();
          loadPdList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deletePrakashonaBili(r.id);
  }

  function printPdList_(list, label) {
    let total = 0;
    const rows = list.map(function (r, i) {
      total += parseNum(r.subtotal) || 0;
      return [toBnNumber(i + 1), r.date || '', r.upashakhaName || '', itemsSummary_(r.items, true), r.subtotal || 0];
    });
    printOfficialList_('প্রকাশনা বিলি তালিকা', 'সময়কাল: ' + label,
      ['ক্রম', 'তারিখ', 'উপশাখা', 'বই (সংখ্যা)', 'মোট সংখ্যা'], rows, 'সর্বমোট বিলি: ' + toBnNumber(total) + 'টি');
  }

  // ==================== প্রকাশনা: বাতিল প্রকাশনা ফরম ====================
  let _pcId = '';
  let _pcItems = [];
  let _pcAll = [];

  function initPrakashonaBatil() {
    _pcItems = [{ bookName: '', qty: '', unitPrice: '' }];
    renderPcTable();
    loadPcList();

    document.getElementById('pcAddRowBtn').addEventListener('click', function () {
      _pcItems.push({ bookName: '', qty: '', unitPrice: '' });
      renderPcTable();
    });
    document.getElementById('pcSaveBtn').addEventListener('click', submitPcForm);
    document.getElementById('pcResetBtn').addEventListener('click', resetPcForm);
    document.getElementById('pcListPrintBtn').addEventListener('click', function () {
      openPeriodPrint_('বাতিল প্রকাশনা তালিকা প্রিন্ট', function () { return _pcAll; }, printPcList_);
    });
  }

  function renderPcTable() {
    const body = document.getElementById('pcItemsBody');
    body.innerHTML = '';
    _pcItems.forEach(function (item, idx) {
      body.appendChild(buildPriceItemRow(_pcItems, idx, function () {
        _pcItems.splice(idx, 1);
        if (!_pcItems.length) _pcItems.push({ bookName: '', qty: '', unitPrice: '' });
        renderPcTable();
      }, recalcPcSummary));
    });
    recalcPcSummary();
  }

  function recalcPcSummary() {
    document.getElementById('pc-subtotal').textContent = '৳' + sumPriceItems(_pcItems);
  }

  function submitPcForm() {
    const isEdit = !!_pcId;
    const validItems = _pcItems.filter(function (r) { return r.bookName; });
    if (!validItems.length) {
      showToast('অনুগ্রহ করে অন্তত একটি বইয়ের তথ্য দিন', 'error');
      return;
    }
    const formData = {
      id: _pcId,
      date: formatDateForSheet(document.getElementById('pc-date').value),
      items: validItems,
      subtotal: sumPriceItems(_pcItems)
    };
    const btn = document.getElementById('pcSaveBtn');
    btn.disabled = true;
    google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast((isEdit ? 'আপডেট' : 'সংরক্ষণ') + ' সম্পন্ন হয়েছে', 'success');
          resetPcForm();
          if (isEdit) setFormCardOpen_('pcFormCard', 'pcFormToggleBtn', false, false);
          loadPcList();
          refreshTalika_();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) { btn.disabled = false; showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .savePrakashonaBatil(formData);
  }

  function resetPcForm() {
    _pcId = '';
    document.getElementById('pc-date').value = '';
    _pcItems = [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pcSaveBtn', false);
    renderPcTable();
  }

  function loadPcList() {
    const box = document.getElementById('pcList');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _pcAll = (res.success && res.data) ? res.data : [];
        renderPcList();
      })
      .withFailureHandler(function () { box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>'; })
      .getPrakashonaBatilList();
  }

  function renderPcList() {
    const box = document.getElementById('pcList');
    const countEl = document.getElementById('pcCount');
    if (!_pcAll.length) { box.innerHTML = '<div class="no-result">কোনো তথ্য নেই</div>'; countEl.textContent = ''; return; }
    countEl.textContent = '(মোট ' + toBnNumber(_pcAll.length) + 'টি)';
    let html = '<table class="dhajjo-table"><thead><tr><th>তারিখ</th><th>বই (সংখ্যা)</th><th>সাবটোটাল</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _pcAll.forEach(function (r, idx) {
      html += '<tr><td>' + escapeHtml(r.date || '—') + '</td><td class="col-wrap">' + escapeHtml(itemsSummary_(r.items, true) || '—') + '</td>' +
        '<td>৳' + escapeHtml(String(r.subtotal || 0)) + '</td><td>' + actionIcons_(idx, ['edit', 'print', 'delete']) + '</td></tr>';
    });
    box.innerHTML = html + '</tbody></table>';
    bindRowActions_(box, _pcAll, { edit: loadPcForEdit, print: printPcReceipt, delete: deletePcRecord_ });
  }

  function loadPcForEdit(r) {
    _pcId = r.id;
    document.getElementById('pc-date').value = toInputDate(r.date);
    _pcItems = (r.items && r.items.length) ? JSON.parse(JSON.stringify(r.items)) : [{ bookName: '', qty: '', unitPrice: '' }];
    setSaveMode_('pcSaveBtn', true);
    renderPcTable();
    setFormCardOpen_('pcFormCard', 'pcFormToggleBtn', true, true);
  }

  function deletePcRecord_(r) {
    if (!confirm('আপনি কি নিশ্চিত এই এন্ট্রি মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (_pcId === r.id) resetPcForm();
          loadPcList();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deletePrakashonaBatil(r.id);
  }

  function printPcReceipt(r) {
    document.getElementById('pcr-orgName').textContent = document.getElementById('headerBranchName').textContent;
    document.getElementById('pcr-date').textContent = r.date || '—';
    fillReceiptItems_('pcr-items', r.items, true);
    document.getElementById('pcr-subtotal').textContent = '৳' + (r.subtotal || 0);
    printViaWindow('pcPrintTemplate');
  }

  function printPcList_(list, label) {
    let total = 0;
    const rows = list.map(function (r, i) {
      total += parseNum(r.subtotal) || 0;
      return [toBnNumber(i + 1), r.date || '', itemsSummary_(r.items, true), '৳' + (r.subtotal || 0)];
    });
    printOfficialList_('বাতিল প্রকাশনা তালিকা', 'সময়কাল: ' + label,
      ['ক্রম', 'তারিখ', 'বই (সংখ্যা)', 'সাবটোটাল'], rows, 'সর্বমোট বাতিল: ৳' + total);
  }

  // ==================== এয়ানত বৃদ্ধি ফরম ====================
  let _eiData = [];

  function initEyanatIncrease() {
    document.getElementById('eyanatIncreaseToggleBtn').addEventListener('click', function () {
      const card = document.getElementById('eyanatIncreaseCard');
      const willOpen = (card.style.display === 'none' || !card.style.display);
      card.style.display = willOpen ? 'block' : 'none';
      // এয়ানত বৃদ্ধি ফরম খুললে সদস্য সার্চ/ধার্য্য ফরম লুকাবে, বন্ধ করলে আবার দেখাবে
      document.getElementById('dhajjoMemberWrap').style.display = willOpen ? 'none' : 'block';
    });

    document.getElementById('eiLoadBtn').addEventListener('click', loadEyanatIncreaseList);
    document.getElementById('eiSaveBtn').addEventListener('click', function () { submitEyanatIncrease('সংরক্ষণ'); });
    document.getElementById('eiUpdateBtn').addEventListener('click', function () { submitEyanatIncrease('আপডেট'); });
    document.getElementById('eiResetBtn').addEventListener('click', loadEyanatIncreaseList);
    document.getElementById('eiPrintBtn').addEventListener('click', printEyanatIncrease);
  }

  function loadEyanatIncreaseList() {
    const branch = document.getElementById('ei-branch').value;
    const maan = document.getElementById('ei-maan').value;
    if (!branch || !maan) {
      showToast('অনুগ্রহ করে শাখা ও মান নির্বাচন করুন', 'error');
      return;
    }
    const listWrap = document.getElementById('eiListWrap');
    const body = document.getElementById('eiListBody');
    body.innerHTML = '<tr><td colspan="5" data-label="">লোড হচ্ছে...</td></tr>';
    listWrap.style.display = 'block';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          body.innerHTML = '<tr><td colspan="5" data-label="">তথ্য লোড করতে সমস্যা হয়েছে</td></tr>';
          return;
        }
        _eiData = res.data;
        renderEyanatIncreaseTable();
      })
      .withFailureHandler(function (err) {
        body.innerHTML = '<tr><td colspan="5" data-label="">সমস্যা হয়েছে: ' + err.message + '</td></tr>';
      })
      .getEyanatIncreaseFormList(branch, maan);
  }

  function renderEyanatIncreaseTable() {
    const body = document.getElementById('eiListBody');
    body.innerHTML = '';
    if (!_eiData.length) {
      body.innerHTML = '<tr><td colspan="5" data-label="">এই শাখা ও মানের কোনো সদস্য পাওয়া যায়নি</td></tr>';
      return;
    }
    const todayStr = new Date().toLocaleDateString('bn-BD');
    _eiData.forEach(function (m, idx) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="ক্রম">' + toBnNumber(idx + 1) + '</td>' +
        '<td data-label="নাম">' + escapeHtml(m.name) + '</td>' +
        '<td data-label="বর্তমান ধার্য্য">৳' + escapeHtml(String(m.currentRate)) + '</td>';
      const incTd = document.createElement('td');
      incTd.setAttribute('data-label', 'বৃদ্ধির পরিমাণ');
      const incInput = document.createElement('input');
      incInput.type = 'text';
      incInput.className = 'amount-input';
      incInput.placeholder = 'পরিমাণ';
      incInput.dataset.idx = idx;
      incTd.appendChild(incInput);
      tr.appendChild(incTd);
      const dateTd = document.createElement('td');
      dateTd.setAttribute('data-label', 'তারিখ');
      dateTd.textContent = todayStr;
      tr.appendChild(dateTd);
      body.appendChild(tr);
    });
  }

  function submitEyanatIncrease(actionLabel) {
    const entries = [];
    document.querySelectorAll('#eiListBody input[data-idx]').forEach(function (input) {
      const amount = input.value;
      if (amount && parseNum(amount) > 0) {
        const idx = parseInt(input.dataset.idx, 10);
        entries.push({ memberId: _eiData[idx].memberId, memberName: _eiData[idx].name, increaseAmount: amount });
      }
    });
    if (!entries.length) {
      showToast('অনুগ্রহ করে অন্তত একজনের জন্য বৃদ্ধির পরিমাণ লিখুন', 'error');
      return;
    }
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadEyanatIncreaseList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .saveEyanatIncrease(entries);
  }

  function printEyanatIncrease() {
    document.getElementById('eiprint-branch').textContent = document.getElementById('ei-branch').value || '—';
    document.getElementById('eiprint-maan').textContent = document.getElementById('ei-maan').value || '—';
    document.getElementById('eiprint-date').textContent = new Date().toLocaleDateString('bn-BD');

    const table = document.getElementById('eiprint-table');
    let rows = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">নাম</td><td class="p-label">পূর্বের ধার্য্য</td><td class="p-label">বৃদ্ধি</td><td class="p-label">নতুন ধার্য্য</td></tr>';
    document.querySelectorAll('#eiListBody input[data-idx]').forEach(function (input) {
      const idx = parseInt(input.dataset.idx, 10);
      const m = _eiData[idx];
      const increase = parseNum(input.value) || 0;
      rows += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(m.name) + '</td><td>৳' + m.currentRate + '</td><td>৳' + increase + '</td><td>৳' + (m.currentRate + increase) + '</td></tr>';
    });
    table.innerHTML = rows;

    printViaWindow('eiPrintTemplate');
  }

  // ==================== নিসাব বৃদ্ধি ফরম ====================
  let _niData = [];

  function initNisabIncrease() {
    document.getElementById('nisabIncreaseToggleBtn').addEventListener('click', function () {
      const card = document.getElementById('nisabIncreaseCard');
      const willShow = (card.style.display === 'none' || !card.style.display);
      card.style.display = willShow ? 'block' : 'none';
      // নিসাব বৃদ্ধি ফরম খুললে উপশাখা নির্বাচন/ধার্য্য অংশ লুকাবে, বন্ধ করলে আবার দেখাবে
      document.getElementById('upashakhaDhajjoMainWrap').style.display = willShow ? 'none' : 'block';
      if (willShow) loadNisabIncreaseList();
    });

    document.getElementById('niSaveBtn').addEventListener('click', function () { submitNisabIncrease('সংরক্ষণ'); });
    document.getElementById('niUpdateBtn').addEventListener('click', function () { submitNisabIncrease('আপডেট'); });
    document.getElementById('niResetBtn').addEventListener('click', loadNisabIncreaseList);
    document.getElementById('niPrintBtn').addEventListener('click', printNisabIncrease);
  }

  function loadNisabIncreaseList() {
    const body = document.getElementById('niListBody');
    body.innerHTML = '<tr><td colspan="5" data-label="">লোড হচ্ছে...</td></tr>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          body.innerHTML = '<tr><td colspan="5" data-label="">তথ্য লোড করতে সমস্যা হয়েছে</td></tr>';
          return;
        }
        _niData = res.data;
        renderNisabIncreaseTable();
      })
      .withFailureHandler(function (err) {
        body.innerHTML = '<tr><td colspan="5" data-label="">সমস্যা হয়েছে: ' + err.message + '</td></tr>';
      })
      .getNisabIncreaseFormList();
  }

  function renderNisabIncreaseTable() {
    const body = document.getElementById('niListBody');
    body.innerHTML = '';
    if (!_niData.length) {
      body.innerHTML = '<tr><td colspan="5" data-label="">কোনো উপশাখা পাওয়া যায়নি</td></tr>';
      return;
    }
    const todayStr = new Date().toLocaleDateString('bn-BD');
    _niData.forEach(function (u, idx) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td data-label="ক্রম">' + toBnNumber(idx + 1) + '</td>' +
        '<td data-label="উপশাখার নাম">' + escapeHtml(u.name) + '</td>' +
        '<td data-label="বর্তমান ধার্য্য">৳' + escapeHtml(String(u.currentRate)) + '</td>';
      const incTd = document.createElement('td');
      incTd.setAttribute('data-label', 'বৃদ্ধির পরিমাণ');
      const incInput = document.createElement('input');
      incInput.type = 'text';
      incInput.className = 'amount-input';
      incInput.placeholder = 'পরিমাণ';
      incInput.dataset.idx = idx;
      incTd.appendChild(incInput);
      tr.appendChild(incTd);
      const dateTd = document.createElement('td');
      dateTd.setAttribute('data-label', 'তারিখ');
      dateTd.textContent = todayStr;
      tr.appendChild(dateTd);
      body.appendChild(tr);
    });
  }

  function submitNisabIncrease(actionLabel) {
    const entries = [];
    document.querySelectorAll('#niListBody input[data-idx]').forEach(function (input) {
      const amount = input.value;
      if (amount && parseNum(amount) > 0) {
        const idx = parseInt(input.dataset.idx, 10);
        entries.push({ upashakhaId: _niData[idx].upashakhaId, upashakhaName: _niData[idx].name, increaseAmount: amount });
      }
    });
    if (!entries.length) {
      showToast('অনুগ্রহ করে অন্তত একটি উপশাখার জন্য বৃদ্ধির পরিমাণ লিখুন', 'error');
      return;
    }
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(actionLabel + ' সম্পন্ন হয়েছে', 'success');
          loadNisabIncreaseList();
        } else {
          showToast('সমস্যা হয়েছে: ' + res.error, 'error');
        }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .saveNisabIncrease(entries);
  }

  function printNisabIncrease() {
    document.getElementById('niprint-date').textContent = new Date().toLocaleDateString('bn-BD');

    const table = document.getElementById('niprint-table');
    let rows = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">উপশাখার নাম</td><td class="p-label">পূর্বের ধার্য্য</td><td class="p-label">বৃদ্ধি</td><td class="p-label">নতুন ধার্য্য</td></tr>';
    document.querySelectorAll('#niListBody input[data-idx]').forEach(function (input) {
      const idx = parseInt(input.dataset.idx, 10);
      const u = _niData[idx];
      const increase = parseNum(input.value) || 0;
      rows += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(u.name) + '</td><td>৳' + u.currentRate + '</td><td>৳' + increase + '</td><td>৳' + (u.currentRate + increase) + '</td></tr>';
    });
    table.innerHTML = rows;

    printViaWindow('niPrintTemplate');
  }

  // ফরম কার্ড ও রিপোর্ট কার্ড একে অপরের সাথে এক্সক্লুসিভ — একটি খুললে অন্যটি বন্ধ হবে
  function toggleFormReportCard_(reportBtnId, reportCardId, formCardId) {
    const btn = document.getElementById(reportBtnId);
    const reportCard = document.getElementById(reportCardId);
    const formCard = document.getElementById(formCardId);
    if (!btn || !reportCard) return;

    btn.addEventListener('click', function () {
      const willOpen = (reportCard.style.display === 'none' || !reportCard.style.display);
      if (willOpen) {
        reportCard.style.display = 'block';
        if (formCard) formCard.style.display = 'none';
        btn.textContent = '📝 ফরমে ফিরুন';
      } else {
        reportCard.style.display = 'none';
        if (formCard) formCard.style.display = 'block';
        btn.textContent = '📊 রিপোর্ট';
      }
    });
  }

  // ==================== জনশক্তি রিপোর্ট ====================
  let _jrepPivotData = null;
  let _jrepIndData = null;

  function initJonoshoktiReport() {
    toggleFormReportCard_('jiReportToggleBtn', 'jiReportCard', 'jiFormCard');

    document.querySelectorAll('.jrep-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.jrep-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const tab = btn.dataset.jrep;
        document.getElementById('jrep-pivot-section').style.display = (tab === 'individual') ? 'none' : 'block';
        document.getElementById('jrep-individual-section').style.display = (tab === 'individual') ? 'block' : 'none';
        _jrepMode = (tab === 'due') ? 'due' : 'income';
      });
    });

    document.getElementById('jrep-periodType').addEventListener('change', updateJrepPeriodValueField);
    bindDataToggle_('jrepLoadBtn',
      function () { return hasContent_('jrepTableWrap'); },
      function () { document.getElementById('jrepTableWrap').innerHTML = ''; },
      loadJrepPivotReport, '🔍 রিপোর্ট দেখুন', '✖ রিপোর্ট বন্ধ করুন');
    document.getElementById('jrepIndCloseBtn').addEventListener('click', function () {
      document.getElementById('jrepIndResultWrap').style.display = 'none';
      document.getElementById('jrepIndSearchResults').innerHTML = '';
      document.getElementById('jrepIndSearchInput').value = '';
      _jrepIndData = null;
    });
    document.getElementById('jrepPrintBtn').addEventListener('click', printJrepPivotReport);

    document.getElementById('jrepIndSearchBtn').addEventListener('click', doJrepIndSearch);
    document.getElementById('jrepIndSearchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doJrepIndSearch(); }
    });
    document.getElementById('jrepIndPrintBtn').addEventListener('click', printJrepIndReport);

    updateJrepPeriodValueField();
  }

  let _jrepMode = 'income';

  function updateJrepPeriodValueField() {
    const type = document.getElementById('jrep-periodType').value;
    const wrap = document.getElementById('jrep-periodValueWrap');
    const label = document.getElementById('jrep-periodValueLabel');
    const select = document.getElementById('jrep-periodValue');

    if (type === 'বার্ষিক') {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = 'block';
    if (type === 'মাসিক') {
      label.textContent = 'মাস';
      select.innerHTML = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
        .map(function (m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
    } else if (type === 'ত্রৈমাসিক') {
      label.textContent = 'কোয়ার্টার';
      select.innerHTML = '<option value="1">১ম কোয়ার্টার (জানু-মার্চ)</option><option value="2">২য় কোয়ার্টার (এপ্রি-জুন)</option><option value="3">৩য় কোয়ার্টার (জুলা-সেপ্ট)</option><option value="4">৪র্থ কোয়ার্টার (অক্টো-ডিসে)</option>';
    } else if (type === 'ষান্মাসিক') {
      label.textContent = 'অর্ধ';
      select.innerHTML = '<option value="1">১ম অর্ধ (জানু-জুন)</option><option value="2">২য় অর্ধ (জুলা-ডিসে)</option>';
    }
  }

  function loadJrepPivotReport() {
    const branch = document.getElementById('jrep-branch').value;
    const maan = document.getElementById('jrep-maan').value;
    const periodType = document.getElementById('jrep-periodType').value;
    const year = document.getElementById('jrep-year').value;
    const periodValue = document.getElementById('jrep-periodValue').value;

    if (!branch || !maan || !year) {
      showToast('অনুগ্রহ করে শাখা, মান ও বছর নির্বাচন করুন', 'error');
      return;
    }

    const wrap = document.getElementById('jrepTableWrap');
    wrap.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';

    const fn = (_jrepMode === 'due') ? 'getJonoshoktiDueReport' : 'getJonoshoktiIncomeReport';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          wrap.innerHTML = '<div class="no-result">তথ্য লোড করতে সমস্যা হয়েছে</div>';
          return;
        }
        _jrepPivotData = res;
        renderJrepPivotTable();
      })
      .withFailureHandler(function (err) {
        wrap.innerHTML = '<div class="no-result">সমস্যা হয়েছে: ' + err.message + '</div>';
      })
      [fn](branch, maan, periodType, year, periodValue);
  }

  function renderJrepPivotTable() {
    const wrap = document.getElementById('jrepTableWrap');
    if (!_jrepPivotData || !_jrepPivotData.rows.length) {
      wrap.innerHTML = '<div class="no-result">কোনো তথ্য পাওয়া যায়নি</div>';
      return;
    }
    const cols = _jrepPivotData.khatColumns;
    let html = '<table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>নাম</th>';
    cols.forEach(function (c) { html += '<th>' + escapeHtml(c) + '</th>'; });
    html += '<th>মোট</th></tr></thead><tbody>';
    _jrepPivotData.rows.forEach(function (row, idx) {
      html += '<tr><td data-label="ক্রম">' + toBnNumber(idx + 1) + '</td><td data-label="নাম">' + escapeHtml(row.name) + '</td>';
      cols.forEach(function (c) {
        html += '<td data-label="' + escapeHtml(c) + '">৳' + (row.values[c] || 0) + '</td>';
      });
      html += '<td data-label="মোট"><b>৳' + row.total + '</b></td></tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function printJrepPivotReport() {
    if (!_jrepPivotData || !_jrepPivotData.rows.length) {
      showToast('অনুগ্রহ করে প্রথমে রিপোর্ট দেখুন', 'error');
      return;
    }
    document.getElementById('jrepprint-title').textContent = 'খাত-ভিত্তিক ' + (_jrepMode === 'due' ? 'বকেয়া' : 'আয়') + ' রিপোর্ট';
    document.getElementById('jrepprint-meta').textContent =
      document.getElementById('jrep-branch').value + ' | ' + document.getElementById('jrep-maan').value + ' | ' +
      document.getElementById('jrep-periodType').value + ' ' + document.getElementById('jrep-year').value;

    const cols = _jrepPivotData.khatColumns;
    let html = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">নাম</td>';
    cols.forEach(function (c) { html += '<td class="p-label">' + escapeHtml(c) + '</td>'; });
    html += '<td class="p-label">মোট</td></tr>';
    _jrepPivotData.rows.forEach(function (row, idx) {
      html += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(row.name) + '</td>';
      cols.forEach(function (c) { html += '<td>৳' + (row.values[c] || 0) + '</td>'; });
      html += '<td>৳' + row.total + '</td></tr>';
    });
    document.getElementById('jrepprint-table').innerHTML = html;

    printViaWindow('jrepPrintTemplate');
  }

  function doJrepIndSearch() {
    const query = document.getElementById('jrepIndSearchInput').value.trim();
    const resultsBox = document.getElementById('jrepIndSearchResults');
    if (!query) { resultsBox.innerHTML = '<div class="no-result">নাম লিখে সার্চ করুন</div>'; return; }
    resultsBox.innerHTML = '<div class="no-result">খোঁজা হচ্ছে...</div>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          renderGenericSearchResults(res.data, resultsBox, selectJrepIndMember);
        } else {
          resultsBox.innerHTML = '<div class="no-result">সার্চে সমস্যা হয়েছে</div>';
        }
      })
      .withFailureHandler(function (err) { resultsBox.innerHTML = '<div class="no-result">সমস্যা হয়েছে: ' + err.message + '</div>'; })
      .searchMembersByName(query);
  }

  function selectJrepIndMember(m) {
    document.getElementById('jrepIndSearchResults').innerHTML = '';
    document.getElementById('jrepIndSearchInput').value = '';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) { showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error'); return; }
        _jrepIndData = res.data;
        renderJrepIndReport();
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .getMemberFullReport(m.id);
  }

  function renderJrepIndReport() {
    const d = _jrepIndData;
    document.getElementById('jrepIndResultWrap').style.display = 'block';
    document.getElementById('jrepInd-name').textContent = d.member.name;
    document.getElementById('jrepInd-mobile').textContent = d.member.mobile || '—';
    document.getElementById('jrepInd-branchMaan').textContent = (d.member.branch || '—') + ' / ' + (d.member.maan || '—');

    const khatBody = document.getElementById('jrepIndKhatBody');
    khatBody.innerHTML = '';
    d.khats.forEach(function (k) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td data-label="খাতের নাম">' + escapeHtml(k.khatName) + '</td><td data-label="ধার্য্য">৳' + k.dhajjo + '</td><td data-label="পরিশোধ">৳' + k.paid + '</td><td data-label="বকেয়া">৳' + k.due + '</td>';
      khatBody.appendChild(tr);
    });

    const payBody = document.getElementById('jrepIndPayHistoryBody');
    payBody.innerHTML = '';
    d.paymentHistory.forEach(function (p) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(p.khatName) + '</td><td>' + escapeHtml(p.month) + ' ' + escapeHtml(String(p.year)) + '</td><td>৳' + p.amount + '</td><td>' + escapeHtml(p.date) + '</td>';
      payBody.appendChild(tr);
    });
  }

  function printJrepIndReport() {
    if (!_jrepIndData) { showToast('অনুগ্রহ করে প্রথমে একজন সদস্য নির্বাচন করুন', 'error'); return; }
    const d = _jrepIndData;
    document.getElementById('jrepIndprint-name').textContent = d.member.name;
    document.getElementById('jrepIndprint-mobile').textContent = d.member.mobile || '—';
    document.getElementById('jrepIndprint-branchMaan').textContent = (d.member.branch || '—') + ' / ' + (d.member.maan || '—');

    let khatHtml = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">ধার্য্য</td><td class="p-label">পরিশোধ</td><td class="p-label">বকেয়া</td></tr>';
    d.khats.forEach(function (k) {
      khatHtml += '<tr><td>' + escapeHtml(k.khatName) + '</td><td>৳' + k.dhajjo + '</td><td>৳' + k.paid + '</td><td>৳' + k.due + '</td></tr>';
    });
    document.getElementById('jrepIndprint-khatTable').innerHTML = khatHtml;

    let payHtml = '<tr><td class="p-label">খাত</td><td class="p-label">মাস/বছর</td><td class="p-label">পরিমাণ</td><td class="p-label">তারিখ</td></tr>';
    d.paymentHistory.forEach(function (p) {
      payHtml += '<tr><td>' + escapeHtml(p.khatName) + '</td><td>' + escapeHtml(p.month) + ' ' + escapeHtml(String(p.year)) + '</td><td>৳' + p.amount + '</td><td>' + escapeHtml(p.date) + '</td></tr>';
    });
    document.getElementById('jrepIndprint-payTable').innerHTML = payHtml;

    printViaWindow('jrepIndPrintTemplate');
  }

  // ==================== উপশাখা রিপোর্ট ====================
  let _urepPivotData = null;
  let _urepIndData = null;
  let _urepMode = 'income';

  function initUpashakhaReport() {
    toggleFormReportCard_('uiReportToggleBtn', 'uiReportCard', 'uiFormCard');

    document.querySelectorAll('.urep-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.urep-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const tab = btn.dataset.urep;
        document.getElementById('urep-pivot-section').style.display = (tab === 'individual') ? 'none' : 'block';
        document.getElementById('urep-individual-section').style.display = (tab === 'individual') ? 'block' : 'none';
        _urepMode = (tab === 'due') ? 'due' : 'income';
      });
    });

    document.getElementById('urep-periodType').addEventListener('change', updateUrepPeriodValueField);
    bindDataToggle_('urepLoadBtn',
      function () { return hasContent_('urepTableWrap'); },
      function () { document.getElementById('urepTableWrap').innerHTML = ''; },
      loadUrepPivotReport, '🔍 রিপোর্ট দেখুন', '✖ রিপোর্ট বন্ধ করুন');
    document.getElementById('urepIndCloseBtn').addEventListener('click', function () {
      document.getElementById('urepIndResultWrap').style.display = 'none';
      document.getElementById('urepInd-upashakha').value = '';
      _urepIndData = null;
    });
    document.getElementById('urepPrintBtn').addEventListener('click', printUrepPivotReport);

    document.getElementById('urepInd-upashakha').addEventListener('change', function () {
      if (!this.value) {
        document.getElementById('urepIndResultWrap').style.display = 'none';
        return;
      }
      loadUrepIndReport(this.value);
    });
    document.getElementById('urepIndPrintBtn').addEventListener('click', printUrepIndReport);

    updateUrepPeriodValueField();
  }

  function updateUrepPeriodValueField() {
    const type = document.getElementById('urep-periodType').value;
    const wrap = document.getElementById('urep-periodValueWrap');
    const label = document.getElementById('urep-periodValueLabel');
    const select = document.getElementById('urep-periodValue');

    if (type === 'বার্ষিক') {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = 'block';
    if (type === 'মাসিক') {
      label.textContent = 'মাস';
      select.innerHTML = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
        .map(function (m) { return '<option value="' + m + '">' + m + '</option>'; }).join('');
    } else if (type === 'ত্রৈমাসিক') {
      label.textContent = 'কোয়ার্টার';
      select.innerHTML = '<option value="1">১ম কোয়ার্টার (জানু-মার্চ)</option><option value="2">২য় কোয়ার্টার (এপ্রি-জুন)</option><option value="3">৩য় কোয়ার্টার (জুলা-সেপ্ট)</option><option value="4">৪র্থ কোয়ার্টার (অক্টো-ডিসে)</option>';
    } else if (type === 'ষান্মাসিক') {
      label.textContent = 'অর্ধ';
      select.innerHTML = '<option value="1">১ম অর্ধ (জানু-জুন)</option><option value="2">২য় অর্ধ (জুলা-ডিসে)</option>';
    }
  }

  function loadUrepPivotReport() {
    const level = document.getElementById('urep-level').value;
    const periodType = document.getElementById('urep-periodType').value;
    const year = document.getElementById('urep-year').value;
    const periodValue = document.getElementById('urep-periodValue').value;

    if (!year) {
      showToast('অনুগ্রহ করে বছর লিখুন', 'error');
      return;
    }

    const wrap = document.getElementById('urepTableWrap');
    wrap.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';

    const fn = (_urepMode === 'due') ? 'getUpashakhaDueReport' : 'getUpashakhaIncomeReport';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) {
          wrap.innerHTML = '<div class="no-result">তথ্য লোড করতে সমস্যা হয়েছে</div>';
          return;
        }
        _urepPivotData = res;
        renderUrepPivotTable();
      })
      .withFailureHandler(function (err) {
        wrap.innerHTML = '<div class="no-result">সমস্যা হয়েছে: ' + err.message + '</div>';
      })
      [fn](level, periodType, year, periodValue);
  }

  function renderUrepPivotTable() {
    const wrap = document.getElementById('urepTableWrap');
    if (!_urepPivotData || !_urepPivotData.rows.length) {
      wrap.innerHTML = '<div class="no-result">কোনো তথ্য পাওয়া যায়নি</div>';
      return;
    }
    const cols = _urepPivotData.khatColumns;
    let html = '<table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>উপশাখার নাম</th>';
    cols.forEach(function (c) { html += '<th>' + escapeHtml(c) + '</th>'; });
    html += '<th>মোট</th></tr></thead><tbody>';
    _urepPivotData.rows.forEach(function (row, idx) {
      html += '<tr><td data-label="ক্রম">' + toBnNumber(idx + 1) + '</td><td data-label="নাম">' + escapeHtml(row.name) + '</td>';
      cols.forEach(function (c) {
        html += '<td data-label="' + escapeHtml(c) + '">৳' + (row.values[c] || 0) + '</td>';
      });
      html += '<td data-label="মোট"><b>৳' + row.total + '</b></td></tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function printUrepPivotReport() {
    if (!_urepPivotData || !_urepPivotData.rows.length) {
      showToast('অনুগ্রহ করে প্রথমে রিপোর্ট দেখুন', 'error');
      return;
    }
    document.getElementById('urepprint-title').textContent = 'খাত-ভিত্তিক ' + (_urepMode === 'due' ? 'বকেয়া' : 'আয়') + ' রিপোর্ট (উপশাখা)';
    document.getElementById('urepprint-meta').textContent =
      (document.getElementById('urep-level').value || 'সকল মান') + ' | ' +
      document.getElementById('urep-periodType').value + ' ' + document.getElementById('urep-year').value;

    const cols = _urepPivotData.khatColumns;
    let html = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">নাম</td>';
    cols.forEach(function (c) { html += '<td class="p-label">' + escapeHtml(c) + '</td>'; });
    html += '<td class="p-label">মোট</td></tr>';
    _urepPivotData.rows.forEach(function (row, idx) {
      html += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(row.name) + '</td>';
      cols.forEach(function (c) { html += '<td>৳' + (row.values[c] || 0) + '</td>'; });
      html += '<td>৳' + row.total + '</td></tr>';
    });
    document.getElementById('urepprint-table').innerHTML = html;

    printViaWindow('urepPrintTemplate');
  }

  function loadUrepIndReport(upashakhaId) {
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) { showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error'); return; }
        _urepIndData = res.data;
        renderUrepIndReport();
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .getUpashakhaFullReport(upashakhaId);
  }

  function renderUrepIndReport() {
    const d = _urepIndData;
    document.getElementById('urepIndResultWrap').style.display = 'block';

    const khatBody = document.getElementById('urepIndKhatBody');
    khatBody.innerHTML = '';
    d.khats.forEach(function (k) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td data-label="খাতের নাম">' + escapeHtml(k.khatName) + '</td><td data-label="ধার্য্য">৳' + k.dhajjo + '</td><td data-label="পরিশোধ">৳' + k.paid + '</td><td data-label="বকেয়া">৳' + k.due + '</td>';
      khatBody.appendChild(tr);
    });

    const payBody = document.getElementById('urepIndPayHistoryBody');
    payBody.innerHTML = '';
    d.paymentHistory.forEach(function (p) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(p.khatName) + '</td><td>' + escapeHtml(p.month) + ' ' + escapeHtml(String(p.year)) + '</td><td>৳' + p.amount + '</td><td>' + escapeHtml(p.date) + '</td>';
      payBody.appendChild(tr);
    });
  }

  function printUrepIndReport() {
    if (!_urepIndData) { showToast('অনুগ্রহ করে প্রথমে একটি উপশাখা নির্বাচন করুন', 'error'); return; }
    const d = _urepIndData;
    document.getElementById('urepIndprint-name').textContent = d.upashakha.name;

    let khatHtml = '<tr><td class="p-label">খাতের নাম</td><td class="p-label">ধার্য্য</td><td class="p-label">পরিশোধ</td><td class="p-label">বকেয়া</td></tr>';
    d.khats.forEach(function (k) {
      khatHtml += '<tr><td>' + escapeHtml(k.khatName) + '</td><td>৳' + k.dhajjo + '</td><td>৳' + k.paid + '</td><td>৳' + k.due + '</td></tr>';
    });
    document.getElementById('urepIndprint-khatTable').innerHTML = khatHtml;

    let payHtml = '<tr><td class="p-label">খাত</td><td class="p-label">মাস/বছর</td><td class="p-label">পরিমাণ</td><td class="p-label">তারিখ</td></tr>';
    d.paymentHistory.forEach(function (p) {
      payHtml += '<tr><td>' + escapeHtml(p.khatName) + '</td><td>' + escapeHtml(p.month) + ' ' + escapeHtml(String(p.year)) + '</td><td>৳' + p.amount + '</td><td>' + escapeHtml(p.date) + '</td></tr>';
    });
    document.getElementById('urepIndprint-payTable').innerHTML = payHtml;

    printViaWindow('urepIndPrintTemplate');
  }

  // ==================== প্রকাশনা তালিকা ====================
  function initPrakashonaTalika() {
    document.getElementById('ptAddBtn').addEventListener('click', savePtBook_);
    document.getElementById('ptResetBtn').addEventListener('click', resetPtForm_);
    document.getElementById('ptPrintBtn').addEventListener('click', printPtList);
    loadPrakashonaTalikaList(renderPtList);
  }

  function resetPtForm_() {
    document.getElementById('pt-id').value = '';
    document.getElementById('pt-name').value = '';
    document.getElementById('pt-qty').value = '0';
    document.getElementById('pt-price').value = '0';
    setSaveMode_('ptAddBtn', false);
  }

  function savePtBook_() {
    const id = document.getElementById('pt-id').value;
    const isEdit = !!id;
    const name = document.getElementById('pt-name').value.trim();
    if (!name) { showToast('অনুগ্রহ করে বইয়ের নাম লিখুন', 'error'); return; }
    const data = { id: id, name: name, qty: parseNum(document.getElementById('pt-qty').value), price: parseNum(document.getElementById('pt-price').value) };
    const btn = document.getElementById('ptAddBtn');
    btn.disabled = true;
    const runner = google.script.run
      .withSuccessHandler(function (res) {
        btn.disabled = false;
        if (res.success) {
          showToast(res.message, 'success');
          resetPtForm_();
          if (isEdit) setFormCardOpen_('ptFormCard', 'ptFormToggleBtn', false, false);
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { btn.disabled = false; showToast('সমস্যা হয়েছে: ' + err.message, 'error'); });
    if (isEdit) runner.updatePrakashonaBook(data); else runner.addPrakashonaBook(data);
  }

  function renderPtList() {
    const box = document.getElementById('ptList');
    const countEl = document.getElementById('ptCount');
    if (!box) return;
    if (!_prakashonaTalikaList.length) { box.innerHTML = '<div class="no-result">কোনো বই নেই</div>'; countEl.textContent = ''; return; }
    countEl.textContent = '(মোট ' + toBnNumber(_prakashonaTalikaList.length) + 'টি)';
    let html = '<table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>প্রকাশনা/বইয়ের নাম</th><th>সংখ্যা</th><th>এককমূল্য</th><th>মোট</th><th>অ্যাকশন</th></tr></thead><tbody>';
    _prakashonaTalikaList.forEach(function (b, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td class="col-wrap">' + escapeHtml(b.name) + '</td><td>' + toBnNumber(b.qty) + '</td><td>৳' + b.price + '</td><td>৳' + b.total + '</td>' +
        '<td>' + actionIcons_(idx, ['edit', 'delete']) + '</td></tr>';
    });
    box.innerHTML = html + '</tbody></table>';
    bindRowActions_(box, _prakashonaTalikaList, { edit: editPtBook_, delete: deletePtBook_ });
  }

  function editPtBook_(b) {
    document.getElementById('pt-id').value = b.id;
    document.getElementById('pt-name').value = b.name || '';
    document.getElementById('pt-qty').value = b.qty;
    document.getElementById('pt-price').value = b.price;
    setSaveMode_('ptAddBtn', true);
    setFormCardOpen_('ptFormCard', 'ptFormToggleBtn', true, true);
  }

  function deletePtBook_(b) {
    if (!confirm('আপনি কি নিশ্চিত "' + b.name + '" বইটি তালিকা থেকে মুছে ফেলতে চান?')) return;
    google.script.run
      .withSuccessHandler(function (res) {
        if (res.success) {
          showToast(res.message, 'success');
          if (document.getElementById('pt-id').value === String(b.id)) resetPtForm_();
          refreshTalika_();
        } else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
      })
      .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
      .deletePrakashonaBook(b.id);
  }

  function printPtList() {
    if (!_prakashonaTalikaList.length) { showToast('প্রিন্ট করার মতো কোনো বই নেই', 'error'); return; }
    let grand = 0;
    const rows = _prakashonaTalikaList.map(function (b, i) {
      grand += b.total || 0;
      return [toBnNumber(i + 1), b.name, toBnNumber(b.qty), '৳' + b.price, '৳' + b.total];
    });
    printOfficialList_('প্রকাশনা তালিকা', 'মোট বই: ' + toBnNumber(_prakashonaTalikaList.length) + 'টি',
      ['ক্রম', 'প্রকাশনা/বইয়ের নাম', 'সংখ্যা', 'এককমূল্য', 'মোট'], rows, 'সর্বমোট মূল্য: ৳' + grand);
  }

  // ==================== কর্মপরিষদ ====================
  let _kpRows = [];

  let _kpSaved = [];

  function kpBlank_() { return { memberId: '', name: '', mobile: '', departments: '' }; }
  function kpClone_(r) { return { memberId: r.memberId, name: r.name, mobile: r.mobile, departments: r.departments }; }

  function initKormoParishad() {
    loadKpList_();

    document.getElementById('kpAddRowBtn').addEventListener('click', function () {
      _kpRows.push(kpBlank_());
      renderKpTable();
    });
    document.getElementById('kpSaveBtn').addEventListener('click', function () {
      const validRows = _kpRows.filter(function (r) { return r.name; });
      if (!validRows.length) { showToast('অনুগ্রহ করে অন্তত একজনের তথ্য দিন', 'error'); return; }
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast(res.message, 'success');
            _kpSaved = validRows.map(kpClone_);
            renderKpView_();
            setFormCardOpen_('kpFormCard', 'kpFormToggleBtn', false, false);
          } else {
            showToast('সমস্যা হয়েছে: ' + res.error, 'error');
          }
        })
        .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveKormoParishad(validRows);
    });
    document.getElementById('kpResetBtn').addEventListener('click', function () {
      _kpRows = [kpBlank_()];
      renderKpTable();
    });
    document.getElementById('kpPrintBtn').addEventListener('click', function () {
      printKpRows_(_kpRows);
    });

    // ---- তালিকার এডিট / ডিলেট / প্রিন্ট ----
    document.getElementById('kpListEditBtn').addEventListener('click', function () {
      _kpRows = _kpSaved.length ? _kpSaved.map(kpClone_) : [kpBlank_()];
      renderKpTable();
      setFormCardOpen_('kpFormCard', 'kpFormToggleBtn', true, true);
    });
    document.getElementById('kpListDeleteBtn').addEventListener('click', function () {
      if (!confirm('আপনি কি নিশ্চিত "কর্মপরিষদ"-এর পুরো তালিকা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
      const btn = this;
      btn.disabled = true;
      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          if (res.success) {
            showToast(res.message, 'success');
            _kpSaved = [];
            _kpRows = [kpBlank_()];
            renderKpTable();
            renderKpView_();
            setFormCardOpen_('kpFormCard', 'kpFormToggleBtn', false, false);
          } else {
            showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error');
          }
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error');
        })
        .deleteKormoParishad();
    });
    document.getElementById('kpListPrintBtn').addEventListener('click', function () {
      printKpRows_(_kpSaved);
    });
  }

  function loadKpList_() {
    google.script.run
      .withSuccessHandler(function (res) {
        _kpSaved = res.success && res.data && res.data.length ? res.data.map(kpClone_) : [];
        _kpRows = _kpSaved.length ? _kpSaved.map(kpClone_) : [kpBlank_()];
        renderKpTable();
        renderKpView_();
      })
      .withFailureHandler(function (err) {
        _kpRows = [kpBlank_()];
        renderKpTable();
        document.getElementById('kpViewWrap').innerHTML = '<div class="no-result">তালিকা লোড করতে সমস্যা হয়েছে: ' + escapeHtml(err.message) + '</div>';
      })
      .getKormoParishad();
  }

  function renderKpView_() {
    const wrap = document.getElementById('kpViewWrap');
    if (!_kpSaved.length) {
      wrap.innerHTML = '<div class="no-result">এখনো কোনো তথ্য দেওয়া হয়নি</div>';
      return;
    }
    let html = '<div class="list-scroll"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>মোবাইল</th><th>বিভাগ সমূহ</th></tr></thead><tbody>';
    _kpSaved.forEach(function (r, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.mobile || '—') + '</td>' + '<td>' + escapeHtml(r.departments || '—') + '</td>' + '</tr>';
    });
    wrap.innerHTML = html + '</tbody></table></div>';
  }

  function printKpRows_(rows) {
    const valid = rows.filter(function (r) { return r.name; });
    if (!valid.length) { showToast('প্রিন্ট করার মতো কোনো তথ্য নেই', 'error'); return; }
    const table = document.getElementById('kpprint-table');
    let html = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">নাম</td><td class="p-label">মোবাইল</td><td class="p-label">বিভাগ সমূহ</td></tr>';
    valid.forEach(function (r, idx) {
      html += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.mobile || '—') + '</td>' + '<td>' + escapeHtml(r.departments || '—') + '</td>' + '</tr>';
    });
    table.innerHTML = html;
    printViaWindow('kpPrintTemplate');
  }

  function renderKpTable() {
    const body = document.getElementById('kpBody');
    body.innerHTML = '';
    _kpRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');

      const nameTd = buildOfficerSelectCell(row, function (id, o) {
        _kpRows[idx].memberId = id;
        _kpRows[idx].name = o ? o.name : '';
        _kpRows[idx].mobile = o ? o.mobile : '';
        renderKpTable();
      });
      tr.appendChild(nameTd);

      const mobileTd = document.createElement('td');
      mobileTd.setAttribute('data-label', 'মোবাইল');
      mobileTd.textContent = row.mobile || '—';
      tr.appendChild(mobileTd);

      const deptTd = document.createElement('td');
      deptTd.setAttribute('data-label', 'বিভাগ সমূহ');
      const deptInput = document.createElement('input');
      deptInput.type = 'text';
      deptInput.placeholder = 'বিভাগ সমূহ লিখুন';
      deptInput.value = row.departments || '';
      deptInput.addEventListener('input', function () { _kpRows[idx].departments = this.value; });
      deptTd.appendChild(deptInput);
      tr.appendChild(deptTd);

      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _kpRows.splice(idx, 1);
        if (!_kpRows.length) _kpRows.push({ memberId: '', name: '', mobile: '', departments: '' });
        renderKpTable();
      });
      actionTd.appendChild(removeBtn);
      tr.appendChild(actionTd);

      body.appendChild(tr);
    });
  }

  // ==================== শুরা সদস্য ====================
  let _ssRows = [];

  let _ssSaved = [];

  function ssBlank_() { return { memberId: '', name: '', mobile: '' }; }
  function ssClone_(r) { return { memberId: r.memberId, name: r.name, mobile: r.mobile }; }

  function initShuraSodossho() {
    loadSsList_();

    document.getElementById('ssAddRowBtn').addEventListener('click', function () {
      _ssRows.push(ssBlank_());
      renderSsTable();
    });
    document.getElementById('ssSaveBtn').addEventListener('click', function () {
      const validRows = _ssRows.filter(function (r) { return r.name; });
      if (!validRows.length) { showToast('অনুগ্রহ করে অন্তত একজনের তথ্য দিন', 'error'); return; }
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast(res.message, 'success');
            _ssSaved = validRows.map(ssClone_);
            renderSsView_();
            setFormCardOpen_('ssFormCard', 'ssFormToggleBtn', false, false);
          } else {
            showToast('সমস্যা হয়েছে: ' + res.error, 'error');
          }
        })
        .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveShuraSodossho(validRows);
    });
    document.getElementById('ssResetBtn').addEventListener('click', function () {
      _ssRows = [ssBlank_()];
      renderSsTable();
    });
    document.getElementById('ssPrintBtn').addEventListener('click', function () {
      printSsRows_(_ssRows);
    });

    // ---- তালিকার এডিট / ডিলেট / প্রিন্ট ----
    document.getElementById('ssListEditBtn').addEventListener('click', function () {
      _ssRows = _ssSaved.length ? _ssSaved.map(ssClone_) : [ssBlank_()];
      renderSsTable();
      setFormCardOpen_('ssFormCard', 'ssFormToggleBtn', true, true);
    });
    document.getElementById('ssListDeleteBtn').addEventListener('click', function () {
      if (!confirm('আপনি কি নিশ্চিত "শুরা সদস্য"-এর পুরো তালিকা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
      const btn = this;
      btn.disabled = true;
      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          if (res.success) {
            showToast(res.message, 'success');
            _ssSaved = [];
            _ssRows = [ssBlank_()];
            renderSsTable();
            renderSsView_();
            setFormCardOpen_('ssFormCard', 'ssFormToggleBtn', false, false);
          } else {
            showToast('মুছতে সমস্যা হয়েছে: ' + res.error, 'error');
          }
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          showToast('মুছতে সমস্যা হয়েছে: ' + err.message, 'error');
        })
        .deleteShuraSodossho();
    });
    document.getElementById('ssListPrintBtn').addEventListener('click', function () {
      printSsRows_(_ssSaved);
    });
  }

  function loadSsList_() {
    google.script.run
      .withSuccessHandler(function (res) {
        _ssSaved = res.success && res.data && res.data.length ? res.data.map(ssClone_) : [];
        _ssRows = _ssSaved.length ? _ssSaved.map(ssClone_) : [ssBlank_()];
        renderSsTable();
        renderSsView_();
      })
      .withFailureHandler(function (err) {
        _ssRows = [ssBlank_()];
        renderSsTable();
        document.getElementById('ssViewWrap').innerHTML = '<div class="no-result">তালিকা লোড করতে সমস্যা হয়েছে: ' + escapeHtml(err.message) + '</div>';
      })
      .getShuraSodossho();
  }

  function renderSsView_() {
    const wrap = document.getElementById('ssViewWrap');
    if (!_ssSaved.length) {
      wrap.innerHTML = '<div class="no-result">এখনো কোনো তথ্য দেওয়া হয়নি</div>';
      return;
    }
    let html = '<div class="list-scroll"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>মোবাইল</th></tr></thead><tbody>';
    _ssSaved.forEach(function (r, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.mobile || '—') + '</td>' + '</tr>';
    });
    wrap.innerHTML = html + '</tbody></table></div>';
  }

  function printSsRows_(rows) {
    const valid = rows.filter(function (r) { return r.name; });
    if (!valid.length) { showToast('প্রিন্ট করার মতো কোনো তথ্য নেই', 'error'); return; }
    const table = document.getElementById('ssprint-table');
    let html = '<tr><td class="p-label col-serial">ক্রম</td><td class="p-label">নাম</td><td class="p-label">মোবাইল</td></tr>';
    valid.forEach(function (r, idx) {
      html += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.mobile || '—') + '</td>' + '</tr>';
    });
    table.innerHTML = html;
    printViaWindow('ssPrintTemplate');
  }

  function renderSsTable() {
    const body = document.getElementById('ssBody');
    body.innerHTML = '';
    _ssRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');

      const nameTd = buildOfficerSelectCell(row, function (id, o) {
        _ssRows[idx].memberId = id;
        _ssRows[idx].name = o ? o.name : '';
        _ssRows[idx].mobile = o ? o.mobile : '';
        renderSsTable();
      });
      tr.appendChild(nameTd);

      const mobileTd = document.createElement('td');
      mobileTd.setAttribute('data-label', 'মোবাইল');
      mobileTd.textContent = row.mobile || '—';
      tr.appendChild(mobileTd);

      const actionTd = document.createElement('td');
      actionTd.setAttribute('data-label', '');
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        _ssRows.splice(idx, 1);
        if (!_ssRows.length) _ssRows.push({ memberId: '', name: '', mobile: '' });
        renderSsTable();
      });
      actionTd.appendChild(removeBtn);
      tr.appendChild(actionTd);

      body.appendChild(tr);
    });
  }

  // ==================== মূল শাখার অঞ্চল তথ্য ====================
  let _mainZoneRows = [];

  function initMainZone() {
    document.getElementById('mainZoneCount').addEventListener('input', function () {
      const count = parseInt(this.value, 10) || 0;
      while (_mainZoneRows.length < count) _mainZoneRows.push({ name: '', directorId: '', directorName: '', directorMobile: '', assistantId: '', assistantName: '', assistantMobile: '' });
      while (_mainZoneRows.length > count) _mainZoneRows.pop();
      renderMainZoneTable();
    });
    document.getElementById('mainZoneSaveBtn').addEventListener('click', function () {
      const formData = collectBranchFormData_();
      formData.zones = _mainZoneRows.filter(function (z) { return z.name; });
      google.script.run
        .withSuccessHandler(function (res) {
          if (res.success) {
            showToast('অঞ্চলের তথ্য সংরক্ষণ করা হয়েছে', 'success');
            renderZoneView_();
            setFormCardOpen_('mainZoneCard', 'zoneFormToggleBtn', false, false);
          }
          else { showToast('সমস্যা হয়েছে: ' + res.error, 'error'); }
        })
        .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
        .saveBranchSetup(formData);
    });
  }

  function renderMainZoneTable() {
    const body = document.getElementById('mainZonesBody');
    body.innerHTML = '';
    _mainZoneRows.forEach(function (row, idx) {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.setAttribute('data-label', 'অঞ্চলের নাম');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'অঞ্চলের নাম';
      nameInput.value = row.name || '';
      nameInput.addEventListener('input', function () { _mainZoneRows[idx].name = this.value; });
      nameTd.appendChild(nameInput);
      tr.appendChild(nameTd);

      tr.appendChild(buildOfficerSelectCell(row.directorId ? { memberId: row.directorId } : { memberId: '' }, function (id, o) {
        _mainZoneRows[idx].directorId = id;
        _mainZoneRows[idx].directorName = o ? o.name : '';
        _mainZoneRows[idx].directorMobile = o ? o.mobile : '';
        renderMainZoneTable();
      }));

      const dirMobileTd = document.createElement('td');
      dirMobileTd.setAttribute('data-label', 'মোবাইল');
      dirMobileTd.textContent = row.directorMobile || '—';
      tr.appendChild(dirMobileTd);

      tr.appendChild(buildOfficerSelectCell(row.assistantId ? { memberId: row.assistantId } : { memberId: '' }, function (id, o) {
        _mainZoneRows[idx].assistantId = id;
        _mainZoneRows[idx].assistantName = o ? o.name : '';
        _mainZoneRows[idx].assistantMobile = o ? o.mobile : '';
        renderMainZoneTable();
      }));

      const asstMobileTd = document.createElement('td');
      asstMobileTd.setAttribute('data-label', 'মোবাইল');
      asstMobileTd.textContent = row.assistantMobile || '—';
      tr.appendChild(asstMobileTd);

      body.appendChild(tr);
    });
  }

  function collectBranchFormData_() {
    return {
      name: document.getElementById('branch-name').value,
      level: document.getElementById('branch-level').value,
      address: document.getElementById('branch-address').value,
      phone: document.getElementById('branch-phone').value,
      email: document.getElementById('branch-email').value,
      logoUrl: window._currentLogoUrl || '',
      symbolUrl: window._currentSymbolUrl || ''
    };
  }

  // ==================== স্থানান্তরিত সদস্যদের তালিকা (পুনরায় সংযুক্তি) ====================
  let _transferredAll = [];

  function initTransferredList() {
    document.getElementById('transferredSearchInput').addEventListener('input', renderTransferredList);
  }

  function loadTransferredList() {
    const box = document.getElementById('transferredListBody');
    box.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        _transferredAll = (res.success && res.data) ? res.data : [];
        renderTransferredList();
      })
      .withFailureHandler(function () { box.innerHTML = '<div class="no-result">লোড করতে সমস্যা হয়েছে</div>'; })
      .getAllTransferredMembers();
  }

  function renderTransferredList() {
    const box = document.getElementById('transferredListBody');
    const countEl = document.getElementById('transferredListCount');
    if (!_transferredAll.length) {
      box.innerHTML = '<div class="no-result">কোনো স্থানান্তরিত সদস্য নেই</div>';
      countEl.textContent = '';
      return;
    }
    const q = (document.getElementById('transferredSearchInput').value || '').trim().toLowerCase();
    const shown = _transferredAll.filter(function (t) {
      if (!q) return true;
      return [t.memberName, t.fromBranch, t.toBranch, t.mobile].some(function (v) {
        return String(v || '').toLowerCase().indexOf(q) !== -1;
      });
    });
    countEl.textContent = q
      ? '(' + toBnNumber(shown.length) + ' জন / মোট ' + toBnNumber(_transferredAll.length) + ' জন)'
      : '(মোট ' + toBnNumber(_transferredAll.length) + ' জন)';
    if (!shown.length) {
      box.innerHTML = '<div class="no-result">কোনো সদস্য পাওয়া যায়নি</div>';
      return;
    }
    let html = '<div class="list-scroll compact"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>পূর্বের শাখা</th><th>নতুন শাখা</th><th>তারিখ</th><th></th></tr></thead><tbody>';
    shown.forEach(function (t, idx) {
      html += '<tr><td>' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(t.memberName) + '</td><td>' + escapeHtml(t.fromBranch || '—') + '</td><td>' + escapeHtml(t.toBranch || '—') + '</td><td>' + escapeHtml(t.transferDate || '—') + '</td>' +
        '<td><button type="button" class="btn btn-outline btn-sm" data-tid="' + escapeHtml(String(t.id)) + '">↩️ ফিরিয়ে আনুন</button></td></tr>';
    });
    box.innerHTML = html + '</tbody></table></div>';
    box.querySelectorAll('button[data-tid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const t = _transferredAll.filter(function (x) { return String(x.id) === btn.getAttribute('data-tid'); })[0];
        if (!t) return;
        if (!confirm('আপনি কি নিশ্চিত "' + t.memberName + '" কে জনশক্তি তালিকায় পুনরায় সংযুক্ত করতে চান?')) return;
        google.script.run
          .withSuccessHandler(function (res2) {
            if (res2.success) {
              showToast(res2.message, 'success');
              loadTransferredList();
            } else {
              showToast('সমস্যা হয়েছে: ' + res2.error, 'error');
            }
          })
          .withFailureHandler(function (err) { showToast('সমস্যা হয়েছে: ' + err.message, 'error'); })
          .restoreSthanantorMember(t.id);
      });
    });
  }

  // ==================== সদস্য তালিকা প্রিন্ট ====================
  let _mlpData = [];

  function initMemberListPrint() {
    document.getElementById('memberListPrintToggleBtn').addEventListener('click', function () {
      const card = document.getElementById('memberListPrintCard');
      const willOpen = (card.style.display === 'none' || !card.style.display);
      card.style.display = willOpen ? 'block' : 'none';
      // প্রিন্ট অংশ খুললে "সকল সদস্য তালিকা" লুকাবে, বন্ধ করলে আবার দেখাবে
      document.getElementById('memberListCard').style.display = willOpen ? 'none' : 'block';
    });
    document.getElementById('mlpLoadBtn').addEventListener('click', loadMlpList);
    document.getElementById('mlpPrintBtn').addEventListener('click', printMlpList);
  }

  function loadMlpList() {
    const branch = document.getElementById('mlp-branch').value;
    const maan = document.getElementById('mlp-maan').value;
    if (!branch || !maan) { showToast('অনুগ্রহ করে শাখা ও মান নির্বাচন করুন', 'error'); return; }

    const wrap = document.getElementById('mlpListWrap');
    wrap.innerHTML = '<div class="no-result">লোড হচ্ছে...</div>';

    google.script.run
      .withSuccessHandler(function (res) {
        if (!res.success) { wrap.innerHTML = '<div class="no-result">তথ্য লোড করতে সমস্যা হয়েছে</div>'; return; }
        _mlpData = res.data.filter(function (m) { return m.branch === branch && m.maan === maan; });
        renderMlpList();
      })
      .withFailureHandler(function (err) { wrap.innerHTML = '<div class="no-result">সমস্যা হয়েছে: ' + err.message + '</div>'; })
      .getAllMembers();
  }

  function renderMlpList() {
    const wrap = document.getElementById('mlpListWrap');
    if (!_mlpData.length) { wrap.innerHTML = '<div class="no-result">কোনো সদস্য পাওয়া যায়নি</div>'; return; }
    let html = '<div class="list-scroll compact"><table class="dhajjo-table"><thead><tr><th>ক্রম</th><th>নাম</th><th>মোবাইল নং</th><th>অঞ্চলের নাম</th></tr></thead><tbody>';
    _mlpData.forEach(function (m, idx) {
      html += '<tr><td data-label="ক্রম">' + toBnNumber(idx + 1) + '</td><td data-label="নাম">' + escapeHtml(m.name) + '</td><td data-label="মোবাইল">' + escapeHtml(m.mobile || '—') + '</td><td data-label="অঞ্চল">' + escapeHtml(m.zone || '—') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
  }

  function printMlpList() {
    if (!_mlpData.length) { showToast('অনুগ্রহ করে প্রথমে তালিকা দেখুন', 'error'); return; }
    document.getElementById('mlprint-orgName').textContent = document.getElementById('headerBranchName').textContent;
    const subParts = [_mainBranchLevel, (_branchViewData && _branchViewData.address) || ''].filter(Boolean);
    const subEl = document.getElementById('mlprint-sub');
    subEl.textContent = subParts.join(' | ');
    subEl.style.display = subParts.length ? 'block' : 'none';
    document.getElementById('mlprint-meta').textContent = 'শাখা: ' + document.getElementById('mlp-branch').value + '   |   মান: ' + document.getElementById('mlp-maan').value;
    document.getElementById('mlprint-date').textContent = 'তারিখ: ' + new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

    let rows = '<thead><tr><th class="col-serial">ক্রম</th><th>নাম</th><th>মোবাইল নং</th><th>অঞ্চলের নাম</th></tr></thead><tbody>';
    _mlpData.forEach(function (m, idx) {
      rows += '<tr><td class="col-serial">' + toBnNumber(idx + 1) + '</td><td>' + escapeHtml(m.name) + '</td><td>' + escapeHtml(m.mobile || '—') + '</td><td>' + escapeHtml(m.zone || '—') + '</td></tr>';
    });
    document.getElementById('mlprint-table').innerHTML = rows + '</tbody>';
    document.getElementById('mlprint-total').textContent = 'মোট সদস্য: ' + toBnNumber(_mlpData.length) + ' জন';
    printViaWindow('memberListPrintTemplate');
  }
