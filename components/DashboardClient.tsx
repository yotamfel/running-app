'use client'

import { useState } from 'react'

export default function DashboardClient() {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function getFeedback() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בקבלת משוב')
      setFeedback(data.feedback)
      setOpen(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה לא צפויה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={getFeedback}
        disabled={loading}
        className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 rounded-xl py-4 font-semibold text-base disabled:opacity-60 transition-colors"
      >
        {loading ? 'מנתח נתונים...' : '🤖 משוב AI על ההתקדמות'}
      </button>

      {error && (
        <div className="bg-red-900/40 text-red-300 rounded-xl p-4 text-sm border border-red-800">{error}</div>
      )}

      {open && feedback && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
          <div className="bg-slate-800 rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col border-t border-slate-700">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700">
              <h2 className="font-bold text-lg text-white">ניתוח נתוני ריצה</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 text-2xl leading-none hover:text-slate-200"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <p className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">{feedback}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
