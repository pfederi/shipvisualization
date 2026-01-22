'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/lib/i18n-context'
import { X } from 'lucide-react'

interface DocumentationProps {
  isOpen: boolean
  onClose: () => void
}

export default function Documentation({ isOpen, onClose }: DocumentationProps) {
  const { t } = useI18n()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-[10000] bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.docTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={t.close}
          >
            <X size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {t.docIntro}
          </p>

          {/* Data Sources */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {t.docDataSources}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.docDataSourcesText}
            </p>
          </section>

          {/* Position Calculation */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {t.docPositionCalculation}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {t.docPositionCalculationText}
            </p>
            <ul className="list-disc list-outside space-y-2 text-gray-700 dark:text-gray-300 pl-6 ml-2">
              <li>{t.docPositionCalculationList1}</li>
              <li>{t.docPositionCalculationList2}</li>
              <li>{t.docPositionCalculationList3}</li>
              <li>{t.docPositionCalculationList4}</li>
            </ul>
          </section>

          {/* Real-Time Display */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {t.docRealTime}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.docRealTimeText}
            </p>
          </section>

          {/* Accuracy */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {t.docAccuracy}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.docAccuracyText}
            </p>
          </section>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to ensure it's above everything
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}
