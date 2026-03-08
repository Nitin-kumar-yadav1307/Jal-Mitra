import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Droplet, Plus, Info, CheckCircle, Clock, Truck, HandHeart, AlertCircle, Phone, IndianRupee, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

const URGENCY_STYLES = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20'
}

const STATUS_STYLES = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  helper_found: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  in_transit: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

const STATUS_LABELS = {
  open: 'Open',
  helper_found: 'Helper Found',
  in_transit: 'In Transit',
  delivered: 'Delivered'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    litersNeeded: '',
    description: '',
    urgency: 'moderate',
    agreedCostSplit: ''
  })

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/requests`, { withCredentials: true })
      setRequests(res.data)
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('request:updated', (updated) => {
      setRequests(prev => {
        const exists = prev.find(r => r._id === updated._id)
        if (exists) return prev.map(r => r._id === updated._id ? updated : r)
        return [updated, ...prev]
      })
    })
    return () => socket.off('request:updated')
  }, [socket])

  const handleHelp = async (requestId) => {
    try {
      await axios.patch(`${API}/requests/${requestId}/help`, {}, { withCredentials: true })
      toast.success('You offered to help!')
      navigate(`/request/${requestId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to offer help')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await axios.post(`${API}/requests`, {
        ...form,
        litersNeeded: Number(form.litersNeeded),
        agreedCostSplit: Number(form.agreedCostSplit)
      }, { withCredentials: true })
      toast.success('Water request posted!')
      setShowModal(false)
      setForm({ litersNeeded: '', description: '', urgency: 'moderate', agreedCostSplit: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request')
    } finally {
      setSubmitting(false)
    }
  }

  const myRequests = requests.filter(r => r.postedBy?._id === user?._id)
  const otherRequests = requests.filter(r => r.postedBy?._id !== user?._id)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Water Aid Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, <span className="text-gray-200 font-medium">{user?.name}</span> — {user?.societyName}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Post Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Requests', value: requests.length, icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Open', value: requests.filter(r => r.status === 'open').length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'In Transit', value: requests.filter(r => r.status === 'in_transit').length, icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Delivered', value: requests.filter(r => r.status === 'delivered').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        ].map(stat => (
          <div key={stat.label} className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-lg group hover:border-gray-700 transition duration-300">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Other Requests */}
          <div>
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <GlobeIcon className="w-5 h-5 text-blue-400" />
              Community Requests
            </h2>
            {loading ? (
              <div className="text-center py-12 text-gray-400 bg-[#161b22] border border-gray-800 rounded-2xl animate-pulse">
                Loading requests...
              </div>
            ) : otherRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-[#161b22] border border-gray-800 rounded-2xl">
                No active community requests.
              </div>
            ) : (
              <div className="space-y-4">
                {otherRequests.map(req => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    isOwner={false}
                    onView={() => navigate(`/request/${req._id}`)}
                    onHelp={() => handleHelp(req._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {/* My Requests Side Panel */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" />
              My Active Requests
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">You haven't posted any requests yet.</p>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => (
                  <RequestCardMini
                    key={req._id}
                    req={req}
                    onView={() => navigate(`/request/${req._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Post Water Request</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Liters Needed</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Droplet className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={form.litersNeeded}
                    onChange={e => setForm({ ...form, litersNeeded: e.target.value })}
                    required
                    placeholder="e.g. 5000"
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe your situation..."
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Urgency</label>
                <div className="relative">
                  <select
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors appearance-none"
                  >
                    <option value="critical">🔴 Critical - Urgent Help Needed</option>
                    <option value="moderate">🟡 Moderate - Can wait a bit</option>
                    <option value="low">🟢 Low - Routine request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Cost Contribution (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={form.agreedCostSplit}
                    onChange={e => setForm({ ...form, agreedCostSplit: e.target.value })}
                    placeholder="Amount you'll contribute"
                    className="w-full bg-[#0d1117] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestCard({ req, isOwner, onView, onHelp }) {
  return (
    <div className="bg-[#161b22] border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300 group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-gray-100 text-lg group-hover:text-cyan-400 transition-colors">{req.societyName}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                <GlobeIcon className="w-3.5 h-3.5" />
                {req.area}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${URGENCY_STYLES[req.urgency]}`}>
                {req.urgency === 'critical' ? <AlertCircle className="w-3.5 h-3.5" /> : null}
                {req.urgency.toUpperCase()}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_STYLES[req.status]}`}>
                {STATUS_LABELS[req.status]}
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mt-3 line-clamp-2">{req.description}</p>

          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm">
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg">
              <Droplet className="w-4 h-4" />
              <span className="font-medium">{req.litersNeeded.toLocaleString()} L</span>
            </div>
            {req.agreedCostSplit > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                <IndianRupee className="w-4 h-4" />
                <span className="font-medium">{req.agreedCostSplit} contribution</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{req.postedBy?.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={onView}
            className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            View Details
          </button>
          {!isOwner && req.status === 'open' && (
            <button
              onClick={onHelp}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <HandHeart className="w-4 h-4" />
              Offer Help
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RequestCardMini({ req, onView }) {
  return (
    <div
      onClick={onView}
      className="bg-[#0d1117] border border-gray-800 hover:border-gray-700 rounded-xl p-4 cursor-pointer transition-colors group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase ${STATUS_STYLES[req.status]}`}>
          {STATUS_LABELS[req.status]}
        </span>
        <span className="text-xs text-gray-500 font-medium">{req.litersNeeded}L</span>
      </div>
      <p className="text-gray-300 text-sm font-medium line-clamp-1 group-hover:text-cyan-400 transition-colors">
        {req.description}
      </p>
    </div>
  )
}

function GlobeIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}