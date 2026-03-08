import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'
import { AlertTriangle, Users, Droplets, Shield, Trash2, Send } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  helper_found: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  in_transit: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
}

const URGENCY_COLORS = {
  critical: 'bg-red-500/10 text-red-500 border border-red-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border border-green-500/20'
}

export default function Admin() {
  const { socket } = useSocket()
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [sendingAlert, setSendingAlert] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, userRes] = await Promise.all([
          axios.get(`${API}/requests`, { withCredentials: true }),
          axios.get(`${API}/auth/users`, { withCredentials: true })
        ])
        setRequests(reqRes.data)
        setUsers(userRes.data)
      } catch {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to completely remove ${userName}?`)) return
    try {
      await axios.delete(`${API}/auth/users/${userId}`, { withCredentials: true })
      setUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleSendAlert = async (e) => {
    e.preventDefault()
    if (!alert.trim()) return
    setSendingAlert(true)
    try {
      await axios.post(`${API}/messages`, {
        content: `🚨 ADMIN ALERT: ${alert}`,
        requestId: null
      }, { withCredentials: true })
      toast.success('Alert broadcasted to all societies!')
      setAlert('')
    } catch {
      toast.error('Failed to send alert')
    } finally {
      setSendingAlert(false)
    }
  }

  const stats = [
    { label: 'Total Requests', value: requests.length, icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Open', value: requests.filter(r => r.status === 'open').length, icon: Droplets, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'In Transit', value: requests.filter(r => r.status === 'in_transit').length, icon: Droplets, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Delivered', value: requests.filter(r => r.status === 'delivered').length, icon: Droplets, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] gap-4">
      <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium">Loading command center...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className={`w-16 h-16 ${stat.color}`} />
            </div>
            <div className="relative z-10">
              <p className={`text-3xl font-extrabold ${stat.color} mb-1 drop-shadow-sm`}>{stat.value}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* City-wide Alert Box */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
        <h2 className="font-bold text-red-500 mb-2 flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5" /> Broadcast City-Wide Alert
        </h2>
        <p className="text-red-400/70 text-sm mb-4">This message will immediately appear in the Community Hub for all connected society reps.</p>
        <form onSubmit={handleSendAlert} className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            value={alert}
            onChange={e => setAlert(e.target.value)}
            placeholder="e.g. Water supply suspended in Mira Road East for 24 hours..."
            className="flex-1 bg-[#0d1117] border border-red-900/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={sendingAlert || !alert.trim()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {sendingAlert ? 'Broadcasting...' : (
              <>Broadcast <Send className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 bg-[#161b22] p-1.5 rounded-xl border border-gray-800 inline-flex">
        <button
          onClick={() => setTab('requests')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'requests'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          Water Requests
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'users'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          Registered Users
        </button>
      </div>

      {/* Requests Table */}
      {tab === 'requests' && (
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#1c2128] text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Society</th>
                <th className="px-6 py-4">Area</th>
                <th className="px-6 py-4">Liters</th>
                <th className="px-6 py-4">Urgency</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Helper</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-white/[0.02] text-gray-300 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{req.societyName}</td>
                  <td className="px-6 py-4 text-gray-400">{req.area}</td>
                  <td className="px-6 py-4 font-medium text-cyan-400">{req.litersNeeded?.toLocaleString()} L</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${URGENCY_COLORS[req.urgency]}`}>
                      {req.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${STATUS_COLORS[req.status]}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{req.helperSociety?.societyName || '—'}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{new Date(req.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium">No requests generated yet.</div>
          )}
        </div>
      )}

      {/* Users Table */}
      {tab === 'users' && (
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#1c2128] text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Society Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.02] text-gray-300 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-medium">{u.phone}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-300">{u.societyName}</p>
                    <p className="text-xs text-cyan-500/80 mt-0.5">{u.area}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${u.role === 'admin'
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="inline-flex items-center justify-center p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors group"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}