import { useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(e) {
    e.preventDefault()

    setLoading(true)
    setError('')

    // FIXED: Changed path from /api/admin/login to /api/login
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Login failed')
      return
    }

    // FIXED: Redirecting to /admin (the gatekeeper) instead of dashboard
    router.push('/admin/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9'
      }}
    >
      <form
        onSubmit={login}
        style={{
          width: 350,
          padding: 30,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: 20 }}>Admin Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 15,
            padding: 10,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 15,
            padding: 10,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}