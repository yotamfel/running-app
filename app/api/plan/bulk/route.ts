import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.action === 'shift') {
    const fromDate = new Date(body.fromDate)
    const days = parseInt(body.days)
    if (!days || isNaN(fromDate.getTime())) {
      return Response.json({ error: 'נדרש תאריך התחלה ומספר ימים' }, { status: 400 })
    }

    const sessions = await prisma.planSession.findMany({
      where: { plannedDate: { gte: fromDate }, status: 'planned' },
      orderBy: { plannedDate: 'asc' },
    })

    const updates = await Promise.all(
      sessions.map(s =>
        prisma.planSession.update({
          where: { id: s.id },
          data: { plannedDate: new Date(s.plannedDate.getTime() + days * 86400000) },
        })
      )
    )

    return Response.json({ updated: updates.length })
  }

  if (body.action === 'bulk_skip') {
    const fromDate = new Date(body.fromDate)
    const toDate = new Date(body.toDate)
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return Response.json({ error: 'נדרש טווח תאריכים' }, { status: 400 })
    }

    const result = await prisma.planSession.updateMany({
      where: {
        plannedDate: { gte: fromDate, lte: toDate },
        status: 'planned',
      },
      data: { status: 'skipped' },
    })

    return Response.json({ updated: result.count })
  }

  return Response.json({ error: 'פעולה לא מזוהה' }, { status: 400 })
}
