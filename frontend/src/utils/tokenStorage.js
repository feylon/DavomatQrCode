const ACCESS = 'davomat_access'
const REFRESH = 'davomat_refresh'

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* localStorage mavjud bo'lmasa e'tiborsiz qoldiramiz */
  }
}

export const tokenStorage = {
  get access() {
    return read(ACCESS)
  },
  get refresh() {
    return read(REFRESH)
  },
  set(access, refresh) {
    write(ACCESS, access)
    write(REFRESH, refresh)
  },
  clear() {
    write(ACCESS, null)
    write(REFRESH, null)
  },
}
