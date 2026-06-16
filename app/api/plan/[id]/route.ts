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
  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/plan/[id]'>) {
  const { id } = await ctx.params
  await prisma.planSession.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
