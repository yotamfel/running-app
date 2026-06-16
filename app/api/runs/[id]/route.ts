import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/runs/[id]'>) {
  const { id } = await ctx.params
  const run = await prisma.runLog.findUnique({ where: { id } })
  if (!run) return Response.json({ error: 'לא נמצא' }, { status: 404 })
  return Response.json(run)
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/runs/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()

  let paceMinPerKm: number | undefined
  if (body.distanceKm !== undefined || body.durationMin !== undefined) {
    const existing = await prisma.runLog.findUnique({ where: { id } })
    if (existing) {
      const dist = body.distanceKm ?? existing.distanceKm
      const dur = body.durationMin ?? existing.durationMin
      paceMinPerKm = dur / dist
    }
  }

  const run = await prisma.runLog.update({
    where: { id },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.distanceKm !== undefined && { distanceKm: parseFloat(body.distanceKm) }),
      ...(body.durationMin !== undefined && { durationMin: parseFloat(body.durationMin) }),
      ...(paceMinPerKm !== undefined && { paceMinPerKm }),
      ...(body.feeling !== undefined && { feeling: body.feeling ? parseInt(body.feeling) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.planSessionId !== undefined && { planSessionId: body.planSessionId }),
    },
  })
  return Response.json(run)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/runs/[id]'>) {
  const { id } = await ctx.params
  await prisma.runLog.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
