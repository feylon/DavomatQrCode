import { reactive, ref, watch } from 'vue'
import { errorMessage } from '@/api/http'
import { useToast } from './useToast'

// Sahifalangan ro'yxatlar uchun umumiy mantiq (filter + pagination)
export function usePaged(fetcher, initialFilters = {}, { limit = 10 } = {}) {
  const toast = useToast()
  const items = ref([])
  const meta = ref({ page: 1, totalPages: 1, total: 0 })
  const loading = ref(false)
  const filters = reactive({ ...initialFilters })
  const page = ref(1)

  async function load() {
    loading.value = true
    try {
      const params = { page: page.value, limit }
      for (const [k, v] of Object.entries(filters)) if (v !== '' && v !== null && v !== undefined) params[k] = v
      const res = await fetcher(params)
      items.value = res.data
      meta.value = {
        ...res.meta,
        page: res.meta.page,
        totalPages: res.meta.totalPages ?? res.meta.total_pages ?? 1,
        total: res.meta.total ?? res.meta.total_records ?? 0,
      }
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      loading.value = false
    }
  }

  let timer
  watch(
    filters,
    () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (page.value !== 1) page.value = 1
        else load()
      }, 300)
    },
    { deep: true },
  )
  watch(page, load)

  return { items, meta, loading, filters, page, load }
}
