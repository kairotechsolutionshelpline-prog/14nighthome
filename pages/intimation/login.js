import { useState } from 'react'
import { useRouter } from 'next/router'

export default function IntimationLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/intimation/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Login failed')
      return
    }

    router.push('/intimation')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.logo}>✉</div>
          <div>
            <div style={styles.brandName}>MailBlast</div>
            <div style={styles.brandSub}>Intimation System</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="admin@redalertsol.com"
              style={styles.input}
              autoFocus
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter password"
              style={styles.input}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F2F1EE',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1.5rem',
  },
  logo: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#2C2C2A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    flexShrink: 0,
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a18',
  },
  brandSub: {
    fontSize: '12px',
    color: '#888780',
  },
  formGroup: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: '#5F5E5A',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '9px 11px',
    border: '1px solid rgba(0,0,0,0.16)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    color: '#1a1a18',
    background: '#fff',
    boxSizing: 'border-box',
  },
  error: {
    color: '#A32D2D',
    fontSize: '13px',
    marginBottom: '12px',
    background: '#FCEBEB',
    padding: '8px 12px',
    borderRadius: '6px',
  },
  btn: {
    width: '100%',
    padding: '10px',
    background: '#2C2C2A',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },
}