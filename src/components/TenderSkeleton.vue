<script setup>
defineProps({ count: { type: Number, default: 6 } })
</script>

<template>
  <div class="skels" aria-hidden="true">
    <div v-for="n in count" :key="n" class="skel" :style="{ animationDelay: `${n * 60}ms` }">
      <div class="sk sk--avatar" />
      <div class="skel__body">
        <div class="sk sk--line" style="width: 78%" />
        <div class="sk sk--line" style="width: 46%; height: 11px" />
        <div class="skel__chips">
          <div class="sk sk--chip" style="width: 90px" />
          <div class="sk sk--chip" style="width: 62px" />
          <div class="sk sk--chip" style="width: 74px" />
        </div>
      </div>
      <div class="sk sk--price" />
    </div>
  </div>
</template>

<style scoped>
.skels { display: flex; flex-direction: column; gap: 10px; }

.skel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  animation: fade-up .4s var(--ease-out) both;
}
.skel__body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skel__chips { display: flex; gap: 6px; margin-top: 2px; }

.sk {
  background: linear-gradient(90deg, var(--surface-sunk) 25%, var(--border) 37%, var(--surface-sunk) 63%);
  background-size: 600px 100%;
  animation: shimmer 1.4s linear infinite;
  border-radius: var(--r-xs);
}
.sk--avatar { width: 34px; height: 34px; border-radius: var(--r-md); flex-shrink: 0; }
.sk--line   { height: 13px; }
.sk--chip   { height: 20px; border-radius: var(--r-full); }
.sk--price  { width: 84px; height: 15px; flex-shrink: 0; }
</style>
