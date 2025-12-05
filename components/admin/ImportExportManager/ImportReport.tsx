'use client'

import { useState } from 'react'
import styles from './ImportReport.module.scss'

interface ImportResult {
  processed: {
    products: number
    categories: number
    media: number
  }
  errors: string[]
  warnings: string[]
  skipped: {
    products: string[]
    categories: string[]
    media: string[]
  }
}

interface ImportReportProps {
  result: ImportResult
  onClose: () => void
}

export function ImportReport({ result, onClose }: ImportReportProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('stats')

  const totalProcessed = result.processed.products + result.processed.categories + result.processed.media
  const totalSkipped = result.skipped.products.length + result.skipped.categories.length + result.skipped.media.length
  const hasErrors = result.errors.length > 0
  const hasWarnings = result.warnings.length > 0
  const isSuccess = !hasErrors && totalProcessed > 0

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={styles.report}>
      <div className={styles.reportHeader}>
        <div className={styles.reportTitle}>
          <h3>Отчет об импорте</h3>
          <span className={`${styles.statusBadge} ${isSuccess ? styles.success : styles.error}`}>
            {isSuccess ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Успешно
              </>
            ) : hasErrors ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ошибки
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Предупреждения
              </>
            )}
          </span>
        </div>
        <button onClick={onClose} className={styles.closeButton} aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" stroke="#3b82f6" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#3b82f6" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalProcessed}</div>
            <div className={styles.statLabel}>Обработано</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="#f59e0b" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalSkipped}</div>
            <div className={styles.statLabel}>Пропущено</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{result.errors.length}</div>
            <div className={styles.statLabel}>Ошибок</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" />
              <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" />
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{result.warnings.length}</div>
            <div className={styles.statLabel}>Предупреждений</div>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailSection}>
          <button
            className={styles.detailHeader}
            onClick={() => toggleSection('processed')}
          >
            <span className={styles.detailTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" stroke="#10b981" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#10b981" />
              </svg>
              Обработанные элементы
            </span>
            <span className={styles.detailCount}>{totalProcessed}</span>
            <span className={`${styles.expandIcon} ${expandedSection === 'processed' ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>
          {expandedSection === 'processed' && (
            <div className={styles.detailContent}>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Товары:</span>
                <span className={styles.detailItemValue}>{result.processed.products}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Категории:</span>
                <span className={styles.detailItemValue}>{result.processed.categories}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Медиафайлы:</span>
                <span className={styles.detailItemValue}>{result.processed.media}</span>
              </div>
            </div>
          )}
        </div>

        {totalSkipped > 0 && (
          <div className={styles.detailSection}>
            <button
              className={styles.detailHeader}
              onClick={() => toggleSection('skipped')}
            >
              <span className={styles.detailTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" />
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" />
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="#f59e0b" />
                </svg>
                Пропущенные элементы
              </span>
              <span className={styles.detailCount}>{totalSkipped}</span>
              <span className={`${styles.expandIcon} ${expandedSection === 'skipped' ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            {expandedSection === 'skipped' && (
              <div className={styles.detailContent}>
                {result.skipped.products.length > 0 && (
                  <div className={styles.skippedGroup}>
                    <div className={styles.skippedGroupTitle}>Товары ({result.skipped.products.length}):</div>
                    <div className={styles.skippedList}>
                      {result.skipped.products.slice(0, 10).map((item, i) => (
                        <span key={i} className={styles.skippedItem}>{item}</span>
                      ))}
                      {result.skipped.products.length > 10 && (
                        <span className={styles.skippedMore}>
                          и еще {result.skipped.products.length - 10}...
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {result.skipped.categories.length > 0 && (
                  <div className={styles.skippedGroup}>
                    <div className={styles.skippedGroupTitle}>Категории ({result.skipped.categories.length}):</div>
                    <div className={styles.skippedList}>
                      {result.skipped.categories.slice(0, 10).map((item, i) => (
                        <span key={i} className={styles.skippedItem}>{item}</span>
                      ))}
                      {result.skipped.categories.length > 10 && (
                        <span className={styles.skippedMore}>
                          и еще {result.skipped.categories.length - 10}...
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {result.skipped.media.length > 0 && (
                  <div className={styles.skippedGroup}>
                    <div className={styles.skippedGroupTitle}>Медиафайлы ({result.skipped.media.length}):</div>
                    <div className={styles.skippedList}>
                      {result.skipped.media.slice(0, 10).map((item, i) => (
                        <span key={i} className={styles.skippedItem}>{item}</span>
                      ))}
                      {result.skipped.media.length > 10 && (
                        <span className={styles.skippedMore}>
                          и еще {result.skipped.media.length - 10}...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {hasErrors && (
          <div className={styles.detailSection}>
            <button
              className={`${styles.detailHeader} ${styles.errorHeader}`}
              onClick={() => toggleSection('errors')}
            >
              <span className={styles.detailTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" stroke="#ef4444" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" />
                </svg>
                Ошибки
              </span>
              <span className={styles.detailCount}>{result.errors.length}</span>
              <span className={`${styles.expandIcon} ${expandedSection === 'errors' ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            {expandedSection === 'errors' && (
              <div className={styles.detailContent}>
                <div className={styles.errorList}>
                  {result.errors.map((error, i) => (
                    <div key={i} className={styles.errorItem}>
                      <svg className={styles.errorIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.errorText}>{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {hasWarnings && (
          <div className={styles.detailSection}>
            <button
              className={`${styles.detailHeader} ${styles.warningHeader}`}
              onClick={() => toggleSection('warnings')}
            >
              <span className={styles.detailTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" />
                </svg>
                Предупреждения
              </span>
              <span className={styles.detailCount}>{result.warnings.length}</span>
              <span className={`${styles.expandIcon} ${expandedSection === 'warnings' ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            {expandedSection === 'warnings' && (
              <div className={styles.detailContent}>
                <div className={styles.warningList}>
                  {result.warnings.map((warning, i) => (
                    <div key={i} className={styles.warningItem}>
                      <svg className={styles.warningIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.warningText}>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isSuccess && (
        <div className={styles.actions}>
          <button onClick={() => window.location.reload()} className={styles.refreshButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" stroke="currentColor" />
              <path d="M1 20v-6h6" stroke="currentColor" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" />
            </svg>
            Обновить страницу
          </button>
        </div>
      )}
    </div>
  )
}

