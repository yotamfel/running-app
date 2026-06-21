import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/plan/[id]'>) {
  const { id } = await ctx.params
  const session = await prisma.planSession.findUnique({ where: { id } })
  if (!session) return Response.json({ error: 'לא נמצא' }, { status: 404 })
  return Response.json(session)
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/plan/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const updated = await prisma.planSession.update({
    where: { id },
    data: {
      ...(body.plannedDate !== undefined && { plannedDate: new Date(body.plannedDate) }),
      ...(body.targetKm !== undefined && { targetKm: body.targetKm }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.methodNote !== undefined && { methodNote: body.methodNote }),
      ...(body.dayLabel !== undefined && { dayLabel: body.dayLabel }),
      ...(body.linkedRunId !== undefined && { linkedRunId: body.linkedRunId }),
    },
  })

  const alsoUpdated = await autoUpdateFlexDay(updated)

  return Response.json({ ...updated, alsoUpdated })
}

async function autoUpdateFlexDay(session: { id: string; dayLabel: string; weekNumber: number; status: string; plannedDate: Date }) {
  const results = []

  if (session.dayLabel === 'אימון קצר 1') {
    const flexDay = await prisma.planSession.findFirst({
      where: { weekNumber: session.weekNumber, dayLabel: 'יום גמיש' },
    })
    if (flexDay) {
      if (session.status === 'done' && flexDay.status === 'planned') {
        results.push(await prisma.planSession.update({
          where: { id: flexDay.id },
          data: { status: 'not_needed' },
        }))
      } else if (session.status === 'planned' && flexDay.status === 'not_needed') {
        results.push(await prisma.planSession.update({
          where: { id: flexDay.id },
          data: { status: 'planned' },
        }))
      }
    }
  }

  if (session.dayLabel === 'יום גמיש') {
    if (session.status === 'done') {
      const nextSession = await prisma.planSession.findFirst({
        where: { weekNumber: session.weekNumber, id: { not: session.id }, status: 'planned', plannedDate: { gt: session.plannedDate } },
        orderBy: { plannedDate: 'asc' },
      })
      const prevSession = await prisma.planSession.findFirst({
        where: { weekNumber: session.weekNumber, id: { not: session.id }, status: 'planned', plannedDate: { lt: session.plannedDate } },
        orderBy: { plannedDate: 'desc' },
      })
      const closest = nextSession ?? prevSession
      if (closest) {
        results.push(await prisma.planSession.update({
          where: { id: closest.id },
          data: { status: 'not_needed' },
        }))
      }
    } else if (session.status === 'planned') {
      const adjacentNotNeeded = await prisma.planSession.findFirst({
        where: { weekNumber: session.weekNumber, id: { not: session.id }, status: 'not_needed' },
        orderBy: { plannedDate: 'desc' },
      })
      if (adjacentNotNeeded) {
        results.push(await prisma.planSession.update({
          where: { id: adjacentNotNeeded.id },
          data: { status: 'planned' },
        }))
      }
    }
  }

  return results
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/plan/[id]'>) {
  const { id } = await ctx.params
  await prisma.planSession.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
