'use client'

import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'

export default function Footer() {
  const { t } = useI18n()
  const { theme } = useTheme()
  
  return (
    <div className={`p-4 border-t mt-auto ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <p className={`text-[11px] text-center leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
        © {new Date().getFullYear()} {t.createdBy}{' '}
        <a 
          href="https://lakeshorestudios.ch/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={`underline hover:no-underline ${theme === 'dark' ? 'text-blue-400' : 'text-brandblue'}`}
        >
          lakeshorestudios
        </a>
        <br />
        {t.madeWithAI} • {t.version}
      </p>
    </div>
  )
}
