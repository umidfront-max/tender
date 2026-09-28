import { ref, onScopeDispose } from 'vue'
import { triggerCollect, fetchCollectStatus } from '@/api/tenders'

const POLL_MS = 6000   // qo'llanmada 5-10 s tavsiya qilingan

/**
 * Qo'lda yangilash: POST /api/v1/collect ishga tushiradi, keyin
 * GET /api/v1/collect/status ni running:false bo'lgunicha so'rab turadi.
 *
 * Backend javobi erkin shaklda (`additionalProperties`), shuning uchun
 * holatni bir nechta mumkin bo'lgan kalitdan o'qiymiz.
 *
 * @param {() => void} onFinished  yig'ish tugagach chaqiriladi — ro'yxat va stats yangilansin
 */
export function useCollect(onFinished) {
  const running   = ref(false)   // yig'ish jarayoni ketyaptimi
  const cooldown  = ref(0)       // tugma yana necha soniyadan keyin ishlaydi
  const message   = ref(null)    // foydalanuvchiga ko'rsatiladigan qisqa matn
  const error     = ref(null)
  const runs      = ref([])      // oxirgi yig'ishlar tarixi

  let pollId = null
  let tickId = null

  function clearTimers() {
    clearTimeout(pollId); pollId = null
    clearInterval(tickId); tickId = null
  }
  onScopeDispose(clearTimers)

  function startCooldown(seconds) {
    cooldown.value = Math.max(0, Math.round(seconds) || 0)
    clearInterval(tickId)
    if (!cooldown.value) return
    tickId = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        clearInterval(tickId); tickId = null
        message.value = null
      }
    }, 1000)
  }

  /** Javobdagi holatni turli nomlanish ehtimolini hisobga olib o'qiydi */
  function readState(data) {
    const raw = data?.status ?? data?.state ?? data?.result ?? data?.detail
    return typeof raw === 'string' ? raw.toLowerCase() : null
  }

  function readRetry(data) {
    const v = data?.retry_after_seconds ?? data?.retry_after ?? data?.cooldown_seconds
    return Number(v) || 0
  }

  /** Holatni bir marta so'rab, running bo'lsa pollingni davom ettiradi */
  async function poll() {
    try {
      const data = await fetchCollectStatus(12)
      runs.value = data?.runs ?? []

      if (data?.running) {
        running.value = true
        message.value = 'Ma\'lumot yig\'ilmoqda…'
        pollId = setTimeout(poll, POLL_MS)
        return
      }

      // Tugadi
      const wasRunning = running.value
      running.value = false
      clearTimers()

      if (wasRunning) {
        const last = runs.value[0]
        message.value = last?.status === 'failed'
          ? `Yig'ishda xato: ${last.error || 'noma\'lum'}`
          : 'Yangilandi'
        onFinished?.()
        setTimeout(() => { if (!running.value) message.value = null }, 4000)
      }
    } catch (e) {
      running.value = false
      clearTimers()
      error.value = e.message
    }
  }

  /** Ilova ochilganda — boshqa joyda yig'ish ketayotgan bo'lsa ulanib olamiz */
  async function probe() {
    try {
      const data = await fetchCollectStatus(12)
      runs.value = data?.runs ?? []
      if (data?.running) {
        running.value = true
        message.value = 'Ma\'lumot yig\'ilmoqda…'
        clearTimeout(pollId)
        pollId = setTimeout(poll, POLL_MS)
      }
    } catch {
      // Jim qolamiz — bu yordamchi so'rov, xatosi foydalanuvchiga kerak emas
    }
  }

  async function start() {
    if (running.value || cooldown.value > 0) return
    error.value = null
    message.value = null

    try {
      const data = await triggerCollect()
      const state = readState(data)

      if (state === 'cooldown') {
        const wait = readRetry(data)
        message.value = `Hozircha kutish kerak`
        startCooldown(wait)
        return
      }

      // started ham, already_running ham bir xil yo'l bilan kuzatiladi
      running.value = true
      message.value = state === 'already_running'
        ? 'Yig\'ish allaqachon ketyapti…'
        : 'Ma\'lumot yig\'ilmoqda…'

      clearTimeout(pollId)
      pollId = setTimeout(poll, POLL_MS)
    } catch (e) {
      // Backend cooldown'ni 429 bilan ham qaytarishi mumkin
      if (e.status === 429) {
        startCooldown(readRetry(e.payload) || 60)
        message.value = 'Hozircha kutish kerak'
        return
      }
      error.value = e.message
      message.value = null
    }
  }

  return { running, cooldown, message, error, runs, start, probe }
}
