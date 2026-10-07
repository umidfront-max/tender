<script setup>
import { ref } from 'vue'

/**
 * Submenu: joriy toifadagi manbalar.
 * Guruh (masalan UZEX) bosilganda uning hamma domenlari birga tanlanadi;
 * ichidagi bo'limlarni alohida tanlash uchun chevron bilan ochiladi.
 */
const props = defineProps({
  groups:   { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  loading:  { type: Boolean, default: false }
})

const emit = defineEmits(['toggle'])

/** Qaysi guruhlarning ichki ro'yxati ochilgan */
const expanded = ref(new Set())

function toggleExpand(key) {
  const next = new Set(expanded.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expanded.value = next
}

function state(group) {
  const on = group.domains.filter(d => props.selected.includes(d)).length
  if (!on) return 'off'
  return on === group.domains.length ? 'on' : 'partial'
}
</script>

<template>
  <div class="sub">
    <div v-if="loading" class="sub__row">
      <span v-for="n in 5" :key="n" class="skel" />
    </div>

    <template v-else>
      <div class="sub__row">
        <button
          class="tab"
          :class="{ 'tab--on': !selected.length }"
          @click="emit('toggle', [])"
        >
          <i class="ti ti-layout-grid" />Hammasi
        </button>

        <div v-for="g in groups" :key="g.key" class="grp">
          <button
            class="tab"
            :class="{ 'tab--on': state(g) === 'on', 'tab--part': state(g) === 'partial' }"
            @click="emit('toggle', g.domains)"
          >
            <span class="dot" :style="{ background: g.color }" />
            {{ g.name }}
          </button>

          <button
            v-if="g.children.length"
            class="tab tab--caret"
            :class="{ 'tab--open': expanded.has(g.key) }"
            :aria-expanded="expanded.has(g.key)"
            :title="`${g.name} bo'limlari`"
            @click="toggleExpand(g.key)"
          >
            <i class="ti ti-chevron-down" />
          </button>
        </div>
      </div>

      <!-- Ochilgan guruhlarning ichki bo'limlari -->
      <div v-for="g in groups.filter(x => expanded.has(x.key))" :key="`c-${g.key}`" class="sub__row sub__row--child">
        <span class="sub__label">{{ g.name }}:</span>
        <button
          v-for="c in g.children"
          :key="c.id"
          class="tab tab--sm"
          :class="{ 'tab--on': selected.includes(c.domain) }"
          @click="emit('toggle', [c.domain])"
        >
          {{ c.name }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sub {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px 26px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.sub__row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.sub__row--child { padding-left: 4px; }
.sub__label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .5px;
}

/* Guruh + uning chevroni yonma-yon tursin */
.grp { display: flex; align-items: center; gap: 1px; }

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 29px;
  padding: 0 12px;
  background: var(--surface-sunk);
  border: 1px solid transparent;
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
.tab i { font-size: 14px; }
.tab:hover { color: var(--text); }
.tab:focus-visible { outline: none; box-shadow: var(--ring); }

.tab--on {
  background: var(--accent-bg);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  color: var(--accent-text);
  font-weight: 600;
}
.tab--part {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  color: var(--text);
}

.tab--sm { height: 26px; padding: 0 10px; font-size: 11.5px; }

.tab--caret { padding: 0 7px; }
.tab--caret i { transition: transform var(--dur) var(--ease); }
.tab--open i { transform: rotate(180deg); }

.dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skel {
  width: 92px; height: 29px;
  border-radius: var(--r-full);
  background: linear-gradient(90deg, var(--surface-sunk) 25%, var(--border) 37%, var(--surface-sunk) 63%);
  background-size: 600px 100%;
  animation: shimmer 1.4s linear infinite;
}

@media (max-width: 900px) {
  .sub { padding: 9px 14px; }
  .sub__row { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .sub__row::-webkit-scrollbar { display: none; }
}
</style>
