import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401 || status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
      if (status === 504) {
        const event = new CustomEvent('app-toast', {
          detail: {
            type: 'warning',
            message: 'La consulta de datos históricos está tomando más tiempo del esperado. Reintentando...',
          },
        })
        window.dispatchEvent(event)
      }
    }
    return Promise.reject(error)
  }
)

export default api
