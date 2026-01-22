'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useI18n } from '@/lib/i18n-context'

export default function ThemeLanguageToggle() {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-md bg-white/10 transition-colors text-white text-sm font-bold uppercase">
          {language}
        </button>
        <button className="p-1.5 rounded-md bg-white/10 transition-colors text-white">
          <Moon size={18} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
        className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-bold uppercase"
        title={language === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
      >
        {language}
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white"
        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      >
        {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
      </button>
    </div>
  )
}
