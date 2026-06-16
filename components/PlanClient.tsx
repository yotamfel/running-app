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
  planned: 'bg-slate-100 text-slate-600',
  done: 'bg-green-100 text-green-700',
  skipped: 'bg-red-100 text-red-600',
  rescheduled: 'bg-amber-100 text-amber-700',
}

export default function PlanClient({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Session>>({})
  const [saving, setSaving] = useState(false)

  const months = [1, 2, 3, 4]

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
      const res = await fetch(`/api/plan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (!res.ok) throw new Error('שגיאה בשמירה')
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

  return (
    <div className="space-y-6">
      {months.map(month => {
        const monthSessions = sessions.filter(s => s.monthNumber === month)
        if (!monthSessions.length) return null

        const weeks = [...new Set(monthSessions.map(s => s.weekNumber))].sort((a, b) => a - b)

        return (
          <div key={month} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3">
              <h2 className="font-bold">חודש {month}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {weeks.map(week => {
                const weekSessions = monthSessions.filter(s => s.weekNumber === week)
                return (
                  <div key={week}>
                    <div className="px-4 py-2 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">שבוע {week}</p>
                    </div>
                    {weekSessions.map(s => (
                      <div key={s.id} className="px-4 py-3">
                        {editing === s.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500">תאריך</label>
                                <input
                                  type="date"
                                  value={editData.plannedDate as string}
                                  onChange={e => setEditData(d => ({ ...d, plannedDate: e.target.value }))}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500">מרחק (ק&quot;מ)</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editData.targetKm as number}
                                  onChange={e => setEditData(d => ({ ...d, targetKm: parseFloat(e.target.value) }))}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">סטטוס</label>
                              <select
                                value={editData.status as string}
                                onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                              >
                                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">הערת שיטה</label>
                              <input
                                type="text"
                                value={editData.methodNote as string}
                                onChange={e => setEditData(d => ({ ...d, methodNote: e.target.value }))}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(s.id)}
                                disabled={saving}
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
                              >
                                שמור
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="flex-1 bg-slate-100 text-slate-600 rounded-lg py-2 text-sm font-medium"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{s.dayLabel}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? STATUS_COLORS.planned}`}>
                                    {STATUS_LABELS[s.status] ?? s.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {new Date(s.plannedDate).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  {s.targetKm > 0 && ` · ${s.targetKm} ק"מ`}
                                </p>
                                {s.methodNote && (
                                  <p className="text-xs text-slate-400 mt-1">{s.methodNote}</p>
                                )}
                              </div>
                              <button
                                onClick={() => startEdit(s)}
                                className="text-slate-400 p-1 text-sm ml-2"
                              >
                                ✏️
                              </button>
                            </div>
                            {s.status === 'planned' && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => quickStatus(s.id, 'done')}
                                  className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full"
                                >
                                  בוצע
                                </button>
                                <button
                                  onClick={() => quickStatus(s.id, 'skipped')}
                                  className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full"
                                >
                                  פוספס
                                </button>
                                <button
                                  onClick={() => quickStatus(s.id, 'rescheduled')}
                                  className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full"
                                >
                                  נדחה
                                </button>
                              </div>
                            )}
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
