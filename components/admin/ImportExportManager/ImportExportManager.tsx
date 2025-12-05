'use client'

import { useState } from 'react'
import styles from './ImportExportManager.module.scss'
import { ImportReport } from './ImportReport'

export function ImportExportManager() {
  const [exportFormat, setExportFormat] = useState<'zip' | 'json' | 'xlsx'>('zip')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importOptions, setImportOptions] = useState({
    skipExisting: false,
    updateExisting: true,
    importMedia: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/admin/export?format=${exportFormat}`, {
        credentials: 'include',
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${Date.now()}.${exportFormat === 'xlsx' ? 'xlsx' : exportFormat === 'json' ? 'json' : 'zip'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Ошибка при экспорте')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleValidate = async () => {
    if (!importFile) {
      alert('Выберите файл для валидации')
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)

    try {
      const response = await fetch('/api/admin/validate-file', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      setValidationResult(data.data)
    } catch (error) {
      alert('Ошибка при валидации')
      console.error(error)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('Выберите файл для импорта')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('options', JSON.stringify(importOptions))

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        setImportResult(data.data)
      } else {
        alert('Ошибка при импорте: ' + data.error)
        setImportResult(null)
      }
    } catch (error) {
      alert('Ошибка при импорте')
      console.error(error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className={styles.container}>
      {isImporting && (
        <div className={styles.importOverlay}>
          <div className={styles.importProgress}>
            <div className={styles.progressSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <h3 className={styles.progressTitle}>Импорт данных</h3>
            <p className={styles.progressText}>
              Пожалуйста, подождите. Идет обработка файла...
            </p>
            <div className={styles.progressBar}>
              <div className={styles.progressBarFill}></div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Импорт / Экспорт данных</h1>
          <p className={styles.subtitle}>
            Экспорт и импорт товаров, категорий и настроек
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Экспорт данных</h2>
          <div className={styles.card}>
            <p className={styles.description}>
              Экспортируйте все данные магазина в различных форматах
            </p>
            <div className={styles.formatSelector}>
              <label className={styles.formatLabel}>
                <input
                  type="radio"
                  value="zip"
                  checked={exportFormat === 'zip'}
                  onChange={(e) => setExportFormat(e.target.value as 'zip')}
                />
                <span>ZIP (полный экспорт с медиа)</span>
              </label>
              <label className={styles.formatLabel}>
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json')}
                />
                <span>JSON (только данные)</span>
              </label>
              <label className={styles.formatLabel}>
                <input
                  type="radio"
                  value="xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={(e) => setExportFormat(e.target.value as 'xlsx')}
                />
                <span>XLSX (Excel)</span>
              </label>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={styles.exportButton}
            >
              {isExporting ? 'Экспорт...' : 'Экспортировать'}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Импорт данных</h2>
          <div className={styles.card}>
            <p className={styles.description}>
              Импортируйте данные из ZIP архива или JSON файла
            </p>
            <div className={styles.fileUpload}>
              <label className={styles.uploadButton}>
                <svg className={styles.uploadIcon} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12V6M9 6L6 9M9 6L12 9M3 15H15C15.5523 15 16 14.5523 16 14V4C16 3.44772 15.5523 3 15 3H3C2.44772 3 2 3.44772 2 4V14C2 14.5523 2.44772 15 3 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{importFile ? 'Изменить файл' : 'Выбрать файл'}</span>
                <input
                  type="file"
                  accept=".zip,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                  disabled={isImporting}
                />
              </label>
              {importFile && (
                <div className={styles.fileInfo}>
                  <svg className={styles.fileIcon} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4H18.6667L24 9.33333V26.6667C24 27.3739 23.719 28.0522 23.219 28.5522C22.7189 29.0523 22.0406 29.3333 21.3333 29.3333H10.6667C9.95942 29.3333 9.28115 29.0523 8.78105 28.5522C8.28095 28.0522 8 27.3739 8 26.6667V5.33333C8 4.62609 8.28095 3.94781 8.78105 3.44772C9.28115 2.94762 9.95942 2.66667 10.6667 2.66667H8V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.6667 2.66667V9.33333H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className={styles.fileDetails}>
                    <div className={styles.fileName}>{importFile.name}</div>
                    <div className={styles.fileSize}>
                      {(importFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    className={styles.removeFile}
                    onClick={() => setImportFile(null)}
                    disabled={isImporting}
                    type="button"
                    aria-label="Удалить файл"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className={styles.importOptions}>
              <label className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={importOptions.skipExisting}
                  onChange={(e) =>
                    setImportOptions({ ...importOptions, skipExisting: e.target.checked })
                  }
                />
                <span>Пропускать существующие записи</span>
              </label>
              <label className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={importOptions.updateExisting}
                  onChange={(e) =>
                    setImportOptions({ ...importOptions, updateExisting: e.target.checked })
                  }
                />
                <span>Обновлять существующие записи</span>
              </label>
              <label className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={importOptions.importMedia}
                  onChange={(e) =>
                    setImportOptions({ ...importOptions, importMedia: e.target.checked })
                  }
                />
                <span>Импортировать медиафайлы</span>
              </label>
            </div>
            <div className={styles.importActions}>
              <button
                onClick={handleValidate}
                disabled={!importFile}
                className={styles.validateButton}
              >
                Валидировать файл
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className={styles.importButton}
              >
                {isImporting ? 'Импорт...' : 'Импортировать'}
              </button>
            </div>
            {validationResult && (
              <div
                className={`${styles.result} ${
                  validationResult.valid ? styles.success : styles.error
                }`}
              >
                <h3>Результат валидации:</h3>
                <p className={styles.validationStatus}>
                  Валидность: {validationResult.valid ? (
                    <span className={styles.validIcon}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Да
                    </span>
                  ) : (
                    <span className={styles.invalidIcon}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Нет
                    </span>
                  )}
                </p>
                {validationResult.stats && (
                  <div>
                    <p>Товары: {validationResult.stats.products}</p>
                    <p>Категории: {validationResult.stats.categories}</p>
                  </div>
                )}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div>
                    <strong>Ошибки:</strong>
                    <ul>
                      {validationResult.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {importResult && (
              <ImportReport 
                result={importResult} 
                onClose={() => setImportResult(null)} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



