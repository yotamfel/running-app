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

    if (session.dayLabel === 'יום גמיש') {
      const nextSession = await prisma.planSession.findFirst({
        where: {
          weekNumber: session.weekNumber,
          plannedDate: { gt: session.plannedDate },
          status: 'planned',
        },
        orderBy: { plannedDate: 'asc' },
      })
      if (nextSession) {
        await prisma.planSession.update({
          where: { id: nextSession.id },
          data: { status: 'not_needed' },
        })
      }
    }

    // Auto-reschedule: if the run was done later than planned, shift future sessions
    const runDate = new Date(body.date)
    const plannedDate = new Date(session.plannedDate)
    const delayDays = Math.round((runDate.getTime() - plannedDate.getTime()) / 86400000)
    if (delayDays > 1) {
      const futureSessions = await prisma.planSession.findMany({
        where: { plannedDate: { gt: session.plannedDate }, status: 'planned' },
        orderBy: { plannedDate: 'asc' },
      })
      await Promise.all(
        futureSessions.map(s =>
          prisma.planSession.update({
            where: { id: s.id },
            data: { plannedDate: new Date(s.plannedDate.getTime() + delayDays * 86400000) },
          })
        )
      )
    }
  }

  return Response.json(run, { status: 201 })
}
