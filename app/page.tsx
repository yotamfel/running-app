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
    prisma.runLog.findMany({
      where: { date: { gte: weekAgo } },
    }),
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
      <div className="bg-blue-600 text-white px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold">מעקב ריצה</h1>
        <p className="text-blue-100 mt-1 text-sm">תוכנית 4 חודשים — מ-0 ל-15 ק&quot;מ</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 max-w-lg mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{weekKm.toFixed(1)}</p>
            <p className="text-xs text-slate-500">ק&quot;מ השבוע</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{adherencePercent}%</p>
            <p className="text-xs text-slate-500">עמידה בתוכנית</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">{doneSessions}</p>
            <p className="text-xs text-slate-500">ריצות בוצעו</p>
          </div>
        </div>

        {/* Next session */}
        {nextSession && (
          <div className="bg-white rounded-xl p-4 shadow-sm border-r-4 border-blue-500">
            <p className="text-xs text-slate-500 mb-1">האימון הבא</p>
            <p className="font-bold text-lg text-slate-800">{nextSession.dayLabel}</p>
            <p className="text-blue-600 font-medium">{nextSession.targetKm} ק&quot;מ</p>
            <p className="text-sm text-slate-500 mt-1">{formatDate(nextSession.plannedDate)}</p>
            {nextSession.methodNote && (
              <p className="text-xs text-slate-400 mt-2">{nextSession.methodNote}</p>
            )}
          </div>
        )}

        {/* AI Feedback button */}
        <DashboardClient />

        {/* Recent runs */}
        {runs.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">ריצות אחרונות</p>
            <div className="space-y-2">
              {runs.map(run => (
                <div key={run.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{run.distanceKm} ק&quot;מ</p>
                    <p className="text-xs text-slate-500">
                      {new Date(run.date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-600">{formatPace(run.paceMinPerKm)}</p>
                    {run.feeling && (
                      <p className="text-xs text-slate-400">תחושה: {run.feeling}/10</p>
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
