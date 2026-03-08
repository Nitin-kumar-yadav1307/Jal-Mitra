import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { MessageSquare, Send, Users, Activity } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Chat() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/messages`, { withCredentials: true })
      setMessages(res.data)
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return
    socket.on('message:new', (message) => {
      if (!message.requestId) {
        setMessages(prev => [...prev, message])
      }
    })
    return () => socket.off('message:new')
  }, [socket])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      await axios.post(`${API}/messages`, {
        content: newMessage,
        requestId: null
      }, { withCredentials: true })
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full flex-grow">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c2128] to-[#161b22] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Community Hub
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-2 mt-0.5">
                <Users className="w-3.5 h-3.5" /> All society representatives
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f1117]/50 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
              <Activity className="w-8 h-8 animate-pulse text-cyan-500/50" />
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 opacity-60">
              <MessageSquare className="w-12 h-12" />
              <p>Start a new conversation with the community.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId?._id === user?._id
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shadow-md border border-gray-700">
                      {msg.senderId?.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm shadow-lg leading-relaxed ${isMe
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm'
                    : 'bg-[#1c2128] text-gray-200 border border-gray-800/80 rounded-tl-sm'
                    }`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1.5 border-b border-gray-700/50 pb-1.5">
                        <span className="font-semibold text-cyan-400 text-xs tracking-wide">{msg.senderId?.name}</span>
                        <span className="text-gray-500 text-[10px] uppercase font-medium">{msg.senderId?.societyName}</span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    <p className={`text-[10px] font-medium mt-2 text-right ${isMe ? 'text-cyan-200/80' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t border-gray-800 bg-[#161b22]">
          <form onSubmit={sendMessage} className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message to the community..."
                className="w-full bg-[#0d1117] border border-gray-700 rounded-full pl-6 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white h-12 w-12 sm:w-auto sm:px-6 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5 -ml-0.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}