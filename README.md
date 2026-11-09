# دورهمی‌ساز محمد تردستی

نسخهٔ مستقل برای GitHub Pages + Cloudflare Workers و D1.
ظاهر و چهار تصویر، حضور افراد، نظرها، رأی‌گیری، خریدها و هزینه‌ها حفظ شده‌اند.

## وضعیت

- کد و تصاویر آمادهٔ انتشارند.
- تا تنظیم آدرس API در مخزن، انتشار خودکار اجرا نمی‌شود.
- سایت فعلی ChatGPT و داده‌هایش تغییر نمی‌کنند. داده‌های قبلی خودکار به حساب جدید منتقل نشده‌اند؛ قبل از تغییر لینک اصلی باید انتقال داده‌ها جداگانه انجام شود.
- باز شدن بدون فیلترشکن باید روی اینترنت کاربران آزمایش شود؛ انتشار رایگان تضمین دسترسی روی همهٔ اپراتورها نیست.

## راه‌اندازی مرحله به مرحله

### ۱. دسترسی GitHub

اتصال GitHub برای مخزن `mohammadtardasti9211-boop/dorhamisaz-mt` فعال شده است. رمز یا توکن را در گفتگو ارسال نکنید.

### ۲. سرویس رایگان اطلاعات

در https://dash.cloudflare.com/ یک حساب رایگان بسازید یا وارد شوید.
از Workers & Pages یک Worker ساده با نام `dorhamisaz-api` ایجاد کنید.
در Edit Code، محتوای فایل `cloudflare/worker.js` این مخزن را جایگزین و Deploy کنید.
سپس در Storage & Databases → D1 یک دیتابیس **جدید و خالی** به نام `dorhamisaz` بسازید.
در Console دیتابیس، فایل `cloudflare/new-database.sql` را فقط یک بار اجرا کنید. این فایل برای دیتابیس جدید است؛ روی دیتابیس سایت فعلی اجرا نکنید.
در Worker → Settings/Bindings، دیتابیس را با نام دقیق `DB` متصل کنید و Worker را مجدداً Deploy کنید.
آدرس Worker را نگه دارید. آدرس `/api/health` باید `{"ok":true}` برگرداند.
هیچ API token یا رمز دیتابیس نباید در فایل‌های عمومی ذخیره شود.

### ۳. اتصال رابط سایت

در مخزن GitHub: Settings → Secrets and variables → Actions → Variables → New repository variable.
نام: `VITE_API_BASE_URL`
مقدار: آدرس HTTPS ریشهٔ Worker، بدون `/api`، بدون query و بدون کلید.
این آدرس عمومی است و رمز محسوب نمی‌شود.

### ۴. انتشار رایگان

Settings → Pages → Source = GitHub Actions.
سپس Actions → Publish Dorhamisaz → Run workflow.
انتشار فقط بعد از موفقیت تست‌ها و سلامت API انجام می‌شود.

### ۵. آزمایش پیش از جایگزینی لینک اصلی

بدون فیلترشکن روی چند اپراتور آزمایش کنید: بارگذاری تصاویر، ساخت قرار، ورود از گوشی دوم، رأی، حضور، نظر، خرید، هزینه، و تازه‌سازی صفحه.
لینک دعوت نسخهٔ گیتهاب با `?g=...` کار می‌کند تا باز کردن مستقیم برنامه در GitHub Pages خطای 404 ندهد.
لینک مدیریت همچنان کلید محرمانه در fragment دارد؛ فقط برای میزبان نگه دارید.

## توسعه و بررسی

```sh
npm ci
npm run check
npm test
npm run build:worker
VITE_API_BASE_URL=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev npm run build
```

پس از تغییر API، `npm run build:worker` را اجرا و نسخهٔ جدید `cloudflare/worker.js` را به Cloudflare منتقل کنید.
پلن‌های رایگان سقف مصرف دارند؛ تنظیم طرح پولی یا پرداخت لازم نیست.
