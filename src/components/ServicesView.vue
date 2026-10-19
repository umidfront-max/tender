<script setup>
import { ref, computed } from 'vue'
import EmptyState from './EmptyState.vue'
import { formatNumber } from '@/utils/format'

/**
 * Xizmatlar katalogi — AI moslik shu ro'yxat asosida hisoblanadi.
 * Katalog kuniga bir marta avtomatik yangilanadi, bu yer qo'lda tuzatish uchun.
 */
const props = defineProps({
  items:   { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  saving:  { type: Boolean, default: false },
  error:   { type: String, default: null }
})

const emit = defineEmits(['add', 'edit', 'remove', 'retry'])

const BLANK = { name: '', description: '', url: '' }

const form      = ref({ ...BLANK })
const editingId = ref(null)   // null = yangi qo'shish rejimi
const confirmId = ref(null)   // o'chirish tasdig'i kutilayotgan xizmat

const isEditing = computed(() => editingId.value !== null)
const canSave   = computed(() => form.value.name.trim().length > 0)

function startEdit(s) {
  editingId.value = s.id
  form.value = {
    name: s.name ?? '',
    description: s.description ?? '',
    url: s.url ?? ''
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancel() {
  editingId.value = null
  form.value = { ...BLANK }
}

function submit() {
  if (!canSave.value || props.saving) return

  const body = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    url: form.value.url.trim()
  }

  if (isEditing.value) emit('edit', editingId.value, body, cancel)
  else emit('add', body, cancel)
}

function confirmRemove(s) {
  if (confirmId.value === s.id) {
    emit('remove', s.id)
    confirmId.value = null
  } else {
    confirmId.value = s.id
  }
}
</script>

<template>
  <div class="svc">
    <!-- Qo'shish / tahrirlash formasi -->
    <section class="card">
      <h2 class="card__title">
        <i class="ti" :class="isEditing ? 'ti-pencil' : 'ti-plus'" />
        {{ isEditing ? 'Xizmatni tahrirlash' : 'Yangi xizmat' }}
      </h2>

      <div class="form">
        <label class="fld">
          <span>Nomi <b>*</b></span>
          <input v-model="form.name" class="field" type="text" placeholder="masalan: Veb-sayt ishlab chiqish" />
        </label>

        <label class="fld">
          <span>Havola</span>
          <input v-model="form.url" class="field" type="url" placeholder="https://identity-uz.com/..." />
        </label>

        <label class="fld fld--wide">
          <span>Tavsif</span>
          <textarea
            v-model="form.description"
            class="field field--area"
            rows="3"
            placeholder="Xizmat nimadan iborat — AI shu matnga qarab tenderlarga moslikni baholaydi"
          />
        </label>
      </div>

      <p class="note">
        <i class="ti ti-info-circle" />
        Saqlangandan keyin barcha tenderlar fonda qayta baholanadi — bu bir soatgacha
        davom etishi mumkin, o'sha paytda kartalarda «AI jarayonda» ko'rinadi.
      </p>

      <div class="acts">
        <button class="btn btn--primary" :disabled="!canSave || saving" @click="submit">
          <i class="ti" :class="[saving ? 'ti-loader-2' : 'ti-check', { 'spin': saving }]" />
          {{ isEditing ? 'Saqlash' : "Qo'shish" }}
        </button>
        <button v-if="isEditing" class="btn btn--ghost" @click="cancel">Bekor qilish</button>
      </div>

      <p v-if="error" class="err"><i class="ti ti-alert-triangle" />{{ error }}</p>
    </section>

    <!-- Ro'yxat -->
    <div class="bar">
      <h2 class="bar__title">
        <template v-if="loading">Yuklanmoqda…</template>
        <template v-else-if="items.length">
          <strong class="mono">{{ formatNumber(items.length) }}</strong> ta xizmat
        </template>
        <template v-else>Xizmatlar</template>
      </h2>
    </div>

    <EmptyState
      v-if="error && !items.length"
      tone="error"
      icon="ti-plug-connected-x"
      title="Xizmatlar yuklanmadi"
      :message="error"
      action-text="Qayta urinish"
      @action="emit('retry')"
    />

    <EmptyState
      v-else-if="!loading && !items.length"
      icon="ti-briefcase"
      title="Xizmat yo'q"
      message="Katalog har kuni 07:45 da avtomatik yangilanadi. Yuqoridagi forma orqali qo'lda ham qo'shish mumkin."
    />

    <ul v-else class="list">
      <li v-for="s in items" :key="s.id" class="row" :class="{ 'row--editing': editingId === s.id }">
        <div class="row__body">
          <h3 class="row__name">{{ s.name }}</h3>
          <p v-if="s.description" class="row__desc">{{ s.description }}</p>
          <div class="row__meta">
            <span v-if="s.matches_count != null" class="chip chip--cnt">
              <i class="ti ti-sparkles" />{{ formatNumber(s.matches_count) }} ta mos tender
            </span>
            <a v-if="s.url" class="row__link" :href="s.url" target="_blank" rel="noopener noreferrer">
              <i class="ti ti-external-link" />Havola
            </a>
          </div>
        </div>

        <div class="row__acts">
          <button class="icon" title="Tahrirlash" :disabled="saving" @click="startEdit(s)">
            <i class="ti ti-pencil" />
          </button>
          <button
            class="icon"
            :class="{ 'icon--danger': confirmId === s.id }"
            :title="confirmId === s.id ? 'Tasdiqlash uchun yana bosing' : 'O\'chirish'"
            :disabled="saving"
            @click="confirmRemove(s)"
          >
            <i class="ti" :class="confirmId === s.id ? 'ti-alert-triangle' : 'ti-trash'" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.svc { display: flex; flex-direction: column; gap: 16px; }

/* ── Forma ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px 18px;
}
.card__title {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; color: var(--text);
  margin-bottom: 14px;
}
.card__title i { font-size: 16px; color: var(--text-3); }

.form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.fld { display: flex; flex-direction: column; gap: 5px; }
.fld--wide { grid-column: 1 / -1; }
.fld span {
  font-size: 10.5px; font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase; letter-spacing: .5px;
}
.fld b { color: var(--err-fg); }
.field--area { height: auto; padding: 9px 12px; line-height: 1.55; resize: vertical; font-family: inherit; }

.note {
  display: flex; align-items: flex-start; gap: 7px;
  margin-top: 12px;
  font-size: 11.5px; line-height: 1.55;
  color: var(--text-3);
}
.note i { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

.acts { display: flex; gap: 8px; margin-top: 14px; }
.acts .btn:disabled { opacity: .5; cursor: default; }
.spin { animation: spin .8s linear infinite; display: inline-block; }

.err {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--err-fg);
}

/* ── Ro'yxat ── */
.bar__title { font-size: 14px; font-weight: 500; color: var(--text-2); }
.bar__title strong { color: var(--text); font-weight: 700; }

.list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

.row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  transition: border-color var(--dur) var(--ease);
}
.row:hover { border-color: var(--border-strong); }
.row--editing { border-color: var(--accent); background: var(--accent-bg); }

.row__body { flex: 1; min-width: 0; }
.row__name { font-size: 13.5px; font-weight: 600; color: var(--text); line-height: 1.45; }
.row__desc {
  margin-top: 4px;
  font-size: 12px; line-height: 1.55; color: var(--text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.row__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.chip--cnt { background: color-mix(in srgb, var(--violet-500) 12%, transparent); color: color-mix(in srgb, var(--violet-500) 72%, var(--text)); }
.row__link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--text-3); text-decoration: none;
}
.row__link:hover { color: var(--accent-text); }

.row__acts { display: flex; gap: 2px; flex-shrink: 0; }
.icon {
  width: 30px; height: 30px;
  display: grid; place-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  color: var(--text-3);
  font-size: 16px;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.icon:hover { background: var(--surface-hover); color: var(--text-2); }
.icon:disabled { opacity: .4; cursor: default; }
.icon--danger {
  background: var(--err-bg);
  color: var(--err-fg);
  border-color: color-mix(in srgb, var(--err-500) 35%, transparent);
}

@media (max-width: 620px) {
  .form { grid-template-columns: minmax(0, 1fr); }
}
</style>
