import { prisma } from '@/lib/prisma'
import BottomNav from '@/components/BottomNav'
import PlanClient from '@/components/PlanClient'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const sessions = await prisma.planSession.findMany({
    orderBy: { plannedDate: 'asc' },
  })

  const serialized = sessions.map(s => ({
    ...s,
    plannedDate: s.plannedDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-blue-700 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">תוכנית 4 חודשים</h1>
        <p className="text-blue-200 text-sm mt-1">17.6.2026 – 5.10.2026</p>
      </div>
      <div className="px-4 py-4 max-w-lg mx-auto">
        <PlanClient initialSessions={serialized} />
      </div>
      <BottomNav />
    </div>
  )
}
