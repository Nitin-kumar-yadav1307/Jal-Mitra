import { useState, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Droplet, User, Phone, Mail, Lock, Building2, MapPin, ArrowRight } from 'lucide-react'

const AREAS = ['Mira Road East', 'Mira Road West', 'Bhayandar East', 'Bhayandar West', 'Kashimira']

const inputClass =
  "w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"

function InputWrapper({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </label>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    societyName: '',
    area: 'Mira Road East'
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await register({ ...formData, role: 'society_rep' })

      toast.success('Successfully registered! Welcome to the network.', {
        icon: '🌊',
        style: { borderRadius: '10px', background: '#161b22', color: '#fff' }
      })

      navigate('/dashboard')

    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#0f1117] relative overflow-hidden selection:bg-cyan-500/30">

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-600/10 to-blue-800/10 rounded-full mix-blend-screen blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-blue-500/20 mx-auto mb-5">
            <Droplet className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2 tracking-tight">
            Join the Network
          </h2>

          <p className="text-gray-400 text-base max-w-sm mx-auto font-medium">
            Register your society to manage water distribution securely.
          </p>
        </div>

        <div className="bg-[#161b22]/90 backdrop-blur-xl border border-gray-800/80 rounded-[2rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InputWrapper icon={User} label="Full Name">
                <input
                  type="text"
                  name="name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your registered name"
                  className={inputClass}
                />
              </InputWrapper>

              <InputWrapper icon={Phone} label="Contact Number">
                <input
                  type="tel"
                  name="phone"
                  autoComplete="off"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />
              </InputWrapper>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InputWrapper icon={Mail} label="Email Address">
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="official@society.com"
                  className={inputClass}
                />
              </InputWrapper>

              <InputWrapper icon={Lock} label="Secure Password">
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 6 characters"
                  className={inputClass}
                />
              </InputWrapper>

            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InputWrapper icon={Building2} label="Society / Building Name">
                <input
                  type="text"
                  name="societyName"
                  autoComplete="off"
                  value={formData.societyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Shanti Nagar CHS"
                  className={inputClass}
                />
              </InputWrapper>

              <InputWrapper icon={MapPin} label="City Area">

                <div className="relative">

                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {AREAS.map(area => (
                      <option key={area} value={area} className="bg-[#0f1117] text-gray-300">
                        {area}
                      </option>
                    ))}
                  </select>

                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>

                </div>

              </InputWrapper>

            </div>

            <div className="pt-2">

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-4 rounded-2xl font-bold text-white text-base transition-all shadow-lg group disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98]"
              >

                {loading ? 'Creating Account...' : (
                  <span className="flex items-center gap-2">
                    Complete Registration
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}

              </button>

            </div>

          </form>

          <div className="mt-8 text-center">

            <p className="text-[13px] text-gray-400">
              Already registered?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                Return to Login
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}