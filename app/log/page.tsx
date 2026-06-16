import { prisma } from '@/lib/prisma'
import BottomNav from '@/components/BottomNav'
import LogRunClient from '@/components/LogRunClient'

export const dynamic = 'force-dynamic'

export default async function LogPage() {
  const sessions = await prisma.planSession.findMany({
    where: { status: 'planned' },
    orderBy: { plannedDate: 'asc' },
    take: 20,
  })

  const serialized = sessions.map(s => ({
    id: s.id,
    dayLabel: s.dayLabel,
    plannedDate: s.plannedDate.toISOString(),
    targetKm: s.targetKm,
  }))

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">תיעוד ריצה</h1>
        <p className="text-blue-200 text-sm mt-1">הוסף ריצה חדשה</p>
      </div>
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="bg-slate-800 rounded-xl p-4">
          <LogRunClient plannedSessions={serialized} />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
