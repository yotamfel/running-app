'use client'

import { useState, useEffect } from 'react'

type Weather = {
  current: {
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

function runCondition(temp: number, wind: number, rain: number): { label: string; color: string } {
  if (rain > 60) return { label: 'לא מומלץ לצאת — גשם', color: 'text-red-400' }
  if (temp >= 34) return { label: 'חם מאוד — רוץ לפני 7:00 בלבד', color: 'text-red-400' }
  if (temp >= 29) return { label: 'חם — עדיף בוקר מוקדם או ערב', color: 'text-amber-400' }
  if (wind >= 35) return { label: 'רוח חזקה — קשה לריצה', color: 'text-amber-400' }
  if (temp <= 8) return { label: 'קר — לבוש שכבות', color: 'text-blue-400' }
  return { label: 'תנאים טובים לריצה', color: 'text-emerald-400' }
}

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=31.7683&longitude=35.2137' +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&hourly=temperature_2m,precipitation_probability' +
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
      <div className="bg-slate-800 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-16" />
      </div>
    )
  }

  const c = weather.current
  const condition = runCondition(c.temperature_2m, c.wind_speed_10m, weather.daily.precipitation_probability_max[0])

  // Next 3 days forecast (skip today at index 0)
  const forecast = weather.daily.time.slice(1, 4).map((t, i) => {
    const idx = i + 1
    const date = new Date(t)
    return {
      day: DAY_NAMES[date.getDay()],
      icon: wmoIcon(weather.daily.weather_code[idx]),
      max: Math.round(weather.daily.temperature_2m_max[idx]),
      min: Math.round(weather.daily.temperature_2m_min[idx]),
      rain: weather.daily.precipitation_probability_max[idx],
    }
  })

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-slate-400 mb-2">מזג אוויר · ירושלים</p>
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
            <p className="text-xs text-slate-400">רוח {Math.round(c.wind_speed_10m)} קמ"ש</p>
          </div>
        </div>

        <div className="mt-3 bg-slate-700/50 rounded-lg px-3 py-2">
          <p className={`text-sm font-medium ${condition.color}`}>{condition.label}</p>
        </div>
      </div>

      <div className="border-t border-slate-700 px-4 py-3 flex justify-between">
        {forecast.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400">{f.day}</p>
            <span className="text-lg">{f.icon}</span>
            <p className="text-xs text-white font-medium">{f.max}°</p>
            <p className="text-xs text-slate-500">{f.min}°</p>
            {f.rain > 20 && <p className="text-xs text-blue-400">{f.rain}%</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
