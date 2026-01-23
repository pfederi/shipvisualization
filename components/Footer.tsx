'use client'

import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'

interface FooterProps {
  onReleaseNotesClick?: () => void
}

export default function Footer({ onReleaseNotesClick }: FooterProps) {
  const { t } = useI18n()
  const { theme } = useTheme()
  
  return (
    <div className={`p-4 border-t mt-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
        {t.madeWithAI} • v1.2.0
        {onReleaseNotesClick && (
          <>
            {' • '}
            <button
              onClick={onReleaseNotesClick}
              className={`underline hover:no-underline ${theme === 'dark' ? 'text-blue-400' : 'text-brandblue'}`}
            >
              {t.releaseNotes}
            </button>
          </>
        )}
      </p>
    </div>
  )
}
