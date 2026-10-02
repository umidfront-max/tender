<script setup>
import { ref, watch, nextTick } from 'vue'

/**
 * Raqam kiritish maydoni: ekranda "1 000 000", modelda xom "1000000".
 *
 * `type="number"` bo'lsa brauzer bo'sh joyni qabul qilmaydi, shuning uchun
 * `type="text"` + `inputmode="numeric"` ishlatiladi — telefonda ham raqamli
 * klaviatura chiqadi.
 */

const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  placeholder: { type: String, default: '' }
})

const el = ref(null)
const display = ref('')

/** 1000000 -> "1 000 000" */
function format(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Kursordan oldingi raqamlar soni — formatlashdan keyin joyini tiklash uchun */
function digitsBefore(text, caret) {
  return (text.slice(0, caret).match(/\d/g) || []).length
}

/** N-chi raqamdan keyingi pozitsiyani topadi */
function caretAfterDigits(text, count) {
  if (count <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      seen++
      if (seen === count) return i + 1
    }
  }
  return text.length
}

function onInput(e) {
  const input = e.target
  const before = digitsBefore(input.value, input.selectionStart ?? input.value.length)

  const digits = input.value.replace(/\D/g, '')
  const formatted = format(digits)

  model.value = digits
  display.value = formatted

  // Vue DOM ni yangilagach kursorni o'z joyiga qaytaramiz —
  // aks holda o'rtaga raqam qo'shganda kursor oxiriga sakrab ketadi
  nextTick(() => {
    if (!el.value) return
    const pos = caretAfterDigits(el.value.value, before)
    el.value.setSelectionRange(pos, pos)
  })
}

// Tashqaridan o'zgarsa (masalan filtrlar tozalanganda) ko'rinishni moslaymiz
watch(model, (v) => {
  const next = format(v)
  if (next !== display.value) display.value = next
}, { immediate: true })
</script>

<template>
  <input
    ref="el"
    class="field"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :value="display"
    :placeholder="placeholder"
    @input="onInput"
  />
</template>
