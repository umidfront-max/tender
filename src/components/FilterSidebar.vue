<script setup>
import { ref, computed } from 'vue'
import { BUYER_TYPES, PRICE_UNITS } from '@/composables/useTenders'
import NumberField from './NumberField.vue'

const filters = defineModel('filters', { type: Object, required: true })

const props = defineProps({
  // /api/v1/items dagi `category` aynan mos kelishi kerak, shuning uchun
  // qiymatlar ma'lumotdan yig'iladi (useCategories)
  categories:  { type: Array, default: () => [] },
  // Joriy toifadagi manbalar: Davlat'da saytlar, Banklar'da banklar
  sources:     { type: Array, default: () => [] },
  selected:    { type: Array, default: () => [] },
  sourceLabel: { type: String, default: 'Manba' },
  activeCount: { type: Number, default: 0 },
  open:        { type: Boolean, default: false }
})

const emit = defineEmits(['apply', 'reset', 'close', 'toggle-domain', 'clear-domains'])

/** Ro'yxat uzun bo'lsa (banklar) qidiruv maydoni chiqadi */
const query = ref('')
const searchable = computed(() => props.sources.length > 8)

/**
 * Ro'yxatda faqat sayt nomi ko'rsatiladi: UZEX sub-manbalarining to'liq
 * yo'li ("new-xarid.uzex.uz/mahalliy-auksion") ustunga sig'maydi, qolaversa
 * yo'lning oxiri manba nomida allaqachon bor.
 */
function host(domain) {
  return String(domain || '').split('/')[0]
}

const visibleSources = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.sources
  return props.sources.filter(s =>
    (s.name || '').toLowerCase().includes(q) || (s.domain || '').toLowerCase().includes(q)
  )
})
</script>

<template>
    <Transition name="fade">
      <div v-if="open" class="scrim" @click="emit('close')" />
    </Transition>

    <aside class="side" :class="{ 'side--open': open }">
      <div class="side__head">
        <h2 class="side__title">
          Filtrlar
          <span v-if="activeCount" class="side__count">{{ activeCount }}</span>
        </h2>
        <button class="side__clear" :disabled="!activeCount" @click="emit('reset')">Tozalash</button>
        <button class="side__close btn btn--ghost btn--icon btn--sm" @click="emit('close')" aria-label="Yopish">
          <i class="ti ti-x" />
        </button>
      </div>

      <div class="side__scroll">
        <!-- Manba / Bank — domain filtri -->
        <section class="grp">
          <h3 class="grp__title">
            {{ sourceLabel }}
            <small v-if="sources.length">· {{ sources.length }} ta</small>
          </h3>

          <input
            v-if="searchable"
            v-model="query"
            class="field field--search"
            type="search"
            :placeholder="`${sourceLabel} nomini yozing…`"
          />

          <div class="srcs" :class="{ 'srcs--scroll': sources.length > 8 }">
            <label class="src">
              <input type="checkbox" :checked="!selected.length" @change="emit('clear-domains')" />
              <span class="src__name src__name--all">Hammasi</span>
            </label>

            <label v-for="s in visibleSources" :key="s.domain" class="src" :title="s.domain">
              <input
                type="checkbox"
                :checked="selected.includes(s.domain)"
                @change="emit('toggle-domain', s.domain)"
              />
              <span class="src__name">{{ s.name }}</span>
              <span class="src__dom">{{ host(s.domain) }}</span>
            </label>

            <p v-if="searchable && !visibleSources.length" class="srcs__empty">Topilmadi</p>
          </div>
        </section>

        <!-- Buyurtmachi turi -->
        <section class="grp">
          <h3 class="grp__title">Buyurtmachi</h3>
          <div class="seg">
            <button
              v-for="b in BUYER_TYPES"
              :key="b.value"
              class="seg__btn"
              :class="{ 'seg__btn--on': filters.buyerType === b.value }"
              @click="filters.buyerType = b.value; emit('apply')"
            >{{ b.label }}</button>
          </div>
        </section>

        <!-- Kategoriya -->
        <section class="grp">
          <h3 class="grp__title">Kategoriya</h3>
          <select v-model="filters.category" class="field" @change="emit('apply')">
            <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </section>

        <!-- Narx: son + birlik, API ga to'liq summa ketadi -->
        <section class="grp">
          <h3 class="grp__title">Narx, UZS</h3>
          <div class="price">
            <label class="price__row">
              <span class="price__lbl">dan</span>
              <NumberField v-model="filters.priceMin" placeholder="0" />
              <select v-model="filters.priceMinUnit" class="field field--unit" @change="emit('apply')">
                <option v-for="u in PRICE_UNITS" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
            </label>
            <label class="price__row">
              <span class="price__lbl">gacha</span>
              <NumberField v-model="filters.priceMax" placeholder="chegarasiz" />
              <select v-model="filters.priceMaxUnit" class="field field--unit" @change="emit('apply')">
                <option v-for="u in PRICE_UNITS" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
            </label>
          </div>
          <p class="grp__note">Narx valyutasi manbaga qarab UZS, USD yoki EUR bo'ladi</p>
        </section>

        <!-- Sana -->
        <section class="grp">
          <h3 class="grp__title">E'lon sanasi</h3>
          <div class="dates">
            <input v-model="filters.dateFrom" class="field" type="date" @change="emit('apply')" />
            <span class="dates__sep">—</span>
            <input v-model="filters.dateTo" class="field" type="date" @change="emit('apply')" />
          </div>
        </section>

        <!-- INN / STIR -->
        <section class="grp">
          <h3 class="grp__title">Buyurtmachi STIR</h3>
          <input
            v-model="filters.companyTin"
            class="field"
            type="text"
            inputmode="numeric"
            placeholder="masalan 200836354"
            @keydown.enter="emit('apply')"
            @change="emit('apply')"
          />
          <p class="grp__note">Boshidan mos kelishi yetarli</p>
        </section>
      </div>

      <div class="side__foot">
        <button class="btn btn--primary" style="flex:1" @click="emit('apply')">
          <i class="ti ti-filter" /> Qo'llash
        </button>
      </div>
    </aside>
</template>

<style scoped>
.scrim {
  display: none;
  position: fixed; inset: 0;
  background: rgba(11, 14, 19, .45);
  backdrop-filter: blur(2px);
  z-index: 45;
}

.side {
  position: sticky;
  top: var(--header-h);
  align-self: start;
  height: calc(100vh - var(--header-h));
  width: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.side__head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.side__title {
  flex: 1;
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: var(--text);
}
.side__count {
  min-width: 18px; height: 18px; padding: 0 5px;
  display: grid; place-items: center;
  background: var(--accent); color: var(--on-accent);
  border-radius: var(--r-full);
  font-size: 11px; font-weight: 700;
}
.side__clear {
  background: none; border: none;
  padding: 0;
  color: var(--accent-text);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
}
.side__clear:hover:not(:disabled) { text-decoration: underline; }
.side__clear:disabled { opacity: .45; cursor: default; }
.side__close { display: none; }

.side__scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 16px 18px; }

.grp { margin-bottom: 20px; }
.grp:last-child { margin-bottom: 4px; }
.grp__title {
  font-size: 12px; font-weight: 600;
  color: var(--text);
  margin-bottom: 9px;
}
.grp__title small { font-weight: 500; color: var(--text-3); }
.grp__note { margin-top: 8px; font-size: 10.5px; line-height: 1.5; color: var(--text-3); }

/* ── Manba / bank ro'yxati ── */
.field--search { height: 34px; font-size: 12.5px; margin-bottom: 8px; }

.srcs { display: flex; flex-direction: column; }
.srcs--scroll {
  max-height: 232px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
}
.srcs__empty { padding: 8px 4px; font-size: 11.5px; color: var(--text-3); }

.src {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 6px;
  border-radius: var(--r-xs);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease);
}
.src:hover { background: var(--surface-hover); }
.src input {
  width: 15px; height: 15px;
  flex-shrink: 0;
  accent-color: var(--accent);
  cursor: pointer;
}
.src__name {
  flex: 1 1 auto; min-width: 0;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.src__name--all { font-weight: 600; }
.src__dom {
  flex: 0 1 auto; min-width: 0;
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Segment tanlagich: buyurtmachi turi ── */
.seg {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--surface-sunk);
  border-radius: var(--r-sm);
}
.seg__btn {
  flex: 1;
  padding: 6px 4px;
  background: transparent;
  border: none;
  border-radius: var(--r-xs);
  color: var(--text-2);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.seg__btn:hover { color: var(--text); }
.seg__btn:focus-visible { outline: none; box-shadow: var(--ring); }
.seg__btn--on {
  background: var(--surface);
  color: var(--accent-text);
  font-weight: 600;
  box-shadow: var(--sh-xs);
}

/* ── Narx ── */
.price { display: flex; flex-direction: column; gap: 8px; }
.price__row { display: flex; align-items: center; gap: 8px; }
.price__lbl {
  width: 42px; flex-shrink: 0;
  font-size: 12px; color: var(--text-3);
}
.field--unit { width: 78px; flex-shrink: 0; padding-right: 26px; }

/* ── Sana ── */
.dates { display: flex; align-items: center; gap: 7px; }
.dates__sep { color: var(--text-3); font-size: 12px; }

.side__foot {
  display: flex; gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

@media (max-width: 900px) {
  .scrim { display: block; }
  .side {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    height: 100dvh;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--dur-slow) var(--ease-out);
    box-shadow: var(--sh-lg);
  }
  .side--open { transform: none; }
  .side__close { display: inline-flex; }
}
</style>
