export function isDemo(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('demo=1'))
}
