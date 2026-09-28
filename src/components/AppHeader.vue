<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  // POST /api/v1/collect fonda ishlayapti
  collecting: { type: Boolean, default: false },
  // cooldown tugaguncha qolgan soniya
  cooldown:   { type: Number, default: 0 },
  // qisqa holat matni: "Ma'lumot yig'ilmoqda…", "Yangilandi" va h.k.
  message:    { type: String, default: null },
  online:     { type: Boolean, default: true }
})
const emit = defineEmits(['collect', 'toggle-sidebar'])

const { theme, toggle } = useTheme()

const collectTitle = computed(() => {
  if (props.cooldown) return `${props.cooldown} soniyadan keyin qayta urinib ko'ring`
  if (props.collecting) return 'Yig\'ish ketyapti…'
  return 'Saytlardan hozir yangi ma\'lumot yig\'ish'
})
</script>

<template>
  <header class="hdr">
    <button class="hdr__burger btn btn--ghost btn--icon" @click="emit('toggle-sidebar')" aria-label="Menyu">
      <i class="ti ti-menu-2" />
    </button>

    <a class="brand" href="/">
      <span class="brand__mark">
        <i class="ti ti-file-certificate" />
      </span>
      <span class="brand__txt">
        <span class="brand__name">TenderHub<span class="brand__uz">UZ</span></span>
        <span class="brand__sub">Yagona tenderlar monitoringi</span>
      </span>
    </a>

    <div class="hdr__right">
      <Transition name="fade">
        <span v-if="message" class="hdr__msg">{{ message }}</span>
      </Transition>

      <span class="pulse" :class="{ 'pulse--off': !online }">
        <span class="pulse__dot"><i class="pulse__ring" /></span>
        <span class="pulse__label">{{ online ? 'Jonli' : 'Uzilgan' }}</span>
      </span>

      <button class="btn btn--ghost btn--icon" @click="toggle" :aria-label="theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'i rejim'">
        <i :class="theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'" />
      </button>

      <button
        class="btn btn--ghost"
        :class="{ 'btn--icon': !cooldown }"
        :disabled="collecting || cooldown > 0"
        :title="collectTitle"
        @click="emit('collect')"
      >
        <i class="ti ti-refresh" :class="{ 'is-spinning': collecting }" />
        <span v-if="cooldown" class="mono">{{ cooldown }}s</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--border);
}

.hdr__burger { display: none; }

.hdr__msg {
  font-size: 11.5px;
  color: var(--text-2);
  background: var(--surface-sunk);
  border-radius: var(--r-full);
  padding: 4px 11px;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .hdr__msg { display: none; }
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  color: inherit;
  margin-right: auto;
}
.brand__mark {
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border-radius: var(--r-md);
  background: linear-gradient(140deg, var(--brand-500), var(--brand-700));
  color: #fff;
  font-size: 18px;
  box-shadow: var(--sh-sm);
  flex-shrink: 0;
}
.brand__txt { display: flex; flex-direction: column; line-height: 1.2; }
.brand__name { font-size: 15px; font-weight: 700; letter-spacing: -.2px; }
.brand__uz {
  margin-left: 4px;
  font-size: 11px; font-weight: 600;
  color: var(--accent-text);
  background: var(--accent-bg);
  padding: 1px 5px;
  border-radius: var(--r-xs);
  vertical-align: 1px;
}
.brand__sub { font-size: 11px; color: var(--text-3); margin-top: 1px; }

.hdr__right { display: flex; align-items: center; gap: 8px; }

/* Live indikator */
.pulse {
  display: inline-flex; align-items: center; gap: 8px;
  height: 28px; padding: 0 11px 0 9px;
  border-radius: var(--r-full);
  background: var(--ok-bg);
  color: var(--ok-fg);
  font-size: 12px; font-weight: 600;
}
.pulse--off { background: var(--err-bg); color: var(--err-fg); }
.pulse__dot { position: relative; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pulse__ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: currentColor;
  animation: ping 2s var(--ease-out) infinite;
}
.pulse--off .pulse__ring { animation: none; }

.is-spinning { animation: spin .8s linear infinite; display: inline-block; }

.btn:disabled { opacity: .5; cursor: default; }

@media (max-width: 900px) {
  .hdr { padding: 0 14px; }
  .hdr__burger { display: inline-flex; }
  .brand__sub { display: none; }
  .pulse__label { display: none; }
  .pulse { padding: 0 9px; }
}
</style>
