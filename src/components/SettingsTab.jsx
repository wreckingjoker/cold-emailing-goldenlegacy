import { useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">{label}</label>
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 flex items-center gap-2">
        <span className="w-4 h-4 text-gray-300">🔒</span>
        {value}
      </div>
    </div>
  )
}

const STORAGE_KEY = 'gl_campaign_settings'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function SettingsTab() {
  const saved = loadSaved()
  const [dailyLimit, setDailyLimit] = useState(saved?.dailyLimit ?? 50)
  const [sendTime, setSendTime] = useState(saved?.sendTime ?? '09:00')
  const [activeDays, setActiveDays] = useState(saved?.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleDay(day) {
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function handleSave() {
    if (activeDays.length === 0) {
      showToast('Select at least one send day.', 'error')
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dailyLimit: Number(dailyLimit), sendTime, days: activeDays }))
    showToast('Settings saved. Takes effect on next scheduled run.')
  }

  return (
    <div className="space-y-8 max-w-xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Campaign Settings</h2>
        <p className="text-gray-400 text-sm mt-0.5">Changes take effect on the next scheduled run.</p>
      </div>

      {/* Sender info — read-only */}
      <section className="space-y-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Sender (read-only)</h3>
        <div className="grid grid-cols-1 gap-3">
          <ReadOnlyField label="Sender Name" value="Arvind Pal Singh" />
          <ReadOnlyField label="Sender Email" value="info@goldenlegacy.ae" />
          <ReadOnlyField label="CC (always)" value="fatema@goldenfortune.ae" />
        </div>
      </section>

      {/* Send schedule */}
      <section className="space-y-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Send Schedule</h3>

        {/* Daily limit */}
        <div>
          <label className="block text-gray-600 text-sm mb-1.5">
            Daily Email Limit
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={dailyLimit}
            onChange={e => setDailyLimit(e.target.value)}
            className="w-32 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Send time */}
        <div>
          <label className="block text-gray-600 text-sm mb-1.5">
            Send Time <span className="text-gray-400 text-xs">(GST — Asia/Dubai, UTC+4)</span>
          </label>
          <input
            type="time"
            value={sendTime}
            onChange={e => setSendTime(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Days */}
        <div>
          <label className="block text-gray-600 text-sm mb-2">Send Days</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeDays.includes(day)
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors"
      >
        Save Settings
      </button>
    </div>
  )
}
