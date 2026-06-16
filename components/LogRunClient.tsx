'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Session = {
  id: string
  dayLabel: string
  plannedDate: string
  targetKm: number
}

function formatPace(dist: string, dur: string) {
  const d = parseFloat(dist)
  const m = parseFloat(dur)
  if (!d || !m || d === 0) return null
  const pace = m / d
  const min = Math.floor(pace)
  const sec = Math.round((pace - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')} דק'/ק"מ`
}

export default function LogRunClient({ plannedSessions }: { plannedSessions: Session[] }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    date: today,
    distanceKm: '',
    durationMin: '',
    feeling: '',
    notes: '',
    planSessionId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const pace = formatPace(form.distanceKm, form.durationMin)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.distanceKm || !form.durationMin) {
      setError('יש למלא מרחק וזמן')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('שגיאה בשמירה')
      setSuccess(true)
      setTimeout(() => { router.push('/history'); router.refresh() }, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-base placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">תאריך</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">מרחק (ק&quot;מ)</label>
          <input type="number" step="0.1" min="0" value={form.distanceKm} onChange={e => set('distanceKm', e.target.value)} placeholder="0.0" className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">זמן (דקות)</label>
          <input type="number" step="0.5" min="0" value={form.durationMin} onChange={e => set('durationMin', e.target.value)} placeholder="0" className={inputClass} required />
        </div>
      </div>

      {pace && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-indigo-400 mb-0.5">קצב מחושב</p>
          <p className="text-xl font-bold text-indigo-300">{pace}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">תחושה (1–10)</label>
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set('feeling', form.feeling === String(n) ? '' : String(n))}
              className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                form.feeling === String(n)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {plannedSessions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">קישור לסשן מהתוכנית (אופציונלי)</label>
          <select value={form.planSessionId} onChange={e => set('planSessionId', e.target.value)} className={inputClass}>
            <option value="">ללא קישור</option>
            {plannedSessions.map(s => (
              <option key={s.id} value={s.id}>
                {new Date(s.plannedDate).toLocaleDateString('he-IL')} — {s.dayLabel} ({s.targetKm} ק&quot;מ)
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">הערות</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="איך הרגשת, מה עבד, מה היה קשה..." rows={3} className={`${inputClass} resize-none`} />
      </div>

      {error && <div className="bg-red-900/40 text-red-300 rounded-xl px-4 py-3 text-sm border border-red-800">{error}</div>}
      {success && <div className="bg-emerald-900/40 text-emerald-300 rounded-xl px-4 py-3 text-sm font-medium text-center border border-emerald-800">הריצה נשמרה בהצלחה</div>}

      <button type="submit" disabled={saving || success} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 font-semibold text-base disabled:opacity-60 transition-colors">
        {saving ? 'שומר...' : 'שמור ריצה'}
      </button>
    </form>
  )
}
