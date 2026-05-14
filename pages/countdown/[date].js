import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Countdown() {
  const router = useRouter()
  const { date } = router.query
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!date) return
    const tick = () => {
      const now = new Date()
      const deadline = new Date(date)
      deadline.setHours(23, 59, 59, 0)
      const diff = deadline - now
      if (diff <= 0) return setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [date])

  const pad = n => String(n).padStart(2, '0')
  const formatted = date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '40px 20px', background: '#FFF8E6' }}>
      <p style={{ fontSize: '13px', fontWeight: '600', color: '#7A5C00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ⏰ Submission Deadline
      </p>
      <p style={{ fontSize: '15px', fontWeight: '700', color: '#7A5C00' }}>📅 {formatted}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
        {[['days', 'Days'], ['hours', 'Hours'], ['minutes', 'Minutes'], ['seconds', 'Seconds']].map(([key, label]) => (
          <div key={key} style={{ background: '#fff', border: '1px solid #F5C842', borderRadius: '6px', padding: '8px 14px', minWidth: '52px' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#185FA5' }}>{pad(time[key])}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
