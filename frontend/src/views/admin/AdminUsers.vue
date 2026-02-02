<script setup>
import { onMounted, reactive, ref } from 'vue'
import { adminApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { usePaged } from '@/composables/usePaged'
import AppModal from '@/components/AppModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import AppPagination from '@/components/AppPagination.vue'
import PersonCell from '@/components/PersonCell.vue'
import ResetPasswordModal from '@/components/ResetPasswordModal.vue'
import { formatDate, fullName } from '@/utils/format'

const toast = useToast()
const { items, meta, loading, filters, page, load } = usePaged(adminApi.users, { search: '', ownerId: '' })

// Filter va forma uchun tashkilotlar ro'yxati
const owners = ref([])
async function loadOwners() {
  try {
    const res = await adminApi.owners({ page: 1, limit: 100 })
    owners.value = res.data
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
onMounted(() => {
  load()
  loadOwners()
})

const empty = () => ({ ownerId: '', login: '', password: '', firstname: '', lastname: '', middlname: '', email: '' })
const editing = ref(null)
const form = reactive(empty())
const saving = ref(false)
const formError = ref('')
const resetFor = ref(null)

function openCreate() {
  Object.assign(form, empty(), { ownerId: filters.ownerId || owners.value[0]?.id || '' })
  formError.value = ''
  editing.value = 'new'
}

function openEdit(u) {
  Object.assign(form, { ...empty(), ...u, ownerId: u.owner?.id ?? '', middlname: u.middlname ?? '' })
  formError.value = ''
  editing.value = u
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const { ownerId, login, password, firstname, lastname, middlname, email } = form
    if (editing.value === 'new') {
      await adminApi.createUser({ ownerId, login, password, firstname, lastname, middlname: middlname || undefined, email })
      toast.success('Xodim qo‘shildi')
    } else {
      await adminApi.updateUser(editing.value.id, { ownerId, login, firstname, lastname, middlname, email })
      toast.success('Ma’lumotlar yangilandi')
    }
    editing.value = null
    load()
  } catch (e) {
    formError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

async function toggleBlock(u) {
  if (!confirm(`${fullName(u)} ni ${u.isBlock ? 'blokdan chiqarish' : 'bloklash'}ni tasdiqlaysizmi?`)) return
  try {
    await adminApi.updateUser(u.id, { isBlock: !u.isBlock })
    toast.success(u.isBlock ? 'Blokdan chiqarildi' : 'Bloklandi')
    load()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Xodimlar</h1>
        <p>Barcha tashkilotlardagi xodimlar</p>
      </div>
      <button class="btn btn-primary" :disabled="!owners.length" @click="openCreate"><AppIcon name="plus" /> Yangi xodim</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filters" style="flex: 1">
          <input v-model="filters.search" class="input grow" placeholder="Ism yoki login bo‘yicha qidirish…" />
          <select v-model="filters.ownerId" class="select">
            <option value="">Barcha tashkilotlar</option>
            <option v-for="o in owners" :key="o.id" :value="o.id">{{ o.company }}</option>
          </select>
        </div>
        <span v-if="loading" class="spinner muted" />
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Tashkilot</th>
              <th>Email</th>
              <th>Holat</th>
              <th>Qo‘shilgan</th>
              <th class="actions">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td><PersonCell :user="u" /></td>
              <td>{{ u.owner?.company || '—' }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" :class="u.isBlock ? 'badge-danger' : 'badge-success'">{{ u.isBlock ? 'Bloklangan' : 'Faol' }}</span>
              </td>
              <td>{{ formatDate(u.created_At) }}</td>
              <td class="actions">
                <div class="row" style="justify-content: flex-end">
                  <button class="btn btn-sm btn-ghost btn-icon" title="Tahrirlash" @click="openEdit(u)"><AppIcon name="edit" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" title="Parolni tiklash" @click="resetFor = u"><AppIcon name="key" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" :class="{ 'btn-danger': !u.isBlock }" :title="u.isBlock ? 'Blokdan chiqarish' : 'Bloklash'" @click="toggleBlock(u)">
                    <AppIcon :name="u.isBlock ? 'unlock' : 'lock'" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="6" class="empty">Xodimlar topilmadi</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-model:page="page" :total-pages="meta.totalPages" :total="meta.total" />
    </div>

    <AppModal v-if="editing" :title="editing === 'new' ? 'Yangi xodim' : 'Xodimni tahrirlash'" width="640px" @close="editing = null">
      <form id="user-form" class="stack" @submit.prevent="save">
        <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
        <div class="form-grid">
          <div class="field" style="grid-column: 1 / -1">
            <label>Tashkilot *</label>
            <select v-model="form.ownerId" class="select" required>
              <option v-for="o in owners" :key="o.id" :value="o.id" :disabled="o.isBlock">{{ o.company }} — {{ fullName(o) }}</option>
            </select>
          </div>
          <div class="field">
            <label>Familiya *</label>
            <input v-model="form.lastname" class="input" required />
          </div>
          <div class="field">
            <label>Ism *</label>
            <input v-model="form.firstname" class="input" required />
          </div>
          <div class="field">
            <label>Otasining ismi</label>
            <input v-model="form.middlname" class="input" />
          </div>
          <div class="field">
            <label>Email *</label>
            <input v-model="form.email" type="email" class="input" required />
          </div>
          <div class="field">
            <label>Login *</label>
            <input v-model="form.login" class="input" autocomplete="off" required />
          </div>
          <div v-if="editing === 'new'" class="field">
            <label>Parol *</label>
            <input v-model="form.password" class="input" minlength="6" autocomplete="new-password" required />
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn" @click="editing = null">Bekor qilish</button>
        <button class="btn btn-primary" form="user-form" :disabled="saving">
          <span v-if="saving" class="spinner" /> Saqlash
        </button>
      </template>
    </AppModal>

    <ResetPasswordModal v-if="resetFor" :user="resetFor" :action="adminApi.resetPassword" @close="resetFor = null" />
  </div>
</template>
