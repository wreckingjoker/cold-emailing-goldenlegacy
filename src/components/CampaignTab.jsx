import { useState, useEffect, useRef } from 'react'
import { getStats, startCampaign, pauseCampaign } from '../api/n8n'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function CampaignTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [toast, setToast] = useState(null)
  const intervalRef = useRef(null)

  async function fetchStats() {
    try {
      const data = await getStats()
      setStats(data)
      setError(null)
    } catch (e) {
      setError('Could not load campaign stats. Check your n8n webhook is active.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    intervalRef.current = setInterval(fetchStats, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleToggle() {
    setToggling(true)
    try {
      if (stats?.active) {
        await pauseCampaign()
        showToast('Campaign paused.')
      } else {
        await startCampaign()
        showToast('Campaign started!')
      }
      await fetchStats()
    } catch (e) {
      showToast('Action failed — check n8n connection.', 'error')
    } finally {
      setToggling(false)
    }
  }

  const sent = stats?.sent ?? 0
  const total = stats?.total ?? 0
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0
  const isActive = stats?.active

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Campaign Overview</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {stats?.lastSentAt
              ? `Last sent: ${new Date(stats.lastSentAt).toLocaleString()}`
              : 'No emails sent yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
            isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isActive ? 'Active' : 'Paused'}
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling || loading}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {toggling ? 'Working...' : isActive ? 'Pause Campaign' : 'Start Campaign'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats?.total} color="text-gray-900" />
        <StatCard label="Sent" value={stats?.sent} color="text-green-600" />
        <StatCard label="Pending" value={stats?.pending} color="text-amber-600" />
        <StatCard label="Failed" value={stats?.failed} color="text-red-600" />
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="text-amber-600 font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs">{sent} of {total} emails sent</p>
        </div>
      )}

      {loading && (
        <p className="text-gray-400 text-sm text-center py-8">Loading stats...</p>
      )}
    </div>
  )
}
