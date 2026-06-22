import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `אתה מנתח נתוני ריצה ויועץ אימונים. תפקידך לתת משוב עובדתי ואנליטי על ההתקדמות, ועצות קונקרטיות איך להמשיך קדימה.
אל תשתמש בשפה מעודדת, מוטיבציונית, או נלהבת. אל תגיד "כל הכבוד", "אתה מצוין", "תמשיך כך" וכל ביטוי דומה.

מבנה התשובה:
1. **ניתוח ביצועים** — התמקד קודם כל בריצות האחרונות (3-5 האחרונות). מה השתנה, מגמות קצב ומרחק, תחושה. לאחר מכן תן תמונה כוללת קצרה על כלל ההתקדמות.
2. **השוואת אימונים מאותו סוג** — אם יש נתוני השוואה בין אימונים מאותו סוג (למשל שתי "ריצה קצרה 1" או שתי "ריצה ארוכה"), השווה את הביצועים: שינויים בקצב, מרחק בפועל מול מתוכנן, תחושה. ציין מגמות שיפור או נסיגה בין ביצועים של אותו סוג אימון.
3. **עצות להמשך** — על בסיס הנתונים, תן המלצות קונקרטיות:
   - אם יש תוכנית פעילה: מה לשים לב אליו באימונים הקרובים, התאמות מומלצות (קצב, מרחק, מנוחה) בהתאם לביצועים האחרונים, אזהרות מפני עומס יתר או חוסר עקביות.
   - אם התוכנית מסתיימת בקרוב או הסתיימה: איך לשמור על הרמה, איך להמשיך להתקדם, מה הצעד הבא (הגדלת מרחק, שיפור קצב, ריצות מסוג חדש כמו אינטרוולים או טמפו).
   - אם אין תוכנית: המלצות לתדירות, מבנה שבועי, ומטרות ריאליסטיות בהתבסס על הנתונים.
4. **האימון הבא שלך** — אם אין תוכנית פעילה, תן המלצה ספציפית לאימון הבא: סוג (ריצה רגילה / אינטרוולים / טמפו / ריצה ארוכה), מרחק מומלץ, קצב מומלץ, ותזמון (מתי לבצע ביחס לאימון האחרון). בסס את ההמלצה על הריצות האחרונות ועל עקרונות של עומס הדרגתי.

אפשר להציע התאמות קונקרטיות (למשל הפחתת קצב, הגדלת מרחק הדרגתית, יום מנוחה נוסף, סוגי אימונים חדשים) על בסיס הנתונים.
אל תשתמש בסימני קריאה.
כתוב בעברית בלבד.`

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'מפתח API לא מוגדר' }, { status: 500 })
  }

  const now = new Date()

  const [sessions, runs, allRuns] = await Promise.all([
    prisma.planSession.findMany({ orderBy: { plannedDate: 'asc' } }),
    prisma.runLog.findMany({ orderBy: { date: 'desc' }, take: 20 }),
    prisma.runLog.findMany(),
  ])

  const planActive = sessions.some(s => s.status === 'planned' && new Date(s.plannedDate) >= now)

  const sessionById = new Map(sessions.map(s => [s.id, s]))
  const runById = new Map(allRuns.map(r => [r.id, r]))

  const recentRuns = runs.map(r => {
    const linked = r.planSessionId ? sessionById.get(r.planSessionId) : null
    return {
      תאריך: new Date(r.date).toLocaleDateString('he-IL'),
      'מרחק (ק"מ)': r.distanceKm,
      'זמן (דקות)': r.durationMin,
      'קצב (דק/ק"מ)': r.paceMinPerKm.toFixed(2),
      תחושה: r.feeling ?? 'לא דווח',
      הערות: r.notes ?? '',
      ...(linked ? {
        'סוג אימון מתוכנן': linked.dayLabel,
        'מרחק מתוכנן': linked.targetKm,
        'שבוע בתוכנית': linked.weekNumber,
        'חודש בתוכנית': linked.monthNumber,
      } : {}),
    }
  })

  const totalKm = allRuns.reduce((sum, r) => sum + r.distanceKm, 0)
  const totalRuns = allRuns.length
  const avgPace = totalRuns > 0 ? (allRuns.reduce((sum, r) => sum + r.paceMinPerKm, 0) / totalRuns).toFixed(2) : 'אין נתונים'

  let userMessage = `
נתוני ריצה לניתוח (התמקד קודם כל בריצות האחרונות ובמגמות אחרונות):

**סיכום כללי:**
- סה"כ ריצות: ${totalRuns}
- סה"כ ק"מ: ${totalKm.toFixed(1)}
- ממוצע קצב כולל: ${avgPace} דק/ק"מ

**20 הריצות האחרונות (מהחדשה לישנה):**
${JSON.stringify(recentRuns, null, 2)}
`

  const allPlannedCount = sessions.filter(s => s.status !== 'not_needed').length
  const totalDone = sessions.filter(s => s.status === 'done').length
  const totalSkipped = sessions.filter(s => s.status === 'skipped').length
  const upcomingSessions = sessions.filter(s => s.status === 'planned' && new Date(s.plannedDate) >= now)
  const lastSessionDate = sessions.length > 0 ? new Date(sessions[sessions.length - 1].plannedDate) : null
  const planFinished = lastSessionDate && lastSessionDate < now
  const planNearEnd = lastSessionDate && !planFinished && upcomingSessions.length <= 8

  if (planActive || planFinished) {
    const pastSessions = sessions.filter(s => s.status !== 'not_needed' && (s.status !== 'planned' || new Date(s.plannedDate) < now)).length
    const adherencePercent = pastSessions > 0 ? Math.round((totalDone / pastSessions) * 100) : 0

    const recentPlan = sessions
      .filter(s => {
        const d = new Date(s.plannedDate)
        return d >= new Date(now.getTime() - 14 * 86400000) && d <= new Date(now.getTime() + 14 * 86400000)
      })
      .map(s => {
        const linkedRun = s.linkedRunId ? runById.get(s.linkedRunId) : null
        return {
          תאריך: new Date(s.plannedDate).toLocaleDateString('he-IL'),
          'סוג אימון': s.dayLabel,
          'שבוע': s.weekNumber,
          'מרחק מתוכנן': s.targetKm,
          סטטוס: s.status,
          ...(linkedRun ? {
            'מרחק בפועל': linkedRun.distanceKm,
            'קצב בפועל': linkedRun.paceMinPerKm.toFixed(2),
            'תחושה בפועל': linkedRun.feeling ?? 'לא דווח',
          } : {}),
        }
      })

    userMessage += `
**עמידה בתוכנית אימונים (4 חודשים, מ-0 ל-15 ק"מ):**
- סה"כ אימונים בתוכנית: ${allPlannedCount}
- בוצעו: ${totalDone}
- פוספסו: ${totalSkipped}
- אחוז עמידה: ${adherencePercent}%
- נותרו: ${upcomingSessions.length} אימונים
${planFinished ? '- התוכנית הסתיימה' : ''}
${planNearEnd ? '- התוכנית מתקרבת לסיום' : ''}

**אימונים מסביב לתאריך הנוכחי (שבועיים אחורה + שבועיים קדימה):**
${JSON.stringify(recentPlan, null, 2)}
`

    const completedByType = new Map<string, Array<{ week: number; month: number; date: string; targetKm: number; actualKm?: number; pace?: string; feeling?: number | null }>>()
    for (const s of sessions) {
      if (s.status !== 'done') continue
      const linkedRun = s.linkedRunId ? runById.get(s.linkedRunId) : null
      const entry = {
        week: s.weekNumber,
        month: s.monthNumber,
        date: new Date(s.plannedDate).toLocaleDateString('he-IL'),
        targetKm: s.targetKm,
        ...(linkedRun ? {
          actualKm: linkedRun.distanceKm,
          pace: linkedRun.paceMinPerKm.toFixed(2),
          feeling: linkedRun.feeling,
        } : {}),
      }
      const existing = completedByType.get(s.dayLabel)
      if (existing) existing.push(entry)
      else completedByType.set(s.dayLabel, [entry])
    }

    const comparableTypes = Array.from(completedByType.entries())
      .filter(([, entries]) => entries.length >= 2)
      .map(([type, entries]) => ({
        'סוג אימון': type,
        'ביצועים': entries.sort((a, b) => a.week - b.week).map(e => ({
          'שבוע': e.week,
          'חודש': e.month,
          'תאריך': e.date,
          'מרחק מתוכנן': e.targetKm,
          ...(e.actualKm !== undefined ? { 'מרחק בפועל': e.actualKm } : {}),
          ...(e.pace ? { 'קצב (דק/ק"מ)': e.pace } : {}),
          ...(e.feeling !== undefined ? { 'תחושה': e.feeling ?? 'לא דווח' } : {}),
        })),
      }))

    if (comparableTypes.length > 0) {
      userMessage += `
**השוואת אימונים מאותו סוג (אימונים שבוצעו לפחות פעמיים):**
${JSON.stringify(comparableTypes, null, 2)}
`
    }

    if (upcomingSessions.length > 0) {
      const next5 = upcomingSessions.slice(0, 5).map(s => ({
        תאריך: new Date(s.plannedDate).toLocaleDateString('he-IL'),
        'סוג אימון': s.dayLabel,
        'מרחק מתוכנן': s.targetKm,
        הוראות: s.methodNote ?? '',
      }))
      userMessage += `
**5 האימונים הבאים:**
${JSON.stringify(next5, null, 2)}
`
    }
  }

  if (!planActive && !planFinished) {
    const lastRun = runs[0]
    const daysSinceLastRun = lastRun ? Math.round((now.getTime() - new Date(lastRun.date).getTime()) / 86400000) : null
    userMessage += `
**מצב נוכחי:** אין תוכנית אימונים פעילה. המשתמש מתאמן באופן עצמאי.
${daysSinceLastRun !== null ? `- ימים מאז הריצה האחרונה: ${daysSinceLastRun}` : ''}

אנא ספק ניתוח על הביצועים האחרונים, תמונה כוללת, ובעיקר — המלצה ספציפית ומפורטת לאימון הבא (סוג, מרחק, קצב, תזמון).`
  } else {
    userMessage += '\nאנא ספק ניתוח על הביצועים האחרונים, תמונה כוללת, ועצות קונקרטיות איך להמשיך קדימה.'
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  await prisma.aiFeedback.upsert({
    where: { id: 'singleton' },
    update: { content: text },
    create: { id: 'singleton', content: text },
  })

  return Response.json({ feedback: text })
}

export async function GET() {
  const saved = await prisma.aiFeedback.findUnique({ where: { id: 'singleton' } })
  if (!saved) return Response.json({ feedback: null })
  return Response.json({ feedback: saved.content, updatedAt: saved.updatedAt })
}
