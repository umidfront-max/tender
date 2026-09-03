<script setup>
defineProps({
  icon:       { type: String, default: 'ti-file-off' },
  title:      { type: String, required: true },
  message:    { type: String, default: '' },
  actionText: { type: String, default: '' },
  tone:       { type: String, default: 'neutral' } // neutral | error
})
defineEmits(['action'])
</script>

<template>
  <div class="empty" :class="`empty--${tone}`">
    <span class="empty__icon"><i class="ti" :class="icon" /></span>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="message" class="empty__msg">{{ message }}</p>
    <button v-if="actionText" class="btn btn--ghost btn--sm" @click="$emit('action')">
      <i class="ti ti-refresh" /> {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  background: var(--surface);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-xl);
  animation: fade-up .4s var(--ease-out) both;
}
.empty__icon {
  width: 54px; height: 54px;
  display: grid; place-items: center;
  border-radius: var(--r-lg);
  background: var(--surface-sunk);
  color: var(--text-3);
  font-size: 26px;
  margin-bottom: 14px;
}
.empty--error .empty__icon { background: var(--err-bg); color: var(--err-fg); }

.empty__title { font-size: 15px; font-weight: 600; color: var(--text); }
.empty__msg {
  font-size: 13px; color: var(--text-2);
  margin-top: 5px; margin-bottom: 16px;
  max-width: 380px; line-height: 1.6;
}
</style>
