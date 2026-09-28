<script setup>
import TenderCard from './TenderCard.vue'
import TenderSkeleton from './TenderSkeleton.vue'
import EmptyState from './EmptyState.vue'

defineProps({
  items:   { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error:   { type: String, default: null },
  resolve: { type: Function, required: true },
  // PATCH so'rovi ketayotgan tenderlar id'lari — tugmalar vaqtincha bloklanadi
  busyIds: { type: Object, default: () => new Set() }
})
defineEmits(['retry', 'reset', 'interest'])
</script>

<template>
  <TenderSkeleton v-if="loading" :count="6" />

  <EmptyState
    v-else-if="error"
    tone="error"
    icon="ti-plug-connected-x"
    title="Server bilan aloqa yo'q"
    :message="`${error}. Backend ishlayotganini va manzil to'g'riligini tekshiring.`"
    action-text="Qayta urinish"
    @action="$emit('retry')"
  />

  <EmptyState
    v-else-if="!items.length"
    icon="ti-search-off"
    title="Hech narsa topilmadi"
    message="Qidiruv so'zi yoki filtrlarni o'zgartirib ko'ring — ehtimol shartlar juda tor."
    action-text="Filtrlarni tozalash"
    @action="$emit('reset')"
  />

  <TransitionGroup v-else name="list" tag="div" class="list">
    <TenderCard
      v-for="(item, i) in items"
      :key="item.id ?? `${item.domain}-${item.external_id}`"
      :item="item"
      :source="resolve(item.domain)"
      :index="i"
      :busy="busyIds.has(item.id)"
      @interest="(it, val) => $emit('interest', it, val)"
    />
  </TransitionGroup>
</template>

<style scoped>
.list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
