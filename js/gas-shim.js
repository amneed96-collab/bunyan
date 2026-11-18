/**
 * google.script.run সিমুলেটর
 * ----------------------------------------------------------
 * আগের কোড যেমন ছিল ঠিক তেমনই থাকে:
 *   google.script.run.withSuccessHandler(fn).withFailureHandler(fn).getBranchInfo(...)
 * কিন্তু ভেতরে এখন Apps Script Web App-এ fetch (POST) যায়।
 *
 * CORS প্রিফ্লাইট এড়াতে Content-Type: text/plain ব্যবহার করা হয়েছে।
 */
(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var PW_KEY = 'jamaat_app_password';

  function getPassword() {
    try { return sessionStorage.getItem(PW_KEY) || ''; } catch (e) { return ''; }
  }
  function setPassword(v) {
    try { sessionStorage.setItem(PW_KEY, v); } catch (e) {}
  }

  // ---------- পাসওয়ার্ড বক্স (শুধু সার্ভারে APP_PASSWORD সেট থাকলে দেখায়) ----------
  var pendingLogin = null;
  function askPassword(message) {
    if (pendingLogin) return pendingLogin;
    pendingLogin = new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,20,50,.75);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:inherit;';
      ov.innerHTML =
        '<div style="background:#fff;padding:24px;border-radius:12px;width:min(92vw,360px);box-shadow:0 10px 40px rgba(0,0,0,.4);text-align:center">' +
        '<h3 style="margin:0 0 6px;color:#0b2a5b">🔒 লগইন প্রয়োজন</h3>' +
        '<p id="gasPwMsg" style="margin:0 0 12px;color:#b00020;font-size:14px;min-height:18px"></p>' +
        '<input id="gasPwInput" type="password" placeholder="পাসওয়ার্ড" style="width:100%;box-sizing:border-box;padding:10px;font-size:16px;border:1px solid #999;border-radius:8px">' +
        '<button id="gasPwBtn" style="margin-top:12px;width:100%;padding:10px;font-size:16px;background:#0b2a5b;color:#fff;border:0;border-radius:8px;cursor:pointer">প্রবেশ করুন</button>' +
        '</div>';
      document.body.appendChild(ov);
      var input = ov.querySelector('#gasPwInput');
      ov.querySelector('#gasPwMsg').textContent = message || '';
      input.focus();
      function submit() {
        var v = input.value;
        if (!v) return;
        setPassword(v);
        document.body.removeChild(ov);
        pendingLogin = null;
        resolve();
      }
      ov.querySelector('#gasPwBtn').addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });
    return pendingLogin;
  }

  // ---------- মূল কল ----------
  function callApi(fn, args, attempt) {
    attempt = attempt || 0;
    var url = cfg.API_URL;
    if (!url || url.indexOf('PASTE_YOUR') === 0) {
      return Promise.reject(new Error('config.js ফাইলে API_URL বসানো হয়নি'));
    }
    return fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args, password: getPassword() })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('সার্ভার ত্রুটি (' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        if (data && data.ok) return data.result === undefined ? null : data.result;
        if (data && data.code === 'AUTH' && attempt < 5) {
          return askPassword(attempt > 0 ? 'পাসওয়ার্ড ভুল, আবার চেষ্টা করুন' : '').then(function () {
            return callApi(fn, args, attempt + 1);
          });
        }
        throw new Error((data && data.error) || 'অজানা ত্রুটি');
      });
  }

  // ---------- google.script.run এর মতো চেইনযোগ্য অবজেক্ট ----------
  function makeRunner(onSuccess, onFailure) {
    var target = {
      withSuccessHandler: function (fn) { return makeRunner(fn, onFailure); },
      withFailureHandler: function (fn) { return makeRunner(onSuccess, fn); },
      withUserObject: function () { return makeRunner(onSuccess, onFailure); }
    };
    return new Proxy(target, {
      get: function (t, name) {
        if (name in t) return t[name];
        if (typeof name !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          callApi(name, args).then(
            function (res) { if (onSuccess) onSuccess(res); },
            function (err) {
              if (onFailure) onFailure(err instanceof Error ? err : new Error(String(err)));
              else console.error('[API ত্রুটি] ' + name + ':', err);
            }
          );
        };
      }
    });
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = makeRunner(null, null);
})();
