<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ownerApi } from '@/api'
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
const router = useRouter()
const { items, meta, loading, filters, page, load } = usePaged(ownerApi.employees, { search: '', state: '' })
onMounted(load)

const empty = () => ({ login: '', password: '', firstname: '', lastname: '', middlname: '', email: '' })
const editing = ref(null)
const form = reactive(empty())
const saving = ref(false)
const formError = ref('')
const resetFor = ref(null)

function openCreate() {
  Object.assign(form, empty())
  formError.value = ''
  editing.value = 'new'
}

function openEdit(u) {
  Object.assign(form, { ...empty(), ...u, middlname: u.middlname ?? '', password: '' })
  formError.value = ''
  editing.value = u
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const { login, password, firstname, lastname, middlname, email } = form
    if (editing.value === 'new') {
      await ownerApi.createEmployee({ login, password, firstname, lastname, middlname: middlname || undefined, email })
      toast.success(`Xodim qo‘shildi. Login: ${login}`)
    } else {
      await ownerApi.updateEmployee(editing.value.id, { login, firstname, lastname, middlname, email })
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
    await ownerApi.updateEmployee(u.id, { isBlock: !u.isBlock })
    toast.success(u.isBlock ? 'Blokdan chiqarildi' : 'Bloklandi')
    load()
  } catch (e) {
    toast.error(errorMessage(e))
  }
}

function openHistory(u) {
  router.push({ path: '/owner/history', query: { userId: u.id } })
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Xodimlar</h1>
        <p>Tashkilotingiz xodimlari va ularning hisoblari</p>
      </div>
      <button class="btn btn-primary" @click="openCreate"><AppIcon name="plus" /> Yangi xodim</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filters" style="flex: 1">
          <input v-model="filters.search" class="input grow" placeholder="Ism yoki login bo‘yicha qidirish…" />
          <select v-model="filters.state" class="select">
            <option value="">Barchasi</option>
            <option value="active">Faol</option>
            <option value="blocked">Bloklangan</option>
          </select>
        </div>
        <span v-if="loading" class="spinner muted" />
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Email</th>
              <th>Holat</th>
              <th>Qo‘shilgan</th>
              <th class="actions">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td><PersonCell :user="u" /></td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" :class="u.isBlock ? 'badge-danger' : 'badge-success'">{{ u.isBlock ? 'Bloklangan' : 'Faol' }}</span>
              </td>
              <td>{{ formatDate(u.created_At) }}</td>
              <td class="actions">
                <div class="row" style="justify-content: flex-end">
                  <button class="btn btn-sm btn-ghost btn-icon" title="Davomat tarixi" @click="openHistory(u)"><AppIcon name="history" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" title="Tahrirlash" @click="openEdit(u)"><AppIcon name="edit" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" title="Parolni tiklash" @click="resetFor = u"><AppIcon name="key" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" :class="{ 'btn-danger': !u.isBlock }" :title="u.isBlock ? 'Blokdan chiqarish' : 'Bloklash'" @click="toggleBlock(u)">
                    <AppIcon :name="u.isBlock ? 'unlock' : 'lock'" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="5" class="empty">Xodimlar topilmadi</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-model:page="page" :total-pages="meta.totalPages" :total="meta.total" />
    </div>

    <AppModal v-if="editing" :title="editing === 'new' ? 'Yangi xodim' : 'Xodimni tahrirlash'" width="640px" @close="editing = null">
      <form id="emp-form" class="stack" @submit.prevent="save">
        <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
        <div class="form-grid">
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
            <span class="hint">Xodim birinchi kirishdan so‘ng o‘zgartirishi mumkin</span>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn" @click="editing = null">Bekor qilish</button>
        <button class="btn btn-primary" form="emp-form" :disabled="saving">
          <span v-if="saving" class="spinner" /> Saqlash
        </button>
      </template>
    </AppModal>

    <ResetPasswordModal v-if="resetFor" :user="resetFor" :action="ownerApi.resetPassword" @close="resetFor = null" />
  </div>
</template>
