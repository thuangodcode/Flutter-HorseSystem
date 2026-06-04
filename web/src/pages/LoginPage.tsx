import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../auth/SessionContext'
import axios from 'axios'

export function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email, password })
      navigate('/app')
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = err.response.data?.message
        if (msg === 'INVALID_CREDENTIALS') {
          setError('Email hoặc mật khẩu không chính xác.')
        } else {
          setError(msg || 'Đăng nhập thất bại. Vui lòng thử lại.')
        }
      } else {
        setError('Không thể kết nối đến máy chủ. Kiểm tra Backend đang chạy chưa.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        '--color-primary': '#0ea5e9',
        '--color-secondary': '#0ea5e9',
        '--color-surface-container': '#f8fafc',
        '--color-on-surface': '#0f172a',
      } as React.CSSProperties}
    >
      <style>{`
        .glass-darker {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(14, 165, 233, 0.15);
          box-shadow: 0 20px 50px rgba(14, 165, 233, 0.08);
        }
        .glow-sphere-1 {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 50%;
          height: 60%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .glow-sphere-2 {
          position: absolute;
          bottom: -10%;
          right: -10%;
          width: 50%;
          height: 60%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .role-card {
          transition: all 0.2s ease;
        }
        .role-card:hover {
          border-color: #0ea5e9;
        }
      `}</style>

      {/* Decorative Orbs */}
      <div className="glow-sphere-1"></div>
      <div className="glow-sphere-2"></div>

      <div className="glass-darker w-full max-w-5xl rounded-[2rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side Info Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-sky-600 via-sky-800 to-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle details */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 text-white no-underline mb-12">
              <span className="material-symbols-outlined text-3xl text-sky-300" data-icon="stadium">stadium</span>
              <span className="font-headline font-bold text-xl tracking-tight">Equestrian Elite</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">Hệ Thống Trực Tuyến</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
              Chào mừng <br />
              trở lại! 🏆
            </h1>
            
            <p className="text-sky-100/80 font-medium text-sm leading-relaxed mb-8">
              Đăng nhập để cập nhật lịch thi đấu, quản lý chiến mã và tham gia dự đoán kết quả các cuộc đua đỉnh cao.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: 'pets', text: 'Quản lý chiến mã và jockey' },
              { icon: 'sports_score', text: 'Theo dõi kết quả real-time' },
              { icon: 'military_tech', text: 'Tham gia giải đấu danh giá' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="material-symbols-outlined text-sky-300 text-lg" data-icon={item.icon}>{item.icon}</span>
                <span className="text-xs font-semibold text-sky-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="lg:col-span-7 bg-white p-8 md:p-12 flex flex-col justify-center" style={{ backgroundColor: '#ffffff' }}>
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2" style={{ color: '#0f172a' }}>Đăng Nhập</h2>
            <p className="text-slate-500 text-sm font-medium" style={{ color: '#64748b' }}>Điền thông tin tài khoản của bạn để đăng nhập</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ color: '#475569' }}>
                Email
              </span>
              <div className="relative rounded-xl shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined text-lg" data-icon="mail">mail</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium text-slate-900"
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    paddingLeft: '40px',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ color: '#475569' }}>
                Mật Khẩu
              </span>
              <div className="relative rounded-xl shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400" style={{ color: '#94a3b8' }}>
                  <span className="material-symbols-outlined text-lg" data-icon="lock">lock</span>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium text-slate-900"
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    paddingLeft: '40px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ color: '#94a3b8', background: 'transparent', border: 'none' }}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-shake">
                <span className="material-symbols-outlined text-lg" data-icon="error">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
              style={{
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <span className="material-symbols-outlined text-lg" data-icon="login">login</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs font-semibold text-slate-500 mt-8" style={{ color: '#64748b' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-sky-500 hover:text-sky-600 no-underline font-bold transition-colors">Đăng ký ngay →</Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 no-underline font-medium transition-colors" style={{ color: '#94a3b8' }}>
              <span className="material-symbols-outlined text-base" data-icon="arrow_back">arrow_back</span>
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
