<script setup>
import { BUYER_TYPES } from '@/composables/useTenders'
import NumberField from './NumberField.vue'

const filters = defineModel('filters', { type: Object, required: true })

defineProps({
  // /api/v1/items dagi `category` aynan mos kelishi kerak, shuning uchun
  // qiymatlar ma'lumotdan yig'iladi (useCategories)
  categories:  { type: Array, default: () => [] },
  activeCount: { type: Number, default: 0 },
  open:        { type: Boolean, default: false }
})

const emit = defineEmits(['apply', 'reset', 'close'])
</script>

<template>
    <Transition name="fade">
      <div v-if="open" class="scrim" @click="emit('close')" />
    </Transition>

    <aside class="side" :class="{ 'side--open': open }">
      <div class="side__head">
        <h2 class="side__title">
          <i class="ti ti-adjustments-horizontal" />
          Filtrlar
          <span v-if="activeCount" class="side__count">{{ activeCount }}</span>
        </h2>
        <button class="side__close btn btn--ghost btn--icon btn--sm" @click="emit('close')" aria-label="Yopish">
          <i class="ti ti-x" />
        </button>
      </div>

      <div class="side__scroll">
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

        <!-- Narx -->
        <section class="grp">
          <h3 class="grp__title">Narx oralig'i</h3>
          <div class="pair">
            <NumberField v-model="filters.priceMin" placeholder="dan" />
            <span class="pair__sep">—</span>
            <NumberField v-model="filters.priceMax" placeholder="gacha" />
          </div>
          <p class="grp__note">Narx valyutasi manbaga qarab UZS, USD yoki EUR bo'ladi</p>
        </section>

        <!-- Sana -->
        <section class="grp">
          <h3 class="grp__title">E'lon sanasi</h3>
          <div class="dates">
            <label class="dates__row">
              <span>dan</span>
              <input v-model="filters.dateFrom" class="field" type="date" />
            </label>
            <label class="dates__row">
              <span>gacha</span>
              <input v-model="filters.dateTo" class="field" type="date" />
            </label>
          </div>
        </section>
      </div>

      <div class="side__foot">
        <button class="btn btn--primary" style="flex:1" @click="emit('apply')">
          <i class="ti ti-filter" /> Qo'llash
        </button>
        <button class="btn btn--ghost btn--icon" :disabled="!activeCount" @click="emit('reset')" aria-label="Tozalash">
          <i class="ti ti-filter-off" />
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
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.side__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--text);
}
.side__title i { font-size: 16px; color: var(--text-3); }
.side__count {
  min-width: 18px; height: 18px; padding: 0 5px;
  display: grid; place-items: center;
  background: var(--accent); color: var(--on-accent);
  border-radius: var(--r-full);
  font-size: 11px; font-weight: 700;
}
.side__close { display: none; }

.side__scroll { flex: 1; overflow-y: auto; padding: 16px 18px; }

.grp { margin-bottom: 22px; }
.grp:last-child { margin-bottom: 4px; }
.grp__title {
  font-size: 10.5px; font-weight: 700;
  color: var(--text-3);
  text-transform: uppercase; letter-spacing: .6px;
  margin-bottom: 9px;
}
.grp__title small { font-weight: 500; text-transform: none; letter-spacing: 0; opacity: .8; }
.grp__note { margin-top: 8px; font-size: 10.5px; line-height: 1.5; color: var(--text-3); }

/* ── Segment tanlagich: toifa, buyurtmachi turi ── */
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
.pair { display: flex; align-items: center; gap: 7px; }
.pair__sep { color: var(--text-3); font-size: 12px; }

/* ── Sana ── */
.dates { display: flex; flex-direction: column; gap: 8px; }
.dates__row { display: flex; align-items: center; gap: 10px; }
.dates__row span {
  width: 40px; flex-shrink: 0;
  font-size: 11.5px; color: var(--text-3);
}

.side__foot {
  display: flex; gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.side__foot .btn:disabled { opacity: .4; cursor: default; }

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
