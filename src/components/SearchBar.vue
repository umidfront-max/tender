<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const model = defineModel({ type: String, default: '' })
defineProps({
  loading:     { type: Boolean, default: false },
  // Faqat raqam kiritilsa backend uni STIR/tender kodi deb aniq qidiradi
  placeholder: { type: String, default: "Tender nomi, tashkilot, STIR yoki kalit so'z…" },
  label:       { type: String, default: 'Tenderlarni qidirish' }
})
const emit = defineEmits(['search', 'input-debounced'])

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

    <span class="search__bar" />
  </div>
</template>

<style scoped>
.search {
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}
.search:hover { border-color: var(--n-300); }
.search:focus-within { border-color: var(--accent); box-shadow: var(--ring); }

.search__icon {
  position: absolute; left: 14px;
  font-size: 18px; color: var(--text-3);
  pointer-events: none;
  transition: color var(--dur-fast) var(--ease);
}
.search:focus-within .search__icon { color: var(--accent); }

.search__input {
  flex: 1;
  height: 100%;
  padding: 0 76px 0 42px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text);
}
.search__input:focus { outline: none; }
.search__input::placeholder { color: var(--text-3); }
.search__input::-webkit-search-cancel-button { display: none; }

.search__clear {
  position: absolute; right: 12px;
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
  position: absolute; right: 12px;
  padding: 3px 7px;
  font-family: var(--font);
  font-size: 11px; font-weight: 600;
  color: var(--text-3);
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--r-xs);
  pointer-events: none;
}

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
  .search__input { padding-right: 44px; }
}
</style>
