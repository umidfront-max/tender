<script setup>
import { ref, computed } from 'vue'
import {
  formatPrice, formatNumber, formatDate, formatDateTime, formatRelative,
  formatFileSize, formatScore, initials, isToday,
  deadlineInfo, statusLabel, categoryLabel
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

const price    = computed(() => formatPrice(props.item.price, props.item.currency || 'UZS'))
const fresh    = computed(() => isToday(props.item.first_seen_at))
const relTime  = computed(() => formatRelative(props.item.published_at || props.item.first_seen_at))
const deadline = computed(() => deadlineInfo(extra.value.deadline))
const status   = computed(() => statusLabel(extra.value.status))
const score    = computed(() => formatScore(props.item.score))

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
  extra.value.company_name && { label: 'Buyurtmachi',       value: extra.value.company_name, icon: 'ti-building' },
  extra.value.company_tin  && { label: 'STIR / INN',        value: extra.value.company_tin,  icon: 'ti-id', mono: true },
  extra.value.region       && { label: 'Hudud',             value: extra.value.region,       icon: 'ti-map-pin' },
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
        <span class="card__avatar" :style="{ background: source.color || 'var(--n-400)' }">
          {{ initials(source.name || item.domain || '?') }}
        </span>

        <span class="card__body">
          <span class="card__row">
            <h3 class="card__title">
              <span v-if="updated" class="upd" :title="`Manbada o'zgartirilgan: ${formatDateTime(item.updated_at)}`">UPD</span>
              {{ item.title || 'Nomsiz tender' }}
            </h3>
            <span v-if="price" class="card__price mono">{{ price }}</span>
            <span v-else class="card__price card__price--none">Narx ko'rsatilmagan</span>
          </span>

          <span v-if="extra.company_name" class="card__org">
            <i class="ti ti-building" />{{ extra.company_name }}
          </span>

          <span class="card__meta">
            <span class="chip chip--src">
              <i class="ti ti-building-store" />{{ source.name || item.domain }}
            </span>

            <span v-if="deadline" class="chip" :class="`chip--dl-${deadline.tone}`">
              <i class="ti ti-hourglass" />{{ deadline.text }}
            </span>

            <span v-if="status" class="chip" :class="status.tone === 'ok' ? 'chip--ok' : 'chip--muted'">
              {{ status.text }}
            </span>

            <span v-if="fresh" class="chip chip--new">
              <i class="ti ti-flame" />Yangi
            </span>

            <span v-if="item.category" class="chip chip--cat">{{ categoryLabel(item.category) }}</span>

            <span v-if="score" class="chip chip--score" title="Qidiruv moslik bahosi">
              <i class="ti ti-target-arrow" />{{ score }}
            </span>

            <span class="chip chip--time">
              <i class="ti ti-clock" />{{ relTime }}
            </span>

            <span class="card__id mono">{{ extra.code || `#${item.external_id || item.id}` }}</span>
          </span>
        </span>
      </button>

      <!-- Belgilash: PATCH /items/{id}/interest, bazada saqlanadi -->
      <div class="card__acts">
        <button
          class="mk mk--yes"
          :class="{ 'mk--on': interest === 'interested' }"
          :disabled="busy"
          :title="interest === 'interested' ? 'Belgini olib tashlash' : 'Bizga qiziq deb belgilash'"
          :aria-pressed="interest === 'interested'"
          @click="mark('interested')"
        >
          <i class="ti ti-check" />
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

        <button class="act act--caret" @click="open = !open" :aria-expanded="open" aria-label="Tafsilotlar">
          <i class="ti ti-chevron-down" />
        </button>
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

          <a v-if="item.url" class="btn btn--primary btn--sm" :href="item.url" target="_blank" rel="noopener">
            <i class="ti ti-external-link" /> Manbada ochish
          </a>
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
.card--open { border-color: color-mix(in srgb, var(--src-color) 45%, var(--border)); box-shadow: var(--sh-md); }
.card--busy { opacity: .6; pointer-events: none; }

/* Belgilangan tenderlar ko'zga darhol tashlanadi */
.card--i-interested { border-color: color-mix(in srgb, var(--ok-500) 40%, var(--border)); }
.card--i-not_interested { opacity: .55; }
.card--i-not_interested:hover { opacity: .8; }

.card__head { display: flex; align-items: flex-start; flex-wrap: wrap; }

.card__main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1 1 340px;
  min-width: 0;
  padding: 14px 6px 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}
.card__main:focus-visible { outline: none; box-shadow: inset var(--ring); }

.card__avatar {
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border-radius: var(--r-md);
  color: #fff;
  font-size: 11px; font-weight: 700;
  letter-spacing: -.3px;
  flex-shrink: 0;
  margin-top: 1px;
}

.card__body { flex: 1; min-width: 0; display: block; }

.card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.card__title {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.card__price {
  font-size: 14px; font-weight: 700;
  color: var(--accent-text);
  white-space: nowrap;
  flex-shrink: 0;
}
.card__price--none { font-size: 11.5px; font-weight: 500; color: var(--text-3); }

/* extra.company_name — buyurtmachi tashkilot */
.card__org {
  display: flex; align-items: center; gap: 5px;
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--text-2);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.card__org i { font-size: 13px; color: var(--text-3); flex-shrink: 0; }

.card__meta {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}
.chip--src   { background: var(--surface-sunk); color: var(--text-2); }
.chip--new   { background: var(--warn-bg); color: var(--warn-fg); }
.chip--cat   { background: var(--accent-bg); color: var(--accent-text); }
.chip--ok    { background: var(--ok-bg); color: var(--ok-fg); }
.chip--muted { background: var(--surface-sunk); color: var(--text-3); }
.chip--score { background: color-mix(in srgb, var(--violet-500) 12%, transparent); color: color-mix(in srgb, var(--violet-500) 72%, var(--text)); }
.chip--time  { background: transparent; color: var(--text-3); padding-left: 0; }

/* extra.deadline — muddat qanchalik yaqinligiga qarab rang */
.chip--dl-over   { background: var(--surface-sunk); color: var(--text-3); text-decoration: line-through; }
.chip--dl-urgent { background: var(--err-bg); color: var(--err-fg); font-weight: 600; }
.chip--dl-soon   { background: var(--warn-bg); color: var(--warn-fg); }
.chip--dl-open   { background: var(--ok-bg); color: var(--ok-fg); }

.card__id { font-size: 10.5px; color: var(--text-3); margin-left: auto; }

/* ── Belgilash tugmalari ── */
.card__acts {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 12px 12px 4px;
  flex-shrink: 0;
}

.mk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 11px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-full);
  color: var(--text-2);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.mk i { font-size: 15px; }
.mk:focus-visible { outline: none; box-shadow: var(--ring); }
.mk:disabled { opacity: .4; cursor: default; }

.mk--yes:hover:not(:disabled) {
  color: var(--ok-fg);
  border-color: color-mix(in srgb, var(--ok-500) 45%, transparent);
  background: var(--ok-bg);
}
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

.act {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  color: var(--text-3);
  font-size: 17px;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.act:hover { background: var(--surface-hover); color: var(--text-2); }
.act:focus-visible { outline: none; box-shadow: var(--ring); }
.act:disabled { opacity: .4; cursor: default; }

.act--caret { font-size: 18px; }
.card--open .act--caret { color: var(--accent); }
.card--open .act--caret i { transform: rotate(180deg); }
.act--caret i { transition: transform var(--dur) var(--ease); }

/* ── Ochiluvchi panel ── */
.card__panel { overflow: hidden; }
.expand-enter-active, .expand-leave-active {
  transition: height var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
.expand-enter-from, .expand-leave-to { height: 0 !important; opacity: 0; }

.card__inner {
  padding: 14px 16px 16px 62px;
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

@media (max-width: 620px) {
  .card__row { flex-direction: column; gap: 6px; }
  .card__price { font-size: 13px; }
  .card__inner { padding-left: 16px; }
  .card__id { margin-left: 0; }
  /* Tor ekranda tugmalar karta ostiga to'liq kenglikda tushadi */
  .card__acts {
    width: 100%;
    padding: 0 16px 14px 16px;
  }
  .card__acts .act--caret { margin-left: auto; }
  .mk { flex: 1; justify-content: center; }
}
</style>
