import { useState } from 'react'
import CampaignTab from './components/CampaignTab'
import ContactsTab from './components/ContactsTab'
import TemplateTab from './components/TemplateTab'
import SettingsTab from './components/SettingsTab'
import brandLogo from '../brand-logo.png'

const TABS = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'template', label: 'Template' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('campaign')
  const [pdfBase64, setPdfBase64] = useState(null)
  const [pdfName, setPdfName] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src={brandLogo} alt="Golden Legacy" className="h-12 w-auto" />
          <span className="text-gray-400 text-xs">info@goldenlegacy.ae</span>
        </div>

        {/* Tab Bar */}
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {activeTab === 'campaign' && <CampaignTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'template' && <TemplateTab pdfBase64={pdfBase64} pdfName={pdfName} setPdfBase64={setPdfBase64} setPdfName={setPdfName} />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}
