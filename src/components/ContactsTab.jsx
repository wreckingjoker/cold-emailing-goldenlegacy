import { useState, useEffect } from 'react'
import { getContacts, addContact } from '../api/n8n'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-600',
  sent:    'bg-green-50 text-green-600',
  failed:  'bg-red-50 text-red-600',
  opened:  'bg-blue-50 text-blue-600',
}

const FILTERS = ['all', 'pending', 'sent', 'failed', 'opened']

const EMPTY_FORM = { company: '', email: '' }

export default function ContactsTab() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  // Add contact modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

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

  function openModal() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormError(null)
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    if (!form.company.trim()) return setFormError('Company name is required.')
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setFormError('A valid email address is required.')

    setSaving(true)
    try {
      await addContact({ company: form.company.trim(), email: form.email.trim() })
      setSuccessMsg(`${form.company} added successfully.`)
      setShowModal(false)
      load()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setFormError('Failed to add contact. Check that /webhook/add-contact is active in n8n.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <p className="text-gray-400 text-sm mt-0.5">{contacts.length} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openModal}
            className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
          >
            + Add Contact
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-40 text-gray-600"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {successMsg}
        </div>
      )}

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

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Add Contact</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john@acme.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {formError && (
                <p className="text-red-500 text-xs">{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
