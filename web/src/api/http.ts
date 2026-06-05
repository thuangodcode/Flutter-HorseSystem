import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add dynamic JWT token authorization header interceptor
http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('hr_session')
  if (raw) {
    try {
      const session = JSON.parse(raw)
      if (session && session.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }
    } catch (e) {
      console.error('Failed to parse session token:', e)
    }
  }
  return config
})

// Add response interceptor to handle 401 errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Session expired or unauthorized. Clearing session.')
      localStorage.removeItem('hr_session')
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
