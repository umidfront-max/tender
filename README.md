# TenderHub UZ

O'zbekiston tender platformalarini yagona oynadan kuzatish uchun frontend. Vue 3 (Composition API, `<script setup>`) + Vite, hech qanday UI kutubxonasiz.

## Ishga tushirish

```bash
npm install
npm run dev
```

Ochiladi: http://localhost:5173

## Backend manzili

Dev rejimda `vite.config.js` dagi proxy ishlatiladi — CORS muammosi bo'lmaydi:

```js
proxy: { '/api': { target: 'http://192.168.1.10:8000', changeOrigin: true } }
```

Manzil o'zgarsa faqat shu qatorni tahrirlang.

Production build uchun `.env` faylida:

```
VITE_API_BASE=http://192.168.1.10:8000
```

## Struktura

```
src/
├── api/
│   ├── client.js          fetch ustidagi qatlam — query builder, AbortSignal, xatolar
│   ├── tenders.js         /items, /stats, /interest, /collect, /sources
│   └── laws.js            /laws
├── composables/
│   ├── useTenders.js      filtrlar, sahifalash, saralash, statistika — asosiy logika
│   ├── useSources.js      manbalar keshi va rang biriktirish
│   ├── useCategories.js   kategoriyalarni javoblardan yig'ish
│   ├── useStats.js        tab sonlari (/items/stats)
│   ├── useCollect.js      qo'lda yig'ish + holat pollingi
│   ├── useLaws.js         qonunlar ro'yxati va filtrlari
│   └── useTheme.js        light/dark, localStorage'ga saqlanadi
├── components/
│   ├── AppHeader.vue      logo, live indikator, tema, qo'lda yig'ish
│   ├── StatsBar.vue       4 ta ko'rsatkich kartasi
│   ├── SearchBar.vue      ⌘K fokus, debounce, loading chizig'i
│   ├── FilterSidebar.vue  manba (ko'p tanlov)/kategoriya/narx/sana filtrlari
│   ├── ResultToolbar.vue  natija soni, saralash, sahifa hajmi
│   ├── TenderList.vue     ro'yxat + skeleton + empty/error holatlar
│   ├── InterestTabs.vue   4 ta tab, sonlar bilan
│   ├── LawsView.vue       qonunlar bo'limi: qidiruv, sana, ro'yxat
│   ├── LawCard.vue        hujjat kartasi, lex.uz va PDF havolalari
│   ├── NumberField.vue    "1 000 000" ko'rinishida raqam kiritish
│   ├── TenderCard.vue     akkordeon karta: belgilash, UPD, muddat, hujjatlar
│   ├── TenderSkeleton.vue shimmer yuklanish holati
│   ├── EmptyState.vue     bo'sh/xato holatlari
│   └── PaginationBar.vue  1 … 4 [5] 6 … 20 ko'rinishida
├── utils/
│   ├── format.js          raqam, narx, sana, muddat, fayl hajmi
│   └── html.js            HTML `detail` ni tozalash
└── assets/styles/
    ├── tokens.css         dizayn tokenlari (light + dark)
    └── main.css           global stillar, tugma/input klasslari
```

## API bilan bog'lanish

Backend: **aggregator** (FastAPI) — Swagger: `http://192.168.1.10:8000/docs`

| Endpoint | Qachon | Parametrlar |
|---|---|---|
| `GET /api/v1/items` | har bir ro'yxat va qidiruv | `q, interest, category, domain, price_min, price_max, date_from, date_to, sort, page, page_size` |
| `GET /api/v1/items/stats` | tab sonlari, filtr o'zgarganda | `domain, category, ending_days` |
| `PATCH /api/v1/items/{id}/interest` | kartadagi belgilash tugmalari | body: `{"interest": "interested" \| "not_interested" \| "new"}` |
| `GET /api/v1/sources` | ilova ochilganda bir marta | — |
| `GET /api/v1/laws` | Qonunlar bo'limi | `q, date_from, date_to, page, page_size` |
| `POST /api/v1/collect` | headerdagi yangilash tugmasi | `source` (ixtiyoriy) |
| `GET /api/v1/collect/status` | yig'ish ketayotganda har 6 s | `limit` |

Muhim: **alohida `/search` endpointi yo'q**. Ro'yxat ham, qidiruv ham `/api/v1/items`
orqali ketadi — `q` berilsa 3 tilda (uz lotin, uz kirill, rus) ma'no bo'yicha qidiradi
va `score` qaytaradi, `q`siz oddiy filtrlanadigan ro'yxat bo'ladi.

`sort` bo'sh bo'lsa umuman yuborilmaydi va API standartini qo'llaydi:
qidiruvda `relevance`, ro'yxatda `newest`.

`domain` bir nechta bo'lishi mumkin — vergul bilan: `xt-xarid.uz,hayotbirja.uz`.

`category` **aynan** mos kelishi kerak va ro'yxati uchun alohida endpoint yo'q,
shuning uchun qiymatlar javoblardan yig'iladi (`useCategories`).

### Tablar va belgilash

4 ta tab `interest` filtriga to'g'ri keladi: `all` / `new` / `interested` / `not_interested`.
Sonlarni front hisoblamaydi — `GET /items/stats` beradi, ya'ni butun baza bo'yicha,
joriy sahifa bo'yicha emas.

Belgilash `PATCH` orqali bazaga yoziladi, shuning uchun sahifa yangilansa ham,
boshqa kompyuterda ochilsa ham holat saqlanib qoladi. Interfeysda optimistik ishlaydi:
avval ekranda o'zgaradi, server rad etsa orqaga qaytariladi. Tugmani qayta bosish
belgini olib tashlaydi (API da bu `new`).

Joriy tab bilan mos kelmay qolgan tender ro'yxatdan darhol chiqib ketadi —
masalan «Yangi» tabida turib tenderni qiziqarli deb belgilasangiz.

### Qonunlar bo'limi

Headerdagi **Tenderlar / Qonunlar** tugmalari bo'limni almashtiradi. Vue Router
qo'shilmadi — ilova bitta ekrandan iborat, shuning uchun oddiy `view` holati yetarli.
Qonunlar ro'yxati birinchi marta ochilgandagina yuklanadi.

`GET /api/v1/laws` doim yangi → eski tartibda qaytaradi, saralash parametri yo'q.
Filtrlar: matn qidiruvi va hujjat sanasi oralig'i. Sidebar bu bo'limda ko'rsatilmaydi.

Karta bosilganda hujjat lex.uz'da yangi tabda ochiladi, o'ng chetdagi tugma esa PDF ni.

**Sana bilan ehtiyot bo'lish kerak:** `published_at` vaqtsiz sana (`2026-09-29`).
`new Date('2026-09-29')` ni brauzer UTD deb o'qiydi va manfiy vaqt zonalarida
sana bir kun orqaga siljiydi. Shuning uchun `formatIsoDate()` satrni to'g'ridan-to'g'ri
qayta tartiblaydi: `29.09.2026`. `first_seen_at` esa to'liq vaqt belgisi, u bilan
`Date` ishlatish xavfsiz — **YANGI** badge o'sha oxirgi 24 soat bo'yicha chiqadi.

### Qo'lda yangilash

Headerdagi tugma `POST /api/v1/collect` ni chaqiradi, keyin `GET /collect/status`
har 6 soniyada so'raladi. `running: false` bo'lgach ro'yxat va sonlar yangilanadi.
Backend `cooldown` qaytarsa tugma `retry_after_seconds` davomida bloklanadi va
qolgan vaqt tugmaning o'zida sanab turadi.

`POST /collect` tenderlar bilan birga qonunlarni ham yig'adi, shuning uchun
yig'ish tugagach qonunlar ro'yxati ham (agar ochilgan bo'lsa) yangilanadi.
Faqat qonunlar kerak bo'lsa: `POST /api/v1/collect?source=lex.uz`.

Ilova ochilganda holat bir marta tekshiriladi — boshqa brauzerda boshlangan
yig'ish ketayotgan bo'lsa, kuzatuvga o'zi ulanadi.

Har bir yangi so'rov oldingisini `AbortController` orqali bekor qiladi — tez yozganda eski javob kelib qolmaydi.

### `extra` maydoni

Javobdagi `extra` barcha saytlarda bir xil tuzilma, sayt bermagan qiymat `null`.
Kartada shular ko'rsatiladi:

| Kalit | Interfeysda |
|---|---|
| `deadline` | rangli badge — «3 kun qoldi» / «Bugun tugaydi» / «Muddati tugagan» |
| `company_name`, `company_tin` | karta ostidagi tashkilot qatori va tafsilotlar |
| `region`, `status`, `code` | chip va tafsilotlar jadvali |
| `goods`, `goods_count`, `lots_count` | «Tovarlar va xizmatlar» bloki |
| `categories` | teglar |
| `files` | yuklab olinadigan hujjatlar ro'yxati (nomi, hajmi, kengaytmasi) |

`was_updated: true` bo'lsa kartada **UPD** belgisi chiqadi — manba saytda tender
o'zgartirilgan degani; o'zgarish vaqti `updated_at` da.

Muddati tugagan tenderlarni API umuman qaytarmaydi (arxiv jadvalga o'tadi),
shuning uchun frontda alohida filtr kerak emas.

`detail` ba'zi saytlarda (`tbcbank.uz`) HTML formatda keladi — `utils/html.js`
oq ro'yxat bo'yicha tozalab, keyin chiqaradi.

Narx UZS, USD yoki EUR da bo'lishi mumkin — shuning uchun narx bo'yicha
umumiy summa ko'rsatilmaydi, ko'rsatkichlar `/items/stats` dan olinadi.

## Xususiyatlar

- Debounce qidiruv (350ms) — har harfda so'rov ketmaydi
- ⌘K / Ctrl+K qidiruvga fokus, Esc chiqish
- Dark mode — tizim sozlamasidan boshlanadi, tanlov saqlanadi
- Skeleton yuklanish, bo'sh va xato holatlari alohida
- Sahifalash — sahifa o'zgarganda yuqoriga silliq scroll
- 900px dan pastda sidebar drawer'ga aylanadi
- `prefers-reduced-motion` hurmat qilinadi

## Qo'shish mumkin bo'lgan narsalar

- **Sevimlilar** — `localStorage` da tender ID lari, alohida composable
- **Vue Router** — `/tender/:id` sahifasi, filtrlar URL da saqlanadi
- **Avtomatik yangilanish** — `setInterval` bilan yangi tenderlarni tekshirish
- **Excel eksport** — SheetJS orqali joriy natijalarni yuklab olish
# tender
