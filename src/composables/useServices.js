import { ref } from 'vue'
import {
  fetchServices, createService, updateService, deleteService
} from '@/api/services'

/**
 * Xizmatlar katalogi (admin bo'limi).
 *
 * Katalog har kuni 07:45 da identity-uz.com dan avtomatik yangilanadi —
 * qo'lda qo'shish shart emas, lekin mumkin. Har bir o'zgarish fonda
 * barcha tenderlarni qayta baholashni boshlaydi (bir soatgacha davom etadi),
 * shu paytda tenderlarda match_score null bo'lib turadi.
 */
export function useServices() {
  const items   = ref([])
  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref(null)
  const loaded  = ref(false)

  let controller = null

  async function load() {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal

    loading.value = true
    error.value = null

    try {
      const data = await fetchServices(signal)
      // Javob massiv yoki {items: []} bo'lishi mumkin
      items.value = Array.isArray(data) ? data : (data?.items ?? [])
      loaded.value = true
    } catch (e) {
      if (e.name === 'AbortError') return
      error.value = e.message
      items.value = []
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  /** @param {{name: string, description?: string, url?: string}} body */
  async function add(body) {
    saving.value = true
    error.value = null
    try {
      await createService(body)
      await load()
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      saving.value = false
    }
  }

  async function edit(id, body) {
    saving.value = true
    error.value = null
    try {
      await updateService(id, body)
      await load()
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      saving.value = false
    }
  }

  async function remove(id) {
    saving.value = true
    error.value = null
    try {
      await deleteService(id)
      items.value = items.value.filter(s => s.id !== id)
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, loaded, load, add, edit, remove }
}
