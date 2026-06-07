import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'bookgym-theme'

function readInitial() {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function apply(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

let themeState = typeof window !== 'undefined' ? readInitial() : 'light'
const listeners = new Set()

function emitChange() {
  for (const l of listeners) l()
}

function setTheme(newTheme) {
  if (themeState === newTheme) return
  themeState = newTheme
  apply(newTheme)
  try { localStorage.setItem(STORAGE_KEY, newTheme) } catch { /* ignore */ }
  emitChange()
}

function subscribe(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot() {
  return themeState
}

export function useDarkMode() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)
  const isDark = theme === 'dark'

  const toggle = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark])
  const setLight = useCallback(() => setTheme('light'), [])
  const setDark = useCallback(() => setTheme('dark'), [])

  return { theme, isDark, toggle, setLight, setDark }
}
