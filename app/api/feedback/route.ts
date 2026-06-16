import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `אתה מנתח נתוני ריצה. תפקידך לתת משוב עובדתי ואנליטי בלבד על ההתקדמות לפי הנתונים שיוצגו לך.
אל תשתמש בשפה מעודדת, מוטיבציונית, או נלהבת. אל תגיד "כל הכבוד", "אתה מצוין", "תמשיך כך" וכל ביטוי דומה.
התייחס לעובדות בלבד: עמידה בתוכנית, מגמות בקצב, מגמות במרחק, פערים בין מתוכנן לבוצע. אפשר להציע התאמות קונקרטיות (למשל הפחתת קצב, יום מנוחה נוסף) על בסיס הנתונים בלבד.
אל תשתמש בסימני קריאה.
כתוב בעברית בלבד.`

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'מפתח API לא מוגדר' }, { status: 500 })
  }

  const [sessions, runs] = await Promise.all([
    prisma.planSession.findMany({ orderBy: { plannedDate: 'asc' } }),
    prisma.runLog.findMany({ orderBy: { date: 'desc' }, take: 15 }),
  ])

  const totalSessions = sessions.filter(s => s.status !== 'planned' || new Date(s.plannedDate) < new Date()).length
  const doneSessions = sessions.filter(s => s.status === 'done').length
  const skippedSessions = sessions.filter(s => s.status === 'skipped').length
  const adherencePercent = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0

  const runsData = runs.map(r => ({
    תאריך: new Date(r.date).toLocaleDateString('he-IL'),
    'מרחק (ק"מ)': r.distanceKm,
    'זמן (דקות)': r.durationMin,
    'קצב (דק/ק"מ)': r.paceMinPerKm.toFixed(2),
    תחושה: r.feeling ?? 'לא דווח',
    הערות: r.notes ?? '',
  }))

  const planSummary = sessions.slice(0, 40).map(s => ({
    תאריך: new Date(s.plannedDate).toLocaleDateString('he-IL'),
    'סוג אימון': s.dayLabel,
    'מרחק מתוכנן': s.targetKm,
    סטטוס: s.status,
  }))

  const userMessage = `
נתוני ריצה לניתוח:

**עמידה בתוכנית:**
- סשנים שהיו אמורים להתרחש עד היום: ${totalSessions}
- בוצעו: ${doneSessions}
- פוספסו: ${skippedSessions}
- אחוז עמידה: ${adherencePercent}%

**15 הריצות האחרונות:**
${JSON.stringify(runsData, null, 2)}

**תוכנית (40 סשנים ראשונים):**
${JSON.stringify(planSummary, null, 2)}

אנא ספק ניתוח של הנתונים.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ feedback: text })
}
