/**
 * API স্তর — GitHub Pages (বা যেকোনো ডোমেইন) থেকে আসা কল গ্রহণ করে।
 * ফ্রন্টএন্ড (js/gas-shim.js) এখানে POST পাঠায়: { fn: 'ফাংশনের নাম', args: [...], password: '...' }
 *
 * নিয়ম:
 *  - নামের শেষে "_" থাকা ফাংশন (প্রাইভেট হেল্পার) কখনো বাইরে থেকে কল করা যায় না
 *  - ঐচ্ছিক পাসওয়ার্ড: Project Settings → Script properties → APP_PASSWORD
 *    (সেট না করলে আগের মতোই উন্মুক্ত থাকবে)
 *  - ঐচ্ছিক ডোমেইন সীমাবদ্ধতা অন্য উপায়ে সম্ভব নয় (Apps Script CORS হেডার নিয়ন্ত্রণ করতে দেয় না),
 *    তাই পাসওয়ার্ড ব্যবহার করাই নিরাপদ।
 */

const API_BLOCKED_NAMES_ = ['doGet', 'doPost', 'include', 'setupAppPassword', 'removeAppPassword'];

function doGet(e) {
  return apiJson_({
    ok: true,
    app: 'Jamaat Management System API',
    message: 'API চালু আছে। ফ্রন্টএন্ড সাইট (GitHub Pages) থেকে এটি ব্যবহার করুন।',
    passwordProtected: !!getAppPassword_()
  });
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return apiJson_({ ok: false, error: 'অবৈধ অনুরোধ' });
  }

  const fn = String(req.fn || '');
  const args = Array.isArray(req.args) ? req.args : [];

  // পাসওয়ার্ড যাচাই (ঐচ্ছিক)
  const required = getAppPassword_();
  if (required) {
    if (fn === '__ping') {
      // শুধু পাসওয়ার্ড ঠিক আছে কিনা দেখার জন্য
    }
    if (String(req.password || '') !== required) {
      return apiJson_({ ok: false, code: 'AUTH', error: 'পাসওয়ার্ড প্রয়োজন বা ভুল' });
    }
  }
  if (fn === '__ping') return apiJson_({ ok: true, result: true });

  // ফাংশন যাচাই
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(fn) || fn.endsWith('_') || API_BLOCKED_NAMES_.indexOf(fn) !== -1) {
    return apiJson_({ ok: false, error: 'অনুমোদিত নয়: ' + fn });
  }
  const target = globalThis[fn];
  if (typeof target !== 'function') {
    return apiJson_({ ok: false, error: 'ফাংশন পাওয়া যায়নি: ' + fn });
  }

  try {
    const result = target.apply(null, args);
    return apiJson_({ ok: true, result: result === undefined ? null : result });
  } catch (err) {
    return apiJson_({ ok: false, error: (err && err.message) ? err.message : String(err) });
  }
}

function apiJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getAppPassword_() {
  return PropertiesService.getScriptProperties().getProperty('APP_PASSWORD') || '';
}

/** Apps Script এডিটর থেকে একবার চালিয়ে পাসওয়ার্ড সেট করুন (নিচের লেখা বদলে নিন) */
function setupAppPassword() {
  const NEW_PASSWORD = 'এখানে-আপনার-পাসওয়ার্ড-লিখুন';
  PropertiesService.getScriptProperties().setProperty('APP_PASSWORD', NEW_PASSWORD);
}

/** পাসওয়ার্ড তুলে দিতে এটি চালান */
function removeAppPassword() {
  PropertiesService.getScriptProperties().deleteProperty('APP_PASSWORD');
}
