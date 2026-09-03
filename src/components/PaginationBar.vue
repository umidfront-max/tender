<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  page:      { type: Number, required: true },
  totalPages:{ type: Number, required: true },
  total:     { type: Number, default: 0 },
  pageSize:  { type: Number, default: 12 }
})
const emit = defineEmits(['go'])

/** 1 … 4 5 [6] 7 8 … 20 ko'rinishida sahifa raqamlari */
const pages = computed(() => {
  const { page: p, totalPages: t } = props
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)

  const out = [1]
  const start = Math.max(2, p - 1)
  const end   = Math.min(t - 1, p + 1)

  if (start > 2) out.push('…')
  for (let i = start; i <= end; i++) out.push(i)
  if (end < t - 1) out.push('…')
  out.push(t)
  return out
})

const from = computed(() => (props.page - 1) * props.pageSize + 1)
const to   = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <nav v-if="totalPages > 1" class="pg" aria-label="Sahifalar">
    <p class="pg__info">
      <strong class="mono">{{ formatNumber(from) }}–{{ formatNumber(to) }}</strong>
      / {{ formatNumber(total) }} ta
    </p>

    <div class="pg__nums">
      <button class="pg__btn" :disabled="page <= 1" @click="emit('go', page - 1)" aria-label="Oldingi">
        <i class="ti ti-chevron-left" />
      </button>

      <template v-for="(p, i) in pages" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="pg__gap">…</span>
        <button
          v-else
          class="pg__btn"
          :class="{ 'pg__btn--on': p === page }"
          :aria-current="p === page ? 'page' : undefined"
          @click="emit('go', p)"
        >{{ p }}</button>
      </template>

      <button class="pg__btn" :disabled="page >= totalPages" @click="emit('go', page + 1)" aria-label="Keyingi">
        <i class="ti ti-chevron-right" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pg {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.pg__info { font-size: 12.5px; color: var(--text-3); }
.pg__info strong { color: var(--text-2); font-weight: 600; }

.pg__nums { display: flex; align-items: center; gap: 4px; }

.pg__btn {
  min-width: 34px; height: 34px;
  padding: 0 9px;
  display: grid; place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  font-size: 13px; font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease),
              color var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.pg__btn:hover:not(:disabled):not(.pg__btn--on) {
  background: var(--surface-hover);
  border-color: var(--border);
  color: var(--text);
}
.pg__btn--on {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
  box-shadow: var(--sh-xs);
}
.pg__btn:disabled { opacity: .32; cursor: default; }
.pg__btn:focus-visible { outline: none; box-shadow: var(--ring); }

.pg__gap { padding: 0 4px; color: var(--text-3); font-size: 13px; }

@media (max-width: 620px) {
  .pg { justify-content: center; }
  .pg__info { width: 100%; text-align: center; }
}
</style>
