import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getMe = async () => {
      try {
        const res = await axios.get(`${API}/auth/me`, { withCredentials: true })
        setUser(res.data)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    getMe()
  }, [])

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true })
    setUser(res.data)
    return res.data
  }

  const register = async (formData) => {
    const res = await axios.post(`${API}/auth/register`, formData, { withCredentials: true })
    setUser(res.data)
    return res.data
  }

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)