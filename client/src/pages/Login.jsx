import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Droplet, Mail, Lock, ArrowRight, ShieldCheck, Map, Clock, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(formData.email, formData.password)
      toast.success('Welcome back to Jal Mitra!', {
        icon: '💧',
        style: { borderRadius: '10px', background: '#161b22', color: '#fff' }
      })
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (email, password) => {
    setFormData({ email, password })
  }

  return (
    <div className="min-h-screen flex bg-[#0f1117] selection:bg-cyan-500/30">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-16 bg-[#161b22] relative overflow-hidden border-r border-gray-800/50">
        {/* Decorative ambient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-70"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Jal Mitra</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 leading-tight">
            Water coordination for<br />every society in Mira Bhayandar.
          </h1>
          <p className="text-base leading-relaxed text-gray-400 mb-12 max-w-md">
            A community-driven platform where society representatives coordinate water sharing, arrange transport, and track deliveries live.
          </p>
          <div className="space-y-6 max-w-md">
            {[
              { icon: ShieldCheck, title: 'Secure & Verified', desc: 'Only valid registered societies can join the network' },
              { icon: Map, title: 'Smart Distribution', desc: 'Find water availability nearest to your location' },
              { icon: Clock, title: 'Real-time Coordination', desc: 'Connect instantly during supply cuts via Community Hub' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-colors group">
                <div className="mt-1 bg-[#0f1117] p-2.5 rounded-xl border border-gray-800 group-hover:border-cyan-500/50 transition-colors">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1 tracking-wide">{title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[280px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-500 font-medium">© 2026 Jal Mitra · Municipal Corporation</p>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-grid-slate-800/[0.04] bg-[size:20px_20px]"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex justify-center items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-blue-500/20">
              <Droplet className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-white text-2xl tracking-tight">Jal Mitra</span>
          </div>

          <div className="bg-[#161b22] sm:bg-transparent p-8 sm:p-0 rounded-3xl border border-gray-800 sm:border-none shadow-2xl sm:shadow-none">
            <div className="mb-8 hidden sm:block">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-400 font-medium">Sign in to your society representative account</p>
            </div>

            <div className="mb-8 sm:hidden text-center">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
              <p className="text-sm text-gray-400">Access your society dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold mb-2 uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="society@example.com"
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">Password</label>
                  <a href="#" className="text-[11px] font-medium text-cyan-500 hover:text-cyan-400 transition-colors">Forgot?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative flex items-center justify-center py-3.5 rounded-xl font-bold text-white text-sm transition-all shadow-lg overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-blue-500/25 active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <span className="animate-pulse">Signing in...</span>
                    ) : (
                      <>
                        Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#161b22] sm:bg-[#0f1117] px-4 text-gray-500 font-medium tracking-wide">QUICK DEMO</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Admin Access', email: 'admin@jalmitra.com', pass: 'admin123' },
                { label: 'Society Rep', email: 'rahul@gmail.com', pass: 'password123' },
              ].map(({ label, email, pass }) => (
                <button
                  key={label}
                  onClick={() => quickLogin(email, pass)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0d1117] border border-gray-800 hover:border-cyan-500/50 hover:bg-white/[0.02] transition-colors group"
                >
                  <LogIn className="w-4 h-4 text-gray-500 mb-1.5 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">{label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-sm font-medium mt-8 text-gray-400">
              New to the network?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                Register society
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}