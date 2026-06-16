'use client'

import { useState, useEffect } from 'react'

type Weather = {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weather_code: number[]
    wind_speed_10m: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    weather_code: number[]
  }
}

function wmoIcon(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  return '⛈️'
}

function wmoLabel(code: number): string {
  if (code === 0) return 'שמיים בהירים'
  if (code <= 2) return 'מעונן חלקית'
  if (code === 3) return 'מעונן'
  if (code <= 48) return 'ערפל'
  if (code <= 55) return 'טפטוף'
  if (code <= 67) return 'גשם'
  if (code <= 77) return 'שלג'
  if (code <= 82) return 'מקלחות גשם'
  return 'סופת ברקים'
}

type RunAssessment = { label: string; detail: string; color: string; bg: string; border: string }

function assessRun(temp: number, wind: number, rain: number, code: number): RunAssessment {
  const isRaining = code >= 51 || rain > 60
  const veryHot = temp >= 34
  const hot = temp >= 29
  const veryWindy = wind >= 40
  const windy = wind >= 25

  if (isRaining)
    return { label: 'לא מומלץ', detail: `גשם צפוי (${rain}% הסתברות)`, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800' }
  if (veryHot)
    return { label: 'לא מומלץ', detail: `חם מאוד — ${temp}°, מסוכן לריצה בשעות אלו`, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800' }
  if (veryWindy)
    return { label: 'קשה', detail: `רוח חזקה — ${Math.round(wind)} קמ"ש`, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800' }
  if (hot)
    return { label: 'אפשרי', detail: `חם — ${temp}°, קח הרבה מים ורוץ לאט`, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800' }
  if (windy)
    return { label: 'סביר', detail: `רוח — ${Math.round(wind)} קמ"ש, מעט יותר קשה`, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800' }
  return { label: 'תנאים טובים', detail: `${temp}° · ${Math.round(wind)} קמ"ש רוח · ${rain}% גשם`, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800' }
}

function findHourIndex(times: string[], targetHour: number, targetDate?: string): number {
  const prefix = targetDate
    ? `${targetDate}T${String(targetHour).padStart(2, '0')}`
    : (() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}T${String(targetHour).padStart(2, '0')}`
      })()
  const idx = times.findIndex(t => t.startsWith(prefix))
  return idx >= 0 ? idx : 0
}

function defaultPickerTime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [error, setError] = useState(false)
  const [pickerTime, setPickerTime] = useState<string>(defaultPickerTime)

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=31.7683&longitude=35.2137' +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code' +
      '&timezone=Asia%2FJerusalem&forecast_days=4'
    )
      .then(r => r.json())
      .then(setWeather)
      .catch(() => setError(true))
  }, [])

  if (error) return null
  if (!weather) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse">
        <div className="h-3 bg-slate-700 rounded w-32 mb-4" />
        <div className="h-8 bg-slate-700 rounded w-20 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-48" />
      </div>
    )
  }

  const c = weather.current

  // Parse picked hour and find index in hourly array (today's date by default)
  const pickedHour = parseInt(pickerTime.split(':')[0], 10)
  const nowHour = new Date().getHours()
  // If picked hour is earlier than now, it means tomorrow
  const daysOffset = pickedHour < nowHour ? 1 : 0
  const targetDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  const hourIdx = findHourIndex(weather.hourly.time, pickedHour, targetDate)
  const picked = {
    temp: Math.round(weather.hourly.temperature_2m[hourIdx] ?? 0),
    rain: weather.hourly.precipitation_probability[hourIdx] ?? 0,
    wind: weather.hourly.wind_speed_10m[hourIdx] ?? 0,
    code: weather.hourly.weather_code[hourIdx] ?? 0,
  }

  const assessment = assessRun(picked.temp, picked.wind, picked.rain, picked.code)

  const timeLabel = `${String(pickedHour).padStart(2, '0')}:00${daysOffset > 0 ? ' (מחר)' : ''}`

  const forecast = weather.daily.time.slice(1, 4).map((t, i) => {
    const idx = i + 1
    const date = new Date(t + 'T12:00:00')
    return {
      day: DAY_NAMES[date.getDay()],
      icon: wmoIcon(weather.daily.weather_code[idx]),
      max: Math.round(weather.daily.temperature_2m_max[idx]),
      min: Math.round(weather.daily.temperature_2m_min[idx]),
      rain: weather.daily.precipitation_probability_max[idx],
    }
  })

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Current */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-slate-400 mb-2">מזג אוויר כעת · ירושלים</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{wmoIcon(c.weather_code)}</span>
            <div>
              <p className="text-3xl font-bold text-white">{Math.round(c.temperature_2m)}°</p>
              <p className="text-xs text-slate-400">{wmoLabel(c.weather_code)}</p>
            </div>
          </div>
          <div className="text-left space-y-1">
            <p className="text-xs text-slate-400">מורגש {Math.round(c.apparent_temperature)}°</p>
            <p className="text-xs text-slate-400">לחות {c.relative_humidity_2m}%</p>
            <p className="text-xs text-slate-400">רוח {Math.round(c.wind_speed_10m)} קמ&quot;ש</p>
          </div>
        </div>
      </div>

      {/* Time picker + assessment */}
      <div className={`mx-4 mb-3 rounded-xl border px-4 py-3 ${assessment.bg} ${assessment.border}`}>
        {/* Header row with picker */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400">מתי אתה רוצה לרוץ?</p>
          <input
            type="time"
            value={pickerTime}
            onChange={e => setPickerTime(e.target.value)}
            step={3600}
            className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-indigo-500"
            style={{ direction: 'ltr', minWidth: '5rem' }}
          />
        </div>
        {/* Result */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-base font-bold ${assessment.color}`}>{assessment.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{assessment.detail}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xl">{wmoIcon(picked.code)}</span>
            <p className="text-xs text-slate-400">{timeLabel}</p>
          </div>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="border-t border-slate-700 px-4 py-3 flex justify-between">
        {forecast.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400">{f.day}</p>
            <span className="text-lg">{f.icon}</span>
            <p className="text-xs text-white font-medium">{f.max}°</p>
            <p className="text-xs text-slate-500">{f.min}°</p>
            {f.rain > 20 && <p className="text-xs text-indigo-400">{f.rain}%</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
