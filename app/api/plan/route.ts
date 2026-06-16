import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sessions = await prisma.planSession.findMany({
    orderBy: { plannedDate: 'asc' },
  })
  return Response.json(sessions)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const session = await prisma.planSession.create({
    data: {
      monthNumber: body.monthNumber,
      weekNumber: body.weekNumber,
      dayLabel: body.dayLabel,
      plannedDate: new Date(body.plannedDate),
      targetKm: body.targetKm,
      methodNote: body.methodNote ?? null,
      status: body.status ?? 'planned',
    },
  })
  return Response.json(session, { status: 201 })
}
