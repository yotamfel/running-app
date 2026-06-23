import { prisma } from '@/lib/prisma'
import BottomNav from '@/components/BottomNav'
import DashboardClient from '@/components/DashboardClient'
import WeatherWidget from '@/components/WeatherWidget'

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

  const [sessions, runs, weekRuns, allRuns] = await Promise.all([
    prisma.planSession.findMany({ orderBy: { plannedDate: 'asc' } }),
    prisma.runLog.findMany({ orderBy: { date: 'desc' }, take: 3 }),
    prisma.runLog.findMany({ where: { date: { gte: weekAgo } } }),
    prisma.runLog.findMany(),
  ])

  const nextSession = sessions.find(s => s.status === 'planned')

  const pastSessions = sessions.filter(s => new Date(s.plannedDate) < now && s.status !== 'not_needed')
  const doneSessions = pastSessions.filter(s => s.status === 'done').length
  const adherencePercent =
    pastSessions.length > 0 ? Math.round((doneSessions / pastSessions.length) * 100) : 0

  const planActive = !!nextSession
  const weekKm = weekRuns.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalKm = allRuns.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalRuns = allRuns.length

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-slate-800 text-white px-4 pt-10 pb-8 border-b border-slate-700">
        <h1 className="text-2xl font-bold">מעקב ריצה</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {planActive ? 'תוכנית 4 חודשים — מ-0 ל-15 ק"מ' : 'מעקב ריצה אישי'}
        </p>
      </div>

      <div className="px-4 mt-4 space-y-4 max-w-lg mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-indigo-400">{weekKm.toFixed(1)}</p>
            <p className="text-xs text-slate-400">ק&quot;מ השבוע</p>
          </div>
          {planActive ? (
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-2xl font-bold text-emerald-400">{adherencePercent}%</p>
              <p className="text-xs text-slate-400">עמידה בתוכנית</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-2xl font-bold text-emerald-400">{totalKm.toFixed(1)}</p>
              <p className="text-xs text-slate-400">סה&quot;כ ק&quot;מ</p>
            </div>
          )}
          <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-2xl font-bold text-violet-400">{totalRuns}</p>
            <p className="text-xs text-slate-400">סה&quot;כ ריצות</p>
          </div>
        </div>

        {/* Next session — detailed */}
        {nextSession && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="border-r-4 border-indigo-500 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">האימון הבא</p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-white">{nextSession.dayLabel}</p>
                  <p className="text-indigo-400 font-semibold text-base">
                    {nextSession.targetKm > 0 ? `${nextSession.targetKm} ק"מ` : 'אופציונלי'}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">{formatDate(nextSession.plannedDate)}</p>
                </div>
                <span className="text-2xl mt-1">
                  {nextSession.dayLabel.includes('ארוך') ? '🏃' : nextSession.dayLabel.includes('גמיש') ? '🔄' : '⚡'}
                </span>
              </div>
            </div>
            {nextSession.methodNote && (
              <div className="bg-slate-700/40 border-t border-slate-700 px-4 py-3">
                <p className="text-xs text-slate-300 font-medium mb-1">מה לעשות:</p>
                <p className="text-sm text-slate-400 leading-6">{nextSession.methodNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Weather */}
        <WeatherWidget />

        {/* AI Feedback */}
        <DashboardClient />

        {/* Recent runs */}
        {runs.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <p className="text-sm font-semibold text-slate-200 px-4 pt-3 pb-2">ריצות אחרונות</p>
            <div className="divide-y divide-slate-700">
              {runs.map(run => (
                <div key={run.id} className="flex justify-between items-center px-4 py-3">
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
