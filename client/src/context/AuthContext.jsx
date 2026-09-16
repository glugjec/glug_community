import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'glug_token'
const USER_KEY = 'glug_user'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY))
    } catch {
      return null
    }
  })
  const [authLoading, setAuthLoading] = useState(true)

  // Verify token and fetch fresh user profile on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        setAuthLoading(false)
        return
      }

      try {
        const data = await authApi.getMe()
        if (data?.user) {
          setUser(data.user)
          localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err.message)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
        setToken(null)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()

    const handleBannedEvent = (e) => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
      setToken(null)
      if (e?.detail) {
        sessionStorage.setItem('glug_banned_notice', JSON.stringify(e.detail))
      }
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    window.addEventListener('glug:banned', handleBannedEvent)
    return () => window.removeEventListener('glug:banned', handleBannedEvent)
  }, [])

  const login = (userData, tokenValue) => {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
    setToken(tokenValue)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
  }

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, authLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}