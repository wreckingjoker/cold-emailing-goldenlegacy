import { useState, useRef } from 'react'
import { saveTemplate } from '../api/n8n'

const DEFAULT_TEMPLATE = `Dear {{company}},

I hope this message finds you well.

Seven years ago, I began an entrepreneurial journey with a vision to build something meaningful, client-focused, and built on trust. What started as an idea grew into Golden Fortune — a journey shaped by your support, collaboration, and confidence in us. For that, I remain sincerely grateful.

Today, I would like to personally inform you of an important development.

I, Arvind Pal Singh, have officially restructured and rebranded our operations under a new entity — Golden Legacy. This transition reflects internal strategic changes designed to support long-term growth, improved agility, and an enhanced service framework for our valued clients.

While the name has evolved, our foundation remains unchanged.

Golden Legacy has been established with a renewed vision — to provide more innovative, responsive, and personalized solutions while maintaining the same integrity, professionalism, and commitment you have always experienced.

Under Golden Legacy, you can expect:
  • Greater flexibility in how we collaborate
  • Enhanced and more personalized client service
  • Expanded and improved solution offerings
  • Faster decision-making and response timelines
  • A stronger focus on your long-term strategic goals

This transition is a forward-looking step, allowing us to operate with improved efficiency and a sharper focus on delivering measurable value to you.

I deeply value the relationship we have built over the years and sincerely hope to continue our partnership under this new chapter. It would be my privilege to support your future plans through Golden Legacy.

Should you wish to understand more about this transition or explore upcoming opportunities, I would be pleased to arrange a brief call at your convenience.

New Contact Details:
Company Name: Golden Legacy
Website: www.goldenlegacy.ae
Email: info@goldenlegacy.ae
Phone: +971-55-6656007

Thank you once again for your continued trust and support. I look forward to strengthening our association and beginning this exciting new chapter together.

Warm regards,
Arvind Pal Singh
Founder & CEO
Golden Legacy
Direct Email: info@goldenlegacy.ae
Mobile: +971-556656007`

const DEFAULT_SUBJECT = 'An Important Update from Arvind Pal Singh — Golden Legacy'

export default function TemplateTab() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [previewName, setPreviewName] = useState('')
  const [previewCompany, setPreviewCompany] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [savedAt, setSavedAt] = useState(null)
  const textareaRef = useRef(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function insertTag(tag) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = template.slice(0, start) + tag + template.slice(end)
    setTemplate(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  function validateTemplate(t) {
    const valid = ['{{name}}', '{{company}}']
    const found = t.match(/\{\{[^}]+\}\}/g) || []
    const invalid = found.filter(tag => !valid.includes(tag))
    return invalid
  }

  async function handleSave() {
    const invalid = validateTemplate(template)
    if (invalid.length > 0) {
      showToast(`Invalid merge tags: ${invalid.join(', ')}`, 'error')
      return
    }
    setSaving(true)
    try {
      await saveTemplate(template, subject)
      const ts = new Date().toLocaleString()
      setSavedAt(ts)
      showToast('Template saved to n8n.')
    } catch (e) {
      showToast('Save failed — check n8n connection.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const preview = template
    .replace(/\{\{name\}\}/g, previewName || '{{name}}')
    .replace(/\{\{company\}\}/g, previewCompany || '{{company}}')

  const invalidTags = validateTemplate(template)

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Template</h2>
          {savedAt && (
            <p className="text-gray-400 text-xs mt-0.5">Last saved: {savedAt}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors text-gray-600"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Subject line (editable) */}
      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-3 gap-2">
        <span className="text-gray-400 text-xs whitespace-nowrap">Subject:</span>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="flex-1 text-sm text-gray-700 bg-transparent focus:outline-none"
        />
      </div>

      {/* Merge tag helpers */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">Insert:</span>
        {['{{name}}', '{{company}}'].map(tag => (
          <button
            key={tag}
            onClick={() => insertTag(tag)}
            disabled={showPreview}
            className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded font-mono transition-colors disabled:opacity-30"
          >
            {tag}
          </button>
        ))}
        {invalidTags.length > 0 && (
          <span className="text-red-600 text-xs ml-2">
            Unknown tags: {invalidTags.join(', ')}
          </span>
        )}
      </div>

      {showPreview ? (
        <div className="space-y-4">
          {/* Preview inputs */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Sample name"
              value={previewName}
              onChange={e => setPreviewName(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Sample company"
              value={previewCompany}
              onChange={e => setPreviewCompany(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
          </div>
          {/* Rendered preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto">
            {preview}
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={template}
          onChange={e => setTemplate(e.target.value)}
          rows={22}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 font-mono leading-relaxed focus:outline-none focus:border-amber-500 resize-none"
          spellCheck={false}
        />
      )}
    </div>
  )
}
