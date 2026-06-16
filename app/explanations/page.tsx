import BottomNav from '@/components/BottomNav'

export default function ExplanationsPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="bg-blue-600 text-white px-4 pt-10 pb-6">
        <h1 className="text-xl font-bold">הסברים ורציונל</h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-base mb-3">שיטת ריצה-הליכה</h2>
          <p className="text-sm text-slate-600 leading-7">
            כשמתחילים מאפס, הגוף עדיין לא מוכן לריצה רצופה. שיטת ריצה-הליכה מחלקת את האימון לסטים:
            ריצה X דקות + הליכה Y דקות, וחוזרים על הסט. עם השבועות, זמן הריצה עולה וזמן ההליכה קטן.
            זו הדרך הבטוחה ביותר למנוע פציעות ולבנות בסיס אירובי.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-base mb-3">מבנה שבועי</h2>
          <div className="space-y-2">
            {[
              { day: 'רביעי', type: 'אימון קצר 1', color: 'bg-blue-50 text-blue-700' },
              { day: 'חמישי', type: 'יום גמיש / השלמה', color: 'bg-amber-50 text-amber-700' },
              { day: 'שבת', type: 'אימון קצר 2', color: 'bg-blue-50 text-blue-700' },
              { day: 'ראשון', type: 'מנוחה / גמיש', color: 'bg-slate-50 text-slate-600' },
              { day: 'שני', type: 'אימון ארוך', color: 'bg-green-50 text-green-700' },
              { day: 'שלישי', type: 'מנוחה', color: 'bg-slate-50 text-slate-600' },
              { day: 'שישי', type: 'מנוחה (תמיד)', color: 'bg-slate-50 text-slate-600' },
            ].map(({ day, type, color }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 w-16">{day}</span>
                <span className={`text-sm px-3 py-1 rounded-full ${color}`}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-base mb-3">מטרות לפי חודש</h2>
          <div className="space-y-3">
            {[
              { month: 'חודש 1', goal: '5 ק"מ', date: 'עד 13.7.2026', desc: 'בניית בסיס, ריצה-הליכה, 1.5–5 ק"מ' },
              { month: 'חודש 2', goal: '10 ק"מ', date: 'עד 10.8.2026', desc: 'ריצה רציפה קלה, 3–10 ק"מ' },
              { month: 'חודש 3', goal: '15 ק"מ', date: 'עד 7.9.2026', desc: 'עומס גובר, 4.5–15 ק"מ' },
              { month: 'חודש 4', goal: 'גיבוש', date: 'עד 5.10.2026', desc: 'ביסוס ה-15 ק"מ, שיפור קצב' },
            ].map(({ month, goal, date, desc }) => (
              <div key={month} className="flex gap-3 items-start">
                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg font-medium shrink-0 mt-0.5">{month}</div>
                <div>
                  <p className="font-medium text-sm text-slate-800">{goal} — {date}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-slate-800 text-base mb-3">מושגי יסוד</h2>
          <div className="space-y-3">
            {[
              { term: 'קצב', def: 'דקות לקילומטר (דק\'/ק"מ). ככל שהמספר נמוך יותר — הריצה מהירה יותר. קצב 7:00 = 7 דקות לק"מ.' },
              { term: 'RPE', def: 'Rating of Perceived Exertion — תחושת מאמץ סובייקטיבית. בתוכנית זו: 1-4 קל, 5-7 בינוני, 8-10 קשה.' },
              { term: 'ריצה קלה', def: 'קצב שבו אפשר לנהל שיחה בנוחות. רוב האימונים בתוכנית זו צריכים להיות בקצב קל.' },
              { term: 'שבוע החלמה', def: 'שבוע עם נפח נמוך יותר, המופיע כל 3-4 שבועות. נועד לאפשר לגוף להתאושש.' },
            ].map(({ term, def }) => (
              <div key={term}>
                <p className="font-semibold text-sm text-slate-800">{term}</p>
                <p className="text-sm text-slate-600 leading-6">{def}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-amber-800 leading-6">
            <span className="font-semibold">כלל בטיחות: </span>
            עייפות ונשימה כבדה הם תקינים. כאב הוא לא — אם יש כאב (לא עייפות), עוצרים ומאבחנים.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
