<script setup>
import { computed } from 'vue'
import { formatIsoDate, isWithin24h } from '@/utils/format'

const props = defineProps({
  law:   { type: Object, required: true },
  index: { type: Number, default: 0 }
})

/** Hujjat sanasi — satr sifatida, timezone siljishisiz */
const dateText = computed(() => formatIsoDate(props.law.published_at))

/** Sana belgisi uchun kun va oy/yil alohida */
const dateParts = computed(() => {
  const m = String(props.law.published_at ?? '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? { day: m[3], rest: `${m[2]}.${m[1]}` } : null
})

/**
 * YANGI badge — serverning `is_new` maydoni bo'yicha (24 soatda o'zi o'chadi).
 * Eski javoblarda bu maydon bo'lmasligi mumkin, shunda first_seen_at ga qaytamiz.
 */
const isNew = computed(() =>
  typeof props.law.is_new === 'boolean'
    ? props.law.is_new
    : isWithin24h(props.law.first_seen_at)
)
</script>

<template>
  <article class="law" :style="{ animationDelay: `${Math.min(index, 10) * 35}ms` }">
    <!-- Kartaning o'zi lex.uz sahifasini yangi tabda ochadi -->
    <a
      class="law__main"
      :href="law.url || '#'"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span class="law__date" :class="{ 'law__date--new': isNew }">
        <template v-if="dateParts">
          <span class="law__day">{{ dateParts.day }}</span>
          <span class="law__rest mono">{{ dateParts.rest }}</span>
        </template>
        <i v-else class="ti ti-calendar-off" />
      </span>

      <span class="law__body">
        <span class="law__top">
          <span v-if="isNew" class="law__badge">YANGI</span>
          <h3 class="law__title">{{ law.title || 'Nomsiz hujjat' }}</h3>
        </span>

        <!-- authority — organ + hujjat turi + sana + raqam, lex.uz'dagi to'liq matn -->
        <p v-if="law.authority" class="law__authority">{{ law.authority }}</p>

        <span class="law__meta">
          <span v-if="law.doc_number" class="chip chip--doc mono">
            <i class="ti ti-hash" />{{ law.doc_number }}
          </span>
          <span class="chip chip--date">
            <i class="ti ti-calendar-event" />{{ dateText }}
          </span>
          <span class="law__src">lex.uz <i class="ti ti-external-link" /></span>
        </span>
      </span>
    </a>

    <a
      v-if="law.pdf_url"
      class="law__pdf"
      :href="law.pdf_url"
      target="_blank"
      rel="noopener noreferrer"
      title="PDF ko'rinishda ochish"
    >
      <i class="ti ti-file-type-pdf" />
      <span>PDF</span>
    </a>
  </article>
</template>

<style scoped>
.law {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  animation: fade-up .4s var(--ease-out) both;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.law:hover { border-color: var(--border-strong); box-shadow: var(--sh-sm); }

.law__main {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  flex: 1;
  min-width: 0;
  padding: 14px 10px 14px 14px;
  text-decoration: none;
  color: inherit;
}
.law__main:focus-visible { outline: none; box-shadow: inset var(--ring); }

/* ── Sana belgisi ── */
.law__date {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 7px 4px;
  background: var(--surface-sunk);
  border-radius: var(--r-md);
  color: var(--text-2);
}
.law__date--new { background: var(--accent-bg); color: var(--accent-text); }
.law__day  { font-size: 17px; font-weight: 700; line-height: 1.1; letter-spacing: -.4px; }
.law__rest { font-size: 9.5px; opacity: .75; }

.law__body { flex: 1; min-width: 0; display: block; }

.law__top { display: block; }
.law__badge {
  display: inline-block;
  vertical-align: 2px;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: var(--r-xs);
  background: var(--ok-bg);
  color: var(--ok-fg);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .4px;
}
.law__title {
  display: inline;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.55;
  color: var(--text);
}
.law__main:hover .law__title { color: var(--accent-text); }

/* authority — subtitle */
.law__authority {
  margin-top: 5px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.law__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
}
.chip--doc  { background: var(--accent-bg); color: var(--accent-text); font-size: 10.5px; }
.chip--date { background: var(--surface-sunk); color: var(--text-2); }
.law__src {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 10.5px;
  color: var(--text-3);
}
.law__src i { font-size: 12px; }

/* ── PDF tugmasi ── */
.law__pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 62px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  text-decoration: none;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .3px;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.law__pdf i { font-size: 19px; }
.law__pdf:hover { background: var(--err-bg); color: var(--err-fg); }
.law__pdf:focus-visible { outline: none; box-shadow: inset var(--ring); }

@media (max-width: 620px) {
  .law__date { width: 44px; }
  .law__day { font-size: 15px; }
  .law__pdf { width: 52px; }
  .law__src { margin-left: 0; }
}
</style>
