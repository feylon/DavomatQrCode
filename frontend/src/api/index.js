import { http } from './http'

const data = (p) => p.then((r) => r.data)

export const authApi = {
  login: (body) => data(http.post('/auth/login', body)),
  profile: () => data(http.get('/auth/profile')),
  changePassword: (body) => data(http.post('/auth/changePassword', body)),
}

export const adminApi = {
  stats: () => data(http.get('/admin/stats')),
  owners: (params) => data(http.get('/admin/owners', { params })),
  createOwner: (body) => data(http.post('/admin/owners', body)),
  updateOwner: (id, body) => data(http.patch(`/admin/owners/${id}`, body)),
  users: (params) => data(http.get('/admin/users', { params })),
  createUser: (body) => data(http.post('/admin/users', body)),
  updateUser: (id, body) => data(http.patch(`/admin/users/${id}`, body)),
  resetPassword: (id, newPassword) => data(http.patch(`/admin/accounts/${id}/password`, { newPassword })),
}

export const ownerApi = {
  employees: (params) => data(http.get('/owner/users', { params })),
  createEmployee: (body) => data(http.post('/owner/users', body)),
  updateEmployee: (id, body) => data(http.patch(`/owner/users/${id}`, body)),
  resetPassword: (id, newPassword) => data(http.patch(`/owner/users/${id}/password`, { newPassword })),

  today: () => data(http.get('/owner/attendance/today')),
  atWork: () => data(http.get('/owner/attendance/at-work')),
  stats: (params) => data(http.get('/owner/attendance/stats', { params })),
  scanToken: (token) => data(http.post('/owner/attendance/scan', { token })),
  scanImage: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return data(http.post('/owner/attendance/scan-image', fd))
  },
  markAbsence: (body) => data(http.post('/owner/attendance/mark-absence', body)),
  cancelAbsence: (id) => data(http.delete(`/owner/attendance/absence/${id}`)),
  exportCsv: (params) => http.get('/owner/attendance/export', { params, responseType: 'blob' }),
}

export const userApi = {
  today: () => data(http.get('/user/attendance/today')),
  enterQr: () => data(http.post('/user/attendance/enter/generated_qr')),
  exitQr: () => data(http.post('/user/attendance/exit/generated_qr')),
  stats: (params) => data(http.get('/user/attendance/my-stats', { params })),
}
