import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function d(day: number, month: number, year: number = 2026): Date {
  return new Date(year, month - 1, day)
}

const sessions = [
  // Month 1 — Week 1
  { monthNumber: 1, weekNumber: 1, dayLabel: 'אימון קצר 1', plannedDate: d(17, 6), targetKm: 1.5, methodNote: "ריצה 1 דק' + הליכה 2 דק', חזרה על הסט" },
  { monthNumber: 1, weekNumber: 1, dayLabel: 'יום גמיש', plannedDate: d(18, 6), targetKm: 0, methodNote: 'השלמה אם צריך' },
  { monthNumber: 1, weekNumber: 1, dayLabel: 'אימון קצר 2', plannedDate: d(20, 6), targetKm: 2, methodNote: "ריצה 1 דק' + הליכה 2 דק'" },
  { monthNumber: 1, weekNumber: 1, dayLabel: 'אימון ארוך', plannedDate: d(22, 6), targetKm: 1.5, methodNote: "ריצה 1 דק' + הליכה 2 דק'" },
  // Month 1 — Week 2
  { monthNumber: 1, weekNumber: 2, dayLabel: 'אימון קצר 1', plannedDate: d(24, 6), targetKm: 2, methodNote: "ריצה 2 דק' + הליכה 1.5 דק'" },
  { monthNumber: 1, weekNumber: 2, dayLabel: 'יום גמיש', plannedDate: d(25, 6), targetKm: 0, methodNote: null },
  { monthNumber: 1, weekNumber: 2, dayLabel: 'אימון קצר 2', plannedDate: d(27, 6), targetKm: 2, methodNote: "ריצה 2 דק' + הליכה 1.5 דק'" },
  { monthNumber: 1, weekNumber: 2, dayLabel: 'אימון ארוך', plannedDate: d(29, 6), targetKm: 3, methodNote: "ריצה 2 דק' + הליכה 1.5 דק'" },
  // Month 1 — Week 3
  { monthNumber: 1, weekNumber: 3, dayLabel: 'אימון קצר 1', plannedDate: d(1, 7), targetKm: 2.5, methodNote: "ריצה 3 דק' + הליכה 1 דק'" },
  { monthNumber: 1, weekNumber: 3, dayLabel: 'יום גמיש', plannedDate: d(2, 7), targetKm: 0, methodNote: null },
  { monthNumber: 1, weekNumber: 3, dayLabel: 'אימון קצר 2', plannedDate: d(4, 7), targetKm: 2.5, methodNote: "ריצה 3 דק' + הליכה 1 דק'" },
  { monthNumber: 1, weekNumber: 3, dayLabel: 'אימון ארוך', plannedDate: d(6, 7), targetKm: 4, methodNote: "ריצה 3 דק' + הליכה 1 דק'" },
  // Month 1 — Week 4
  { monthNumber: 1, weekNumber: 4, dayLabel: 'אימון קצר 1', plannedDate: d(8, 7), targetKm: 3, methodNote: "ריצה 4 דק' + הליכה 1 דק'" },
  { monthNumber: 1, weekNumber: 4, dayLabel: 'יום גמיש', plannedDate: d(9, 7), targetKm: 0, methodNote: null },
  { monthNumber: 1, weekNumber: 4, dayLabel: 'אימון קצר 2', plannedDate: d(11, 7), targetKm: 3, methodNote: "ריצה 4 דק' + הליכה 1 דק'" },
  { monthNumber: 1, weekNumber: 4, dayLabel: 'אימון ארוך', plannedDate: d(13, 7), targetKm: 5, methodNote: 'נסה/י לסיים ברציפות אם נעים' },

  // Month 2 — Week 5
  { monthNumber: 2, weekNumber: 5, dayLabel: 'אימון קצר 1', plannedDate: d(15, 7), targetKm: 3, methodNote: 'ריצה רציפה קלה' },
  { monthNumber: 2, weekNumber: 5, dayLabel: 'יום גמיש', plannedDate: d(16, 7), targetKm: 0, methodNote: null },
  { monthNumber: 2, weekNumber: 5, dayLabel: 'אימון קצר 2', plannedDate: d(18, 7), targetKm: 3, methodNote: 'ריצה רציפה קלה' },
  { monthNumber: 2, weekNumber: 5, dayLabel: 'אימון ארוך', plannedDate: d(20, 7), targetKm: 6, methodNote: null },
  // Month 2 — Week 6
  { monthNumber: 2, weekNumber: 6, dayLabel: 'אימון קצר 1', plannedDate: d(22, 7), targetKm: 3.5, methodNote: null },
  { monthNumber: 2, weekNumber: 6, dayLabel: 'יום גמיש', plannedDate: d(23, 7), targetKm: 0, methodNote: null },
  { monthNumber: 2, weekNumber: 6, dayLabel: 'אימון קצר 2', plannedDate: d(25, 7), targetKm: 3.5, methodNote: null },
  { monthNumber: 2, weekNumber: 6, dayLabel: 'אימון ארוך', plannedDate: d(27, 7), targetKm: 7, methodNote: null },
  // Month 2 — Week 7 (recovery)
  { monthNumber: 2, weekNumber: 7, dayLabel: 'אימון קצר 1', plannedDate: d(29, 7), targetKm: 4, methodNote: 'שבוע החלמה — קצת קל יותר' },
  { monthNumber: 2, weekNumber: 7, dayLabel: 'יום גמיש', plannedDate: d(30, 7), targetKm: 0, methodNote: null },
  { monthNumber: 2, weekNumber: 7, dayLabel: 'אימון קצר 2', plannedDate: d(1, 8), targetKm: 4, methodNote: null },
  { monthNumber: 2, weekNumber: 7, dayLabel: 'אימון ארוך', plannedDate: d(3, 8), targetKm: 8.5, methodNote: null },
  // Month 2 — Week 8
  { monthNumber: 2, weekNumber: 8, dayLabel: 'אימון קצר 1', plannedDate: d(5, 8), targetKm: 4, methodNote: null },
  { monthNumber: 2, weekNumber: 8, dayLabel: 'יום גמיש', plannedDate: d(6, 8), targetKm: 0, methodNote: null },
  { monthNumber: 2, weekNumber: 8, dayLabel: 'אימון קצר 2', plannedDate: d(8, 8), targetKm: 4, methodNote: null },
  { monthNumber: 2, weekNumber: 8, dayLabel: 'אימון ארוך', plannedDate: d(10, 8), targetKm: 10, methodNote: 'יעד חודש 2' },

  // Month 3 — Week 9
  { monthNumber: 3, weekNumber: 9, dayLabel: 'אימון קצר 1', plannedDate: d(12, 8), targetKm: 4.5, methodNote: null },
  { monthNumber: 3, weekNumber: 9, dayLabel: 'יום גמיש', plannedDate: d(13, 8), targetKm: 0, methodNote: null },
  { monthNumber: 3, weekNumber: 9, dayLabel: 'אימון קצר 2', plannedDate: d(15, 8), targetKm: 4.5, methodNote: null },
  { monthNumber: 3, weekNumber: 9, dayLabel: 'אימון ארוך', plannedDate: d(17, 8), targetKm: 11, methodNote: null },
  // Month 3 — Week 10
  { monthNumber: 3, weekNumber: 10, dayLabel: 'אימון קצר 1', plannedDate: d(19, 8), targetKm: 5, methodNote: null },
  { monthNumber: 3, weekNumber: 10, dayLabel: 'יום גמיש', plannedDate: d(20, 8), targetKm: 0, methodNote: null },
  { monthNumber: 3, weekNumber: 10, dayLabel: 'אימון קצר 2', plannedDate: d(22, 8), targetKm: 5, methodNote: null },
  { monthNumber: 3, weekNumber: 10, dayLabel: 'אימון ארוך', plannedDate: d(24, 8), targetKm: 12.5, methodNote: null },
  // Month 3 — Week 11 (recovery)
  { monthNumber: 3, weekNumber: 11, dayLabel: 'אימון קצר 1', plannedDate: d(26, 8), targetKm: 5, methodNote: 'שבוע החלמה' },
  { monthNumber: 3, weekNumber: 11, dayLabel: 'יום גמיש', plannedDate: d(27, 8), targetKm: 0, methodNote: null },
  { monthNumber: 3, weekNumber: 11, dayLabel: 'אימון קצר 2', plannedDate: d(29, 8), targetKm: 5, methodNote: null },
  { monthNumber: 3, weekNumber: 11, dayLabel: 'אימון ארוך', plannedDate: d(31, 8), targetKm: 13, methodNote: null },
  // Month 3 — Week 12
  { monthNumber: 3, weekNumber: 12, dayLabel: 'אימון קצר 1', plannedDate: d(2, 9), targetKm: 5, methodNote: null },
  { monthNumber: 3, weekNumber: 12, dayLabel: 'יום גמיש', plannedDate: d(3, 9), targetKm: 0, methodNote: null },
  { monthNumber: 3, weekNumber: 12, dayLabel: 'אימון קצר 2', plannedDate: d(5, 9), targetKm: 5, methodNote: null },
  { monthNumber: 3, weekNumber: 12, dayLabel: 'אימון ארוך', plannedDate: d(7, 9), targetKm: 15, methodNote: 'יעד חודש 3' },

  // Month 4 — Week 13
  { monthNumber: 4, weekNumber: 13, dayLabel: 'אימון קצר 1', plannedDate: d(9, 9), targetKm: 5, methodNote: null },
  { monthNumber: 4, weekNumber: 13, dayLabel: 'יום גמיש', plannedDate: d(10, 9), targetKm: 0, methodNote: null },
  { monthNumber: 4, weekNumber: 13, dayLabel: 'אימון קצר 2', plannedDate: d(12, 9), targetKm: 5, methodNote: null },
  { monthNumber: 4, weekNumber: 13, dayLabel: 'אימון ארוך', plannedDate: d(14, 9), targetKm: 15, methodNote: 'חזרה/השלמה אם צריך' },
  // Month 4 — Week 14
  { monthNumber: 4, weekNumber: 14, dayLabel: 'אימון קצר 1', plannedDate: d(16, 9), targetKm: 5.5, methodNote: 'עבודת קצב קלה' },
  { monthNumber: 4, weekNumber: 14, dayLabel: 'יום גמיש', plannedDate: d(17, 9), targetKm: 0, methodNote: null },
  { monthNumber: 4, weekNumber: 14, dayLabel: 'אימון קצר 2', plannedDate: d(19, 9), targetKm: 5.5, methodNote: null },
  { monthNumber: 4, weekNumber: 14, dayLabel: 'אימון ארוך', plannedDate: d(21, 9), targetKm: 15, methodNote: null },
  // Month 4 — Week 15
  { monthNumber: 4, weekNumber: 15, dayLabel: 'אימון קצר 1', plannedDate: d(23, 9), targetKm: 6, methodNote: null },
  { monthNumber: 4, weekNumber: 15, dayLabel: 'יום גמיש', plannedDate: d(24, 9), targetKm: 0, methodNote: null },
  { monthNumber: 4, weekNumber: 15, dayLabel: 'אימון קצר 2', plannedDate: d(26, 9), targetKm: 6, methodNote: null },
  { monthNumber: 4, weekNumber: 15, dayLabel: 'אימון ארוך', plannedDate: d(28, 9), targetKm: 16, methodNote: 'אופציונלי, למי שמרגיש מוכן' },
  // Month 4 — Week 16
  { monthNumber: 4, weekNumber: 16, dayLabel: 'אימון קצר 1', plannedDate: d(30, 9), targetKm: 5, methodNote: null },
  { monthNumber: 4, weekNumber: 16, dayLabel: 'יום גמיש', plannedDate: d(1, 10), targetKm: 0, methodNote: null },
  { monthNumber: 4, weekNumber: 16, dayLabel: 'אימון קצר 2', plannedDate: d(3, 10), targetKm: 5, methodNote: 'אופציונלי' },
  { monthNumber: 4, weekNumber: 16, dayLabel: 'אימון ארוך', plannedDate: d(5, 10), targetKm: 15, methodNote: 'ריצת סיכום — סוגרים תוכנית' },
]

async function main() {
  console.log('מוחק נתונים קיימים...')
  await prisma.planSession.deleteMany()

  console.log('מזין', sessions.length, 'סשנים לתוכנית...')
  await prisma.planSession.createMany({ data: sessions })

  console.log('הזנת הנתונים הושלמה.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
