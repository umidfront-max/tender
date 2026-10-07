/**
 * Backend sanalarni UTC da beradi. Formatlash brauzer vaqt zonasida emas,
 * aniq Toshkent vaqtida bo'lishi kerak — aks holda chet eldan ochilganda
 * yoki noto'g'ri sozlangan kompyuterda sana siljib ko'rinadi.
 */
const TZ = 'Asia/Tashkent'

const nf = new Intl.NumberFormat('uz-UZ')

/** Sanani Toshkent vaqtida "2026-10-07" ko'rinishiga keltiradi */
const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
})

/** Toshkent kalendaridagi kun raqami — kunlar farqini to'g'ri hisoblash uchun */
function dayIndex(date) {
  const [y, m, d] = dayFmt.format(date).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000
}

/** 1234567 -> "1 234 567" */
export function formatNumber(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return nf.format(Math.round(v))
}

/** 10008376350 -> "10.0 mlrd" */
export function formatCompact(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return null
  if (v >= 1e12) return (v / 1e12).toFixed(2) + ' trln'
  if (v >= 1e9)  return (v / 1e9).toFixed(2)  + ' mlrd'
  if (v >= 1e6)  return (v / 1e6).toFixed(1)  + ' mln'
  if (v >= 1e3)  return (v / 1e3).toFixed(0)  + ' ming'
  return nf.format(Math.round(v))
}

/**
 * Narx + valyuta. Backend to'liq son beradi ("102607054.00"),
 * ajratkichlarni front qo'yadi: "102 607 054 UZS".
 */
export function formatPrice(price, currency = 'UZS') {
  const v = Number(price)
  if (!Number.isFinite(v) || v <= 0) return null
  return `${nf.format(Math.round(v))} ${currency}`
}

/** Qisqa ko'rinish ("1.11 mlrd UZS") — joy tor bo'lgan yerlar uchun */
export function formatPriceCompact(price, currency = 'UZS') {
  const compact = formatCompact(price)
  return compact ? `${compact} ${currency}` : null
}

const dtf = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric'
})

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dtf.format(d)
}

/** "3 soat oldin", "2 kun oldin" */
export function formatRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1)     return 'hozirgina'
  if (diffMin < 60)    return `${diffMin} daqiqa oldin`

  const diffH = Math.round(diffMin / 60)
  if (diffH < 24)      return `${diffH} soat oldin`

  const diffD = Math.round(diffH / 24)
  if (diffD < 30)      return `${diffD} kun oldin`

  const diffMo = Math.round(diffD / 30)
  if (diffMo < 12)     return `${diffMo} oy oldin`

  return `${Math.round(diffMo / 12)} yil oldin`
}

/** Toshkent vaqti bo'yicha bugungi kunmi? */
export function isToday(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return dayIndex(d) === dayIndex(new Date())
}

/** Manba nomidan initsial: "UZEX E-Tender" -> "UE" */
export function initials(name = '') {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const dttf = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: TZ,
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

/** Sana + vaqt — extra.deadline uchun */
export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dttf.format(d)
}

/**
 * extra.deadline — takliflar qabuli tugash muddati.
 * @returns {{text: string, tone: 'over'|'urgent'|'soon'|'open', days: number}|null}
 */
export function deadlineInfo(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  // Kalendar kunlari farqi (Toshkent bo'yicha) — soatlar farqi emas,
  // aks holda "bugun tugaydi" va "ertaga" chegarasi siljib ketadi
  const days = dayIndex(d) - dayIndex(new Date())

  if (days < 0)  return { days, tone: 'over',   text: 'Muddati tugagan' }
  if (days === 0) return { days, tone: 'urgent', text: 'Bugun tugaydi' }
  if (days === 1) return { days, tone: 'urgent', text: 'Ertaga tugaydi' }
  if (days <= 7)  return { days, tone: 'soon',   text: `${days} kun qoldi` }
  return { days, tone: 'open', text: `${days} kun qoldi` }
}

/** extra.files[].size_kb -> "128 KB" / "1.2 MB" */
export function formatFileSize(kb) {
  const v = Number(kb)
  if (!Number.isFinite(v) || v <= 0) return ''
  return v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${Math.round(v)} KB`
}

/** Saytdagi holat (extra.status) — turli saytlarda turlicha yoziladi */
export function statusLabel(status) {
  if (!status) return null
  const key = String(status).toLowerCase()
  if (key === 'active' || key === 'open') return { text: 'Faol', tone: 'ok' }
  if (key === 'closed' || key === 'finished') return { text: 'Yopilgan', tone: 'muted' }
  return { text: String(status), tone: 'muted' }
}

/** Kategoriya nomi — 'general' texnik qiymat, qolganlari saytdagi holicha */
export function categoryLabel(value) {
  if (!value) return ''
  if (value === 'general') return 'Umumiy'
  return value
}

/** score (0..1) -> "3.2%" ko'rinishida moslik bahosi */
export function formatScore(score) {
  const v = Number(score)
  if (!Number.isFinite(v)) return null
  return `${(v * 100).toFixed(1)}%`
}

/**
 * "2026-09-29" -> "29.09.2026"
 *
 * Ataylab `new Date()` ishlatilmaydi: faqat sanadan iborat satrni brauzer UTC
 * deb o'qiydi va mahalliy vaqt zonasida bir kun oldinga/orqaga siljib ketishi mumkin.
 */
export function formatIsoDate(iso) {
  if (!iso) return '—'
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso)
}

/** Oxirgi 24 soat ichidami? (to'liq vaqt belgisi uchun — first_seen_at) */
export function isWithin24h(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff <= 86400000
}

/** extra.buyer_type — buyurtmachi turi */
export function buyerTypeLabel(value) {
  if (value === 'budget') return 'Budjet'
  if (value === 'corporate') return 'Korporativ'
  return null
}
