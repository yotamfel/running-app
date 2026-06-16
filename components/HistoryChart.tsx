'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

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

export default function HistoryChart({ runs }: { runs: Run[] }) {
  const chartData = [...runs]
    .reverse()
    .map(r => ({
      date: new Date(r.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      'מרחק': r.distanceKm,
      'קצב': parseFloat(r.paceMinPerKm.toFixed(2)),
    }))

  return (
    <div className="space-y-4">
      {runs.length === 0 ? (
        <p className="text-slate-400 text-center py-8">עדיין אין ריצות מתועדות</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">מרחק לאורך זמן (ק&quot;מ)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="מרחק" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">קצב לאורך זמן (דק&apos;/ק&quot;מ)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} reversed />
                <Tooltip formatter={(v) => typeof v === 'number' ? formatPace(v) : v} />
                <Line type="monotone" dataKey="קצב" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">כל הריצות</p>
            </div>
            {runs.map(r => (
              <div key={r.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{r.distanceKm} ק&quot;מ</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {r.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{r.notes}</p>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">{formatPace(r.paceMinPerKm)} דק&apos;/ק&quot;מ</p>
                  <p className="text-xs text-slate-500">{r.durationMin} דקות</p>
                  {r.feeling && <p className="text-xs text-slate-400">תחושה {r.feeling}/10</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
