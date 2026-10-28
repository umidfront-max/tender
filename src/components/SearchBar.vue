<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const model = defineModel({ type: String, default: '' })
defineProps({
  loading:     { type: Boolean, default: false },
  // Faqat raqam kiritilsa backend uni STIR/tender kodi deb aniq qidiradi
  placeholder: { type: String, default: "Tender nomi, tashkilot, STIR yoki kalit so'z…" },
  label:       { type: String, default: 'Tenderlarni qidirish' },
  // Qonunlar bo'limida AI qidiruvi yo'q — tugma faqat tenderlarda chiqadi
  ai:          { type: Boolean, default: false },
  // Hozir ko'rinayotgan natijalar AI qidiruvidanmi
  aiActive:    { type: Boolean, default: false }
})
const emit = defineEmits(['search', 'input-debounced', 'ai-search'])

const inputEl = ref(null)

function onInput() { emit('input-debounced') }
function clear() {
  model.value = ''
  emit('search')
  inputEl.value?.focus()
}

/** ⌘K / Ctrl+K — qidiruvga fokus */
function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
    inputEl.value?.select()
  }
  if (e.key === 'Escape' && document.activeElement === inputEl.value) {
    inputEl.value.blur()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="search" :class="{ 'is-busy': loading }">
    <i class="ti ti-search search__icon" aria-hidden="true" />

    <input
      ref="inputEl"
      v-model="model"
      class="search__input"
      type="search"
      :placeholder="placeholder"
      :aria-label="label"
      @input="onInput"
      @keydown.enter="emit('search')"
    />

    <Transition name="fade">
      <button v-if="model" class="search__clear" @click="clear" aria-label="Tozalash">
        <i class="ti ti-x" />
      </button>
    </Transition>

    <kbd v-if="!model" class="search__kbd">⌘K</kbd>

    <!-- ai=1: sinonim va ma'no bo'yicha, imloviy xato bilan yozilsa ham topadi -->
    <button
      v-if="ai"
      class="search__go"
      :class="{ 'search__go--on': aiActive }"
      :disabled="loading || !model.trim()"
      :title="model.trim() ? 'Ma\'no va sinonimlar bo\'yicha qidirish' : 'Avval qidiruv so\'zini yozing'"
      @click="emit('ai-search')"
    >
      <i class="ti" :class="aiActive ? 'ti-sparkles-filled' : 'ti-sparkles'" />
      <span>AI bilan qidirish</span>
    </button>

    <span class="search__bar" />
  </div>
</template>

<style scoped>
.search {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding-right: 6px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}
.search:hover { border-color: var(--n-300); }
.search:focus-within { border-color: var(--accent); box-shadow: var(--ring); }

.search__icon {
  position: absolute; left: 18px;
  font-size: 18px; color: var(--text-3);
  pointer-events: none;
  transition: color var(--dur-fast) var(--ease);
}
.search:focus-within .search__icon { color: var(--accent); }

.search__input {
  flex: 1;
  height: 100%;
  min-width: 0;
  padding: 0 12px 0 48px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--text);
}
.search__input:focus { outline: none; }
.search__input::placeholder { color: var(--text-3); }
.search__input::-webkit-search-cancel-button { display: none; }

.search__clear {
  margin-right: 10px;
  flex-shrink: 0;
  width: 24px; height: 24px;
  display: grid; place-items: center;
  border: none; border-radius: 50%;
  background: var(--surface-sunk);
  color: var(--text-2);
  font-size: 14px;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.search__clear:hover { background: var(--border-strong); color: var(--text); }

.search__kbd {
  margin-right: 10px;
  flex-shrink: 0;
  padding: 3px 7px;
  font-family: var(--font);
  font-size: 11px; font-weight: 600;
  color: var(--text-3);
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--r-xs);
  pointer-events: none;
}

.search__go {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  padding: 0 18px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--r-md);
  background: var(--violet-700);
  color: #fff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
}
.search__go i { font-size: 16px; }
.search__go:hover:not(:disabled) { background: color-mix(in srgb, var(--violet-700) 85%, #000); }
.search__go:focus-visible { outline: none; box-shadow: var(--ring); }
.search__go:disabled { opacity: .45; cursor: default; }
/* Natijalar AI qidiruvidan — tugma yoqilgan holatda qoladi */
.search__go--on { box-shadow: 0 0 0 2px color-mix(in srgb, var(--violet-500) 45%, transparent); }

/* Yuklanish chizig'i */
.search__bar {
  position: absolute;
  bottom: 0; left: 0;
  height: 2px; width: 40%;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transform: translateX(-100%);
}
.is-busy .search__bar {
  opacity: 1;
  animation: slide 1.1s var(--ease) infinite;
}
@keyframes slide {
  to { transform: translateX(350%); }
}

@media (max-width: 620px) {
  .search__kbd { display: none; }
  .search { height: 50px; }
  .search__go { width: 40px; height: 38px; padding: 0; justify-content: center; }
  .search__go span { display: none; }
}
</style>
