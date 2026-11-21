/**
 * বাংলাদেশ জামায়াতে ইসলামী - সাংগঠনিক ব্যবস্থাপনা সিস্টেম
 * ধাপ ১: হেডার, হোম ড্যাশবোর্ড, আমাদের সম্পর্কে, শাখা সেটাপ, ফুটার
 */

// ================== কনফিগারেশন ==================
const SHEET_NAMES = {
  BRANCH_SETUP: 'ShakhaSetup',
  ABOUT_US: 'AmaderShomporke',
  JONOSHOKTI: 'Jonoshokti',
  STHANANTOR: 'Sthanantor',
  DHAJJO: 'Dhajjo',
  COMMITTEE: 'Committee',
  UPASHAKHA: 'Upashakha',
  UPASHAKHA_DHAJJO: 'UpashakhaDhajjo',
  JONOSHOKTI_AY: 'JonoshoktiAy',
  UPASHAKHA_AY: 'UpashakhaAy',
  ANNANNO_AY: 'AnnannoAy',
  BYAY: 'Byay',
  MASHIK_AY_BYAY: 'MashikAyByay',
  MASHIK_NIRBACHON: 'MashikNirbachonKarjokrom',
  SANGGHOTHONIK_REPORT: 'SangghothonikReport',
  PRAKASHONA_KROY: 'PrakashonaKroy',
  PRAKASHONA_BIKROY: 'PrakashonaBikroy',
  PRAKASHONA_BILI: 'PrakashonaBili',
  PRAKASHONA_BATIL: 'PrakashonaBatil',
  JONOSHOKTI_EYANAT_RATE: 'JonoshoktiEyanatRate',
  UPASHAKHA_NISAB_RATE: 'UpashakhaNisabRate',
  KORMO_PARISHAD: 'KormoParishad',
  SHURA_SODOSSHO: 'ShuraSodossho',
  PRAKASHONA_TALIKA: 'PrakashonaTalika',
  WARD_SHAKHA: 'WardShakha',
  UNIT: 'Unit',
  BOI: 'Boi'
};

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function monthNameToNumber_(name) {
  const idx = BN_MONTHS.indexOf(name);
  return idx === -1 ? 1 : idx + 1;
}

function extractMonthNameFromDateStr_(dateStr) {
  if (!dateStr) return BN_MONTHS[0];
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12) return BN_MONTHS[m - 1];
  }
  return BN_MONTHS[0];
}

/** মাসিক-হার খাত (এয়ানত/উর্ধতন নিসাব) এর জন্য নির্দিষ্ট মাস পর্যন্ত ক্রমপুঞ্জিত ধার্য্য হিসাব করে,
 *  রেট পরিবর্তনের ইতিহাস বিবেচনা করে (যে মাস থেকে যে রেট কার্যকর, সেই মাস থেকে সেই রেট গণনা হবে) */
function calcMonthlyRateAssessedTotal_(rateHistorySorted, targetYear, targetMonthName) {
  if (!rateHistorySorted.length) return 0;
  const startEntry = rateHistorySorted[0];
  const startIdx = parseInt(startEntry.year) * 12 + (monthNameToNumber_(startEntry.month) - 1);
  const targetIdx = parseInt(targetYear) * 12 + (monthNameToNumber_(targetMonthName) - 1);
  if (targetIdx < startIdx) return 0;

  let total = 0;
  for (let m = startIdx; m <= targetIdx; m++) {
    let applicableRate = 0;
    for (let i = 0; i < rateHistorySorted.length; i++) {
      const entryIdx = parseInt(rateHistorySorted[i].year) * 12 + (monthNameToNumber_(rateHistorySorted[i].month) - 1);
      if (entryIdx <= m) applicableRate = parseFloat(rateHistorySorted[i].rate) || 0;
      else break;
    }
    total += applicableRate;
  }
  return total;
}

const JONOSHOKTI_HEADERS = ['আইডি', 'নাম', 'মোবাইল', 'শাখা', 'মান', 'সদস্য হওয়ার তারিখ', 'পেশা', 'ঠিকানা', 'অঞ্চলের নাম', 'তৈরির সময়'];
const MAAN_OPTIONS = ['রুকন', 'অগ্রসর কর্মী', 'কর্মী', 'সহযোগী সদস্য'];

const DRIVE_FOLDER_NAME = 'Jamaat_System_Uploads';

// doGet / doPost এখন Api.gs ফাইলে আছে

// ================== হেল্পার ফাংশন ==================
function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function getOrCreateUploadFolder_() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

/**
 * ভিত্তি ৬৪ (base64) ছবি ডেটা আপলোড করে Drive-এ সংরক্ষণ করে এবং সরাসরি লিংক ফেরত দেয়
 * data: "data:image/png;base64,...."
 */
function uploadImage(dataUrl, fileNamePrefix) {
  try {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
    if (!match) throw new Error('অবৈধ ছবি ডেটা');
    const mimeType = match[1];
    const base64Data = match[2];
    const extension = mimeType.split('/')[1];
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileNamePrefix + '_' + new Date().getTime() + '.' + extension);

    const folder = getOrCreateUploadFolder_();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // সরাসরি প্রদর্শনযোগ্য লিংক (থাম্বনেইল API — সাধারণ 'uc?export=view' লিংকের চেয়ে বেশি নির্ভরযোগ্য)
    const directUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';
    return { success: true, url: directUrl, fileId: file.getId() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== শাখা সেটাপ ==================
const BRANCH_SETUP_HEADERS = ['শাখার নাম', 'মান', 'ঠিকানা', 'ফোন', 'ইমেইল', 'লোগো URL', 'প্রতীক URL', 'অঞ্চল তথ্য (JSON)'];

function getBranchInfo() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BRANCH_SETUP, BRANCH_SETUP_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return {
        success: true,
        data: { name: '', level: '', address: '', phone: '', email: '', logoUrl: '', symbolUrl: '', zones: [] }
      };
    }
    const row = sheet.getRange(2, 1, 1, BRANCH_SETUP_HEADERS.length).getValues()[0];
    let zones = [];
    try { zones = JSON.parse(row[7] || '[]'); } catch (e) { zones = []; }
    return {
      success: true,
      data: {
        name: row[0] || '',
        level: row[1] || '',
        address: row[2] || '',
        phone: row[3] || '',
        email: row[4] || '',
        logoUrl: row[5] || '',
        symbolUrl: row[6] || '',
        zones: zones
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveBranchSetup(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BRANCH_SETUP, BRANCH_SETUP_HEADERS);

    const rowData = [
      formData.name || '',
      formData.level || '',
      formData.address || '',
      formData.phone || '',
      formData.email || '',
      formData.logoUrl || '',
      formData.symbolUrl || '',
      JSON.stringify(formData.zones || [])
    ];

    sheet.getRange(2, 4).setNumberFormat('@'); // ফোন কলাম টেক্সট ফরম্যাট (শুরুর ০ যাতে না হারায়)
    sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    SpreadsheetApp.flush();
    return { success: true, message: 'শাখার তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== আমাদের সম্পর্কে ==================
function getAboutUs() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.ABOUT_US,
      ['প্রতিষ্ঠাকাল', 'উদ্দেশ্য ও লক্ষ্য', 'প্রতিষ্ঠার ইতিহাস']);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, data: { foundingDate: '', purpose: '', history: '' } };
    }
    const row = sheet.getRange(2, 1, 1, 3).getValues()[0];
    return {
      success: true,
      data: {
        foundingDate: row[0] || '',
        purpose: row[1] || '',
        history: row[2] || ''
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveAboutUs(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.ABOUT_US,
      ['প্রতিষ্ঠাকাল', 'উদ্দেশ্য ও লক্ষ্য', 'প্রতিষ্ঠার ইতিহাস']);
    const rowData = [
      formData.foundingDate || '',
      formData.purpose || '',
      formData.history || ''
    ];
    sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
    SpreadsheetApp.flush();
    return { success: true, message: 'তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== হোম ড্যাশবোর্ড পরিসংখ্যান ==================
function countDataRows_(sheetName) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  const lastRow = sheet.getLastRow();
  return lastRow > 1 ? lastRow - 1 : 0;
}

function getDashboardStats() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_NAMES.JONOSHOKTI);

    let totalRukon = 0, totalAgroshorKormi = 0, totalKormi = 0, totalSohojogi = 0;

    if (sheet && sheet.getLastRow() > 1) {
      const maanCol = sheet.getRange(2, 5, sheet.getLastRow() - 1, 1).getValues();
      maanCol.forEach(function (row) {
        const maan = row[0];
        if (maan === 'রুকন') totalRukon++;
        else if (maan === 'অগ্রসর কর্মী') totalAgroshorKormi++;
        else if (maan === 'কর্মী') totalKormi++;
        else if (maan === 'সহযোগী সদস্য') totalSohojogi++;
      });
    }

    const upashakhaSheet = ss.getSheetByName(SHEET_NAMES.UPASHAKHA);
    let totalWardShakha = 0, totalUnit = 0;
    if (upashakhaSheet && upashakhaSheet.getLastRow() > 1) {
      const levelCol = upashakhaSheet.getRange(2, 3, upashakhaSheet.getLastRow() - 1, 1).getValues();
      levelCol.forEach(function (row) {
        if (row[0] === 'ওয়ার্ড') totalWardShakha++;
        else if (row[0] === 'ইউনিট') totalUnit++;
      });
    }
    const totalBoi = countDataRows_(SHEET_NAMES.BOI);
    const totalJonoshokti = totalRukon + totalAgroshorKormi + totalKormi + totalSohojogi;

    return {
      success: true,
      data: {
        totalJonoshokti: totalJonoshokti,
        totalRukon: totalRukon,
        totalAgroshorKormi: totalAgroshorKormi,
        totalKormi: totalKormi,
        totalSohojogi: totalSohojogi,
        totalWardShakha: totalWardShakha,
        totalUnit: totalUnit,
        totalBoi: totalBoi
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== জনশক্তি: সদস্য ফরম ==================
function getAllMembers() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };

    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
    const members = rows.map(function (r) {
      return {
        id: r[0],
        name: r[1],
        mobile: r[2],
        branch: r[3],
        maan: r[4],
        joinDate: formatDateValue_(r[5]),
        profession: r[6],
        address: r[7],
        zone: r[8]
      };
    }).filter(function (m) { return m.id; });

    return { success: true, data: members };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function formatDateValue_(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return val;
}

function searchMembersByName(nameQuery) {
  try {
    const result = getAllMembers();
    if (!result.success) return result;
    const q = (nameQuery || '').trim().toLowerCase();
    if (!q) return { success: true, data: [] };
    const matches = result.data.filter(function (m) {
      return String(m.name || '').toLowerCase().indexOf(q) !== -1;
    });
    return { success: true, data: matches };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveMember(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);

    if (formData.id) {
      // এডিট - বিদ্যমান রো খুঁজে বের করে আপডেট
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            sheet.getRange(rowIndex, 3).setNumberFormat('@'); // মোবাইল কলাম টেক্সট ফরম্যাট (শুরুর ০ যাতে না হারায়)
            sheet.getRange(rowIndex, 2, 1, 8).setValues([[
              formData.name || '',
              formData.mobile || '',
              formData.branch || '',
              formData.maan || '',
              formData.joinDate || '',
              formData.profession || '',
              formData.address || '',
              formData.zone || ''
            ]]);
            SpreadsheetApp.flush();
            return { success: true, message: 'সদস্যের তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'সদস্য খুঁজে পাওয়া যায়নি' };
    } else {
      // নতুন সদস্য যুক্ত
      const newId = 'M' + new Date().getTime();
      const newRowIndex = sheet.getLastRow() + 1;
      sheet.getRange(newRowIndex, 3).setNumberFormat('@'); // মোবাইল কলাম টেক্সট ফরম্যাট
      const rowData = [
        newId,
        formData.name || '',
        formData.mobile || '',
        formData.branch || '',
        formData.maan || '',
        formData.joinDate || '',
        formData.profession || '',
        formData.address || '',
        formData.zone || '',
        new Date()
      ];
      sheet.getRange(newRowIndex, 1, 1, rowData.length).setValues([rowData]);
      SpreadsheetApp.flush();
      return { success: true, message: 'নতুন সদস্য সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteMember(memberId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(memberId)) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'সদস্য মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'সদস্য খুঁজে পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== জনশক্তি: স্থানান্তর ফরম ==================
const STHANANTOR_HEADERS = ['আইডি', 'সদস্য আইডি', 'সদস্যের নাম', 'মোবাইল', 'পূর্বের শাখা', 'পূর্বের মান', 'নতুন শাখা', 'নতুন শাখার ঠিকানা', 'স্থানান্তরের তারিখ', 'পূর্বের অঞ্চল', 'পুনরায় সংযুক্তির তারিখ', 'তৈরির সময়'];

function getMemberById_(memberId) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(memberId)) {
      return { rowIndex: i + 2, row: rows[i] };
    }
  }
  return null;
}

function updateMemberBranch_(memberId, newBranch) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
  const found = getMemberById_(memberId);
  if (found) {
    sheet.getRange(found.rowIndex, 4).setValue(newBranch); // শাখা কলাম
  }
}

function saveSthanantor(formData) {
  try {
    if (!formData.memberId) {
      return { success: false, error: 'অনুগ্রহ করে সার্চ করে একজন সদস্য নির্বাচন করুন' };
    }
    const sheet = getOrCreateSheet_(SHEET_NAMES.STHANANTOR, STHANANTOR_HEADERS);
    const newId = 'T' + new Date().getTime();
    const newRowIndex = sheet.getLastRow() + 1;
    sheet.getRange(newRowIndex, 4).setNumberFormat('@'); // মোবাইল কলাম টেক্সট ফরম্যাট
    sheet.getRange(newRowIndex, 1, 1, STHANANTOR_HEADERS.length).setValues([[
      newId,
      formData.memberId,
      formData.memberName || '',
      formData.mobile || '',
      formData.fromBranch || '',
      formData.fromMaan || '',
      formData.toBranch || '',
      formData.toBranchAddress || '',
      formData.transferDate || '',
      formData.fromZone || '',
      '',
      new Date()
    ]]);

    // সদস্যকে জনশক্তি শীট থেকে মুছে ফেলা হচ্ছে (স্থানান্তর শীটে ইতিমধ্যে যুক্ত হয়েছে)
    const memberSheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const found = getMemberById_(formData.memberId);
    if (found) {
      memberSheet.deleteRow(found.rowIndex);
    }

    SpreadsheetApp.flush();
    return { success: true, message: 'সদস্যকে সফলভাবে নতুন শাখায় স্থানান্তর করা হয়েছে', id: newId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getSthanantorByMember(memberId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.STHANANTOR, STHANANTOR_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, STHANANTOR_HEADERS.length).getValues();
    const data = rows.map(function (r) {
      return {
        id: r[0], memberId: r[1], memberName: r[2], mobile: r[3],
        fromBranch: r[4], fromMaan: r[5], toBranch: r[6], toBranchAddress: r[7],
        transferDate: formatDateValue_(r[8]), fromZone: r[9], restoredDate: formatDateValue_(r[10])
      };
    }).filter(function (t) { return t.id && (!memberId || String(t.memberId) === String(memberId)); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** সকল স্থানান্তরিত সদস্যের তালিকা (এখনও পুনরায় সংযুক্ত হয়নি এমন সবাই) */
function getAllTransferredMembers() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.STHANANTOR, STHANANTOR_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, STHANANTOR_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0] && !r[10]; }).map(function (r) {
      return {
        id: r[0], memberId: r[1], memberName: r[2], mobile: r[3],
        fromBranch: r[4], fromMaan: r[5], toBranch: r[6], toBranchAddress: r[7],
        transferDate: formatDateValue_(r[8]), fromZone: r[9]
      };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** স্থানান্তরিত সদস্যকে পুনরায় জনশক্তি তালিকায় ফিরিয়ে আনা */
function restoreSthanantorMember(sthanantorId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.STHANANTOR, STHANANTOR_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const rows = sheet.getRange(2, 1, lastRow - 1, STHANANTOR_HEADERS.length).getValues();

    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(sthanantorId)) {
        const r = rows[i];
        const memberSheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
        const newId = 'M' + new Date().getTime();
        const newRowIndex = memberSheet.getLastRow() + 1;
        memberSheet.getRange(newRowIndex, 3).setNumberFormat('@');
        memberSheet.getRange(newRowIndex, 1, 1, JONOSHOKTI_HEADERS.length).setValues([[
          newId, r[2], r[3], r[6], r[5], '', '', '', r[9], new Date()
        ]]);

        const today = new Date();
        sheet.getRange(i + 2, 11).setValue(Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy'));

        SpreadsheetApp.flush();
        return { success: true, message: 'সদস্যকে পুনরায় জনশক্তি তালিকায় সংযুক্ত করা হয়েছে', newMemberId: newId };
      }
    }
    return { success: false, error: 'তথ্য পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== জনশক্তি: ধার্য্য ফরম ==================
// প্রতি সদস্য + বছরের জন্য একটি রো — সব খাতের নাম, পরিমাণ ও তারিখ একটি তালিকায় (JSON) সংরক্ষিত
const DHAJJO_HEADERS = [
  'আইডি', 'সদস্য আইডি', 'সদস্যের নাম', 'শাখা', 'বছর',
  'আইটেম (JSON)', 'তৈরির সময়', 'হালনাগাদের সময়'
];

const DHAJJO_DEFAULT_ITEMS = [
  { name: 'এয়ানত', amount: '', date: '' },
  { name: 'এককালীন', amount: '', date: '' },
  { name: 'নির্বাচনী ওয়াদা', amount: '', date: '' },
  { name: 'যাকাত', amount: '', date: '' }
];

function findDhajjoRow_(memberId, year) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.DHAJJO, DHAJJO_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = sheet.getRange(2, 1, lastRow - 1, DHAJJO_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === String(memberId) && String(rows[i][4]) === String(year)) {
      return { rowIndex: i + 2, row: rows[i] };
    }
  }
  return null;
}

function rowToDhajjoObj_(row) {
  let items = [];
  try { items = JSON.parse(row[5] || '[]'); } catch (e) { items = []; }
  return {
    id: row[0],
    memberId: row[1],
    memberName: row[2],
    branch: row[3],
    year: row[4],
    items: items
  };
}

/** নির্দিষ্ট সদস্য ও বছরের ধার্য্য রেকর্ড (না থাকলে ডিফল্ট খাত সহ ফাঁকা কাঠামো ফেরত দেয়) */
function getDhajjoRecord(memberId, memberName, branch, year) {
  try {
    const found = findDhajjoRow_(memberId, year);
    if (found) {
      return { success: true, data: rowToDhajjoObj_(found.row) };
    }
    return {
      success: true,
      data: {
        id: '', memberId: memberId, memberName: memberName, branch: branch, year: year,
        items: JSON.parse(JSON.stringify(DHAJJO_DEFAULT_ITEMS))
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** ধার্য্য রেকর্ড সংরক্ষণ/আপডেট (নতুন হলে তৈরি করবে, আগে থাকলে ওভাররাইট করবে) */
function saveDhajjoRecord(formData) {
  try {
    if (!formData.memberId) return { success: false, error: 'অনুগ্রহ করে সদস্য নির্বাচন করুন' };
    if (!formData.year) return { success: false, error: 'অনুগ্রহ করে বছর লিখুন' };

    const sheet = getOrCreateSheet_(SHEET_NAMES.DHAJJO, DHAJJO_HEADERS);
    const items = (formData.items || []).filter(function (it) {
      return it.name && String(it.name).trim() !== '';
    });
    const itemsJson = JSON.stringify(items);
    const found = findDhajjoRow_(formData.memberId, formData.year);

    if (found) {
      sheet.getRange(found.rowIndex, 6).setValue(itemsJson);
      sheet.getRange(found.rowIndex, 8).setValue(new Date());
    } else {
      const newId = 'D' + new Date().getTime();
      sheet.appendRow([
        newId, formData.memberId, formData.memberName || '', formData.branch || '',
        formData.year, itemsJson, new Date(), new Date()
      ]);
    }

    // এয়ানত আইটেম থাকলে রেট-ইতিহাস শীটেও সিঙ্ক করা (মাসিক হিসাবের জন্য প্রয়োজন)
    items.forEach(function (it) {
      if (it.name === 'এয়ানত' && it.amount) {
        const monthName = extractMonthNameFromDateStr_(it.date);
        upsertEyanatRate_(formData.memberId, formData.memberName, parseFloat(it.amount) || 0, formData.year, monthName);
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'ধার্য্যের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getDhajjoByMember(memberId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.DHAJJO, DHAJJO_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, DHAJJO_HEADERS.length).getValues();
    const data = rows
      .filter(function (r) { return r[0] && (!memberId || String(r[1]) === String(memberId)); })
      .map(rowToDhajjoObj_)
      .sort(function (a, b) { return String(b.year).localeCompare(String(a.year)); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== শাখা সেটাপ: কমিটি তথ্য ==================
const COMMITTEE_HEADERS = ['আইডি', 'পদবি', 'সদস্য আইডি', 'নাম', 'মোবাইল', 'ক্রম'];

const COMMITTEE_STANDARD_POSITIONS = [
  'আমীর / সভাপতি',
  'নায়েবে আমীর / সহ-সভাপতি',
  'সেক্রেটারী',
  'সহকারী সেক্রেটারী',
  'বায়তুলমাল সেক্রেটারী',
  'অফিস সম্পাদক',
  'প্রকাশনা সম্পাদক',
  'সংস্কৃতি সম্পাদক',
  'তালিমুল কুরআন পরিচালক',
  'মিডিয়া সম্পাদক',
  'যুব সম্পাদক'
];

const COMMITTEE_MULTI_POSITIONS = ['নায়েবে আমীর / সহ-সভাপতি', 'সহকারী সেক্রেটারী'];

/** জনশক্তি শীট থেকে শুধু রুকনদের তালিকা (নাম নির্বাচন করলে মোবাইল অটো-ফিল করার জন্য) */
function getRukonList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
    const rukons = rows
      .filter(function (r) { return r[0] && r[4] === 'রুকন'; })
      .map(function (r) { return { id: r[0], name: r[1], mobile: r[2] }; });
    return { success: true, data: rukons };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** কমিটির তালিকা (পূর্বনির্ধারিত পদবিগুলো ফাঁকা হলেও দেখাবে, কাস্টম পদবি নিচে) */
function getCommittee() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.COMMITTEE, COMMITTEE_HEADERS);
    const lastRow = sheet.getLastRow();
    let saved = [];
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, COMMITTEE_HEADERS.length).getValues();
      saved = rows
        .filter(function (r) { return r[0]; })
        .map(function (r) {
          return { id: r[0], position: r[1], memberId: r[2], name: r[3], mobile: r[4], order: r[5] };
        })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    }
    return { success: true, data: saved, standardPositions: COMMITTEE_STANDARD_POSITIONS, multiPositions: COMMITTEE_MULTI_POSITIONS };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** কমিটির পুরো তালিকা সংরক্ষণ/আপডেট (সম্পূর্ণ ওভাররাইট) */
function saveCommittee(items) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.COMMITTEE, COMMITTEE_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.deleteRows(2, lastRow - 1);
    }

    const validItems = (items || []).filter(function (it) {
      return it.position && String(it.position).trim() !== '' && it.name && String(it.name).trim() !== '';
    });

    if (validItems.length > 0) {
      const rows = validItems.map(function (it, idx) {
        const newId = 'C' + new Date().getTime() + '_' + idx;
        return [newId, it.position, it.memberId || '', it.name, it.mobile || '', idx];
      });
      sheet.getRange(2, 5, rows.length, 1).setNumberFormat('@'); // মোবাইল কলাম টেক্সট ফরম্যাট
      sheet.getRange(2, 1, rows.length, COMMITTEE_HEADERS.length).setValues(rows);
    }

    SpreadsheetApp.flush();
    return { success: true, message: 'কমিটির তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== উপশাখা ==================
// প্রতিটি উপশাখার তথ্য একটি রো — কর্মকর্তা ও অঞ্চলের তথ্য JSON আকারে সংরক্ষিত
const UPASHAKHA_HEADERS = ['আইডি', 'উপশাখার নাম', 'মান', 'ডাটা (JSON)', 'তৈরির সময়', 'হালনাগাদের সময়'];

/** জনশক্তি শীট থেকে রুকন, অগ্রসর কর্মী ও কর্মীদের নাম তালিকা (উপশাখার কর্মকর্তা নির্বাচনের জন্য) */
function getOfficerNameList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
    const allowedMaan = ['রুকন', 'অগ্রসর কর্মী', 'কর্মী'];
    const officers = rows
      .filter(function (r) { return r[0] && allowedMaan.indexOf(r[4]) !== -1; })
      .map(function (r) { return { id: r[0], name: r[1], mobile: r[2] }; });
    return { success: true, data: officers };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** উপশাখার হালকা তালিকা (সদস্য ফরমের শাখা ড্রপডাউন ও উপশাখা ধার্য্য ফরমের জন্য) */
function getAllUpashakha() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA, UPASHAKHA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_HEADERS.length).getValues();
    const list = rows
      .filter(function (r) { return r[0]; })
      .map(function (r) {
        let data = {};
        try { data = JSON.parse(r[3] || '{}'); } catch (e) { data = {}; }
        return {
          id: r[0], name: r[1], level: r[2],
          amirName: data.amir ? data.amir.name : '',
          amirMobile: data.amir ? data.amir.mobile : ''
        };
      });
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** নাম দিয়ে উপশাখা সার্চ (সেটাপ ফরমে এডিট করার জন্য) */
function searchUpashakhaByName(query) {
  try {
    const result = getAllUpashakha();
    if (!result.success) return result;
    const q = (query || '').trim().toLowerCase();
    if (!q) return { success: true, data: [] };
    const matches = result.data.filter(function (u) {
      return String(u.name || '').toLowerCase().indexOf(q) !== -1;
    });
    return { success: true, data: matches };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** নির্দিষ্ট উপশাখার সম্পূর্ণ তথ্য (এডিট ফরমে লোড করার জন্য) */
function getUpashakhaById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA, UPASHAKHA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'উপশাখা পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let data = {};
        try { data = JSON.parse(rows[i][3] || '{}'); } catch (e) { data = {}; }
        return {
          success: true,
          data: { id: rows[i][0], name: rows[i][1], level: rows[i][2], details: data }
        };
      }
    }
    return { success: false, error: 'উপশাখা পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** উপশাখা এন্ট্রি ফরম — শুধু নাম ও মান সংরক্ষণ/আপডেট (কমিটির বিস্তারিত JSON অপরিবর্তিত থাকে) */
function saveUpashakhaEntry(formData) {
  try {
    if (!formData.name) return { success: false, error: 'অনুগ্রহ করে উপশাখার নাম লিখুন' };
    if (!formData.level) return { success: false, error: 'অনুগ্রহ করে মান নির্বাচন করুন' };
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA, UPASHAKHA_HEADERS);

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            sheet.getRange(rowIndex, 2, 1, 2).setValues([[formData.name, formData.level]]);
            sheet.getRange(rowIndex, 6).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'উপশাখার তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'উপশাখা খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'U' + new Date().getTime();
      sheet.appendRow([newId, formData.name, formData.level, '{}', new Date(), new Date()]);
      SpreadsheetApp.flush();
      return { success: true, message: 'নতুন উপশাখা এন্ট্রি সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** উপশাখা সংরক্ষণ/আপডেট (formData.id থাকলে আপডেট, না থাকলে নতুন তৈরি) */
function saveUpashakha(formData) {
  try {
    if (!formData.name) return { success: false, error: 'অনুগ্রহ করে উপশাখার নাম লিখুন' };
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA, UPASHAKHA_HEADERS);
    const detailsJson = JSON.stringify(formData.details || {});

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            sheet.getRange(rowIndex, 2, 1, 3).setValues([[formData.name, formData.level || '', detailsJson]]);
            sheet.getRange(rowIndex, 6).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'উপশাখার তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'উপশাখা খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'U' + new Date().getTime();
      sheet.appendRow([newId, formData.name, formData.level || '', detailsJson, new Date(), new Date()]);
      SpreadsheetApp.flush();
      return { success: true, message: 'নতুন উপশাখা সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteUpashakha(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA, UPASHAKHA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'উপশাখা মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'উপশাখা খুঁজে পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== উপশাখা ধার্য্য ==================
const UPASHAKHA_DHAJJO_HEADERS = ['আইডি', 'উপশাখা আইডি', 'উপশাখার নাম', 'বছর', 'আইটেম (JSON)', 'তৈরির সময়', 'হালনাগাদের সময়'];

const UPASHAKHA_DHAJJO_DEFAULT_ITEMS = [
  { name: 'উর্ধতন নিসাব', amount: '', date: '' },
  { name: 'এককালীন', amount: '', date: '' },
  { name: 'নির্বাচনী ফান্ড', amount: '', date: '' },
  { name: 'যাকাত', amount: '', date: '' }
];

function findUpashakhaDhajjoRow_(upashakhaId, year) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_DHAJJO_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]) === String(upashakhaId) && String(rows[i][3]) === String(year)) {
      return { rowIndex: i + 2, row: rows[i] };
    }
  }
  return null;
}

function rowToUpashakhaDhajjoObj_(row) {
  let items = [];
  try { items = JSON.parse(row[4] || '[]'); } catch (e) { items = []; }
  return { id: row[0], upashakhaId: row[1], upashakhaName: row[2], year: row[3], items: items };
}

function getUpashakhaDhajjoRecord(upashakhaId, upashakhaName, year) {
  try {
    const found = findUpashakhaDhajjoRow_(upashakhaId, year);
    if (found) return { success: true, data: rowToUpashakhaDhajjoObj_(found.row) };
    return {
      success: true,
      data: {
        id: '', upashakhaId: upashakhaId, upashakhaName: upashakhaName, year: year,
        items: JSON.parse(JSON.stringify(UPASHAKHA_DHAJJO_DEFAULT_ITEMS))
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveUpashakhaDhajjoRecord(formData) {
  try {
    if (!formData.upashakhaId) return { success: false, error: 'অনুগ্রহ করে উপশাখা নির্বাচন করুন' };
    if (!formData.year) return { success: false, error: 'অনুগ্রহ করে বছর লিখুন' };

    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
    const items = (formData.items || []).filter(function (it) { return it.name && String(it.name).trim() !== ''; });
    const itemsJson = JSON.stringify(items);
    const found = findUpashakhaDhajjoRow_(formData.upashakhaId, formData.year);

    if (found) {
      sheet.getRange(found.rowIndex, 5).setValue(itemsJson);
      sheet.getRange(found.rowIndex, 7).setValue(new Date());
    } else {
      const newId = 'UD' + new Date().getTime();
      sheet.appendRow([newId, formData.upashakhaId, formData.upashakhaName || '', formData.year, itemsJson, new Date(), new Date()]);
    }

    // উর্ধতন নিসাব আইটেম থাকলে রেট-ইতিহাস শীটেও সিঙ্ক করা
    items.forEach(function (it) {
      if (it.name === 'উর্ধতন নিসাব' && it.amount) {
        const monthName = extractMonthNameFromDateStr_(it.date);
        upsertNisabRate_(formData.upashakhaId, formData.upashakhaName, parseFloat(it.amount) || 0, formData.year, monthName);
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'উপশাখা ধার্য্যের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteUpashakhaDhajjoRecord(upashakhaId, year) {
  try {
    const found = findUpashakhaDhajjoRow_(upashakhaId, year);
    if (!found) return { success: false, error: 'এই বছরের কোনো তথ্য পাওয়া যায়নি' };
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
    sheet.deleteRow(found.rowIndex);
    SpreadsheetApp.flush();
    return { success: true, message: 'উপশাখা ধার্য্যের তথ্য মুছে ফেলা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getUpashakhaDhajjoByUpashakha(upashakhaId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_DHAJJO_HEADERS.length).getValues();
    const data = rows
      .filter(function (r) { return r[0] && (!upashakhaId || String(r[1]) === String(upashakhaId)); })
      .map(rowToUpashakhaDhajjoObj_)
      .sort(function (a, b) { return String(b.year).localeCompare(String(a.year)); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== বায়তুলমাল: জনশক্তি আয় ==================
const JONOSHOKTI_AY_HEADERS = ['আইডি', 'সদস্য আইডি', 'সদস্যের নাম', 'শাখা', 'মান', 'বছর', 'মাস', 'খাতের নাম', 'পরিমাণ', 'তারিখ', 'তৈরির সময়'];

/** নির্দিষ্ট শাখা ও মানের সব সদস্যের ধার্য্য/পরিশোধ/বকেয়া তালিকা (নির্দিষ্ট বছর+মাস পর্যন্ত ক্রমপুঞ্জিত হিসাব) */
function getJonoshoktiIncomeList(branch, maan, year, month) {
  try {
    const memberSheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const memberLastRow = memberSheet.getLastRow();
    const members = [];
    if (memberLastRow >= 2) {
      const rows = memberSheet.getRange(2, 1, memberLastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
      rows.forEach(function (r) {
        if (r[0] && r[3] === branch && r[4] === maan) {
          members.push({ id: r[0], name: r[1], mobile: r[2] });
        }
      });
    }
    if (!members.length) return { success: true, data: [] };

    // সব ধার্য্য রো একবারে পড়ে সদস্য অনুযায়ী গ্রুপ করা (প্রতিটি সদস্যের জন্য আলাদা কল না করে)
    const dhajjoSheet = getOrCreateSheet_(SHEET_NAMES.DHAJJO, DHAJJO_HEADERS);
    const dhajjoLastRow = dhajjoSheet.getLastRow();
    const dhajjoByMember = {};
    if (dhajjoLastRow >= 2) {
      const dRows = dhajjoSheet.getRange(2, 1, dhajjoLastRow - 1, DHAJJO_HEADERS.length).getValues();
      dRows.forEach(function (r) {
        if (!r[0]) return;
        const mid = String(r[1]);
        if (!dhajjoByMember[mid]) dhajjoByMember[mid] = [];
        let items = [];
        try { items = JSON.parse(r[5] || '[]'); } catch (e) { items = []; }
        dhajjoByMember[mid].push({ year: r[4], items: items });
      });
    }

    // সব এয়ানত রেট-ইতিহাস একবারে পড়া
    const rateSheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_EYANAT_RATE, JONOSHOKTI_EYANAT_RATE_HEADERS);
    const rateLastRow = rateSheet.getLastRow();
    const rateByMember = {};
    if (rateLastRow >= 2) {
      const rRows = rateSheet.getRange(2, 1, rateLastRow - 1, JONOSHOKTI_EYANAT_RATE_HEADERS.length).getValues();
      rRows.forEach(function (r) {
        if (!r[0]) return;
        const mid = String(r[1]);
        if (!rateByMember[mid]) rateByMember[mid] = [];
        rateByMember[mid].push({ rate: r[3], year: r[4], month: r[5] });
      });
    }

    // সব পরিশোধ একবারে পড়া
    const paySheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_AY, JONOSHOKTI_AY_HEADERS);
    const payLastRow = paySheet.getLastRow();
    const payByMemberKhat = {};
    if (payLastRow >= 2) {
      const pRows = paySheet.getRange(2, 1, payLastRow - 1, JONOSHOKTI_AY_HEADERS.length).getValues();
      pRows.forEach(function (r) {
        if (!r[0]) return;
        const key = String(r[1]) + '|' + r[7];
        payByMemberKhat[key] = (payByMemberKhat[key] || 0) + (parseFloat(r[8]) || 0);
      });
    }

    // প্রকাশনা বিক্রয়ের বকেয়া একবারে পড়া (গ্রাহকের নাম মিলিয়ে)
    const bikroySheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const bikroyLastRow = bikroySheet.getLastRow();
    const dueByCustomer = {};
    if (bikroyLastRow >= 2) {
      const bRows = bikroySheet.getRange(2, 1, bikroyLastRow - 1, PRAKASHONA_BIKROY_HEADERS.length).getValues();
      bRows.forEach(function (r) {
        if (!r[0]) return;
        const due = parseFloat(r[7]) || 0;
        if (due > 0) {
          const cust = String(r[2] || '').trim();
          dueByCustomer[cust] = (dueByCustomer[cust] || 0) + due;
        }
      });
    }

    const result = members.map(function (m) {
      const memberDhajjo = dhajjoByMember[String(m.id)] || [];
      const khatMap = {};

      memberDhajjo.forEach(function (rec) {
        if (parseInt(rec.year) > parseInt(year)) return; // ভবিষ্যতের বছর এখনো গণনায় আসবে না
        (rec.items || []).forEach(function (it) {
          if (it.name === 'এয়ানত') return; // এয়ানত আলাদাভাবে (রেট-ইতিহাস দিয়ে) হিসাব হবে
          const amt = parseFloat(it.amount) || 0;
          if (amt <= 0) return; // ধার্য্য না থাকলে এই খাত যোগ হবে না
          khatMap[it.name] = (khatMap[it.name] || 0) + amt;
        });
      });

      const rateHistory = (rateByMember[String(m.id)] || []).slice().sort(function (a, b) {
        return (parseInt(a.year) * 12 + monthNameToNumber_(a.month)) - (parseInt(b.year) * 12 + monthNameToNumber_(b.month));
      });
      if (rateHistory.length) {
        const eyanatAssessed = calcMonthlyRateAssessedTotal_(rateHistory, year, month);
        if (eyanatAssessed > 0) khatMap['এয়ানত'] = eyanatAssessed;
      }

      const khats = Object.keys(khatMap).map(function (khatName) {
        const assessed = khatMap[khatName];
        const paid = payByMemberKhat[String(m.id) + '|' + khatName] || 0;
        return { khatName: khatName, dhajjo: assessed, paid: paid, due: assessed - paid, readOnly: false };
      });

      const pubDue = dueByCustomer[String(m.name).trim()] || 0;
      if (pubDue > 0) {
        khats.push({ khatName: 'প্রকাশনা বকেয়া', dhajjo: pubDue, paid: 0, due: pubDue, readOnly: true });
      }

      return { memberId: m.id, name: m.name, mobile: m.mobile, khats: khats };
    });

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** জনশক্তি আয় - পরিশোধ এন্ট্রি সংরক্ষণ/আপডেট (একই সদস্য+বছর+মাস+খাত হলে আপডেট, নাহলে নতুন) */
function saveJonoshoktiIncomePayments(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_AY, JONOSHOKTI_AY_HEADERS);
    const payments = formData.payments || [];
    if (!payments.length) return { success: false, error: 'কোনো পরিশোধের তথ্য দেওয়া হয়নি' };

    const lastRow = sheet.getLastRow();
    const existingRows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_AY_HEADERS.length).getValues() : [];

    payments.forEach(function (p) {
      if (!p.amount || parseFloat(p.amount) <= 0) return;
      let foundRowIndex = -1;
      for (let i = 0; i < existingRows.length; i++) {
        if (String(existingRows[i][1]) === String(p.memberId) &&
          String(existingRows[i][5]) === String(formData.year) &&
          String(existingRows[i][6]) === String(formData.month) &&
          existingRows[i][7] === p.khatName) {
          foundRowIndex = i + 2;
          break;
        }
      }
      if (foundRowIndex > -1) {
        sheet.getRange(foundRowIndex, 9).setValue(parseFloat(p.amount));
        sheet.getRange(foundRowIndex, 10).setValue(p.date || '');
      } else {
        const newId = 'JA' + new Date().getTime() + Math.floor(Math.random() * 1000);
        sheet.appendRow([
          newId, p.memberId, p.memberName || '', formData.branch || '', formData.maan || '',
          formData.year, formData.month, p.khatName, parseFloat(p.amount), p.date || '', new Date()
        ]);
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'পরিশোধের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== বায়তুলমাল: উপশাখা আয় ==================
const UPASHAKHA_AY_HEADERS = ['আইডি', 'উপশাখা আইডি', 'উপশাখার নাম', 'বছর', 'মাস', 'খাতের নাম', 'পরিমাণ', 'তারিখ', 'তৈরির সময়'];

function getUpashakhaIncomeList(upashakhaId, upashakhaName, year, month) {
  try {
    // সব উপশাখা ধার্য্য রো পড়া, এই উপশাখার সব বছরের রেকর্ড খুঁজে বের করা (নির্দিষ্ট বছর পর্যন্ত)
    const dhajjoSheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
    const dhajjoLastRow = dhajjoSheet.getLastRow();
    const khatMap = {};
    if (dhajjoLastRow >= 2) {
      const rows = dhajjoSheet.getRange(2, 1, dhajjoLastRow - 1, UPASHAKHA_DHAJJO_HEADERS.length).getValues();
      rows.forEach(function (r) {
        if (!r[0] || String(r[1]) !== String(upashakhaId)) return;
        if (parseInt(r[3]) > parseInt(year)) return;
        let items = [];
        try { items = JSON.parse(r[4] || '[]'); } catch (e) { items = []; }
        items.forEach(function (it) {
          if (it.name === 'উর্ধতন নিসাব') return; // আলাদাভাবে রেট-ইতিহাস দিয়ে হিসাব হবে
          const amt = parseFloat(it.amount) || 0;
          if (amt <= 0) return; // ধার্য্য না থাকলে এই খাত যোগ হবে না
          khatMap[it.name] = (khatMap[it.name] || 0) + amt;
        });
      });
    }

    const rateHistory = getNisabRateHistoryForUpashakha_(upashakhaId);
    if (rateHistory.length) {
      const nisabAssessed = calcMonthlyRateAssessedTotal_(rateHistory, year, month);
      if (nisabAssessed > 0) khatMap['উর্ধতন নিসাব'] = nisabAssessed;
    }

    const paySheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_AY, UPASHAKHA_AY_HEADERS);
    const payLastRow = paySheet.getLastRow();
    const payByKhat = {};
    if (payLastRow >= 2) {
      const pRows = paySheet.getRange(2, 1, payLastRow - 1, UPASHAKHA_AY_HEADERS.length).getValues();
      pRows.forEach(function (r) {
        if (!r[0] || String(r[1]) !== String(upashakhaId)) return;
        payByKhat[r[5]] = (payByKhat[r[5]] || 0) + (parseFloat(r[6]) || 0);
      });
    }

    const khats = Object.keys(khatMap).map(function (khatName) {
      const assessed = khatMap[khatName];
      const paid = payByKhat[khatName] || 0;
      return { khatName: khatName, dhajjo: assessed, paid: paid, due: assessed - paid, readOnly: false };
    });

    // প্রকাশনা বিক্রয়ের বকেয়া (গ্রাহক/উপশাখার নাম মিলিয়ে)
    const bikroySheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const bikroyLastRow = bikroySheet.getLastRow();
    let pubDue = 0;
    if (bikroyLastRow >= 2) {
      const bRows = bikroySheet.getRange(2, 1, bikroyLastRow - 1, PRAKASHONA_BIKROY_HEADERS.length).getValues();
      bRows.forEach(function (r) {
        if (!r[0]) return;
        if (String(r[2] || '').trim() === String(upashakhaName).trim()) {
          const due = parseFloat(r[7]) || 0;
          if (due > 0) pubDue += due;
        }
      });
    }
    if (pubDue > 0) {
      khats.push({ khatName: 'প্রকাশনা বকেয়া', dhajjo: pubDue, paid: 0, due: pubDue, readOnly: true });
    }

    return { success: true, data: khats };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveUpashakhaIncomePayments(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_AY, UPASHAKHA_AY_HEADERS);
    const payments = formData.payments || [];
    if (!payments.length) return { success: false, error: 'কোনো পরিশোধের তথ্য দেওয়া হয়নি' };

    const lastRow = sheet.getLastRow();
    const existingRows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_AY_HEADERS.length).getValues() : [];

    payments.forEach(function (p) {
      if (!p.amount || parseFloat(p.amount) <= 0) return;
      let foundRowIndex = -1;
      for (let i = 0; i < existingRows.length; i++) {
        if (String(existingRows[i][1]) === String(formData.upashakhaId) &&
          String(existingRows[i][3]) === String(formData.year) &&
          String(existingRows[i][4]) === String(formData.month) &&
          existingRows[i][5] === p.khatName) {
          foundRowIndex = i + 2;
          break;
        }
      }
      if (foundRowIndex > -1) {
        sheet.getRange(foundRowIndex, 7).setValue(parseFloat(p.amount));
        sheet.getRange(foundRowIndex, 8).setValue(p.date || '');
      } else {
        const newId = 'UA' + new Date().getTime() + Math.floor(Math.random() * 1000);
        sheet.appendRow([
          newId, formData.upashakhaId, formData.upashakhaName || '',
          formData.year, formData.month, p.khatName, parseFloat(p.amount), p.date || '', new Date()
        ]);
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'পরিশোধের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== বায়তুলমাল: অন্যান্য আয় ==================
const ANNANNO_AY_HEADERS = ['আইডি', 'তারিখ', 'খাত', 'ক্রম', 'বিবরণ', 'পরিমাণ', 'তৈরির সময়'];

function getAnnannoAyList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.ANNANNO_AY, ANNANNO_AY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, ANNANNO_AY_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      return { id: r[0], date: formatDateValue_(r[1]), khat: r[2], serial: r[3], description: r[4], amount: r[5] };
    });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** অন্যান্য আয় - একাধিক এন্ট্রি সংরক্ষণ/আপডেট (প্রতিটি রো নিজস্ব id থাকলে আপডেট, না থাকলে নতুন) */
function saveAnnannoAyEntries(entries) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.ANNANNO_AY, ANNANNO_AY_HEADERS);
    const lastRow = sheet.getLastRow();
    const existingIds = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues() : [];
    const resultIds = [];

    (entries || []).forEach(function (e) {
      if (!e.khat && !e.description) return;
      if (e.id) {
        let rowIndex = -1;
        for (let i = 0; i < existingIds.length; i++) {
          if (String(existingIds[i][0]) === String(e.id)) { rowIndex = i + 2; break; }
        }
        if (rowIndex > -1) {
          sheet.getRange(rowIndex, 2, 1, 5).setValues([[e.date || '', e.khat || '', e.serial || '', e.description || '', parseFloat(e.amount) || 0]]);
          resultIds.push(e.id);
          return;
        }
      }
      const newId = 'OA' + new Date().getTime() + Math.floor(Math.random() * 1000);
      sheet.appendRow([newId, e.date || '', e.khat || '', e.serial || '', e.description || '', parseFloat(e.amount) || 0, new Date()]);
      resultIds.push(newId);
    });

    SpreadsheetApp.flush();
    return { success: true, message: 'অন্যান্য আয়ের তথ্য সংরক্ষণ করা হয়েছে', ids: resultIds };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== বায়তুলমাল: ব্যয় ফরম ==================
const BYAY_HEADERS = ['আইডি', 'ভাউচার নং', 'তারিখ', 'খাত', 'ক্রম', 'বিবরণ', 'পরিমাণ', 'তৈরির সময়'];

function getNextVoucherNumber() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BYAY, BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    // বিদ্যমান ভাউচারগুলোর সর্বোচ্চ নম্বর + ১ (মুছে ফেলার পরও নম্বর যেন দ্বিগুণ না হয়)
    let maxNum = 0;
    if (lastRow >= 2) {
      const vals = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      vals.forEach(function (r) {
        const m = String(r[0]).match(/(\d+)\s*$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n < 100000 && n > maxNum) maxNum = n;
        }
      });
    }
    const padded = ('0000' + (maxNum + 1)).slice(-4);
    return { success: true, voucherNo: 'V-' + padded };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getByayList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BYAY, BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, BYAY_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      return { id: r[0], voucherNo: r[1], date: formatDateValue_(r[2]), khat: r[3], serial: r[4], description: r[5], amount: r[6] };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveByay(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BYAY, BYAY_HEADERS);

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            sheet.getRange(rowIndex, 3, 1, 4).setValues([[formData.date || '', formData.khat || '', formData.serial || '', formData.description || '']]);
            sheet.getRange(rowIndex, 7).setValue(parseFloat(formData.amount) || 0);
            SpreadsheetApp.flush();
            return { success: true, message: 'ব্যয়ের তথ্য আপডেট করা হয়েছে', id: formData.id, voucherNo: formData.voucherNo };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const voucherRes = getNextVoucherNumber();
      const voucherNo = voucherRes.success ? voucherRes.voucherNo : ('V-' + new Date().getTime());
      const newId = 'B' + new Date().getTime();
      sheet.appendRow([newId, voucherNo, formData.date || '', formData.khat || '', formData.serial || '', formData.description || '', parseFloat(formData.amount) || 0, new Date()]);
      SpreadsheetApp.flush();
      return { success: true, message: 'ব্যয়ের তথ্য সংরক্ষণ করা হয়েছে', id: newId, voucherNo: voucherNo };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteByay(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.BYAY, BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'ব্যয়ের ভাউচার মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'ভাউচার খুঁজে পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== বায়তুলমাল: মাসিক আয়-ব্যয় ==================
const MASHIK_AY_BYAY_HEADERS = [
  'আইডি', 'মাস', 'বছর', 'ধার্যকৃত নিছাব', 'আয়ের আইটেম (JSON)', 'ব্যয়ের আইটেম (JSON)',
  'মোট আয়', 'গত মাসের উদ্বৃত্ত', 'সর্বমোট আয়', 'মোট ব্যয়', 'গত মাসের ঘাটতি', 'সর্বমোট ব্যয়',
  'উদ্বৃত্ত/ঘাটতি বিবরণ', 'তৈরির সময়', 'হালনাগাদের সময়'
];

function monthYearSortValue_(month, year) {
  return (parseInt(year, 10) || 0) * 12 + monthNameToNumber_(month);
}

function getMashikAyByayList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_AY_BYAY_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      const grandTotalIncome = parseFloat(r[8]) || 0;
      const grandTotalExpense = parseFloat(r[11]) || 0;
      return {
        id: r[0], month: r[1], year: r[2], dhorjoNisab: r[3],
        totalIncome: r[6], prevSurplus: r[7], grandTotalIncome: grandTotalIncome,
        totalExpense: r[9], prevDeficit: r[10], grandTotalExpense: grandTotalExpense,
        closingBalance: grandTotalIncome - grandTotalExpense
      };
    }).sort(function (a, b) { return monthYearSortValue_(b.month, b.year) - monthYearSortValue_(a.month, a.year); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getMashikAyByayById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_AY_BYAY_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let incomeItems = [], expenseItems = [];
        try { incomeItems = JSON.parse(rows[i][4] || '[]'); } catch (e) { incomeItems = []; }
        try { expenseItems = JSON.parse(rows[i][5] || '[]'); } catch (e) { expenseItems = []; }
        return {
          success: true,
          data: {
            id: rows[i][0], month: rows[i][1], year: rows[i][2], dhorjoNisab: rows[i][3],
            incomeItems: incomeItems, expenseItems: expenseItems,
            totalIncome: rows[i][6], prevSurplus: rows[i][7], grandTotalIncome: rows[i][8],
            totalExpense: rows[i][9], prevDeficit: rows[i][10], grandTotalExpense: rows[i][11],
            balanceDetails: rows[i][12]
          }
        };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// মাস/বছর দিয়ে মাসিক আয়-ব্যয়ের রেকর্ড খুঁজে বের করে (৭-ধাপ রিপোর্ট প্রিন্টে ব্যবহারের জন্য)
function getMashikAyByayByMonth(month, year) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: null };
    const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_AY_BYAY_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][1]) === String(month) && String(rows[i][2]) === String(year)) {
        let incomeItems = [], expenseItems = [];
        try { incomeItems = JSON.parse(rows[i][4] || '[]'); } catch (e) { incomeItems = []; }
        try { expenseItems = JSON.parse(rows[i][5] || '[]'); } catch (e) { expenseItems = []; }
        return {
          success: true,
          data: {
            id: rows[i][0], month: rows[i][1], year: rows[i][2], dhorjoNisab: rows[i][3],
            incomeItems: incomeItems, expenseItems: expenseItems,
            totalIncome: rows[i][6], prevSurplus: rows[i][7], grandTotalIncome: rows[i][8],
            totalExpense: rows[i][9], prevDeficit: rows[i][10], grandTotalExpense: rows[i][11],
            balanceDetails: rows[i][12]
          }
        };
      }
    }
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// নির্বাচিত মাস/বছরের ঠিক আগের এন্ট্রির সর্বশেষ উদ্বৃত্ত/ঘাটতি খুঁজে বের করে (excludeId: এডিট করার সময় নিজের এন্ট্রি বাদ দিতে)
function getPreviousMashikBalance(month, year, excludeId) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, balance: 0, found: false };
    const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_AY_BYAY_HEADERS.length).getValues();
    const currentVal = monthYearSortValue_(month, year);
    let best = null, bestVal = -Infinity;
    rows.forEach(function (r) {
      if (!r[0]) return;
      if (excludeId && String(r[0]) === String(excludeId)) return;
      const v = monthYearSortValue_(r[1], r[2]);
      if (v < currentVal && v > bestVal) {
        bestVal = v;
        best = r;
      }
    });
    if (!best) return { success: true, balance: 0, found: false };
    const balance = (parseFloat(best[8]) || 0) - (parseFloat(best[11]) || 0);
    return { success: true, balance: balance, found: true, month: best[1], year: best[2] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveMashikAyByay(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const incomeJson = JSON.stringify(formData.incomeItems || []);
    const expenseJson = JSON.stringify(formData.expenseItems || []);
    const rowData = [
      formData.month || '', formData.year || '', parseFloat(formData.dhorjoNisab) || 0,
      incomeJson, expenseJson,
      parseFloat(formData.totalIncome) || 0, parseFloat(formData.prevSurplus) || 0, parseFloat(formData.grandTotalIncome) || 0,
      parseFloat(formData.totalExpense) || 0, parseFloat(formData.prevDeficit) || 0, parseFloat(formData.grandTotalExpense) || 0,
      formData.balanceDetails || ''
    ];

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            sheet.getRange(rowIndex, 2, 1, 12).setValues([rowData]);
            sheet.getRange(rowIndex, 15).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'মাসিক আয়-ব্যয় আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'MB' + new Date().getTime();
      sheet.appendRow([newId].concat(rowData).concat([new Date(), new Date()]));
      SpreadsheetApp.flush();
      return { success: true, message: 'মাসিক আয়-ব্যয় সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteMashikAyByay(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// মাসিক আয়-ব্যয়ের সমষ্টিগত রিপোর্ট — সবসময় জানুয়ারি থেকে শুরু হয়ে ধরণ অনুযায়ী সীমা পর্যন্ত (মাসিক হলে শুধু নির্বাচিত মাস)
function getMashikAyByayReport(periodType, year, month) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_AY_BYAY, MASHIK_AY_BYAY_HEADERS);
    const lastRow = sheet.getLastRow();
    const yearNum = parseInt(year, 10) || 0;

    let startMonth = 1, endMonth = 12;
    if (periodType === 'মাসিক') {
      const m = monthNameToNumber_(month);
      startMonth = m; endMonth = m;
    } else if (periodType === 'ত্রৈমাসিক') {
      startMonth = 1; endMonth = 3;
    } else if (periodType === 'ষান্মাসিক') {
      startMonth = 1; endMonth = 6;
    } else if (periodType === 'নয় মাসিক') {
      startMonth = 1; endMonth = 9;
    } else { // বার্ষিক
      startMonth = 1; endMonth = 12;
    }

    let records = [];
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_AY_BYAY_HEADERS.length).getValues();
      records = rows.filter(function (r) {
        if (!r[0]) return false;
        if ((parseInt(r[2], 10) || 0) !== yearNum) return false;
        const mn = monthNameToNumber_(r[1]);
        return mn >= startMonth && mn <= endMonth;
      }).map(function (r) {
        let incomeItems = [], expenseItems = [];
        try { incomeItems = JSON.parse(r[4] || '[]'); } catch (e) { incomeItems = []; }
        try { expenseItems = JSON.parse(r[5] || '[]'); } catch (e) { expenseItems = []; }
        return {
          month: r[1], year: r[2], monthNum: monthNameToNumber_(r[1]),
          incomeItems: incomeItems, expenseItems: expenseItems,
          totalIncome: parseFloat(r[6]) || 0, prevSurplus: parseFloat(r[7]) || 0, grandTotalIncome: parseFloat(r[8]) || 0,
          totalExpense: parseFloat(r[9]) || 0, prevDeficit: parseFloat(r[10]) || 0, grandTotalExpense: parseFloat(r[11]) || 0
        };
      }).sort(function (a, b) { return a.monthNum - b.monthNum; });
    }

    // খাত-ভিত্তিক যোগফল
    const incomeTotals = {};
    const expenseTotals = {};
    let sumIncome = 0, sumExpense = 0;
    records.forEach(function (rec) {
      rec.incomeItems.forEach(function (it) {
        const amt = parseFloat(it.amount) || 0;
        const key = it.name || 'অজানা';
        incomeTotals[key] = (incomeTotals[key] || 0) + amt;
      });
      rec.expenseItems.forEach(function (it) {
        const amt = parseFloat(it.amount) || 0;
        const key = it.name || 'অজানা';
        expenseTotals[key] = (expenseTotals[key] || 0) + amt;
      });
      sumIncome += rec.totalIncome;
      sumExpense += rec.totalExpense;
    });

    const openingBalance = records.length ? (records[0].prevSurplus - records[0].prevDeficit) : 0;
    const closingBalance = records.length ? (records[records.length - 1].grandTotalIncome - records[records.length - 1].grandTotalExpense) : (openingBalance + sumIncome - sumExpense);

    const includedMonths = records.map(function (r) { return r.month; });
    const allMonthsInRange = [];
    for (let m = startMonth; m <= endMonth; m++) allMonthsInRange.push(BN_MONTHS[m - 1]);
    const missingMonths = allMonthsInRange.filter(function (m) { return includedMonths.indexOf(m) === -1; });

    return {
      success: true,
      periodType: periodType,
      year: yearNum,
      startMonth: BN_MONTHS[startMonth - 1],
      endMonth: BN_MONTHS[endMonth - 1],
      includedMonths: includedMonths,
      missingMonths: missingMonths,
      incomeTotals: incomeTotals,
      expenseTotals: expenseTotals,
      totalIncome: sumIncome,
      totalExpense: sumExpense,
      openingBalance: openingBalance,
      closingBalance: closingBalance
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== জাতীয় ও স্থানীয় নির্বাচনভিত্তিক কার্যক্রম (মাসিক আয়-ব্যয় পেজের উপরের সেকশন) ==================
const MASHIK_NIRBACHON_HEADERS = [
  'আইডি', 'মাস', 'বছর',
  'পৌরসভা-ওয়ার্ড', 'পৌরসভা-প্রার্থী', 'পৌরসভা-অংশগ্রহণ', 'পৌরসভা-মেয়র', 'পৌরসভা-কাউন্সিলর', 'পৌরসভা-দ্বিতীয়অবস্থান',
  'ইউপি-ওয়ার্ড', 'ইউপি-প্রার্থী', 'ইউপি-অংশগ্রহণ', 'ইউপি-চেয়ারম্যান', 'ইউপি-মেম্বার', 'ইউপি-দ্বিতীয়অবস্থান',
  'ভোটকেন্দ্র-মোট', 'ভোটকেন্দ্র-বৃদ্ধি',
  'ইউনিট-মোট', 'ইউনিট-বৃদ্ধি', 'ইউনিট-টার্গেট',
  'বৈঠক সংখ্যা', 'তৈরির সময়', 'হালনাগাদের সময়'
];

function getMashikNirbachonByMonth(month, year) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_NIRBACHON, MASHIK_NIRBACHON_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: null };
    const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_NIRBACHON_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (String(r[1]) === String(month) && String(r[2]) === String(year)) {
        return {
          success: true,
          data: {
            id: r[0], month: r[1], year: r[2],
            pouWard: r[3], pouCandidate: r[4], pouParticipation: r[5], pouMayor: r[6], pouCouncillor: r[7], pouRunnerup: r[8],
            uniWard: r[9], uniCandidate: r[10], uniParticipation: r[11], uniMayor: r[12], uniCouncillor: r[13], uniRunnerup: r[14],
            centerTotal: r[15], centerGrowth: r[16],
            unitTotal: r[17], unitGrowth: r[18], unitTarget: r[19],
            meetingCount: r[20]
          }
        };
      }
    }
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveMashikNirbachon(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.MASHIK_NIRBACHON, MASHIK_NIRBACHON_HEADERS);
    const rowData = [
      formData.month || '', formData.year || '',
      formData.pouWard || '', formData.pouCandidate || '', formData.pouParticipation || '', formData.pouMayor || '', formData.pouCouncillor || '', formData.pouRunnerup || '',
      formData.uniWard || '', formData.uniCandidate || '', formData.uniParticipation || '', formData.uniMayor || '', formData.uniCouncillor || '', formData.uniRunnerup || '',
      formData.centerTotal || '', formData.centerGrowth || '',
      formData.unitTotal || '', formData.unitGrowth || '', formData.unitTarget || '',
      formData.meetingCount || ''
    ];

    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, MASHIK_NIRBACHON_HEADERS.length).getValues();
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][1]) === String(formData.month) && String(rows[i][2]) === String(formData.year)) {
          const rowIndex = i + 2;
          sheet.getRange(rowIndex, 2, 1, 19).setValues([rowData]);
          sheet.getRange(rowIndex, 22).setValue(new Date());
          SpreadsheetApp.flush();
          return { success: true, message: 'নির্বাচনভিত্তিক কার্যক্রম আপডেট করা হয়েছে' };
        }
      }
    }

    const newId = 'MN' + new Date().getTime();
    sheet.appendRow([newId].concat(rowData).concat([new Date(), new Date()]));
    SpreadsheetApp.flush();
    return { success: true, message: 'নির্বাচনভিত্তিক কার্যক্রম সংরক্ষণ করা হয়েছে', id: newId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== সাংগঠনিক রিপোর্ট (পৌরসভা/ইউনিয়ন ফরম নং ৫) — ৭ ধাপের উইজার্ড ==================
// প্রতিটি ধাপের ডাটা key-value (JSON) আকারে সংরক্ষিত হয়, যাতে ধাপ যোগ/পরিবর্তন সহজ হয়
const SANGGHOTHONIK_REPORT_HEADERS = [
  'আইডি', 'মাস', 'বছর', 'ধরণ', 'পৌরসভা/ইউনিয়নের নাম', 'উপজেলা/থানা', 'আমীর/সভাপতির নাম',
  'ধাপ ১ (JSON)', 'ধাপ ২ (JSON)', 'ধাপ ৩ (JSON)', 'ধাপ ৪ (JSON)', 'ধাপ ৫ (JSON)', 'ধাপ ৬ (JSON)',
  'তৈরির সময়', 'হালনাগাদের সময়'
];

function getSangghothonikReportByMonth(month, year) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.SANGGHOTHONIK_REPORT, SANGGHOTHONIK_REPORT_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: null };
    const rows = sheet.getRange(2, 1, lastRow - 1, SANGGHOTHONIK_REPORT_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (String(r[1]) === String(month) && String(r[2]) === String(year)) {
        const steps = {};
        for (let s = 1; s <= 6; s++) {
          try { steps[s] = JSON.parse(r[6 + s] || '{}'); } catch (e) { steps[s] = {}; }
        }
        return {
          success: true,
          data: {
            id: r[0], month: r[1], year: r[2], periodType: r[3],
            unionName: r[4], upazila: r[5], amirName: r[6],
            steps: steps
          }
        };
      }
    }
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// একটিমাত্র ধাপের ডাটা সংরক্ষণ করে (বাকি ধাপগুলো অপরিবর্তিত থাকে)
function saveSangghothonikReportStep(month, year, periodType, unionName, upazila, amirName, stepNumber, stepData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.SANGGHOTHONIK_REPORT, SANGGHOTHONIK_REPORT_HEADERS);
    const stepJson = JSON.stringify(stepData || {});
    const stepCol = 7 + parseInt(stepNumber, 10); // ধাপ ১ = কলাম ৮, ধাপ ২ = কলাম ৯, ...

    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, SANGGHOTHONIK_REPORT_HEADERS.length).getValues();
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][1]) === String(month) && String(rows[i][2]) === String(year)) {
          const rowIndex = i + 2;
          sheet.getRange(rowIndex, 4, 1, 4).setValues([[periodType || '', unionName || '', upazila || '', amirName || '']]);
          sheet.getRange(rowIndex, stepCol).setValue(stepJson);
          sheet.getRange(rowIndex, 15).setValue(new Date());
          SpreadsheetApp.flush();
          return { success: true, message: 'ধাপ ' + stepNumber + ' সংরক্ষণ করা হয়েছে' };
        }
      }
    }

    const newId = 'SR' + new Date().getTime();
    const newRow = [newId, month || '', year || '', periodType || '', unionName || '', upazila || '', amirName || '', '', '', '', '', '', '', new Date(), new Date()];
    newRow[stepCol - 1] = stepJson;
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return { success: true, message: 'ধাপ ' + stepNumber + ' সংরক্ষণ করা হয়েছে', id: newId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== প্রকাশনা: ক্রয় ফরম ==================
const PRAKASHONA_KROY_HEADERS = ['আইডি', 'তারিখ', 'আইটেম (JSON)', 'সাবটোটাল', 'ডিসকাউন্ট', 'পরিশোধ', 'বকেয়া', 'তৈরির সময়', 'হালনাগাদের সময়'];

function getPrakashonaKroyList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_KROY, PRAKASHONA_KROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_KROY_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      let items = [];
      try { items = JSON.parse(r[2] || '[]'); } catch (e) { items = []; }
      return { id: r[0], date: formatDateValue_(r[1]), items: items, subtotal: r[3], discount: r[4], paid: r[5], due: r[6] };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getPrakashonaKroyById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_KROY, PRAKASHONA_KROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_KROY_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(rows[i][2] || '[]'); } catch (e) { items = []; }
        return {
          success: true,
          data: { id: rows[i][0], date: formatDateValue_(rows[i][1]), items: items, subtotal: rows[i][3], discount: rows[i][4], paid: rows[i][5], due: rows[i][6] }
        };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function savePrakashonaKroy(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_KROY, PRAKASHONA_KROY_HEADERS);
    const itemsJson = JSON.stringify(formData.items || []);
    const rowData = [formData.date || '', itemsJson, formData.subtotal || 0, formData.discount || 0, formData.paid || 0, formData.due || 0];

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            // পুরনো আইটেমের স্টক-প্রভাব উল্টে দেওয়া, তারপর নতুন আইটেমের প্রভাব বসানো
            let oldItems = [];
            try { oldItems = JSON.parse(sheet.getRange(rowIndex, 3).getValue() || '[]'); } catch (e) { oldItems = []; }
            applyStockDelta_(oldItems, -1, false);
            applyStockDelta_(formData.items, +1, true);

            sheet.getRange(rowIndex, 2, 1, 6).setValues([rowData]);
            sheet.getRange(rowIndex, 9).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'PK' + new Date().getTime();
      applyStockDelta_(formData.items, +1, true);
      sheet.appendRow([newId].concat(rowData, [new Date(), new Date()]));
      SpreadsheetApp.flush();
      return { success: true, message: 'প্রকাশনা ক্রয় সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deletePrakashonaKroy(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_KROY, PRAKASHONA_KROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(sheet.getRange(i + 2, 3).getValue() || '[]'); } catch (e) { items = []; }
        applyStockDelta_(items, -1, false);
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== প্রকাশনা: বিক্রয় ফরম ==================
const PRAKASHONA_BIKROY_HEADERS = ['আইডি', 'তারিখ', 'গ্রাহক/উপশাখা', 'আইটেম (JSON)', 'সাবটোটাল', 'ডিসকাউন্ট', 'আদায়', 'বকেয়া', 'তৈরির সময়', 'হালনাগাদের সময়'];

function getPrakashonaBikroyList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BIKROY_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      let items = [];
      try { items = JSON.parse(r[3] || '[]'); } catch (e) { items = []; }
      return { id: r[0], date: formatDateValue_(r[1]), customer: r[2], items: items, subtotal: r[4], discount: r[5], paid: r[6], due: r[7] };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getPrakashonaBikroyById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BIKROY_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(rows[i][3] || '[]'); } catch (e) { items = []; }
        return {
          success: true,
          data: {
            id: rows[i][0], date: formatDateValue_(rows[i][1]), customer: rows[i][2], items: items,
            subtotal: rows[i][4], discount: rows[i][5], paid: rows[i][6], due: rows[i][7]
          }
        };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function savePrakashonaBikroy(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const itemsJson = JSON.stringify(formData.items || []);
    const rowData = [formData.date || '', formData.customer || '', itemsJson, formData.subtotal || 0, formData.discount || 0, formData.paid || 0, formData.due || 0];

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            let oldItems = [];
            try { oldItems = JSON.parse(sheet.getRange(rowIndex, 4).getValue() || '[]'); } catch (e) { oldItems = []; }
            applyStockDelta_(oldItems, +1, false); // আগের বিক্রয় বাতিল করে স্টক ফেরত
            applyStockDelta_(formData.items, -1, false); // নতুন বিক্রয় স্টক থেকে বাদ

            sheet.getRange(rowIndex, 2, 1, 7).setValues([rowData]);
            sheet.getRange(rowIndex, 10).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'PB' + new Date().getTime();
      applyStockDelta_(formData.items, -1, false);
      sheet.appendRow([newId].concat(rowData, [new Date(), new Date()]));
      SpreadsheetApp.flush();
      return { success: true, message: 'প্রকাশনা বিক্রয় সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deletePrakashonaBikroy(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BIKROY, PRAKASHONA_BIKROY_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(sheet.getRange(i + 2, 4).getValue() || '[]'); } catch (e) { items = []; }
        applyStockDelta_(items, +1, false);
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== প্রকাশনা: বিলি ফরম ==================
const PRAKASHONA_BILI_HEADERS = ['আইডি', 'তারিখ', 'উপশাখা আইডি', 'উপশাখার নাম', 'আইটেম (JSON)', 'সাবটোটাল', 'তৈরির সময়', 'হালনাগাদের সময়'];

function getPrakashonaBiliList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BILI, PRAKASHONA_BILI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BILI_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      let items = [];
      try { items = JSON.parse(r[4] || '[]'); } catch (e) { items = []; }
      return { id: r[0], date: formatDateValue_(r[1]), upashakhaId: r[2], upashakhaName: r[3], items: items, subtotal: r[5] };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getPrakashonaBiliById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BILI, PRAKASHONA_BILI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BILI_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(rows[i][4] || '[]'); } catch (e) { items = []; }
        return {
          success: true,
          data: { id: rows[i][0], date: formatDateValue_(rows[i][1]), upashakhaId: rows[i][2], upashakhaName: rows[i][3], items: items, subtotal: rows[i][5] }
        };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function savePrakashonaBili(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BILI, PRAKASHONA_BILI_HEADERS);
    const itemsJson = JSON.stringify(formData.items || []);
    const rowData = [formData.date || '', formData.upashakhaId || '', formData.upashakhaName || '', itemsJson, formData.subtotal || 0];

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            let oldItems = [];
            try { oldItems = JSON.parse(sheet.getRange(rowIndex, 5).getValue() || '[]'); } catch (e) { oldItems = []; }
            applyStockDelta_(oldItems, +1, false);
            applyStockDelta_(formData.items, -1, false);

            sheet.getRange(rowIndex, 2, 1, 5).setValues([rowData]);
            sheet.getRange(rowIndex, 8).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'PD' + new Date().getTime();
      applyStockDelta_(formData.items, -1, false);
      sheet.appendRow([newId].concat(rowData, [new Date(), new Date()]));
      SpreadsheetApp.flush();
      return { success: true, message: 'প্রকাশনা বিলি সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deletePrakashonaBili(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BILI, PRAKASHONA_BILI_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(sheet.getRange(i + 2, 5).getValue() || '[]'); } catch (e) { items = []; }
        applyStockDelta_(items, +1, false);
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== প্রকাশনা: বাতিল প্রকাশনা ফরম ==================
const PRAKASHONA_BATIL_HEADERS = ['আইডি', 'তারিখ', 'আইটেম (JSON)', 'সাবটোটাল', 'তৈরির সময়', 'হালনাগাদের সময়'];

function getPrakashonaBatilList() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BATIL, PRAKASHONA_BATIL_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BATIL_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      return { id: r[0], date: formatDateValue_(r[1]), subtotal: r[3] };
    }).reverse();
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getPrakashonaBatilById(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BATIL, PRAKASHONA_BATIL_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_BATIL_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(rows[i][2] || '[]'); } catch (e) { items = []; }
        return { success: true, data: { id: rows[i][0], date: formatDateValue_(rows[i][1]), items: items, subtotal: rows[i][3] } };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function savePrakashonaBatil(formData) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BATIL, PRAKASHONA_BATIL_HEADERS);
    const itemsJson = JSON.stringify(formData.items || []);
    const rowData = [formData.date || '', itemsJson, formData.subtotal || 0];

    if (formData.id) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0]) === String(formData.id)) {
            const rowIndex = i + 2;
            let oldItems = [];
            try { oldItems = JSON.parse(sheet.getRange(rowIndex, 3).getValue() || '[]'); } catch (e) { oldItems = []; }
            applyStockDelta_(oldItems, +1, false);
            applyStockDelta_(formData.items, -1, false);

            sheet.getRange(rowIndex, 2, 1, 3).setValues([rowData]);
            sheet.getRange(rowIndex, 6).setValue(new Date());
            SpreadsheetApp.flush();
            return { success: true, message: 'তথ্য আপডেট করা হয়েছে', id: formData.id };
          }
        }
      }
      return { success: false, error: 'এন্ট্রি খুঁজে পাওয়া যায়নি' };
    } else {
      const newId = 'PC' + new Date().getTime();
      applyStockDelta_(formData.items, -1, false);
      sheet.appendRow([newId].concat(rowData, [new Date(), new Date()]));
      SpreadsheetApp.flush();
      return { success: true, message: 'বাতিল প্রকাশনা সংরক্ষণ করা হয়েছে', id: newId };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deletePrakashonaBatil(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_BATIL, PRAKASHONA_BATIL_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'কোনো তথ্য নেই' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        let items = [];
        try { items = JSON.parse(sheet.getRange(i + 2, 3).getValue() || '[]'); } catch (e) { items = []; }
        applyStockDelta_(items, +1, false);
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== এয়ানত রেট-ইতিহাস (মাসিক হিসাবের ভিত্তি) ==================
const JONOSHOKTI_EYANAT_RATE_HEADERS = ['আইডি', 'সদস্য আইডি', 'সদস্যের নাম', 'রেট', 'বছর', 'মাস', 'তৈরির সময়'];

function upsertEyanatRate_(memberId, memberName, rate, year, monthName) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_EYANAT_RATE, JONOSHOKTI_EYANAT_RATE_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_EYANAT_RATE_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][1]) === String(memberId) && String(rows[i][4]) === String(year) && rows[i][5] === monthName) {
        sheet.getRange(i + 2, 4).setValue(rate);
        return;
      }
    }
  }
  const newId = 'ER' + new Date().getTime() + Math.floor(Math.random() * 1000);
  sheet.appendRow([newId, memberId, memberName, rate, year, monthName, new Date()]);
}

function getEyanatRateHistoryForMember_(memberId) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_EYANAT_RATE, JONOSHOKTI_EYANAT_RATE_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_EYANAT_RATE_HEADERS.length).getValues();
  const history = rows.filter(function (r) { return r[0] && String(r[1]) === String(memberId); })
    .map(function (r) { return { rate: r[3], year: r[4], month: r[5] }; });
  history.sort(function (a, b) {
    return (parseInt(a.year) * 12 + monthNameToNumber_(a.month)) - (parseInt(b.year) * 12 + monthNameToNumber_(b.month));
  });
  return history;
}

function getEyanatCurrentRate_(memberId) {
  const history = getEyanatRateHistoryForMember_(memberId);
  if (!history.length) return 0;
  return parseFloat(history[history.length - 1].rate) || 0;
}

/** এয়ানত বৃদ্ধি ফরম: নির্দিষ্ট শাখা+মানের সব সদস্যের বর্তমান এয়ানত রেট */
function getEyanatIncreaseFormList(branch, maan) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const lastRow = sheet.getLastRow();
    const members = [];
    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
      rows.forEach(function (r) {
        if (r[0] && r[3] === branch && r[4] === maan) members.push({ id: r[0], name: r[1], mobile: r[2] });
      });
    }
    const result = members.map(function (m) {
      return { memberId: m.id, name: m.name, currentRate: getEyanatCurrentRate_(m.id) };
    });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** এয়ানত বৃদ্ধি সংরক্ষণ (আজকের তারিখ থেকে কার্যকর) */
function saveEyanatIncrease(entries) {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const monthName = BN_MONTHS[today.getMonth()];
    let count = 0;
    (entries || []).forEach(function (e) {
      const increase = parseFloat(e.increaseAmount) || 0;
      if (increase <= 0) return;
      const currentRate = getEyanatCurrentRate_(e.memberId);
      const newRate = currentRate + increase;
      upsertEyanatRate_(e.memberId, e.memberName, newRate, year, monthName);
      count++;
    });
    if (count === 0) return { success: false, error: 'অন্তত একজন সদস্যের জন্য বৃদ্ধির পরিমাণ লিখুন' };
    SpreadsheetApp.flush();
    return {
      success: true,
      message: toBnDigits_(count) + ' জন সদস্যের এয়ানত বৃদ্ধি সংরক্ষণ করা হয়েছে',
      date: Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function toBnDigits_(num) {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, function (d) { return bn[d]; });
}

// ================== নিসাব রেট-ইতিহাস (উপশাখার মাসিক হিসাবের ভিত্তি) ==================
const UPASHAKHA_NISAB_RATE_HEADERS = ['আইডি', 'উপশাখা আইডি', 'উপশাখার নাম', 'রেট', 'বছর', 'মাস', 'তৈরির সময়'];

function upsertNisabRate_(upashakhaId, upashakhaName, rate, year, monthName) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_NISAB_RATE, UPASHAKHA_NISAB_RATE_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_NISAB_RATE_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][1]) === String(upashakhaId) && String(rows[i][4]) === String(year) && rows[i][5] === monthName) {
        sheet.getRange(i + 2, 4).setValue(rate);
        return;
      }
    }
  }
  const newId = 'NR' + new Date().getTime() + Math.floor(Math.random() * 1000);
  sheet.appendRow([newId, upashakhaId, upashakhaName, rate, year, monthName, new Date()]);
}

function getNisabRateHistoryForUpashakha_(upashakhaId) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_NISAB_RATE, UPASHAKHA_NISAB_RATE_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_NISAB_RATE_HEADERS.length).getValues();
  const history = rows.filter(function (r) { return r[0] && String(r[1]) === String(upashakhaId); })
    .map(function (r) { return { rate: r[3], year: r[4], month: r[5] }; });
  history.sort(function (a, b) {
    return (parseInt(a.year) * 12 + monthNameToNumber_(a.month)) - (parseInt(b.year) * 12 + monthNameToNumber_(b.month));
  });
  return history;
}

function getNisabCurrentRate_(upashakhaId) {
  const history = getNisabRateHistoryForUpashakha_(upashakhaId);
  if (!history.length) return 0;
  return parseFloat(history[history.length - 1].rate) || 0;
}

/** নিসাব বৃদ্ধি ফরম: সব উপশাখার বর্তমান নিসাব রেট */
function getNisabIncreaseFormList() {
  try {
    const result = getAllUpashakha();
    if (!result.success) return result;
    const data = result.data.map(function (u) {
      return { upashakhaId: u.id, name: u.name, currentRate: getNisabCurrentRate_(u.id) };
    });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** নিসাব বৃদ্ধি সংরক্ষণ (আজকের তারিখ থেকে কার্যকর) */
function saveNisabIncrease(entries) {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const monthName = BN_MONTHS[today.getMonth()];
    let count = 0;
    (entries || []).forEach(function (e) {
      const increase = parseFloat(e.increaseAmount) || 0;
      if (increase <= 0) return;
      const currentRate = getNisabCurrentRate_(e.upashakhaId);
      const newRate = currentRate + increase;
      upsertNisabRate_(e.upashakhaId, e.upashakhaName, newRate, year, monthName);
      count++;
    });
    if (count === 0) return { success: false, error: 'অন্তত একটি উপশাখার জন্য বৃদ্ধির পরিমাণ লিখুন' };
    SpreadsheetApp.flush();
    return {
      success: true,
      message: toBnDigits_(count) + ' টি উপশাখার নিসাব বৃদ্ধি সংরক্ষণ করা হয়েছে',
      date: Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== জনশক্তি আয়/বকেয়া রিপোর্ট ==================

function getPeriodMonthRange_(periodType, periodValue) {
  if (periodType === 'মাসিক') {
    const m = monthNameToNumber_(periodValue);
    return { start: m, end: m };
  }
  if (periodType === 'ত্রৈমাসিক') {
    const q = parseInt(periodValue) || 1;
    return { start: (q - 1) * 3 + 1, end: q * 3 };
  }
  if (periodType === 'ষান্মাসিক') {
    const h = parseInt(periodValue) || 1;
    return { start: (h - 1) * 6 + 1, end: h * 6 };
  }
  return { start: 1, end: 12 }; // বার্ষিক
}

function getMembersByBranchMaan_(branch, maan) {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
  const lastRow = sheet.getLastRow();
  const members = [];
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      if (branch && r[3] !== branch) return;
      if (maan && r[4] !== maan) return;
      members.push({ id: r[0], name: r[1], mobile: r[2], branch: r[3], maan: r[4] });
    });
  }
  return members;
}

function getAllDhajjoGroupedByMember_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.DHAJJO, DHAJJO_HEADERS);
  const lastRow = sheet.getLastRow();
  const grouped = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, DHAJJO_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      const mid = String(r[1]);
      if (!grouped[mid]) grouped[mid] = [];
      let items = [];
      try { items = JSON.parse(r[5] || '[]'); } catch (e) { items = []; }
      grouped[mid].push({ year: r[4], items: items });
    });
  }
  return grouped;
}

function getAllEyanatRatesGroupedByMember_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_EYANAT_RATE, JONOSHOKTI_EYANAT_RATE_HEADERS);
  const lastRow = sheet.getLastRow();
  const grouped = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_EYANAT_RATE_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      const mid = String(r[1]);
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push({ rate: r[3], year: r[4], month: r[5] });
    });
  }
  Object.keys(grouped).forEach(function (mid) {
    grouped[mid].sort(function (a, b) {
      return (parseInt(a.year) * 12 + monthNameToNumber_(a.month)) - (parseInt(b.year) * 12 + monthNameToNumber_(b.month));
    });
  });
  return grouped;
}

function getAllJonoshoktiPaymentsGroupedByMember_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI_AY, JONOSHOKTI_AY_HEADERS);
  const lastRow = sheet.getLastRow();
  const grouped = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, JONOSHOKTI_AY_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      const mid = String(r[1]);
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push({ khatName: r[7], year: r[5], month: r[6], amount: r[8], date: r[9] });
    });
  }
  return grouped;
}

/** নির্দিষ্ট বছর+মাস (ক্রমপুঞ্জিত) পর্যন্ত একজন সদস্যের প্রতিটি খাতের ধার্য্য */
function computeMemberAssessedByKhat_(memberDhajjoRecords, rateHistorySorted, targetYear, targetMonthName) {
  const khatMap = {};
  memberDhajjoRecords.forEach(function (rec) {
    if (parseInt(rec.year) > parseInt(targetYear)) return;
    (rec.items || []).forEach(function (it) {
      if (it.name === 'এয়ানত') return;
      const amt = parseFloat(it.amount) || 0;
      if (amt <= 0) return;
      khatMap[it.name] = (khatMap[it.name] || 0) + amt;
    });
  });
  if (rateHistorySorted && rateHistorySorted.length) {
    const eyanatAssessed = calcMonthlyRateAssessedTotal_(rateHistorySorted, targetYear, targetMonthName);
    if (eyanatAssessed > 0) khatMap['এয়ানত'] = eyanatAssessed;
  }
  return khatMap;
}

/** নির্দিষ্ট বছর+মাস পর্যন্ত (সর্বমোট, cumulative) পরিশোধের যোগফল খাত-ভিত্তিক */
function sumPaymentsUpTo_(paymentRows, targetYear, targetMonthNum) {
  const result = {};
  const targetIdx = parseInt(targetYear) * 12 + targetMonthNum;
  (paymentRows || []).forEach(function (p) {
    const idx = parseInt(p.year) * 12 + monthNameToNumber_(p.month);
    if (idx <= targetIdx) {
      result[p.khatName] = (result[p.khatName] || 0) + (parseFloat(p.amount) || 0);
    }
  });
  return result;
}

/** নির্দিষ্ট সময়সীমার (একটি নির্দিষ্ট বছরের মধ্যে মাসের রেঞ্জ) পরিশোধের যোগফল খাত-ভিত্তিক */
function sumPaymentsWithinPeriod_(paymentRows, year, startMonthNum, endMonthNum) {
  const result = {};
  (paymentRows || []).forEach(function (p) {
    if (String(p.year) !== String(year)) return;
    const mNum = monthNameToNumber_(p.month);
    if (mNum >= startMonthNum && mNum <= endMonthNum) {
      result[p.khatName] = (result[p.khatName] || 0) + (parseFloat(p.amount) || 0);
    }
  });
  return result;
}

/** খাত-ভিত্তিক আয় রিপোর্ট (নির্দিষ্ট সময়সীমায় প্রাপ্ত পরিশোধ, শাখা+মান অনুযায়ী সব সদস্য) */
function getJonoshoktiIncomeReport(branch, maan, periodType, year, periodValue) {
  try {
    const range = getPeriodMonthRange_(periodType, periodValue);
    const members = getMembersByBranchMaan_(branch, maan);
    const payByMember = getAllJonoshoktiPaymentsGroupedByMember_();

    const khatColumnsSet = {};
    const rows = members.map(function (m) {
      const payRows = payByMember[String(m.id)] || [];
      const incomeByKhat = sumPaymentsWithinPeriod_(payRows, year, range.start, range.end);
      Object.keys(incomeByKhat).forEach(function (k) { khatColumnsSet[k] = true; });
      const total = Object.keys(incomeByKhat).reduce(function (s, k) { return s + incomeByKhat[k]; }, 0);
      return { id: m.id, name: m.name, values: incomeByKhat, total: total };
    });

    return { success: true, khatColumns: Object.keys(khatColumnsSet), rows: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** খাত-ভিত্তিক বকেয়া রিপোর্ট (নির্দিষ্ট সময়সীমার শেষ পর্যন্ত ধার্য্য বিয়োগ পরিশোধ, শাখা+মান অনুযায়ী সব সদস্য) */
function getJonoshoktiDueReport(branch, maan, periodType, year, periodValue) {
  try {
    const range = getPeriodMonthRange_(periodType, periodValue);
    const targetMonthName = BN_MONTHS[range.end - 1];
    const members = getMembersByBranchMaan_(branch, maan);
    const dhajjoByMember = getAllDhajjoGroupedByMember_();
    const rateByMember = getAllEyanatRatesGroupedByMember_();
    const payByMember = getAllJonoshoktiPaymentsGroupedByMember_();

    const khatColumnsSet = {};
    const rows = members.map(function (m) {
      const memberDhajjo = dhajjoByMember[String(m.id)] || [];
      const rateHistory = rateByMember[String(m.id)] || [];
      const assessedMap = computeMemberAssessedByKhat_(memberDhajjo, rateHistory, year, targetMonthName);
      const paidMap = sumPaymentsUpTo_(payByMember[String(m.id)] || [], year, range.end);

      const dueMap = {};
      Object.keys(assessedMap).forEach(function (k) {
        const due = assessedMap[k] - (paidMap[k] || 0);
        dueMap[k] = due;
        khatColumnsSet[k] = true;
      });
      const total = Object.keys(dueMap).reduce(function (s, k) { return s + dueMap[k]; }, 0);
      return { id: m.id, name: m.name, values: dueMap, total: total };
    });

    return { success: true, khatColumns: Object.keys(khatColumnsSet), rows: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** নির্দিষ্ট সদস্যের সম্পূর্ণ আর্থিক তথ্য (প্রিন্ট রিপোর্টের জন্য) */
function getMemberFullReport(memberId) {
  try {
    const memberSheet = getOrCreateSheet_(SHEET_NAMES.JONOSHOKTI, JONOSHOKTI_HEADERS);
    const found = getMemberById_(memberId);
    if (!found) return { success: false, error: 'সদস্য পাওয়া যায়নি' };
    const r = found.row;
    const member = { id: r[0], name: r[1], mobile: r[2], branch: r[3], maan: r[4] };

    const today = new Date();
    const year = today.getFullYear();
    const monthName = BN_MONTHS[today.getMonth()];

    const dhajjoByMember = getAllDhajjoGroupedByMember_();
    const rateByMember = getAllEyanatRatesGroupedByMember_();
    const payByMember = getAllJonoshoktiPaymentsGroupedByMember_();

    const memberDhajjo = dhajjoByMember[String(memberId)] || [];
    const rateHistory = rateByMember[String(memberId)] || [];
    const assessedMap = computeMemberAssessedByKhat_(memberDhajjo, rateHistory, year, monthName);
    const payRows = payByMember[String(memberId)] || [];
    const paidMap = sumPaymentsUpTo_(payRows, year, monthNameToNumber_(monthName));

    const khats = Object.keys(assessedMap).map(function (k) {
      const assessed = assessedMap[k];
      const paid = paidMap[k] || 0;
      return { khatName: k, dhajjo: assessed, paid: paid, due: assessed - paid };
    });

    const paymentHistory = payRows.map(function (p) {
      return { khatName: p.khatName, year: p.year, month: p.month, amount: p.amount, date: p.date };
    }).sort(function (a, b) {
      return (parseInt(b.year) * 12 + monthNameToNumber_(b.month)) - (parseInt(a.year) * 12 + monthNameToNumber_(a.month));
    });

    return { success: true, data: { member: member, khats: khats, paymentHistory: paymentHistory } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== উপশাখা আয়/বকেয়া রিপোর্ট ==================

function getUpashakhaListByLevel_(levelFilter) {
  const result = getAllUpashakha();
  if (!result.success) return [];
  if (!levelFilter) return result.data;
  return result.data.filter(function (u) { return u.level === levelFilter; });
}

function getAllUpashakhaDhajjoGrouped_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_DHAJJO, UPASHAKHA_DHAJJO_HEADERS);
  const lastRow = sheet.getLastRow();
  const grouped = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_DHAJJO_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      const uid = String(r[1]);
      if (!grouped[uid]) grouped[uid] = [];
      let items = [];
      try { items = JSON.parse(r[4] || '[]'); } catch (e) { items = []; }
      grouped[uid].push({ year: r[3], items: items });
    });
  }
  return grouped;
}

function getAllUpashakhaPaymentsGrouped_() {
  const sheet = getOrCreateSheet_(SHEET_NAMES.UPASHAKHA_AY, UPASHAKHA_AY_HEADERS);
  const lastRow = sheet.getLastRow();
  const grouped = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, UPASHAKHA_AY_HEADERS.length).getValues();
    rows.forEach(function (r) {
      if (!r[0]) return;
      const uid = String(r[1]);
      if (!grouped[uid]) grouped[uid] = [];
      grouped[uid].push({ khatName: r[5], year: r[3], month: r[4], amount: r[6], date: r[7] });
    });
  }
  return grouped;
}

function getUpashakhaIncomeReport(levelFilter, periodType, year, periodValue) {
  try {
    const range = getPeriodMonthRange_(periodType, periodValue);
    const upashakhas = getUpashakhaListByLevel_(levelFilter);
    const payByUpashakha = getAllUpashakhaPaymentsGrouped_();

    const khatColumnsSet = {};
    const rows = upashakhas.map(function (u) {
      const payRows = payByUpashakha[String(u.id)] || [];
      const incomeByKhat = sumPaymentsWithinPeriod_(payRows, year, range.start, range.end);
      Object.keys(incomeByKhat).forEach(function (k) { khatColumnsSet[k] = true; });
      const total = Object.keys(incomeByKhat).reduce(function (s, k) { return s + incomeByKhat[k]; }, 0);
      return { id: u.id, name: u.name, values: incomeByKhat, total: total };
    });

    return { success: true, khatColumns: Object.keys(khatColumnsSet), rows: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getUpashakhaDueReport(levelFilter, periodType, year, periodValue) {
  try {
    const range = getPeriodMonthRange_(periodType, periodValue);
    const targetMonthName = BN_MONTHS[range.end - 1];
    const upashakhas = getUpashakhaListByLevel_(levelFilter);
    const dhajjoByUpashakha = getAllUpashakhaDhajjoGrouped_();
    const payByUpashakha = getAllUpashakhaPaymentsGrouped_();

    const khatColumnsSet = {};
    const rows = upashakhas.map(function (u) {
      const uDhajjo = dhajjoByUpashakha[String(u.id)] || [];
      const rateHistory = getNisabRateHistoryForUpashakha_(u.id);
      const assessedMap = computeMemberAssessedByKhat_(uDhajjo, rateHistory, year, targetMonthName);
      // এই সাধারণ ফাংশনটি 'এয়ানত' নাম বাদ দেয়; উপশাখার ক্ষেত্রে খাতের নাম 'উর্ধতন নিসাব', তাই আলাদা করে হিসাব বসাতে হবে
      const nisabAssessed = rateHistory.length ? calcMonthlyRateAssessedTotal_(rateHistory, year, targetMonthName) : 0;
      if (nisabAssessed > 0) assessedMap['উর্ধতন নিসাব'] = nisabAssessed;

      const paidMap = sumPaymentsUpTo_(payByUpashakha[String(u.id)] || [], year, range.end);

      const dueMap = {};
      Object.keys(assessedMap).forEach(function (k) {
        const due = assessedMap[k] - (paidMap[k] || 0);
        dueMap[k] = due;
        khatColumnsSet[k] = true;
      });
      const total = Object.keys(dueMap).reduce(function (s, k) { return s + dueMap[k]; }, 0);
      return { id: u.id, name: u.name, values: dueMap, total: total };
    });

    return { success: true, khatColumns: Object.keys(khatColumnsSet), rows: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getUpashakhaFullReport(upashakhaId) {
  try {
    const result = getAllUpashakha();
    if (!result.success) return { success: false, error: 'উপশাখা পাওয়া যায়নি' };
    const upashakha = result.data.filter(function (u) { return String(u.id) === String(upashakhaId); })[0];
    if (!upashakha) return { success: false, error: 'উপশাখা পাওয়া যায়নি' };

    const today = new Date();
    const year = today.getFullYear();
    const monthName = BN_MONTHS[today.getMonth()];

    const dhajjoByUpashakha = getAllUpashakhaDhajjoGrouped_();
    const uDhajjo = dhajjoByUpashakha[String(upashakhaId)] || [];
    const rateHistory = getNisabRateHistoryForUpashakha_(upashakhaId);
    const assessedMap = computeMemberAssessedByKhat_(uDhajjo, rateHistory, year, monthName);
    const nisabAssessed = rateHistory.length ? calcMonthlyRateAssessedTotal_(rateHistory, year, monthName) : 0;
    if (nisabAssessed > 0) assessedMap['উর্ধতন নিসাব'] = nisabAssessed;

    const payByUpashakha = getAllUpashakhaPaymentsGrouped_();
    const payRows = payByUpashakha[String(upashakhaId)] || [];
    const paidMap = sumPaymentsUpTo_(payRows, year, monthNameToNumber_(monthName));

    const khats = Object.keys(assessedMap).map(function (k) {
      const assessed = assessedMap[k];
      const paid = paidMap[k] || 0;
      return { khatName: k, dhajjo: assessed, paid: paid, due: assessed - paid };
    });

    const paymentHistory = payRows.map(function (p) {
      return { khatName: p.khatName, year: p.year, month: p.month, amount: p.amount, date: p.date };
    }).sort(function (a, b) {
      return (parseInt(b.year) * 12 + monthNameToNumber_(b.month)) - (parseInt(a.year) * 12 + monthNameToNumber_(a.month));
    });

    return { success: true, data: { upashakha: upashakha, khats: khats, paymentHistory: paymentHistory } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== শাখা সেটাপ: কর্মপরিষদ ==================
const KORMO_PARISHAD_HEADERS = ['আইডি', 'ক্রম', 'সদস্য আইডি', 'নাম', 'মোবাইল', 'বিভাগ সমূহ'];

function getKormoParishad() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.KORMO_PARISHAD, KORMO_PARISHAD_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, KORMO_PARISHAD_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      return { id: r[0], serial: r[1], memberId: r[2], name: r[3], mobile: r[4], departments: r[5] };
    }).sort(function (a, b) { return (a.serial || 0) - (b.serial || 0); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveKormoParishad(items) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.KORMO_PARISHAD, KORMO_PARISHAD_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) sheet.deleteRows(2, lastRow - 1);

    const validItems = (items || []).filter(function (it) { return it.name && String(it.name).trim() !== ''; });
    if (validItems.length > 0) {
      const rows = validItems.map(function (it, idx) {
        const newId = 'KP' + new Date().getTime() + '_' + idx;
        return [newId, idx + 1, it.memberId || '', it.name, it.mobile || '', it.departments || ''];
      });
      sheet.getRange(2, 5, rows.length, 1).setNumberFormat('@');
      sheet.getRange(2, 1, rows.length, KORMO_PARISHAD_HEADERS.length).setValues(rows);
    }
    SpreadsheetApp.flush();
    return { success: true, message: 'কর্মপরিষদের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteKormoParishad() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.KORMO_PARISHAD, KORMO_PARISHAD_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) sheet.deleteRows(2, lastRow - 1);
    SpreadsheetApp.flush();
    return { success: true, message: 'কর্মপরিষদের পুরো তালিকা মুছে ফেলা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== শাখা সেটাপ: শুরা সদস্য ==================
const SHURA_SODOSSHO_HEADERS = ['আইডি', 'ক্রম', 'সদস্য আইডি', 'নাম', 'মোবাইল'];

function getShuraSodossho() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.SHURA_SODOSSHO, SHURA_SODOSSHO_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, SHURA_SODOSSHO_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      return { id: r[0], serial: r[1], memberId: r[2], name: r[3], mobile: r[4] };
    }).sort(function (a, b) { return (a.serial || 0) - (b.serial || 0); });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveShuraSodossho(items) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.SHURA_SODOSSHO, SHURA_SODOSSHO_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) sheet.deleteRows(2, lastRow - 1);

    const validItems = (items || []).filter(function (it) { return it.name && String(it.name).trim() !== ''; });
    if (validItems.length > 0) {
      const rows = validItems.map(function (it, idx) {
        const newId = 'SS' + new Date().getTime() + '_' + idx;
        return [newId, idx + 1, it.memberId || '', it.name, it.mobile || ''];
      });
      sheet.getRange(2, 5, rows.length, 1).setNumberFormat('@');
      sheet.getRange(2, 1, rows.length, SHURA_SODOSSHO_HEADERS.length).setValues(rows);
    }
    SpreadsheetApp.flush();
    return { success: true, message: 'শুরা সদস্যদের তথ্য সংরক্ষণ করা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteShuraSodossho() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.SHURA_SODOSSHO, SHURA_SODOSSHO_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) sheet.deleteRows(2, lastRow - 1);
    SpreadsheetApp.flush();
    return { success: true, message: 'শুরা সদস্যদের পুরো তালিকা মুছে ফেলা হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================== প্রকাশনা তালিকা (ক্যাটালগ + স্টক) ==================
const PRAKASHONA_TALIKA_HEADERS = ['আইডি', 'বইয়ের নাম', 'সংখ্যা', 'এককমূল্য', 'তৈরির সময়', 'হালনাগাদের সময়'];

function getPrakashonaTalika() {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_TALIKA, PRAKASHONA_TALIKA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: true, data: [] };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_TALIKA_HEADERS.length).getValues();
    const data = rows.filter(function (r) { return r[0]; }).map(function (r) {
      const qty = parseFloat(r[2]) || 0;
      const price = parseFloat(r[3]) || 0;
      return { id: r[0], name: r[1], qty: qty, price: price, total: qty * price };
    });
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addPrakashonaBook(formData) {
  try {
    if (!formData.name) return { success: false, error: 'অনুগ্রহ করে বইয়ের নাম লিখুন' };
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_TALIKA, PRAKASHONA_TALIKA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).trim() === String(formData.name).trim()) {
          return { success: false, error: 'এই নামের বই ইতিমধ্যে তালিকায় আছে' };
        }
      }
    }
    const newId = 'PT' + new Date().getTime();
    sheet.appendRow([newId, formData.name, parseFloat(formData.qty) || 0, parseFloat(formData.price) || 0, new Date(), new Date()]);
    SpreadsheetApp.flush();
    return { success: true, message: 'নতুন বই তালিকায় যুক্ত করা হয়েছে', id: newId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** তালিকার একটি বইয়ের নাম/সংখ্যা/এককমূল্য আপডেট করে */
function updatePrakashonaBook(formData) {
  try {
    if (!formData || !formData.id) return { success: false, error: 'বই নির্বাচন করা হয়নি' };
    if (!formData.name) return { success: false, error: 'অনুগ্রহ করে বইয়ের নাম লিখুন' };
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_TALIKA, PRAKASHONA_TALIKA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'বই পাওয়া যায়নি' };
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_TALIKA_HEADERS.length).getValues();
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) === String(formData.id)) { rowIndex = i + 2; }
      else if (String(rows[i][1]).trim() === String(formData.name).trim()) {
        return { success: false, error: 'এই নামের বই ইতিমধ্যে তালিকায় আছে' };
      }
    }
    if (rowIndex < 0) return { success: false, error: 'বই পাওয়া যায়নি' };
    sheet.getRange(rowIndex, 2, 1, 3).setValues([[formData.name, parseFloat(formData.qty) || 0, parseFloat(formData.price) || 0]]);
    sheet.getRange(rowIndex, 6).setValue(new Date());
    SpreadsheetApp.flush();
    return { success: true, message: 'বইয়ের তথ্য আপডেট হয়েছে' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** তালিকা থেকে একটি বই মুছে ফেলে */
function deletePrakashonaBook(id) {
  try {
    const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_TALIKA, PRAKASHONA_TALIKA_HEADERS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'বই পাওয়া যায়নি' };
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: 'বইটি তালিকা থেকে মুছে ফেলা হয়েছে' };
      }
    }
    return { success: false, error: 'বই পাওয়া যায়নি' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** বইয়ের স্টক পরিমাণ পরিবর্তন করে (qtyDelta ধনাত্মক হলে বাড়বে, ঋণাত্মক হলে কমবে); newPrice দেওয়া থাকলে এককমূল্য আপডেট হবে */
function adjustPrakashonaStock_(bookName, qtyDelta, newPrice) {
  if (!bookName) return;
  const sheet = getOrCreateSheet_(SHEET_NAMES.PRAKASHONA_TALIKA, PRAKASHONA_TALIKA_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, PRAKASHONA_TALIKA_HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === bookName) {
        const rowIndex = i + 2;
        const newQty = (parseFloat(rows[i][2]) || 0) + qtyDelta;
        sheet.getRange(rowIndex, 3).setValue(newQty);
        if (newPrice !== null && newPrice !== undefined) {
          sheet.getRange(rowIndex, 4).setValue(newPrice);
        }
        sheet.getRange(rowIndex, 6).setValue(new Date());
        return;
      }
    }
  }
  // বই তালিকায় না থাকলে নতুন এন্ট্রি তৈরি হবে
  const newId = 'PT' + new Date().getTime() + Math.floor(Math.random() * 1000);
  sheet.appendRow([newId, bookName, Math.max(qtyDelta, 0), newPrice || 0, new Date(), new Date()]);
}

/** items তালিকার প্রতিটি বইয়ের স্টকে sign অনুযায়ী পরিবর্তন প্রয়োগ করে (sign=+1 বাড়বে, sign=-1 কমবে) */
function applyStockDelta_(items, sign, updatePriceOnPositive) {
  (items || []).forEach(function (item) {
    if (!item.bookName) return;
    const qty = parseFloat(item.qty) || 0;
    if (qty <= 0) return;
    const priceToSet = (sign > 0 && updatePriceOnPositive) ? (parseFloat(item.unitPrice) || 0) : null;
    adjustPrakashonaStock_(item.bookName, sign * qty, priceToSet);
  });
}
