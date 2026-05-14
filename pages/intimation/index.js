import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const PLACEHOLDERS = ['{Name}', '{Email}', '{Phone}', '{Address}', '{CompanyName}', '{CompanyPhone}', '{CompanyAddress}']

export default function Intimation() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('send')

  // Data
  const [companies, setCompanies] = useState([])
  const [templates, setTemplates] = useState([])
  const [history, setHistory] = useState([])

  // Send page
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [senderName, setSenderName] = useState('')
  const [clientPaste, setClientPaste] = useState('')
  const [clients, setClients] = useState([])
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState([])

  // Company modal
  const [showCoModal, setShowCoModal] = useState(false)
  const [editingCo, setEditingCo] = useState(null)
  const [coForm, setCoForm] = useState({ name: '', phone: '', address: '', brandColor: '#185FA5', initials: '', senderEmail: '', senderName: '', logo: '' })

  // Template modal
  const [showTplModal, setShowTplModal] = useState(false)
  const [editingTpl, setEditingTpl] = useState(null)
  const [tplForm, setTplForm] = useState({ name: '', subject: '', emailBody: '', pdfTitle: '', pdfBody: '' })

  // History
  const [historyFilter, setHistoryFilter] = useState('all')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const res = await fetch('/api/intimation/check')
    if (res.status === 401) {
      router.push('/intimation/login')
      return
    }
    setAuthed(true)
    setLoading(false)
    loadCompanies()
    loadTemplates()
    loadHistory()
  }

  async function loadCompanies() {
  const res = await fetch('/api/intimation/companies')
  const data = await res.json()
  setCompanies(Array.isArray(data) ? data : [])
}

async function loadTemplates() {
  const res = await fetch('/api/intimation/templates')
  const data = await res.json()
  setTemplates(Array.isArray(data) ? data : [])
}

  async function loadHistory() {
  const res = await fetch('/api/intimation/history')
  const data = await res.json()
  setHistory(Array.isArray(data) ? data : [])
}

  async function logout() {
    await fetch('/api/intimation/logout', { method: 'POST' })
    router.push('/intimation/login')
  }

  // ── Client parsing ──
  function parseClients() {
    const lines = clientPaste.trim().split('\n').map(l => l.split('\t').map(c => c.trim()))
    const headers = lines[0].map(h => h.toLowerCase())
    const idx = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)))
    const nameI = idx(['name'])
    const emailI = idx(['email', 'mail'])
    const phoneI = idx(['phone', 'mobile', 'number'])
    const addrI = idx(['address', 'addr', 'city'])

    if (emailI === -1) {
      alert('Could not find Email column. Make sure your header row has "Email".')
      return
    }

    const parsed = lines.slice(1)
      .filter(r => r.length > 1 && r[emailI] && r[emailI].includes('@'))
      .map(r => ({
        name: nameI >= 0 ? r[nameI] || '' : '',
        email: r[emailI] || '',
        phone: phoneI >= 0 ? r[phoneI] || '' : '',
        address: addrI >= 0 ? r[addrI] || '' : '',
        status: 'pending',
      }))

    setClients(parsed)
  }

  // ── Send ──
  async function sendAll() {
    if (!selectedCompany) return alert('Please select a company.')
    if (!selectedTemplate) return alert('Please select a template.')
    if (!clients.length) return alert('Please paste and parse a client list.')

    setSending(true)
    setSendResults([])

    const res = await fetch('/api/intimation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: selectedCompany,
        templateId: selectedTemplate,
        clients: clients.map(({ name, email, phone, address }) => ({ name, email, phone, address })),
        senderName,
      }),
    })

    const data = await res.json()
    setSendResults(data.results || [])
    setSending(false)
    loadHistory()
  }

  // ── Company CRUD ──
  function openAddCo() {
    setEditingCo(null)
    setCoForm({ name: '', phone: '', address: '', brandColor: '#185FA5', initials: '', senderEmail: '', senderName: '', logo: '' })
    setShowCoModal(true)
  }

  function openEditCo(co) {
    setEditingCo(co)
    setCoForm({ name: co.name, phone: co.phone || '', address: co.address || '', brandColor: co.brandColor || '#185FA5', initials: co.initials || '', senderEmail: co.senderEmail, senderName: co.senderName, logo: co.logo || '' })
    setShowCoModal(true)
  }

  async function saveCo() {
    if (!coForm.name || !coForm.senderEmail || !coForm.senderName) return alert('Name, sender email and sender name are required.')
    const method = editingCo ? 'PUT' : 'POST'
    const body = editingCo ? { ...coForm, id: editingCo.id } : coForm
    await fetch('/api/intimation/companies', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowCoModal(false)
    loadCompanies()
  }

  async function deleteCo(id) {
    if (!confirm('Delete this company?')) return
    await fetch('/api/intimation/companies', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadCompanies()
  }

  // ── Template CRUD ──
  function openAddTpl() {
    setEditingTpl(null)
    setTplForm({ name: '', subject: '', emailBody: '', pdfTitle: '', pdfBody: '' })
    setShowTplModal(true)
  }

  function openEditTpl(tpl) {
    setEditingTpl(tpl)
    setTplForm({ name: tpl.name, subject: tpl.subject, emailBody: tpl.emailBody, pdfTitle: tpl.pdfTitle, pdfBody: tpl.pdfBody })
    setShowTplModal(true)
  }

  async function saveTpl() {
    if (!tplForm.name || !tplForm.subject || !tplForm.emailBody || !tplForm.pdfTitle || !tplForm.pdfBody) return alert('All fields are required.')
    const method = editingTpl ? 'PUT' : 'POST'
    const body = editingTpl ? { ...tplForm, id: editingTpl.id } : tplForm
    await fetch('/api/intimation/templates', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowTplModal(false)
    loadTemplates()
  }

  async function deleteTpl(id) {
    if (!confirm('Delete this template?')) return
    await fetch('/api/intimation/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadTemplates()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F1EE', fontFamily: 'Inter, sans-serif', color: '#888' }}>
      Loading...
    </div>
  )

  if (!authed) return null

  const filteredHistory = history.filter(h => historyFilter === 'all' ? true : h.status === historyFilter)

  return (
    <div style={s.layout}>
      <Head><title>Intimation — MailBlast</title></Head>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarBrand}>
          <div style={s.brandName}>✉ MailBlast</div>
          <div style={s.brandSub}>Intimation System</div>
        </div>

        <nav style={s.nav}>
          {[
            { id: 'send', label: 'Send Mails', icon: '📤' },
            { id: 'companies', label: 'Companies', icon: '🏢' },
            { id: 'templates', label: 'Templates', icon: '📄' },
            { id: 'history', label: 'History', icon: '📋' },
          ].map(item => (
            <div
              key={item.id}
              style={{ ...s.navItem, ...(activePage === item.id ? s.navItemActive : {}) }}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <button onClick={logout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* ── SEND PAGE ── */}
        {activePage === 'send' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Send Intimation Emails</h2>
              <p style={s.pageSubtitle}>Select company, template, paste clients and send personalized PDF emails.</p>
            </div>

            {/* Step 1: Company */}
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.stepBadge}>1</span> Select Company</div>
              {companies.length === 0 ? (
                <p style={s.muted}>No companies yet. Add one in the Companies tab.</p>
              ) : (
                <div style={s.coGrid}>
                  {companies.map(co => (
                    <div
                      key={co.id}
                      style={{ ...s.coTile, ...(selectedCompany === co.id ? s.coTileSelected : {}) }}
                      onClick={() => { setSelectedCompany(co.id); setSenderName(co.senderName) }}
                    >
                      <div style={{ ...s.coAvatar, background: co.brandColor || '#185FA5' }}>{co.initials}</div>
                      <div style={s.coName}>{co.name}</div>
                      <div style={s.coDetail}>{co.senderEmail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Template */}
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.stepBadge}>2</span> Select Template</div>
              {templates.length === 0 ? (
                <p style={s.muted}>No templates yet. Add one in the Templates tab.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {templates.map(tpl => (
                    <div
                      key={tpl.id}
                      style={{ ...s.tplRow, ...(selectedTemplate === tpl.id ? s.tplRowSelected : {}) }}
                      onClick={() => setSelectedTemplate(tpl.id)}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{tpl.name}</div>
                        <div style={s.muted}>{tpl.subject}</div>
                      </div>
                      {selectedTemplate === tpl.id && <span style={s.checkBadge}>✓ Selected</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Sender name */}
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.stepBadge}>3</span> Sender Display Name</div>
              <input
                style={s.input}
                placeholder="e.g. Legal Team or Accounts Department"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
              />
              <p style={s.hint}>The email will appear as: <strong>{senderName || 'Sender Name'}</strong> &lt;company@email.com&gt;</p>
            </div>

            {/* Step 4: Clients */}
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.stepBadge}>4</span> Paste Client List</div>
              <p style={s.hint}>Copy rows from Excel. First row must be headers. Required: Email. Optional: Name, Phone, Address.</p>
              <textarea
                style={s.textarea}
                rows={7}
                placeholder={'Name\tEmail\tPhone\tAddress\nRahul Shah\trahul@example.com\t9876543210\tSurat'}
                value={clientPaste}
                onChange={e => setClientPaste(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                <button style={s.btnPrimary} onClick={parseClients}>Parse List</button>
                <button style={s.btnSecondary} onClick={() => { setClientPaste(''); setClients([]) }}>Clear</button>
                {clients.length > 0 && <span style={s.successBadge}>✓ {clients.length} clients parsed</span>}
              </div>

              {clients.length > 0 && (
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['#', 'Name', 'Email', 'Phone', 'Address'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.slice(0, 5).map((c, i) => (
                        <tr key={i}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.td}>{c.name || '—'}</td>
                          <td style={s.td}>{c.email}</td>
                          <td style={s.td}>{c.phone || '—'}</td>
                          <td style={s.td}>{c.address || '—'}</td>
                        </tr>
                      ))}
                      {clients.length > 5 && (
                        <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#888' }}>…and {clients.length - 5} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Step 5: Send */}
            <div style={s.card}>
              <div style={s.cardHeader}><span style={s.stepBadge}>5</span> Send</div>
              <div style={s.statsRow}>
                <div style={s.stat}><div style={s.statLabel}>Total</div><div style={s.statVal}>{clients.length}</div></div>
                <div style={s.stat}><div style={s.statLabel}>Sent ✓</div><div style={{ ...s.statVal, color: '#3B6D11' }}>{sendResults.filter(r => r.status === 'sent').length}</div></div>
                <div style={s.stat}><div style={s.statLabel}>Failed ✗</div><div style={{ ...s.statVal, color: '#A32D2D' }}>{sendResults.filter(r => r.status === 'failed').length}</div></div>
              </div>
              <button
                style={{ ...s.btnPrimary, width: '100%', justifyContent: 'center', padding: '11px', opacity: sending ? 0.7 : 1 }}
                onClick={sendAll}
                disabled={sending}
              >
                {sending ? 'Sending... please wait' : '📤 Send to all clients'}
              </button>
              {sendResults.length > 0 && (
                <div style={s.logBox}>
                  {sendResults.map((r, i) => (
                    <div key={i} style={{ color: r.status === 'sent' ? '#3B6D11' : '#A32D2D', fontSize: '12px', padding: '2px 0' }}>
                      {r.status === 'sent' ? '✓' : '✗'} {r.email} {r.reason ? `— ${r.reason}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPANIES PAGE ── */}
        {activePage === 'companies' && (
          <div>
            <div style={{ ...s.pageHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={s.pageTitle}>Companies</h2>
                <p style={s.pageSubtitle}>Manage up to 3 company profiles used for sending.</p>
              </div>
              {companies.length < 3 && (
                <button style={s.btnPrimary} onClick={openAddCo}>+ Add Company</button>
              )}
            </div>

            {companies.length === 0 ? (
              <div style={s.card}><p style={s.muted}>No companies yet.</p></div>
            ) : (
              companies.map(co => (
                <div key={co.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ ...s.coAvatar, width: '46px', height: '46px', borderRadius: '10px', fontSize: '15px', background: co.brandColor || '#185FA5' }}>{co.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{co.name}</div>
                    <div style={s.muted}>{co.senderName} · {co.senderEmail}</div>
                    <div style={s.muted}>{co.phone} {co.address ? `· ${co.address}` : ''}</div>
                  </div>
                  <button style={s.btnSecondary} onClick={() => openEditCo(co)}>Edit</button>
                  <button style={s.btnDanger} onClick={() => deleteCo(co.id)}>Delete</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TEMPLATES PAGE ── */}
        {activePage === 'templates' && (
          <div>
            <div style={{ ...s.pageHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={s.pageTitle}>Templates</h2>
                <p style={s.pageSubtitle}>Create email and PDF templates with placeholders.</p>
              </div>
              <button style={s.btnPrimary} onClick={openAddTpl}>+ Add Template</button>
            </div>

            <div style={s.card}>
              <p style={s.hint}>Available placeholders: {PLACEHOLDERS.map(p => <code key={p} style={s.chip}>{p}</code>)}</p>
            </div>

            {templates.length === 0 ? (
              <div style={s.card}><p style={s.muted}>No templates yet.</p></div>
            ) : (
              templates.map(tpl => (
                <div key={tpl.id} style={s.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{tpl.name}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={s.btnSecondary} onClick={() => openEditTpl(tpl)}>Edit</button>
                      <button style={s.btnDanger} onClick={() => deleteTpl(tpl.id)}>Delete</button>
                    </div>
                  </div>
                  <div style={s.muted}>Subject: {tpl.subject}</div>
                  <div style={s.muted}>PDF Title: {tpl.pdfTitle}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── HISTORY PAGE ── */}
        {activePage === 'history' && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Mail History</h2>
              <p style={s.pageSubtitle}>Full log of all sent intimation emails.</p>
            </div>

            <div style={{ ...s.card, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'sent', 'failed'].map(f => (
                <button
                  key={f}
                  style={{ ...s.btnSecondary, ...(historyFilter === f ? { background: '#2C2C2A', color: '#fff', borderColor: '#2C2C2A' } : {}) }}
                  onClick={() => setHistoryFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', ...s.muted, alignSelf: 'center' }}>{filteredHistory.length} records</span>
            </div>

            {filteredHistory.length === 0 ? (
              <div style={s.card}><p style={s.muted}>No records found.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...s.table, background: '#fff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.09)' }}>
                  <thead>
                    <tr>
                      {['Recipient', 'Email', 'Company', 'Sender', 'Status', 'Date'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(log => (
                      <tr key={log.id}>
                        <td style={s.td}>{log.recipientName}</td>
                        <td style={s.td}>{log.recipientEmail}</td>
                        <td style={s.td}>{log.companyName}</td>
                        <td style={s.td}>{log.senderName}</td>
                        <td style={s.td}>
                          <span style={{ ...s.successBadge, ...(log.status === 'failed' ? { background: '#FCEBEB', color: '#A32D2D' } : {}) }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={s.td}>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Modal */}
      {showCoModal && (
        <div style={s.modalBg}>
          <div style={s.modal}>
            <h3 style={s.modalTitle}>{editingCo ? 'Edit Company' : 'Add Company'}</h3>
            {[
              { label: 'Company Name *', key: 'name', placeholder: 'Acme Pvt. Ltd.' },
              { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210' },
              { label: 'Address', key: 'address', placeholder: 'Surat, Gujarat' },
              { label: 'Initials (2-3 letters)', key: 'initials', placeholder: 'AC' },
              { label: 'Sender Email *', key: 'senderEmail', placeholder: 'hello@company.com' },
              { label: 'Sender Name *', key: 'senderName', placeholder: 'Acme Team' },
              { label: 'Logo URL (optional)', key: 'logo', placeholder: 'https://...' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '10px' }}>
                <label style={s.label}>{field.label}</label>
                <input
                  style={s.input}
                  placeholder={field.placeholder}
                  value={coForm[field.key]}
                  onChange={e => setCoForm({ ...coForm, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ marginBottom: '10px' }}>
              <label style={s.label}>Brand Color</label>
              <input type="color" value={coForm.brandColor} onChange={e => setCoForm({ ...coForm, brandColor: e.target.value })} style={{ width: '56px', height: '34px', padding: '2px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button style={s.btnSecondary} onClick={() => setShowCoModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={saveCo}>Save Company</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTplModal && (
        <div style={s.modalBg}>
          <div style={{ ...s.modal, width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={s.modalTitle}>{editingTpl ? 'Edit Template' : 'Add Template'}</h3>
            {[
              { label: 'Template Name *', key: 'name', placeholder: 'Default Intimation', rows: 1 },
              { label: 'Email Subject *', key: 'subject', placeholder: 'Important update from {CompanyName}', rows: 1 },
              { label: 'Email Body *', key: 'emailBody', placeholder: 'Dear {Name},\n\nPlease find your document attached.', rows: 5 },
              { label: 'PDF Title *', key: 'pdfTitle', placeholder: 'Account Notification', rows: 1 },
              { label: 'PDF Body *', key: 'pdfBody', placeholder: 'Dear {Name},\n\nThis is to inform you...', rows: 8 },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '12px' }}>
                <label style={s.label}>{field.label}</label>
                {field.rows === 1 ? (
                  <input style={s.input} placeholder={field.placeholder} value={tplForm[field.key]} onChange={e => setTplForm({ ...tplForm, [field.key]: e.target.value })} />
                ) : (
                  <textarea style={{ ...s.input, minHeight: `${field.rows * 24}px`, resize: 'vertical' }} placeholder={field.placeholder} value={tplForm[field.key]} onChange={e => setTplForm({ ...tplForm, [field.key]: e.target.value })} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button style={s.btnSecondary} onClick={() => setShowTplModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={saveTpl}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  layout: { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', background: '#F2F1EE' },
  sidebar: { width: '220px', background: '#2C2C2A', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarBrand: { padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  brandName: { fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' },
  brandSub: { fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', marginBottom: '2px', transition: 'all 0.15s' },
  navItemActive: { background: 'rgba(255,255,255,0.13)', color: '#fff', fontWeight: '500' },
  sidebarFooter: { padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', width: '100%' },
  main: { flex: 1, overflowY: 'auto', padding: '28px 32px' },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a18', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#5F5E5A', marginTop: '4px' },
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '10px', padding: '20px 24px', marginBottom: '16px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#1a1a18', marginBottom: '16px' },
  stepBadge: { width: '22px', height: '22px', borderRadius: '50%', background: '#185FA5', color: '#fff', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  coTile: { border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' },
  coTileSelected: { borderColor: '#185FA5', background: '#E6F1FB', boxShadow: '0 0 0 2px rgba(24,95,165,0.15)' },
  coAvatar: { width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '10px' },
  coName: { fontSize: '13px', fontWeight: '600', marginBottom: '3px' },
  coDetail: { fontSize: '11px', color: '#5F5E5A' },
  tplRow: { border: '1px solid rgba(0,0,0,0.09)', borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tplRowSelected: { borderColor: '#185FA5', background: '#E6F1FB' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#1a1a18', background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '9px 11px', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', color: '#1a1a18', background: '#fff', boxSizing: 'border-box', resize: 'vertical' },
  hint: { fontSize: '12px', color: '#888780', marginBottom: '10px', lineHeight: '1.6' },
  muted: { fontSize: '12px', color: '#5F5E5A' },
  label: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#5F5E5A', marginBottom: '5px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#2C2C2A', color: '#fff', border: '1px solid #2C2C2A', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', color: '#1a1a18', border: '1px solid rgba(0,0,0,0.16)', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', color: '#A32D2D', border: '1px solid #A32D2D', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
  stat: { background: '#F8F8F6', borderRadius: '6px', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.09)' },
  statLabel: { fontSize: '11px', color: '#5F5E5A', fontWeight: '500', marginBottom: '6px' },
  statVal: { fontSize: '26px', fontWeight: '600' },
  logBox: { marginTop: '12px', background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '6px', padding: '10px 12px', maxHeight: '200px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' },
  th: { background: '#F8F8F6', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(0,0,0,0.09)' },
  td: { padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: '#1a1a18' },
  successBadge: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: '#EAF3DE', color: '#3B6D11' },
  checkBadge: { display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: '#E6F1FB', color: '#185FA5' },
  chip: { background: '#E6F1FB', color: '#185FA5', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontFamily: 'monospace', marginRight: '4px' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: '10px', padding: '24px', width: '440px', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1a1a18' },
}