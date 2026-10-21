<script setup>
import { ref, computed } from 'vue'
import {
  formatPrice, formatPriceShort, formatDateNumeric, formatNumber, formatDate, formatDateTime, formatRelative,
  formatFileSize, formatScore, initials, isToday,
  deadlineInfo, statusLabel, categoryLabel, buyerTypeLabel, matchInfo, tenderTypeLabel
} from '@/utils/format'
import { looksLikeHtml, sanitizeHtml, stripHtml } from '@/utils/html'

const props = defineProps({
  item:   { type: Object, required: true },
  source: { type: Object, default: () => ({}) },
  index:  { type: Number, default: 0 },
  busy:   { type: Boolean, default: false }
})

const emit = defineEmits(['interest'])

const open = ref(false)

/** /api/v1/items javobidagi `extra` — barcha manbalarda bir xil tuzilma */
const extra = computed(() => props.item.extra ?? {})

const price    = computed(() => formatPriceShort(props.item.price, props.item.currency || 'UZS'))
const fullPrice = computed(() => formatPrice(props.item.price, props.item.currency || 'UZS'))
const fresh    = computed(() => isToday(props.item.first_seen_at))
const relTime  = computed(() => formatRelative(props.item.published_at || props.item.first_seen_at))
const deadline = computed(() => deadlineInfo(extra.value.deadline))
const status   = computed(() => statusLabel(extra.value.status))
const score    = computed(() => formatScore(props.item.score))
const buyerType = computed(() => buyerTypeLabel(extra.value.buyer_type))

/**
 * Tender turi domen yo'lidan olinadi. UZEX sub-manbalarida manba nomi
 * aynan turning o'zi ("Taklif so'rovi") — u holda ikkinchi marta ko'rsatmaymiz.
 */
const tenderType = computed(() => {
  const t = tenderTypeLabel(props.item.domain)
  return t === (props.source.name || '') ? null : t
})

/**
 * AI moslik. match_score null bo'lsa — hali baholanmagan: skoring fonda
 * ishlaydi, yangi tenderlarda bir necha daqiqa null turishi normal.
 */
const match   = computed(() => matchInfo(props.item.match_score))
/** Halqa uzunligi: 2πr, r = 22 */
const RING_LEN = 2 * Math.PI * 22

const scoring = computed(() => props.item.match_score === null || props.item.match_score === undefined)

/** Xodim belgisi: new | interested | not_interested */
const interest = computed(() => props.item.interest ?? 'new')

/** was_updated — manba saytda tender o'zgartirilgan */
const updated = computed(() => props.item.was_updated === true)

const goods      = computed(() => extra.value.goods ?? [])
const categories = computed(() => extra.value.categories ?? [])
const files      = computed(() => extra.value.files ?? [])

/** tbcbank.uz `detail` ni HTML formatda yuboradi — tozalab chiqaramiz */
const detailIsHtml = computed(() => looksLikeHtml(props.item.detail))
const detailHtml   = computed(() => sanitizeHtml(props.item.detail))
const detailText   = computed(() => stripHtml(props.item.detail))

/** Sayt bermagan qiymatlar null keladi — ularni umuman ko'rsatmaymiz */
const facts = computed(() => [
  props.item.match_service && { label: 'Mos xizmat',      value: props.item.match_service, icon: 'ti-sparkles' },
  extra.value.company_name && { label: 'Buyurtmachi',       value: extra.value.company_name, icon: 'ti-building' },
  extra.value.company_tin  && { label: 'STIR / INN',        value: extra.value.company_tin,  icon: 'ti-id', mono: true },
  extra.value.region       && { label: 'Hudud',             value: extra.value.region,       icon: 'ti-map-pin' },
  buyerType.value          && { label: 'Buyurtmachi turi',  value: buyerType.value,          icon: 'ti-wallet' },
  extra.value.deadline     && { label: 'Takliflar muddati', value: formatDateTime(extra.value.deadline), icon: 'ti-hourglass' },
  { label: 'E\'lon sanasi', value: formatDate(props.item.published_at), icon: 'ti-calendar-event' },
  updated.value            && { label: 'O\'zgartirilgan',   value: formatDateTime(props.item.updated_at), icon: 'ti-pencil' },
  extra.value.code         && { label: 'Saytdagi kod',   value: extra.value.code, icon: 'ti-hash', mono: true },
  extra.value.lots_count   && { label: 'Lotlar soni',    value: formatNumber(extra.value.lots_count),  icon: 'ti-stack-2' },
  extra.value.goods_count  && { label: 'Tovarlar soni',  value: formatNumber(extra.value.goods_count), icon: 'ti-package' },
  { label: 'Platforma',        value: props.source.name || props.item.domain, icon: 'ti-world' },
  { label: 'Oxirgi ko\'rilgan', value: formatDate(props.item.last_seen_at),   icon: 'ti-refresh' }
].filter(Boolean))

/** Tugmani qayta bosish belgini olib tashlaydi (API da bu `new`) */
function mark(value) {
  emit('interest', props.item, interest.value === value ? 'new' : value)
}
</script>

<template>
  <article
    class="card"
    :class="[`card--i-${interest}`, { 'card--open': open, 'card--busy': busy }]"
    :style="{ animationDelay: `${Math.min(index, 10) * 35}ms`, '--src-color': source.color || 'var(--n-400)' }"
  >
    <div class="card__head">
      <button class="card__main" @click="open = !open" :aria-expanded="open">
        <!-- AI moslik halqasi; null = hali baholanmagan -->
        <span
          class="ring"
          :class="match ? `ring--${match.tone}` : 'ring--none'"
          :title="item.match_service ? `Eng mos xizmat: ${item.match_service}` : 'AI moslik bahosi'"
        >
          <svg class="ring__svg" viewBox="0 0 52 52" aria-hidden="true">
            <circle class="ring__track" cx="26" cy="26" r="22" />
            <circle
              v-if="match"
              class="ring__bar"
              cx="26" cy="26" r="22"
              :stroke-dasharray="RING_LEN"
              :stroke-dashoffset="RING_LEN * (1 - Math.min(match.value, 100) / 100)"
            />
          </svg>
          <span class="ring__val mono">{{ match ? match.text : '–' }}</span>
          <span class="ring__label">{{ match ? 'AI moslik' : (scoring ? 'AI tahlil qilmoqda' : 'AI moslik') }}</span>
        </span>

        <span class="card__body">
          <span class="card__row">
            <h3 class="card__title">
              <span v-if="updated" class="upd" :title="`Manbada o'zgartirilgan: ${formatDateTime(item.updated_at)}`">UPD</span>
              {{ item.title || 'Nomsiz tender' }}
            </h3>
            <span v-if="fresh" class="badge-new">Yangi</span>
          </span>

          <span v-if="extra.company_name" class="card__org">[{{ extra.company_name }}]</span>

          <span class="card__meta">
            <span class="chip chip--src">{{ source.name || item.domain }}</span>
            <span v-if="tenderType" class="chip chip--tag">{{ tenderType }}</span>
            <span v-if="item.category" class="chip chip--tag">{{ categoryLabel(item.category) }}</span>
            <span v-if="status" class="chip chip--tag">{{ status.text }}</span>
            <span v-if="buyerType" class="chip chip--tag">{{ buyerType }}</span>
            <span v-if="score" class="chip chip--score" title="Qidiruv moslik bahosi">
              <i class="ti ti-target-arrow" />{{ score }}
            </span>
            <span class="chip chip--time">{{ relTime }}</span>
          </span>

          <!-- Uzun izoh kartani cho'zib yubormasin — to'lig'i ochilganda ko'rinadi -->
          <span v-if="item.ai_comment" class="card__ai">
            <i class="ti ti-sparkles" /><b>AI:</b> {{ item.ai_comment }}
          </span>
        </span>
      </button>

      <!-- Narx, muddat va belgilash: PATCH /items/{id}/interest -->
      <div class="card__side">
        <span v-if="price" class="card__price mono" :title="fullPrice">{{ price }}</span>
        <span v-else class="card__price card__price--none">Narx ko'rsatilmagan</span>

        <span v-if="deadline" class="dl" :class="`dl--${deadline.tone}`">
          {{ deadline.text }} · {{ formatDateNumeric(extra.deadline) }}
        </span>

        <div class="card__acts">
          <button
            class="mk mk--yes"
            :class="{ 'mk--on': interest === 'interested' }"
            :disabled="busy"
            :title="interest === 'interested' ? 'Belgini olib tashlash' : 'Bizga qiziq deb belgilash'"
            :aria-pressed="interest === 'interested'"
            @click="mark('interested')"
          >
            <i class="ti" :class="interest === 'interested' ? 'ti-star-filled' : 'ti-star'" />
            <span>Bizga qiziq</span>
          </button>

          <button
            class="mk mk--no"
            :class="{ 'mk--on': interest === 'not_interested' }"
            :disabled="busy"
            :title="interest === 'not_interested' ? 'Belgini olib tashlash' : 'Qiziq emas deb belgilash'"
            :aria-pressed="interest === 'not_interested'"
            @click="mark('not_interested')"
          >
            <i class="ti ti-x" />
            <span>Qiziq emas</span>
          </button>
        </div>

        <a v-if="item.url" class="card__link" :href="item.url" target="_blank" rel="noopener noreferrer">
          Saytda ochish <i class="ti ti-arrow-up-right" />
        </a>

        <span class="card__id mono">№ {{ extra.code || item.external_id || item.id }}</span>
      </div>
    </div>

    <Transition name="expand" @enter="e => e.style.height = e.scrollHeight + 'px'" @leave="e => e.style.height = '0px'">
      <div v-show="open" class="card__panel">
        <div class="card__inner">
          <dl class="facts">
            <div v-for="d in facts" :key="d.label" class="fact">
              <dt><i class="ti" :class="d.icon" />{{ d.label }}</dt>
              <dd :class="{ mono: d.mono }">{{ d.value }}</dd>
            </div>
          </dl>

          <!-- Kartada izoh ikki qatorga kesiladi, bu yerda to'liq ko'rinadi -->
          <section v-if="item.ai_comment" class="blk">
            <h4 class="blk__title"><i class="ti ti-sparkles" />AI izohi</h4>
            <p class="ai__text">{{ item.ai_comment }}</p>
          </section>

          <!-- extra.goods — tender ichidagi tovarlar/xizmatlar -->
          <section v-if="goods.length" class="blk">
            <h4 class="blk__title">
              <i class="ti ti-package" />Tovarlar va xizmatlar
              <span class="blk__count">{{ goods.length }}</span>
            </h4>
            <ul class="goods">
              <li v-for="(g, i) in goods" :key="i">{{ typeof g === 'string' ? g : (g.name ?? g.title ?? '—') }}</li>
            </ul>
          </section>

          <!-- extra.categories — manbadagi kategoriyalar -->
          <section v-if="categories.length" class="blk">
            <h4 class="blk__title"><i class="ti ti-category" />Kategoriyalar</h4>
            <div class="tags">
              <span v-for="(c, i) in categories" :key="i" class="chip chip--cat">{{ c }}</span>
            </div>
          </section>

          <!-- extra.files — ilova hujjatlar -->
          <section v-if="files.length" class="blk">
            <h4 class="blk__title">
              <i class="ti ti-paperclip" />Ilova hujjatlar
              <span class="blk__count">{{ files.length }}</span>
            </h4>
            <ul class="files">
              <li v-for="(f, i) in files" :key="i">
                <a :href="f.url" target="_blank" rel="noopener noreferrer" class="file">
                  <span class="file__ext">{{ (f.ext || '').replace('.', '') || 'file' }}</span>
                  <span class="file__name">{{ f.name || f.file_name || 'Hujjat' }}</span>
                  <span v-if="f.size_kb" class="file__size mono">{{ formatFileSize(f.size_kb) }}</span>
                  <i class="ti ti-download" />
                </a>
              </li>
            </ul>
          </section>

          <!-- detail — ba'zi saytlarda HTML, tozalangan holda chiqariladi -->
          <div v-if="item.detail" class="desc">
            <div v-if="detailIsHtml" class="desc__rich" v-html="detailHtml" />
            <p v-else>{{ detailText }}</p>
          </div>

        </div>
      </div>
    </Transition>
  </article>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  animation: fade-up .4s var(--ease-out) both;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
.card:hover { border-color: var(--border-strong); box-shadow: var(--sh-sm); }
.card--open { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); box-shadow: var(--sh-md); }
.card--busy { opacity: .6; pointer-events: none; }

/* Belgilangan tenderlar ko'zga darhol tashlanadi */
.card--i-interested { border-color: color-mix(in srgb, var(--ok-500) 40%, var(--border)); }
.card--i-not_interested { opacity: .55; }
.card--i-not_interested:hover { opacity: .8; }

.card__head { display: flex; align-items: stretch; }

.card__main {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  flex: 1;
  min-width: 0;
  padding: 18px 8px 18px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.card__main:focus-visible { outline: none; box-shadow: inset var(--ring); }

/* ── AI moslik halqasi ── */
.ring {
  --ring-c: var(--n-300);
  --ring-fg: var(--text-3);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  flex-shrink: 0;
}
.ring--high { --ring-c: var(--ok-500);   --ring-fg: var(--ok-fg); }
.ring--mid  { --ring-c: var(--warn-500); --ring-fg: var(--warn-fg); }
.ring--low  { --ring-c: var(--n-400);    --ring-fg: var(--text-2); }

.ring__svg { width: 56px; height: 56px; transform: rotate(-90deg); }
.ring__track { fill: none; stroke: var(--border-strong); stroke-width: 4; }
.ring--high .ring__track { stroke: color-mix(in srgb, var(--ok-500) 14%, transparent); }
.ring--mid  .ring__track { stroke: color-mix(in srgb, var(--warn-500) 14%, transparent); }
.ring__bar {
  fill: none;
  stroke: var(--ring-c);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset .6s var(--ease-out);
}
.ring__val {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 56px;
  display: grid; place-items: center;
  font-size: 13px; font-weight: 700;
  color: var(--ring-fg);
}
.ring__label {
  margin-top: 4px;
  font-size: 10.5px;
  line-height: 1.3;
  color: var(--text-3);
  text-align: center;
}

.card__body { flex: 1; min-width: 0; display: block; }

.card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.card__title {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge-new {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 2px 7px;
  border-radius: var(--r-xs);
  background: var(--warn-bg);
  color: var(--warn-fg);
  font-size: 10.5px;
  font-weight: 600;
}

/* was_updated — manba saytda o'zgartirilgan */
.upd {
  display: inline-block;
  vertical-align: 1px;
  margin-right: 5px;
  padding: 1px 5px;
  border-radius: var(--r-xs);
  background: var(--warn-bg);
  color: var(--warn-fg);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .3px;
}

/* extra.company_name — buyurtmachi tashkilot */
.card__org {
  display: block;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--text-2);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.card__meta {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
/* Kategoriya nomlari juda uzun bo'lishi mumkin — chip qatordan toshib,
   o'ngdagi tugmalar ostiga tushib ketmasligi uchun kesiladi */
.card__meta .chip {
  border-radius: var(--r-xs);
  max-width: 100%;
  display: inline-block;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card__meta .chip i { vertical-align: -2px; margin-right: 4px; }
.chip--cat { max-width: 320px; }
.chip--src   { background: var(--accent-bg); color: var(--accent-text); }
.chip--tag   { background: var(--surface-sunk); color: var(--text-2); }
.chip--cat   { background: var(--accent-bg); color: var(--accent-text); }
.chip--score { background: color-mix(in srgb, var(--violet-500) 12%, transparent); color: color-mix(in srgb, var(--violet-500) 72%, var(--text)); }
.chip--time  { background: transparent; color: var(--text-3); padding-left: 2px; }

/* AI izohi */
.card__ai {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 12px;
  padding: 9px 14px;
  background: color-mix(in srgb, var(--violet-500) 7%, transparent);
  border-radius: var(--r-sm);
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--text);
}
.card__ai i { font-size: 14px; color: var(--violet-500); margin-right: 6px; vertical-align: -2px; }
.card__ai b { font-weight: 700; color: color-mix(in srgb, var(--violet-500) 72%, var(--text)); }

/* ── O'ng ustun: narx, muddat, tugmalar ── */
.card__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding: 18px 20px 16px 12px;
  flex-shrink: 0;
}

.card__price {
  font-size: 18px; font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
}
.card__price--none { font-family: var(--font); font-size: 12px; font-weight: 500; color: var(--text-3); }

/* extra.deadline — muddat qanchalik yaqinligiga qarab rang */
.dl {
  padding: 3px 8px;
  border-radius: var(--r-xs);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}
.dl--over   { background: var(--surface-sunk); color: var(--text-3); text-decoration: line-through; }
.dl--urgent { background: var(--err-bg);  color: var(--err-fg); }
.dl--soon   { background: var(--warn-bg); color: var(--warn-fg); }
.dl--open   { background: var(--ok-bg);   color: var(--ok-fg); }

.card__acts { display: flex; gap: 6px; margin-top: 8px; }

.mk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 12px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  color: var(--text-2);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.mk i { font-size: 14px; }
.mk:focus-visible { outline: none; box-shadow: var(--ring); }
.mk:disabled { opacity: .4; cursor: default; }

.mk--yes { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.mk--yes:hover:not(:disabled) { background: var(--accent-bg); }
.mk--yes.mk--on {
  color: var(--ok-fg);
  background: var(--ok-bg);
  border-color: color-mix(in srgb, var(--ok-500) 45%, transparent);
  font-weight: 600;
}

.mk--no:hover:not(:disabled) {
  color: var(--err-fg);
  border-color: color-mix(in srgb, var(--err-500) 45%, transparent);
  background: var(--err-bg);
}
.mk--no.mk--on {
  color: var(--err-fg);
  background: var(--err-bg);
  border-color: color-mix(in srgb, var(--err-500) 45%, transparent);
  font-weight: 600;
}

.card__link {
  display: inline-flex; align-items: center; gap: 3px;
  margin-top: 6px;
  font-size: 12.5px; font-weight: 500;
  color: var(--accent-text);
  text-decoration: none;
}
.card__link:hover { text-decoration: underline; }
.card__link i { font-size: 13px; }

.card__id { font-size: 10.5px; color: var(--text-3); }

/* ── Ochiluvchi panel ── */
.card__panel { overflow: hidden; }
.expand-enter-active, .expand-leave-active {
  transition: height var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
.expand-enter-from, .expand-leave-to { height: 0 !important; opacity: 0; }

.card__inner {
  /* Halqa ustuni (20 + 64 + 18) bilan tekislanadi */
  padding: 14px 20px 16px 102px;
  border-top: 1px solid var(--border);
  margin-top: 2px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px 18px;
  margin-bottom: 16px;
}
.fact dt {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase; letter-spacing: .5px;
  margin-bottom: 3px;
}
.fact dt i { font-size: 12px; }
.fact dd { font-size: 12.5px; color: var(--text); word-break: break-word; line-height: 1.5; }

/* ── Bloklar: tovarlar, kategoriyalar, hujjatlar ── */
.blk { margin-bottom: 16px; }
.blk__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase; letter-spacing: .5px;
  margin-bottom: 8px;
}
.blk__title i { font-size: 13px; }
.blk__count {
  min-width: 16px; height: 16px; padding: 0 5px;
  display: grid; place-items: center;
  background: var(--surface-sunk); color: var(--text-2);
  border-radius: var(--r-full);
  font-size: 10px; letter-spacing: 0;
}

.goods {
  list-style: none;
  display: flex; flex-direction: column; gap: 5px;
  max-height: 180px; overflow-y: auto;
}
.goods li {
  position: relative;
  padding: 6px 10px 6px 22px;
  background: var(--surface-sunk);
  border-radius: var(--r-xs);
  font-size: 12px; line-height: 1.5;
  color: var(--text-2);
}
.goods li::before {
  content: '';
  position: absolute;
  left: 10px; top: 12px;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--src-color);
}

.tags { display: flex; flex-wrap: wrap; gap: 5px; }

.ai__text {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-2);
  background: var(--surface-sunk);
  border-radius: var(--r-sm);
  padding: 10px 12px;
}

.files { list-style: none; display: flex; flex-direction: column; gap: 5px; }
.file {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px;
  background: var(--surface-sunk);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  text-decoration: none;
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}
.file:hover { border-color: var(--accent); background: var(--accent-bg); }
.file__ext {
  min-width: 34px; padding: 2px 5px;
  display: grid; place-items: center;
  background: var(--surface);
  border-radius: var(--r-xs);
  font-family: var(--font-mono);
  font-size: 9.5px; font-weight: 700;
  color: var(--text-2);
  text-transform: uppercase;
  flex-shrink: 0;
}
.file__name {
  flex: 1; min-width: 0;
  font-size: 12px; color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.file__size { font-size: 10.5px; color: var(--text-3); flex-shrink: 0; }
.file i { font-size: 15px; color: var(--text-3); flex-shrink: 0; }
.file:hover i { color: var(--accent); }

/* ── Tavsif ── */
.desc {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-2);
  background: var(--surface-sunk);
  border-radius: var(--r-sm);
  padding: 11px 13px;
  margin-bottom: 14px;
  max-height: 220px;
  overflow-y: auto;
}
.desc__rich :deep(p) { margin-bottom: 8px; }
.desc__rich :deep(p:last-child) { margin-bottom: 0; }
.desc__rich :deep(strong), .desc__rich :deep(b) { color: var(--text); font-weight: 600; }
.desc__rich :deep(ul), .desc__rich :deep(ol) { padding-left: 18px; margin-bottom: 8px; }
.desc__rich :deep(a) { color: var(--accent-text); }
.desc__rich :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
.desc__rich :deep(td), .desc__rich :deep(th) {
  border: 1px solid var(--border);
  padding: 5px 7px;
  text-align: left;
}

@media (max-width: 760px) {
  .card__head { flex-direction: column; }
  .card__main { padding: 16px 16px 10px; gap: 12px; }
  .ring { width: 52px; }
  .ring__svg { width: 46px; height: 46px; }
  .ring__val { height: 46px; font-size: 11.5px; }
  .card__side {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    padding: 0 16px 14px;
  }
  .card__acts { width: 100%; margin-top: 2px; }
  .mk { flex: 1; justify-content: center; }
  .card__link { margin-top: 0; }
  .card__id { margin-left: auto; }
  .card__inner { padding-left: 16px; }
}
</style>
