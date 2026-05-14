import { useState, useEffect } from 'react';

export async function getServerSideProps(context) {
  const session = context.req.cookies['kt_admin_session'];
  if (!session) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
}

export default function TemplateEditor() {
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({ name: '', subject: '', emailBody: '', pdfTitle: '', pdfBody: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/templates').then(res => res.json()).then(data => setTemplates(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/templates/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      alert("Template Saved!");
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#333' }}>Template Management</h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Create New Template</h2>
        <div style={{ display: 'grid', gap: '15px' }}>
          <input type="text" placeholder="Template Name (e.g. Welcome Email)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '10px' }} />
          <input type="text" placeholder="Email Subject Line" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ padding: '10px' }} />
          <textarea placeholder="Email Body (HTML allowed) - Use {Name} for placeholders" required rows="6" value={formData.emailBody} onChange={e => setFormData({...formData, emailBody: e.target.value})} style={{ padding: '10px' }} />
          <hr />
          <input type="text" placeholder="PDF Header Title" value={formData.pdfTitle} onChange={e => setFormData({...formData, pdfTitle: e.target.value})} style={{ padding: '10px' }} />
          <textarea placeholder="PDF Body Text" rows="4" value={formData.pdfBody} onChange={e => setFormData({...formData, pdfBody: e.target.value})} style={{ padding: '10px' }} />
          <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>

      <h2>Existing Templates</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {templates.map(t => (
          <div key={t.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <strong>{t.name}</strong> - <span style={{ color: '#666' }}>{t.subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
}