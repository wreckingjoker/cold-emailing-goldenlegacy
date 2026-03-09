import { useState } from 'react'
import brandLogo from '../../brand-logo.png'

const VALID_USER = 'goldenlegacy'
const VALID_PASS = 'admin@goldenlegacy'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    setTimeout(() => {
      if (username.trim() === VALID_USER && password === VALID_PASS) {
        sessionStorage.setItem('gl_auth', '1')
        onLogin()
      } else {
        setError('Invalid username or password.')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={brandLogo} alt="Golden Legacy" className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Golden Legacy · Campaign Dashboard
        </p>
      </div>
    </div>
  )
}
