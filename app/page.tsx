import { prisma } from '@/lib/prisma'
import BottomNav from '@/components/BottomNav'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatPace(pace: number) {
  const min = Math.floor(pace)
  const sec = Math.round((pace - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')} דק'/ק"מ`
}

export default async function HomePage() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [sessions, runs, weekRuns] = await Promise.all([
    prisma.planSession.findMany({ orderBy: { plannedDate: 'asc' } }),
    prisma.runLog.findMany({ orderBy: { date: 'desc' }, take: 3 }),
    prisma.runLog.findMany({ where: { date: { gte: weekAgo } } }),
  ])

  const nextSession = sessions.find(
    s => s.status === 'planned' && new Date(s.plannedDate) >= now
  )

  const pastSessions = sessions.filter(s => new Date(s.plannedDate) < now)
  const doneSessions = pastSessions.filter(s => s.status === 'done').length
  const adherencePercent =
    pastSessions.length > 0 ? Math.round((doneSessions / pastSessions.length) * 100) : 0

  const weekKm = weekRuns.reduce((sum, r) => sum + r.distanceKm, 0)

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold">מעקב ריצה</h1>
        <p className="text-blue-200 mt-1 text-sm">תוכנית 4 חודשים — מ-0 ל-15 ק&quot;מ</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-400">{weekKm.toFixed(1)}</p>
            <p className="text-xs text-slate-400">ק&quot;מ השבוע</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-400">{adherencePercent}%</p>
            <p className="text-xs text-slate-400">עמידה בתוכנית</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-400">{doneSessions}</p>
            <p className="text-xs text-slate-400">ריצות בוצעו</p>
          </div>
        </div>

        {nextSession && (
          <div className="bg-slate-800 rounded-xl p-4 shadow-sm border-r-4 border-blue-500">
            <p className="text-xs text-slate-400 mb-1">האימון הבא</p>
            <p className="font-bold text-lg text-white">{nextSession.dayLabel}</p>
            <p className="text-blue-400 font-medium">{nextSession.targetKm} ק&quot;מ</p>
            <p className="text-sm text-slate-400 mt-1">{formatDate(nextSession.plannedDate)}</p>
            {nextSession.methodNote && (
              <p className="text-xs text-slate-500 mt-2">{nextSession.methodNote}</p>
            )}
          </div>
        )}

        <DashboardClient />

        {runs.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-200 mb-3">ריצות אחרונות</p>
            <div className="space-y-2">
              {runs.map(run => (
                <div key={run.id} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-white">{run.distanceKm} ק&quot;מ</p>
                    <p className="text-xs text-slate-400">
                      {new Date(run.date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-300">{formatPace(run.paceMinPerKm)}</p>
                    {run.feeling && (
                      <p className="text-xs text-slate-500">תחושה: {run.feeling}/10</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
