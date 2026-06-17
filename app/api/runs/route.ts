import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const runs = await prisma.runLog.findMany({
    orderBy: { date: 'desc' },
  })
  return Response.json(runs)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const distanceKm = parseFloat(body.distanceKm)
  const durationMin = parseFloat(body.durationMin)
  const paceMinPerKm = durationMin / distanceKm

  const run = await prisma.runLog.create({
    data: {
      date: new Date(body.date),
      distanceKm,
      durationMin,
      paceMinPerKm,
      feeling: body.feeling ? parseInt(body.feeling) : null,
      notes: body.notes ?? null,
      planSessionId: body.planSessionId ?? null,
    },
  })

  if (body.planSessionId) {
    const session = await prisma.planSession.update({
      where: { id: body.planSessionId },
      data: { status: 'done', linkedRunId: run.id },
    })

    if (session.dayLabel === 'אימון קצר 1') {
      const flexDay = await prisma.planSession.findFirst({
        where: { weekNumber: session.weekNumber, dayLabel: 'יום גמיש', status: 'planned' },
      })
      if (flexDay) {
        await prisma.planSession.update({
          where: { id: flexDay.id },
          data: { status: 'not_needed' },
        })
      }
    }
  }

  return Response.json(run, { status: 201 })
}
