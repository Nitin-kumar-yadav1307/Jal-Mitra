import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft, Clock, MapPin, Phone, Truck, HandHeart,
  CheckCircle, Navigation, MessageSquare, Send, AlertCircle,
  IndianRupee, Droplet, Users
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const STATUS_STEPS = ['open', 'helper_found', 'in_transit', 'delivered']
const STATUS_LABELS = {
  open: 'Open',
  helper_found: 'Helper Found',
  in_transit: 'In Transit',
  delivered: 'Delivered'
}

const URGENCY_STYLES = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20'
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [request, setRequest] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [tankerLocation, setTankerLocation] = useState(null)
  const [transitForm, setTransitForm] = useState({ vehicleNumber: '', driverName: '' })
  const [isTracking, setIsTracking] = useState(false)
  const trackingInterval = useRef(null)
  const messagesEndRef = useRef(null)

  const fetchRequest = async () => {
    try {
      const res = await axios.get(`${API}/requests/${id}`, { withCredentials: true })
      setRequest(res.data)
      if (res.data.transport?.currentLocation?.lat) {
        setTankerLocation(res.data.transport.currentLocation)
      }
    } catch {
      toast.error('Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/messages/${id}`, { withCredentials: true })
      setMessages(res.data)
    } catch {
      toast.error('Failed to load messages')
    }
  }

  useEffect(() => {
    fetchRequest()
    fetchMessages()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return
    socket.emit('join:request', id)

    socket.on('location:update', ({ requestId, lat, lng }) => {
      if (requestId === id) setTankerLocation({ lat, lng })
    })

    socket.on('request:updated', (updated) => {
      if (updated._id === id) setRequest(updated)
    })

    socket.on('message:new', (message) => {
      if (message.requestId === id) {
        setMessages(prev => [...prev, message])
      }
    })

    return () => {
      socket.off('location:update')
      socket.off('request:updated')
      socket.off('message:new')
    }
  }, [socket, id])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    setIsTracking(true)
    toast.success('Live GPS tracking started!')

    trackingInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          socket.emit('location:send', { requestId: id, lat, lng })
          axios.patch(`${API}/requests/${id}/location`, { lat, lng }, { withCredentials: true })
        },
        (err) => console.log('GPS error:', err)
      )
    }, 10000)
  }

  const stopTracking = () => {
    setIsTracking(false)
    clearInterval(trackingInterval.current)
    toast.success('GPS Tracking stopped')
  }

  useEffect(() => {
    return () => clearInterval(trackingInterval.current)
  }, [])

  const handleStartTransit = async (e) => {
    e.preventDefault()
    try {
      await axios.patch(`${API}/requests/${id}/transit`, transitForm, { withCredentials: true })
      toast.success('Transit officially started!')
      startTracking()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start transit')
    }
  }

  const handleDelivered = async () => {
    try {
      await axios.patch(`${API}/requests/${id}/delivered`, {}, { withCredentials: true })
      toast.success('Water marked as successfully delivered! 🎉')
      stopTracking()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark delivered')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      await axios.post(`${API}/messages`, {
        content: newMessage,
        requestId: id
      }, { withCredentials: true })
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] gap-4">
      <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium">Loading request details...</p>
    </div>
  )

  if (!request) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] text-center">
      <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
      <h2 className="text-xl font-bold text-gray-300">Request Not Found</h2>
      <p className="text-gray-500 mt-2">This request might have been removed or doesn't exist.</p>
    </div>
  )

  const isHelper = request.helperSociety?._id === user?._id
  const isOwner = request.postedBy?._id === user?._id
  const currentStep = STATUS_STEPS.indexOf(request.status)
  const mapCenter = tankerLocation
    ? [tankerLocation.lat, tankerLocation.lng]
    : [request.postedBy?.location?.lat || 19.2952, request.postedBy?.location?.lng || 72.8544]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main Request Info Card */}
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">{request.societyName}</h1>
            <p className="text-gray-400 flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4" /> {request.area}
            </p>

            <p className="text-gray-300 mt-4 leading-relaxed">{request.description}</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 border ${URGENCY_STYLES[request.urgency]}`}>
              {request.urgency === 'critical' ? <AlertCircle className="w-3.5 h-3.5" /> : null}
              {request.urgency}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800/60">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Requested Amount</span>
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Droplet className="w-4 h-4" /> {request.litersNeeded?.toLocaleString()} L
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Cost Contribution</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <IndianRupee className="w-4 h-4" />
              {request.agreedCostSplit > 0 ? request.agreedCostSplit : 'None'}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Contact Person</span>
            <div className="flex items-center gap-1.5 text-gray-300 font-medium text-sm">
              <Phone className="w-4 h-4 text-gray-500" /> {request.postedBy?.phone}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Helper Society</span>
            <div className="flex items-center gap-1.5 text-gray-300 font-medium text-sm">
              <HandHeart className="w-4 h-4 text-purple-400" />
              {request.helperSociety ? request.helperSociety.societyName : <span className="text-gray-600">Waiting for help</span>}
            </div>
          </div>
        </div>

        {request.transport?.vehicleNumber && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-cyan-900/10 border border-blue-500/20 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 font-medium">Vehicle:</span>
              <span className="text-white font-bold">{request.transport.vehicleNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-400 font-medium">Driver:</span>
              <span className="text-white font-bold">{request.transport.driverName}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline Card */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden">
            <h2 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-cyan-400" /> Track Progress
            </h2>
            <div className="flex items-center justify-between relative px-2">
              {/* Progress Line */}
              <div className="absolute left-6 right-6 top-5 h-1 bg-gray-800 -z-10 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step} className="flex flex-col items-center relative z-10 w-20">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-900 text-white' :
                      isCurrent ? 'bg-cyan-500 border-cyan-900/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-2 ring-cyan-500/30' :
                        'bg-gray-800 border-gray-900 text-gray-500'
                      }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-3 text-center font-bold uppercase tracking-wider ${isCurrent ? 'text-cyan-400' :
                      isCompleted ? 'text-emerald-500' : 'text-gray-600'
                      }`}>
                      {STATUS_LABELS[step]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Map (Dark Mode Theme) */}
          {request.status === 'in_transit' && (
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl p-1 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-[1000] bg-[#161b22]/90 backdrop-blur border border-gray-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold text-white">
                <Navigation className="w-4 h-4 text-cyan-400" />
                Live Tanker Location
              </div>

              <div className="h-80 sm:h-96 w-full rounded-xl overflow-hidden bg-[#0a0a0a]">
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  {/* Using Standard OpenStreetMap mapping as requested */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[request.postedBy?.location?.lat || 19.2952, request.postedBy?.location?.lng || 72.8544]}>
                    <Popup className="dark-popup">📍 {request.societyName} (Destination)</Popup>
                  </Marker>
                  {tankerLocation && (
                    <Marker position={[tankerLocation.lat, tankerLocation.lng]} icon={redIcon}>
                      <Popup className="dark-popup">🚛 Tanker — {request.transport?.driverName}</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              {!tankerLocation && (
                <div className="absolute inset-0 z-[1000] bg-[#161b22]/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-[#1c2128] border border-gray-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                    <span className="text-gray-300 font-medium">Waiting for driver's GPS signal...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transit Action Forms (for Helper) */}
          {isHelper && request.status === 'helper_found' && (
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" /> Dispatch Delivery Vehicle
              </h2>
              <form onSubmit={handleStartTransit} className="flex gap-4 flex-col sm:flex-row flex-wrap">
                <input
                  type="text"
                  placeholder="Vehicle Number (MH04 AB 1234)"
                  value={transitForm.vehicleNumber}
                  onChange={e => setTransitForm({ ...transitForm, vehicleNumber: e.target.value })}
                  required
                  className="flex-1 min-w-[200px] bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Driver Name"
                  value={transitForm.driverName}
                  onChange={e => setTransitForm({ ...transitForm, driverName: e.target.value })}
                  required
                  className="flex-1 min-w-[200px] bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 whitespace-nowrap"
                >
                  Start Trip
                </button>
              </form>
            </div>
          )}

          {isHelper && request.status === 'in_transit' && (
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div>
                <h2 className="font-bold text-white flex items-center gap-2 mb-1">
                  <Navigation className="w-5 h-5 text-emerald-400" /> Tracking Controls
                </h2>
                <p className="text-gray-500 text-sm">GPS location drops every 10 seconds.</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                {!isTracking ? (
                  <button onClick={startTracking} className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-5 py-2.5 rounded-xl font-semibold transition">
                    Start Broadcasting
                  </button>
                ) : (
                  <div className="flex items-center justify-center px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl gap-2 text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping relative"><span className="absolute inset-0 rounded-full bg-emerald-500 animate-none"></span></span>
                    Live GPS On
                  </div>
                )}
                <button
                  onClick={handleDelivered}
                  className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  Mark Delivered <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Request-specific Chat Pane */}
        <div>
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-xl flex flex-col h-[500px] lg:h-full lg:min-h-[600px] overflow-hidden sticky top-24">
            <div className="p-4 border-b border-gray-800 bg-[#1c2128]">
              <h2 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" /> Order Discussion
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d1117] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 opacity-60">
                  <MessageSquare className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">No messages yet.</p>
                  <p className="text-xs text-center px-4">Coordinate delivery details here.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId?._id === user?._id
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${isMe
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm'
                        : 'bg-[#1c2128] border border-gray-800 text-gray-200 rounded-tl-sm'
                        }`}>
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-gray-700/50">
                            <span className="font-bold text-cyan-400 text-[11px] uppercase tracking-wide">{msg.senderId?.name}</span>
                            <span className="text-gray-500 text-[10px] truncate max-w-[80px]">({msg.senderId?.societyName})</span>
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] font-bold mt-1.5 text-right uppercase tracking-wider ${isMe ? 'text-cyan-200/70' : 'text-gray-600'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-[#161b22]">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors shadow-inner text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}