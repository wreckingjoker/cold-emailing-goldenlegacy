import { useState, useEffect } from 'react'
import { getContacts } from '../api/n8n'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-600',
  sent:    'bg-green-50 text-green-600',
  failed:  'bg-red-50 text-red-600',
  opened:  'bg-blue-50 text-blue-600',
}

const FILTERS = ['all', 'pending', 'sent', 'failed', 'opened']

export default function ContactsTab() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getContacts()
      setContacts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Could not load contacts. Check your n8n /webhook/contacts is active.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all'
    ? contacts
    : contacts.filter(c => c.status === filter)

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <p className="text-gray-400 text-sm mt-0.5">{contacts.length} total</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-40 text-gray-600"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-amber-500 text-black'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              {filter === 'all' ? 'No contacts found.' : `No ${filter} contacts.`}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Sent At</th>
                  <th className="text-left px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id ?? i}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.company || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-500'}`}>
                        {c.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-red-500 text-xs max-w-xs truncate">
                      {c.error || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {loading && (
        <p className="text-gray-400 text-sm text-center py-8">Loading contacts...</p>
      )}
    </div>
  )
}
