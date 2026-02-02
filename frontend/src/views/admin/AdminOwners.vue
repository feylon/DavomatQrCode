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
const { items, meta, loading, filters, page, load } = usePaged(adminApi.owners, { search: '' })
onMounted(load)

const empty = () => ({ login: '', password: '', firstname: '', lastname: '', middlname: '', email: '', company: '' })
const editing = ref(null) // null | 'new' | owner
const form = reactive(empty())
const saving = ref(false)
const formError = ref('')
const resetFor = ref(null)

function openCreate() {
  Object.assign(form, empty())
  formError.value = ''
  editing.value = 'new'
}

function openEdit(o) {
  Object.assign(form, { ...empty(), ...o, password: '' })
  formError.value = ''
  editing.value = o
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    if (editing.value === 'new') {
      await adminApi.createOwner({ ...form })
      toast.success('Tashkilot qo‘shildi')
    } else {
      const { login, firstname, lastname, middlname, email, company } = form
      await adminApi.updateOwner(editing.value.id, { login, firstname, lastname, middlname, email, company })
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

async function toggleBlock(o) {
  const action = o.isBlock ? 'blokdan chiqarish' : 'bloklash'
  if (!confirm(`${fullName(o)} (${o.company}) ni ${action}ni tasdiqlaysizmi?`)) return
  try {
    await adminApi.updateOwner(o.id, { isBlock: !o.isBlock })
    toast.success(o.isBlock ? 'Blokdan chiqarildi' : 'Bloklandi')
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
        <h1>Tashkilotlar</h1>
        <p>Tashkilot rahbarlari (owner) va ularning kompaniyalari</p>
      </div>
      <button class="btn btn-primary" @click="openCreate"><AppIcon name="plus" /> Yangi tashkilot</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filters" style="flex: 1">
          <input v-model="filters.search" class="input grow" placeholder="Ism, login yoki kompaniya bo‘yicha qidirish…" />
        </div>
        <span v-if="loading" class="spinner muted" />
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rahbar</th>
              <th>Tashkilot</th>
              <th>Email</th>
              <th>Xodimlar</th>
              <th>Holat</th>
              <th>Qo‘shilgan</th>
              <th class="actions">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in items" :key="o.id">
              <td><PersonCell :user="o" /></td>
              <td>{{ o.company }}</td>
              <td>{{ o.email }}</td>
              <td class="mono">{{ o.employeesCount ?? 0 }}</td>
              <td>
                <span class="badge" :class="o.isBlock ? 'badge-danger' : 'badge-success'">{{ o.isBlock ? 'Bloklangan' : 'Faol' }}</span>
              </td>
              <td>{{ formatDate(o.created_At) }}</td>
              <td class="actions">
                <div class="row" style="justify-content: flex-end">
                  <button class="btn btn-sm btn-ghost btn-icon" title="Tahrirlash" @click="openEdit(o)"><AppIcon name="edit" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" title="Parolni tiklash" @click="resetFor = o"><AppIcon name="key" :size="16" /></button>
                  <button class="btn btn-sm btn-ghost btn-icon" :class="{ 'btn-danger': !o.isBlock }" :title="o.isBlock ? 'Blokdan chiqarish' : 'Bloklash'" @click="toggleBlock(o)">
                    <AppIcon :name="o.isBlock ? 'unlock' : 'lock'" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="7" class="empty">Tashkilotlar topilmadi</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-model:page="page" :total-pages="meta.totalPages" :total="meta.total" />
    </div>

    <AppModal v-if="editing" :title="editing === 'new' ? 'Yangi tashkilot' : 'Tashkilotni tahrirlash'" width="640px" @close="editing = null">
      <form id="owner-form" class="stack" @submit.prevent="save">
        <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
        <div class="form-grid">
          <div class="field" style="grid-column: 1 / -1">
            <label>Tashkilot nomi *</label>
            <input v-model="form.company" class="input" required />
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
            <label>Otasining ismi *</label>
            <input v-model="form.middlname" class="input" required />
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
        <button class="btn btn-primary" form="owner-form" :disabled="saving">
          <span v-if="saving" class="spinner" /> Saqlash
        </button>
      </template>
    </AppModal>

    <ResetPasswordModal v-if="resetFor" :user="resetFor" :action="adminApi.resetPassword" @close="resetFor = null" />
  </div>
</template>
