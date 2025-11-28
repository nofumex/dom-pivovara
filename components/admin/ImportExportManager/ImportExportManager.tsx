'use client'

import { useState } from 'react'
import styles from './ImportExportManager.module.scss'

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
      setImportResult(data.data)
      if (data.success) {
        alert('Импорт завершен успешно!')
        window.location.reload()
      } else {
        alert('Ошибка при импорте: ' + data.error)
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
            <div className={styles.fileInput}>
              <input
                type="file"
                accept=".zip,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className={styles.fileInputField}
              />
              {importFile && (
                <p className={styles.fileName}>{importFile.name}</p>
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
                <p>Валидность: {validationResult.valid ? '✓ Да' : '✗ Нет'}</p>
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
              <div className={styles.result}>
                <h3>Результат импорта:</h3>
                {importResult.processed && (
                  <div>
                    <p>Обработано товаров: {importResult.processed.products}</p>
                    <p>Обработано категорий: {importResult.processed.categories}</p>
                    <p>Обработано медиа: {importResult.processed.media}</p>
                  </div>
                )}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <strong>Ошибки:</strong>
                    <ul>
                      {importResult.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



