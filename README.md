# বাংলাদেশ জামায়াতে ইসলামী — সাংগঠনিক ব্যবস্থাপনা সিস্টেম

GitHub Pages-এ হোস্ট করা ফ্রন্টএন্ড + Google Apps Script (Google Sheet) ব্যাকএন্ড।
সব ডাটা আপনার নিজের Google Sheet-এ থাকে।

```
ব্রাউজার ──► GitHub Pages (index.html, css/, js/)
                 │  fetch (POST)
                 ▼
            Apps Script Web App (apps-script/) ──► Google Sheet + Drive
```

## ফোল্ডার কাঠামো

| পথ | কাজ |
|---|---|
| `index.html`, `css/style.css`, `js/app.js` | ফ্রন্টএন্ড (আগের কোডই, শুধু আলাদা ফাইলে) |
| `js/gas-shim.js` | `google.script.run` কলগুলো Apps Script API-তে পাঠায় |
| `config.js` | **শুধু এখানে API_URL বসাতে হবে** |
| `apps-script/Code.gs` | মূল ব্যাকএন্ড (`doGet` সরানো হয়েছে) |
| `apps-script/Api.gs` | API রাউটার + ঐচ্ছিক পাসওয়ার্ড |
| `apps-script/appsscript.json` | ম্যানিফেস্ট (টাইমজোন Asia/Dhaka, Web App সেটিং) |
| `docs/FEATURES.md` | ফিচারের পুরো বিবরণ (আগের README) |
| `CNAME.example` | ডোমেইনের জন্য (নিচে ধাপ ৪ দেখুন) |

---

## ধাপ ১ — ব্যাকএন্ড (Google Apps Script)

1. নতুন **Google Sheet** খুলুন → **Extensions → Apps Script**
2. `Code.gs` ফাইলে `apps-script/Code.gs` এর সব কোড পেস্ট করুন
3. **+ → Script** দিয়ে নতুন ফাইল বানান, নাম `Api` → `apps-script/Api.gs` এর কোড পেস্ট করুন
4. বাম পাশে ⚙️ **Project Settings** → "Show appsscript.json manifest file" টিক দিন → `appsscript.json` এ `apps-script/appsscript.json` এর কোড পেস্ট করুন
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. অনুমতি (Authorize) দিন, তারপর **Web app URL** কপি করুন (`.../exec` দিয়ে শেষ)

> ব্রাউজারে সেই URL খুললে `{"ok":true,"app":"Jamaat Management System API",...}` দেখালে ব্যাকএন্ড ঠিক আছে।

⚠️ **পরে Apps Script কোড বদলালে** Deploy → **Manage deployments → ✏️ Edit → Version: New version → Deploy** করতে হবে (URL একই থাকবে)।

## ধাপ ২ — ফ্রন্টএন্ডে URL বসান

`config.js` খুলে:

```js
window.APP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/XXXXXXXX/exec"
};
```

## ধাপ ৩ — GitHub-এ আপলোড ও চালু

1. GitHub-এ নতুন repository বানান (যেমন `jamaat-system`)
2. এই ফোল্ডারের সব ফাইল আপলোড করুন (বা নিচের কমান্ড):
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/ইউজারনেম/jamaat-system.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save
4. ১–২ মিনিট পর সাইট চালু: `https://ইউজারনেম.github.io/jamaat-system/`

## ধাপ ৪ — ভবিষ্যতে নিজের ডোমেইন যোগ করা

কোড বা `config.js` কিছুই বদলাতে হবে না।

**(ক) সাবডোমেইন (সবচেয়ে সহজ, যেমন `app.yourdomain.com`)**
1. ডোমেইনের DNS-এ যোগ করুন: `CNAME` — নাম `app` — মান `ইউজারনেম.github.io`
2. repo-র রুটে `CNAME` নামে ফাইল বানান (এক্সটেনশন ছাড়া), ভেতরে শুধু: `app.yourdomain.com`
   (`CNAME.example` কপি করে নাম বদলান)
3. Settings → Pages → **Custom domain** এ ডোমেইন লিখে Save
4. DNS ঠিক হলে **Enforce HTTPS** টিক দিন

**(খ) মূল ডোমেইন (`yourdomain.com`)** — DNS-এ চারটি `A` রেকর্ড:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
এবং `www` এর জন্য `CNAME` → `ইউজারনেম.github.io`। বাকি ধাপ একই।

> DNS চালু হতে কয়েক মিনিট থেকে ২৪ ঘণ্টা লাগতে পারে।
> GitHub Pages ছাড়া Cloudflare Pages / Netlify / নিজের সার্ভারেও এই ফোল্ডার হুবহু চলবে (এটি পুরোপুরি স্ট্যাটিক সাইট)।

---

## 🔒 নিরাপত্তা (গুরুত্বপূর্ণ)

Apps Script URL "Anyone" অ্যাক্সেসে থাকে, তাই URL জানা যে কেউ ডাটা পড়তে পারে।
সদস্যদের নাম/মোবাইল থাকায় **পাসওয়ার্ড চালু করা উচিত**:

1. Apps Script-এ `Api.gs` খুলে `setupAppPassword` ফাংশনের `NEW_PASSWORD` বদলান
2. ফাংশন সিলেক্ট করে **Run** চাপুন (একবারই)
3. **নতুন Version দিয়ে Deploy** করুন

এরপর সাইট খুললে লগইন বক্স আসবে। পাসওয়ার্ড তুলতে `removeAppPassword` চালান।
(পাসওয়ার্ড কোডে নয়, Script Properties-এ থাকে; GitHub-এ যাবে না। এটি একটি শেয়ার্ড পাসওয়ার্ড — ইউজারভিত্তিক লগইন নয়।)

## সমস্যা সমাধান

| সমস্যা | সমাধান |
|---|---|
| "config.js ফাইলে API_URL বসানো হয়নি" | ধাপ ২ করুন |
| Failed to fetch / CORS | Deploy-এ Who has access = **Anyone** আছে কিনা দেখুন; URL `/exec` দিয়ে শেষ হতে হবে (`/dev` নয়) |
| কোড বদলালাম কিন্তু পরিবর্তন আসছে না | নতুন Version দিয়ে আবার Deploy করুন |
| ছবি আপলোড হচ্ছে না | Apps Script প্রথমবার Drive অনুমতি চায় — Authorize করুন |
| নতুন ফাংশন কাজ করছে না | নাম `_` দিয়ে শেষ হলে বাইরে থেকে কল হয় না (ইচ্ছাকৃত) |

## যোগাযোগ
@Am Shahed : 01605721296
