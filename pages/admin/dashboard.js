import { useState, useEffect } from 'react';

export async function getServerSideProps(context) {
  const session = context.req.cookies['kt_admin_session'];
  if (!session) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
}

export default function IntimationDashboard() {
  const [members, setMembers] = useState('');
  const [companies, setCompanies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Fetch your Companies and Templates from the Database on load
  useEffect(() => {
    const fetchData = async () => {
      const compRes = await fetch('/api/companies'); // Create this API next
      const tempRes = await fetch('/api/templates'); // Create this API next
      if (compRes.ok) setCompanies(await compRes.json());
      if (tempRes.ok) setTemplates(await tempRes.json());
    };
    fetchData();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Processing Excel data...');

    // 1. Parse the tab-separated Excel data
    const rows = members.trim().split('\n').map(row => {
      const [name, email] = row.split('\t');
      return { name: name?.trim(), email: email?.trim() };
    }).filter(m => m.name && m.email);

    if (rows.length === 0) {
      alert("No valid members found. Use 'Name [TAB] Email' format.");
      setLoading(false);
      return;
    }

    // 2. Call the Send API (the one with the 8-20s delay)
    setStatus(`Sending to ${rows.length} members. Please stay on this page...`);
    
    const res = await fetch('/api/send-intimation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members: rows,
        companyId: selectedCompany,
        templateId: selectedTemplate
      }),
    });

    setLoading(false);
    if (res.ok) {
      setStatus('Successfully sent all emails!');
      setMembers('');
    } else {
      setStatus('Error sending emails. Check logs.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#e11d48', marginBottom: '20px' }}>Intimation System</h1>
      
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>1. Select Company</label>
          <select 
            required 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          >
            <option value="">-- Choose Company --</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>2. Select Template</label>
          <select 
            required 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          >
            <option value="">-- Choose Template --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>3. Paste Excel Data (Name [TAB] Email)</label>
          <textarea
            required
            rows="10"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            placeholder="John Doe	john@example.com&#10;Jane Smith	jane@example.com"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '15px', 
            backgroundColor: loading ? '#ccc' : '#e11d48', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Sending Emails...' : '🚀 Start Bulk Intimation'}
        </button>

        {status && <p style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>{status}</p>}
      </form>
    </div>
  );
}