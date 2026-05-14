export default function AdminPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Admin Panel</h1>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          maxWidth: '400px',
          marginTop: '30px',
        }}
      >
        <a href="/admin/dashboard">
          Dashboard
        </a>

        <a href="/admin/intimation">
          Intimation
        </a>

        <a href="/admin/companies">
          Companies
        </a>

        <a href="/admin/templates">
          Templates
        </a>

        <a href="/admin/history">
          History
        </a>
      </div>
    </div>
  )
}