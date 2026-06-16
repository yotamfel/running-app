'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Run = {
  id: string
  date: string
  distanceKm: number
  paceMinPerKm: number
  durationMin: number
  feeling: number | null
  notes: string | null
}

function formatPace(pace: number) {
  const min = Math.floor(pace)
  const sec = Math.round((pace - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
}

export default function HistoryChart({ runs }: { runs: Run[] }) {
  const chartData = [...runs].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
    'מרחק': r.distanceKm,
    'קצב': parseFloat(r.paceMinPerKm.toFixed(2)),
  }))

  if (runs.length === 0) {
    return <p className="text-slate-500 text-center py-8">עדיין אין ריצות מתועדות</p>
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-sm font-semibold text-slate-200 mb-3">מרחק לאורך זמן (ק&quot;מ)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="מרחק" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-sm font-semibold text-slate-200 mb-3">קצב לאורך זמן (דק&apos;/ק&quot;מ)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} reversed />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === 'number' ? formatPace(v) : v} />
            <Line type="monotone" dataKey="קצב" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-200">כל הריצות</p>
        </div>
        {runs.map(r => (
          <div key={r.id} className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm text-white">{r.distanceKm} ק&quot;מ</p>
              <p className="text-xs text-slate-400">
                {new Date(r.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {r.notes && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{r.notes}</p>}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-300">{formatPace(r.paceMinPerKm)} דק&apos;/ק&quot;מ</p>
              <p className="text-xs text-slate-500">{r.durationMin} דקות</p>
              {r.feeling && <p className="text-xs text-slate-500">תחושה {r.feeling}/10</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
