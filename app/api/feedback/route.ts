import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `אתה מנתח נתוני ריצה. תפקידך לתת משוב עובדתי ואנליטי בלבד על ההתקדמות לפי הנתונים שיוצגו לך.
אל תשתמש בשפה מעודדת, מוטיבציונית, או נלהבת. אל תגיד "כל הכבוד", "אתה מצוין", "תמשיך כך" וכל ביטוי דומה.

עקרון מרכזי: התמקד קודם כל בריצות האחרונות ובהתקדמות לאחרונה. מה השתנה, מה השתפר, מה ירד, מגמות קצב ומרחק מהתקופה האחרונה.
אם יש נתוני תוכנית אימונים פעילה, ציין עמידה בתוכנית כהקשר משני.
אם אין תוכנית פעילה, נתח את הריצות העצמאיות: תדירות, קצב, מרחק, תחושה, מגמות.
אפשר להציע התאמות קונקרטיות (למשל הפחתת קצב, הגדלת מרחק הדרגתית, יום מנוחה נוסף) על בסיס הנתונים בלבד.
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

  const recentRuns = runs.map(r => ({
    תאריך: new Date(r.date).toLocaleDateString('he-IL'),
    'מרחק (ק"מ)': r.distanceKm,
    'זמן (דקות)': r.durationMin,
    'קצב (דק/ק"מ)': r.paceMinPerKm.toFixed(2),
    תחושה: r.feeling ?? 'לא דווח',
    הערות: r.notes ?? '',
  }))

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

  if (planActive) {
    const totalSessions = sessions.filter(s => s.status !== 'not_needed' && (s.status !== 'planned' || new Date(s.plannedDate) < now)).length
    const doneSessions = sessions.filter(s => s.status === 'done').length
    const skippedSessions = sessions.filter(s => s.status === 'skipped').length
    const adherencePercent = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0

    const planSummary = sessions.slice(0, 40).map(s => ({
      תאריך: new Date(s.plannedDate).toLocaleDateString('he-IL'),
      'סוג אימון': s.dayLabel,
      'מרחק מתוכנן': s.targetKm,
      סטטוס: s.status,
    }))

    userMessage += `
**הקשר משני — עמידה בתוכנית אימונים:**
- סשנים שהיו אמורים להתרחש עד היום: ${totalSessions}
- בוצעו: ${doneSessions}
- פוספסו: ${skippedSessions}
- אחוז עמידה: ${adherencePercent}%

**תוכנית (40 סשנים ראשונים):**
${JSON.stringify(planSummary, null, 2)}
`
  }

  userMessage += '\nאנא ספק ניתוח, עם דגש על ההתקדמות והמגמות האחרונות.'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ feedback: text })
}
