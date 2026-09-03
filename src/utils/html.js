/**
 * `detail` maydoni ba'zi saytlarda (tbcbank.uz) HTML formatda keladi.
 * Backend uni saytdagi holicha uzatadi, shuning uchun chiqarishdan oldin tozalaymiz.
 */

const ALLOWED = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN', 'DIV',
  'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'A'
])

/** Matnda HTML tegi bormi? */
export function looksLikeHtml(text) {
  return typeof text === 'string' && /<\/?[a-z][\s\S]*>/i.test(text)
}

/** Barcha teglarni olib tashlab, faqat matn qoldiradi (karta ustidagi qisqa ko'rinish uchun) */
export function stripHtml(text) {
  if (!text) return ''
  if (!looksLikeHtml(text)) return text
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

/**
 * Oq ro'yxatdagi teglarni qoldirib, script/style/on* /style atributlarini olib tashlaydi.
 * Natijani v-html bilan chiqarish xavfsiz.
 */
export function sanitizeHtml(text) {
  if (!text) return ''
  const doc = new DOMParser().parseFromString(text, 'text/html')

  for (const el of [...doc.body.querySelectorAll('*')]) {
    if (!ALLOWED.has(el.tagName)) {
      // Tegni olib tashlaymiz, ichidagi matnni saqlab qolamiz
      el.replaceWith(...el.childNodes)
      continue
    }

    for (const attr of [...el.attributes]) {
      const keep = el.tagName === 'A' && attr.name === 'href' &&
                   /^https?:\/\//i.test(attr.value)
      if (!keep) el.removeAttribute(attr.name)
    }

    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  }

  return doc.body.innerHTML
}
