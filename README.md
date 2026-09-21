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
proxy: { '/api': { target: 'http://192.168.1.20:8000', changeOrigin: true } }
```

Manzil o'zgarsa faqat shu qatorni tahrirlang.

Production build uchun `.env` faylida:

```
VITE_API_BASE=http://192.168.1.20:8000
```

## Struktura

```
src/
├── api/
│   ├── client.js          fetch ustidagi qatlam — query builder, AbortSignal, xatolar
│   └── tenders.js         /items, /sources, /health endpointlari
├── composables/
│   ├── useTenders.js      filtrlar, sahifalash, saralash, statistika — asosiy logika
│   ├── useSources.js      manbalar keshi va rang biriktirish
│   ├── useCategories.js   kategoriyalarni javoblardan yig'ish
│   └── useTheme.js        light/dark, localStorage'ga saqlanadi
├── components/
│   ├── AppHeader.vue      logo, live indikator, tema, yangilash
│   ├── StatsBar.vue       4 ta ko'rsatkich kartasi
│   ├── SearchBar.vue      ⌘K fokus, debounce, loading chizig'i
│   ├── FilterSidebar.vue  manba (ko'p tanlov)/kategoriya/narx/sana filtrlari
│   ├── ResultToolbar.vue  natija soni, saralash, sahifa hajmi
│   ├── TenderList.vue     ro'yxat + skeleton + empty/error holatlar
│   ├── TenderCard.vue     akkordeon karta: muddat, tashkilot, tovarlar, hujjatlar
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

Backend: **aggregator** (FastAPI) — Swagger: `http://192.168.1.20:8000/docs`

| Endpoint | Qachon | Parametrlar |
|---|---|---|
| `GET /api/v1/items` | har bir ro'yxat va qidiruv | `q, category, domain, price_min, price_max, date_from, date_to, sort, page, page_size` |
| `GET /api/v1/sources` | ilova ochilganda bir marta | — |

Muhim: **alohida `/search` endpointi yo'q**. Ro'yxat ham, qidiruv ham `/api/v1/items`
orqali ketadi — `q` berilsa 3 tilda (uz lotin, uz kirill, rus) ma'no bo'yicha qidiradi
va `score` qaytaradi, `q`siz oddiy filtrlanadigan ro'yxat bo'ladi.

`sort` bo'sh bo'lsa umuman yuborilmaydi va API standartini qo'llaydi:
qidiruvda `relevance`, ro'yxatda `newest`.

`domain` bir nechta bo'lishi mumkin — vergul bilan: `xt-xarid.uz,hayotbirja.uz`.
Qiymatlarni `/api/v1/sources` beradi.

`category` **aynan** mos kelishi kerak va ro'yxati uchun alohida endpoint yo'q,
shuning uchun qiymatlar javoblardan yig'iladi (`useCategories`).

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

`detail` ba'zi saytlarda (`tbcbank.uz`) HTML formatda keladi — `utils/html.js`
oq ro'yxat bo'yicha tozalab, keyin chiqaradi.

Narx UZS, USD yoki EUR da bo'lishi mumkin, shuning uchun «Umumiy summa»
ko'rsatkichi faqat UZS elementlar bo'yicha hisoblanadi.

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
