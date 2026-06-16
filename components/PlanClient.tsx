'use client'

import { useState } from 'react'

type Session = {
  id: string
  monthNumber: number
  weekNumber: number
  dayLabel: string
  plannedDate: string
  targetKm: number
  methodNote: string | null
  status: string
  linkedRunId: string | null
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'מתוכנן',
  done: 'בוצע',
  skipped: 'פוספס',
  rescheduled: 'נדחה',
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-slate-700 text-slate-300',
  done: 'bg-emerald-900/50 text-emerald-400',
  skipped: 'bg-red-900/50 text-red-400',
  rescheduled: 'bg-amber-900/50 text-amber-400',
}

export default function PlanClient({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Session>>({})
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  function startEdit(s: Session) {
    setEditing(s.id)
    setEditData({
      plannedDate: new Date(s.plannedDate).toISOString().slice(0, 10),
      targetKm: s.targetKm,
      status: s.status,
      methodNote: s.methodNote ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const payload = {
        ...editData,
        methodNote: editData.methodNote?.trim() || null,
      }
      const res = await fetch(`/api/plan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('שגיאה')
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function quickStatus(id: string, status: string) {
    const res = await fetch(`/api/plan/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))
    }
  }

  const inputClass = "w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-500"

  return (
    <div className="space-y-6">
      {[1,2,3,4].map(month => {
        const monthSessions = sessions.filter(s => s.monthNumber === month)
        if (!monthSessions.length) return null
        const weeks = [...new Set(monthSessions.map(s => s.weekNumber))].sort((a, b) => a - b)

        return (
          <div key={month} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <div className="bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold">חודש {month}</h2>
              <span className="text-xs text-slate-400">
                {monthSessions.filter(s => s.status === 'done').length}/{monthSessions.filter(s => s.targetKm > 0).length} בוצעו
              </span>
            </div>
            <div className="divide-y divide-slate-700/50">
              {weeks.map(week => {
                const weekSessions = monthSessions.filter(s => s.weekNumber === week)
                return (
                  <div key={week}>
                    <div className="px-4 py-2 bg-slate-700/30">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">שבוע {week}</p>
                    </div>
                    {weekSessions.map(s => (
                      <div key={s.id} className="px-4 py-3">
                        {editing === s.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-400">תאריך</label>
                                <input type="date" value={editData.plannedDate as string} onChange={e => setEditData(d => ({ ...d, plannedDate: e.target.value }))} className={inputClass} />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400">מרחק (ק&quot;מ)</label>
                                <input type="number" step="0.5" value={editData.targetKm as number} onChange={e => setEditData(d => ({ ...d, targetKm: parseFloat(e.target.value) }))} className={inputClass} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400">סטטוס</label>
                              <select value={editData.status as string} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className={inputClass}>
                                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-slate-400">תיעוד / הערה</label>
                                {editData.methodNote && (
                                  <button type="button" onClick={() => setEditData(d => ({ ...d, methodNote: '' }))} className="text-xs text-red-400 hover:text-red-300">מחק הערה</button>
                                )}
                              </div>
                              <textarea
                                rows={3}
                                value={editData.methodNote as string ?? ''}
                                onChange={e => setEditData(d => ({ ...d, methodNote: e.target.value }))}
                                placeholder="הוסף הערה או תיעוד..."
                                className={inputClass + ' resize-none'}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(s.id)} disabled={saving} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">שמור</button>
                              <button onClick={() => setEditing(null)} className="flex-1 bg-slate-700 text-slate-300 rounded-lg py-2 text-sm font-medium">ביטול</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm text-white">{s.dayLabel}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? STATUS_COLORS.planned}`}>
                                    {STATUS_LABELS[s.status] ?? s.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(s.plannedDate).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  {s.targetKm > 0 && ` · ${s.targetKm} ק"מ`}
                                </p>
                              </div>
                              <div className="flex gap-1 mr-2">
                                {s.methodNote && (
                                  <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1">
                                    {expanded === s.id ? '▲' : 'פרטים'}
                                  </button>
                                )}
                                <button onClick={() => startEdit(s)} className="text-slate-500 hover:text-slate-300 p-1">✏️</button>
                              </div>
                            </div>

                            {expanded === s.id && s.methodNote && (
                              <div className="mt-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600">
                                <p className="text-xs text-slate-300 leading-5">{s.methodNote}</p>
                              </div>
                            )}

                            <div className="flex gap-2 mt-2 flex-wrap">
                              {s.status === 'planned' ? (
                                <>
                                  <button onClick={() => quickStatus(s.id, 'done')} className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full">בוצע</button>
                                  <button onClick={() => quickStatus(s.id, 'skipped')} className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-3 py-1 rounded-full">פוספס</button>
                                  <button onClick={() => quickStatus(s.id, 'rescheduled')} className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-3 py-1 rounded-full">נדחה</button>
                                </>
                              ) : (
                                <button onClick={() => quickStatus(s.id, 'planned')} className="text-xs bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1 rounded-full">↩ החזר למתוכנן</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
