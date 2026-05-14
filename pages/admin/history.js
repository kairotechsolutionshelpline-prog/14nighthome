import { useState, useEffect } from 'react';

export async function getServerSideProps(context) {
  const session = context.req.cookies['kt_admin_session'];
  if (!session) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
}

export default function MailHistory() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setLogs(data));
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333' }}>Mail Delivery History</h1>
        <button onClick={() => window.location.href = '/admin'} style={{ padding: '10px 20px', cursor: 'pointer' }}>Back to Admin</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '15px', textAlign: 'left' }}>Recipient</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Company</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '15px' }}>
                <div style={{ fontWeight: 'bold' }}>{log.recipientName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{log.recipientEmail}</div>
              </td>
              <td style={{ padding: '15px' }}>{log.companyName}</td>
              <td style={{ padding: '15px' }}>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '12px',
                  backgroundColor: log.status === 'sent' ? '#d1fae5' : '#fee2e2',
                  color: log.status === 'sent' ? '#065f46' : '#991b1b'
                }}>
                  {log.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '15px', fontSize: '14px', color: '#666' }}>
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}