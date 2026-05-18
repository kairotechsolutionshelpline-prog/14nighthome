import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [members, setMembers] = useState([])
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [submissionDate, setSubmissionDate] = useState('')
  const [liveCountdown, setLiveCountdown] = useState(null)
  const [senderName, setSenderName] = useState('')
  const [senderPrefix, setSenderPrefix] = useState('')
  const [mailProvider, setMailProvider] = useState('resend')

  useEffect(() => {
    const a = sessionStorage.getItem('kt_auth')
    if (a === 'true') setAuthed(true)
    const h = localStorage.getItem('kt_history')
    if (h) setHistory(JSON.parse(h))
  }, [])

  useEffect(() => {
    if (!submissionDate) { setLiveCountdown(null); return }
    const tick = () => {
      const now = new Date()
      const deadline = new Date(submissionDate)
      deadline.setHours(23, 59, 59, 0)
      const diff = deadline - now
      if (diff <= 0) return setLiveCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setLiveCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [submissionDate])

  function getDateOptions() {
    const options = []
    for (let i = 0; i <= 4; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const value = d.toISOString().split('T')[0]
      options.push({ label, value })
    }
    return options
  }

  async function handleLogin(e) {
    e.preventDefault()
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      sessionStorage.setItem('kt_auth', 'true')
      setAuthed(true)
    } else {
      setLoginError('Incorrect password. Try again.')
    }
  }

  function parseMembers() {
    const lines = pasteText.trim().split('\n').filter(l => l.trim())
    const parsed = []
    for (const line of lines) {
      const parts = line.trim().split(/\t|  +/)
      if (parts.length >= 2) {
        const name = parts[0].trim()
        const email = parts[parts.length - 1].trim()
        if (name && email.includes('@')) {
          parsed.push({ name, email, status: 'pending' })
        }
      }
    }
    setMembers(parsed)
  }

  function getInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  async function sendAll() {
    if (!members.length) return
    if (!senderName.trim()) { alert('Please enter a Sender Name before sending.'); return }
    if (mailProvider !== 'gmail' && !senderPrefix.trim()) { alert('Please enter a Sender Email prefix before sending.'); return }
    setSending(true)
    const pendingMembers = members.filter(m => m.status !== 'sent')
    setMembers(prev => prev.map(m => m.status !== 'sent' ? { ...m, status: 'sending' } : m))

    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ members: pendingMembers, submissionDate, senderName: senderName.trim(), senderPrefix: senderPrefix.trim(), provider: mailProvider })
    })
    const data = await res.json()

    const updatedMembers = members.map(m => {
      const result = data.results?.find(r => r.email === m.email)
      return result ? { ...m, status: result.status } : m
    })
    setMembers(updatedMembers)

    const sent = updatedMembers.filter(m => m.status === 'sent').length
    const failed = updatedMembers.filter(m => m.status === 'failed').length
    const entry = {
      date: new Date().toLocaleString('en-IN'),
      total: members.length,
      sent,
      failed,
      members: updatedMembers.map(m => ({ name: m.name, email: m.email, status: m.status }))
    }
    const newHistory = [entry, ...history].slice(0, 10)
    setHistory(newHistory)
    localStorage.setItem('kt_history', JSON.stringify(newHistory))
    setSending(false)
  }

  function logout() {
    sessionStorage.removeItem('kt_auth')
    setAuthed(false)
  }

  const sentCount = members.filter(m => m.status === 'sent').length
  const failedCount = members.filter(m => m.status === 'failed').length

  if (!authed) return (
    <div style={styles.loginPage}>
      <Head><title>Kairotech Dashboard</title></Head>
      <div style={styles.loginCard}>
        <div style={styles.logoRow}>
          <div style={styles.logoCircle}>KTS</div>
          <div>
            <div style={styles.brandName}><span style={{ color: '#185FA5' }}>Kairo</span>tech Solutions</div>
            <div style={styles.brandSub}>Mail Dashboard</div>
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setLoginError('') }}
              placeholder="Enter admin email"
              style={styles.input}
              autoFocus
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setLoginError('') }}
              placeholder="Enter dashboard password"
              style={styles.input}
            />
          </div>
          {loginError && <p style={styles.errorText}>{loginError}</p>}
          <button type="submit" style={styles.primaryBtn}>Login</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <Head><title>Kairotech Dashboard</title></Head>
      <div style={styles.topBar}>
        <div style={styles.logoRow}>
          <div style={styles.logoCircle}>KTS</div>
          <div>
            <div style={styles.brandName}><span style={{ color: '#185FA5' }}>Kairo</span>tech Solutions</div>
            <div style={styles.brandSub}>Mail Dashboard</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Paste member list</div>
          <p style={styles.hint}>Paste names and emails from your database — tab or spaces separated, one per line.</p>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder={"Sharmila S\tsathishkumar.sharmila@gmail.com\nrajesh\trajeshkaburrewar@gmail.com\nRam Poojan Mishra\trpmishra8569@gmail.com"}
            style={styles.textarea}
          />
          <button onClick={parseMembers} style={{ ...styles.primaryBtn, width: 'auto', marginTop: '10px' }}>
            Load members
          </button>
        </div>

        {members.length > 0 && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <div style={styles.sectionLabel}>Members ({members.length})</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={styles.statPill}>{sentCount} sent</div>
                <div style={{ ...styles.statPill, background: failedCount > 0 ? '#FCEBEB' : '#f5f5f5', color: failedCount > 0 ? '#791F1F' : '#888' }}>{failedCount} failed</div>
              </div>
            </div>

            <div style={styles.membersList}>
              {members.map((m, i) => (
                <div key={i} style={styles.memberRow}>
                  <div style={styles.memberInfo}>
                    <div style={styles.avatar}>{getInitials(m.name)}</div>
                    <div>
                      <p style={styles.memberName}>{m.name}</p>
                      <p style={styles.memberEmail}>{m.email}</p>
                    </div>
                  </div>
                  <span style={{
                    ...styles.badge,
                    ...(m.status === 'sent' ? styles.badgeSent :
                      m.status === 'failed' ? styles.badgeFailed :
                      m.status === 'sending' ? styles.badgeSending :
                      styles.badgePending)
                  }}>
                    {m.status === 'sent' ? '✓ Sent' : m.status === 'failed' ? '✗ Failed' : m.status === 'sending' ? 'Sending...' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

{/* Sender Details */}
            <div style={{ marginTop: '16px', marginBottom: '4px' }}>

              <label style={styles.label}>📮 Mail Server</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMailProvider('resend')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid', borderColor: mailProvider === 'resend' ? '#185FA5' : '#ddd', background: mailProvider === 'resend' ? '#E6F1FB' : '#fff', color: mailProvider === 'resend' ? '#185FA5' : '#555', fontWeight: mailProvider === 'resend' ? '600' : '400', cursor: 'pointer', fontSize: '13px' }}
                >
                  🖥️ Server Mail
                </button>
                <button
                  type="button"
                  onClick={() => setMailProvider('gmail')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid', borderColor: mailProvider === 'gmail' ? '#EA4335' : '#ddd', background: mailProvider === 'gmail' ? '#FDE8E6' : '#fff', color: mailProvider === 'gmail' ? '#EA4335' : '#555', fontWeight: mailProvider === 'gmail' ? '600' : '400', cursor: 'pointer', fontSize: '13px' }}
                >
                  📧 Google Mail
                </button>
              </div>

              <label style={styles.label}>✉️ Sender Name <span style={{ color: '#A32D2D' }}>*</span></label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="e.g. Kairotech Solutions"
                style={{ ...styles.input, marginBottom: '12px' }}
              />

              <label style={styles.label}>📧 Sender Email Prefix <span style={{ color: '#A32D2D' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={senderPrefix}
                  onChange={e => setSenderPrefix(e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="e.g. updates"
                  style={{ ...styles.input, marginBottom: 0, maxWidth: '160px' }}
                />
                <span style={{ fontSize: '14px', color: '#555', whiteSpace: 'nowrap' }}>@trulogictech.com</span>
              </div>
            </div>

            {/* Submission Deadline */}
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>📅 Submission Deadline (optional)</label>
              <select
                value={submissionDate}
                onChange={e => setSubmissionDate(e.target.value)}
                style={{ ...styles.input, marginBottom: 0 }}
              >
                <option value="">-- No deadline --</option>
                {getDateOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {liveCountdown && (
                <div style={{ background: '#FFF8E6', border: '1px solid #F5C842', borderRadius: '8px', padding: '12px', marginTop: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#7A5C00', marginBottom: '8px' }}>⏰ Live countdown</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[['days', 'Days'], ['hours', 'Hours'], ['minutes', 'Min'], ['seconds', 'Sec']].map(([key, label]) => (
                      <div key={key} style={{ background: '#fff', border: '1px solid #F5C842', borderRadius: '6px', padding: '6px 12px', minWidth: '48px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#185FA5' }}>{String(liveCountdown[key]).padStart(2, '0')}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={sendAll} disabled={sending} style={{ ...styles.primaryBtn, marginTop: '8px', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending emails...' : 'Send all emails'}
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div style={styles.card}>
            <div style={styles.sectionLabel}>Send history</div>
            {history.map((h, i) => (
              <div key={i} style={styles.historyRow}>
                <div>
                  <p style={styles.historyDate}>{h.date}</p>
                  <p style={styles.historyDetail}>{h.total} members — {h.sent} sent, {h.failed} failed</p>
                </div>
                <span style={{ ...styles.badge, ...(h.failed > 0 ? styles.badgeFailed : styles.badgeSent) }}>
                  {h.failed > 0 ? `${h.failed} failed` : 'All sent'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.helplineBar}>
          <div style={styles.memberInfo}>
            <span style={{ fontSize: '20px' }}>🎧</span>
            <div>
              <p style={{ fontSize: '12px', color: '#888' }}>Helpline</p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>kairotechsolutionshelpline@gmail.com</p>
            </div>
          </div>
          <a
            href="mailto:kairotechsolutionshelpline@gmail.com?subject=Helpline Request&body=Hi Kairotech Helpline Team,%0A%0AName : %0AIssue : %0A%0AThank you."
            style={styles.mailLink}
          >
            ✉️ Contact helpline
          </a>
        </div>
      </div>
    </div>
  )
}

const styles = {
  loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' },
  loginCard: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px' },
  page: { minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' },
  topBar: { background: '#fff', borderBottom: '0.5px solid #e0e0e0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  container: { maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoCircle: { width: '42px', height: '42px', borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E6F1FB', fontWeight: '600', fontSize: '13px', flexShrink: 0 },
  brandName: { fontSize: '17px', fontWeight: '600', color: '#111' },
  brandSub: { fontSize: '12px', color: '#888' },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' },
  sectionLabel: { fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' },
  hint: { fontSize: '13px', color: '#888', marginBottom: '10px', lineHeight: '1.5' },
  textarea: { width: '100%', minHeight: '130px', padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', background: '#f9f9f9', border: '0.5px solid #e0e0e0', borderRadius: '8px', color: '#111', resize: 'vertical', boxSizing: 'border-box' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', background: '#f9f9f9', border: '0.5px solid #e0e0e0', borderRadius: '8px', color: '#111', boxSizing: 'border-box', marginBottom: '8px' },
  primaryBtn: { width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  logoutBtn: { padding: '7px 16px', background: 'transparent', border: '0.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#555' },
  errorText: { color: '#A32D2D', fontSize: '13px', marginBottom: '8px' },
  formGroup: { marginBottom: '12px' },
  label: { fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' },
  membersList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  memberRow: { background: '#f9f9f9', border: '0.5px solid #e0e0e0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' },
  memberInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', background: '#185FA5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  memberName: { fontSize: '14px', fontWeight: '600', color: '#111', margin: 0 },
  memberEmail: { fontSize: '12px', color: '#888', margin: 0 },
  badge: { fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: '600', whiteSpace: 'nowrap' },
  badgePending: { background: '#f5f5f5', color: '#888' },
  badgeSending: { background: '#E6F1FB', color: '#0C447C' },
  badgeSent: { background: '#EAF3DE', color: '#27500A' },
  badgeFailed: { background: '#FCEBEB', color: '#791F1F' },
  statPill: { fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#EAF3DE', color: '#27500A', fontWeight: '600' },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #eee' },
  historyDate: { fontSize: '13px', fontWeight: '600', color: '#111', margin: 0 },
  historyDetail: { fontSize: '12px', color: '#888', margin: 0 },
  helplineBar: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  mailLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#185FA5', border: '0.5px solid #185FA5', borderRadius: '8px', padding: '7px 14px', textDecoration: 'none' }
}
