import { prisma } from '@/lib/prisma'
import BottomNav from '@/components/BottomNav'
import HistoryChart from '@/components/HistoryChart'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const runs = await prisma.runLog.findMany({
    orderBy: { date: 'desc' },
  })

  const serialized = runs.map(r => ({
    id: r.id,
    date: r.date.toISOString(),
    distanceKm: r.distanceKm,
    durationMin: r.durationMin,
    paceMinPerKm: r.paceMinPerKm,
    feeling: r.feeling,
    notes: r.notes,
  }))

  const totalKm = runs.reduce((sum, r) => sum + r.distanceKm, 0)
  const avgPace = runs.length > 0
    ? runs.reduce((sum, r) => sum + r.paceMinPerKm, 0) / runs.length
    : 0

  function formatPace(pace: number) {
    const min = Math.floor(pace)
    const sec = Math.round((pace - min) * 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-blue-600 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">היסטוריה והתקדמות</h1>
        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-2xl font-bold">{totalKm.toFixed(1)}</p>
            <p className="text-blue-200 text-xs">סה&quot;כ ק&quot;מ</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{runs.length}</p>
            <p className="text-blue-200 text-xs">ריצות</p>
          </div>
          {runs.length > 0 && (
            <div>
              <p className="text-2xl font-bold">{formatPace(avgPace)}</p>
              <p className="text-blue-200 text-xs">קצב ממוצע</p>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-4 max-w-lg mx-auto">
        <HistoryChart runs={serialized} />
      </div>
      <BottomNav />
    </div>
  )
}
