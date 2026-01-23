'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme'

interface ReleaseNotesProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReleaseNotes({ isOpen, onClose }: ReleaseNotesProps) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      // Lade Release Notes
      fetch('/release-notes/RELEASES.md')
        .then(res => res.text())
        .then(text => {
          setContent(text)
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to load release notes:', err)
          setContent('# Fehler beim Laden der Release Notes')
          setIsLoading(false)
        })
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Einfaches Markdown-Parsing für Überschriften, Listen und Fettdruck
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let key = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // H1
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {line.substring(2)}
          </h1>
        )
      }
      // H2
      else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className={`text-2xl font-bold mt-8 mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {line.substring(3)}
          </h2>
        )
      }
      // H3
      else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className={`text-xl font-semibold mt-6 mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {line.substring(4)}
          </h3>
        )
      }
      // Horizontale Linie
      else if (line.trim() === '---') {
        elements.push(
          <hr key={key++} className={`my-8 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`} />
        )
      }
      // Liste
      else if (line.startsWith('- ')) {
        const listItems: string[] = [line.substring(2)]
        while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
          i++
          listItems.push(lines[i].substring(2))
        }
        elements.push(
          <ul key={key++} className={`list-disc list-outside space-y-2 pl-6 ml-2 mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {listItems.map((item, idx) => {
              // Parse Fettdruck **text**
              const parts = item.split(/(\*\*.*?\*\*)/)
              return (
                <li key={idx}>
                  {parts.map((part, partIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={partIdx} className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{part.slice(2, -2)}</strong>
                    }
                    return <span key={partIdx}>{part}</span>
                  })}
                </li>
              )
            })}
          </ul>
        )
      }
      // Leere Zeile
      else if (line.trim() === '') {
        // Ignorieren
      }
      // Normaler Text
      else {
        // Parse Fettdruck **text**
        const parts = line.split(/(\*\*.*?\*\*)/)
        elements.push(
          <p key={key++} className={`mb-3 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIdx} className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{part.slice(2, -2)}</strong>
              }
              return <span key={partIdx}>{part}</span>
            })}
          </p>
        )
      }
    }

    return elements
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative z-[10000] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t.releaseNotes}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label={t.close}
          >
            <X size={24} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandblue"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {parseMarkdown(content)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
