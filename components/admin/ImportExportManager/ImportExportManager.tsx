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
     replaceAll: false, // Полная замена каталога
   })
   const [isExporting, setIsExporting] = useState(false)
   const [isImporting, setIsImporting] = useState(false)
   const [importResult, setImportResult] = useState<any>(null)
   const [validationResult, setValidationResult] = useState<any>(null)
   const [importProgress, setImportProgress] = useState({
     progress: 0,
     message: 'Инициализация...',
   })

  // Состояния для синхронизации каталога
  const [syncFile, setSyncFile] = useState<File | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

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
     setImportProgress({ progress: 0, message: 'Инициализация...' })

     const formData = new FormData()
     formData.append('file', importFile)
     formData.append('options', JSON.stringify(importOptions))

     try {
       const response = await fetch('/api/admin/import', {
         method: 'POST',
         credentials: 'include',
         body: formData,
       })

       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`)
       }

       const reader = response.body?.getReader()
       const decoder = new TextDecoder()
       let buffer = ''

       if (!reader) {
         throw new Error('Не удалось получить поток данных')
       }

       while (true) {
         const { done, value } = await reader.read()

         if (done) {
           break
         }

         buffer += decoder.decode(value, { stream: true })
         const lines = buffer.split('\n')
         buffer = lines.pop() || ''

         for (const line of lines) {
           if (line.startsWith('data: ')) {
             try {
               const data = JSON.parse(line.slice(6))

               if (data.error) {
                 alert('Ошибка при импорте: ' + data.error)
                 setIsImporting(false)
                 return
               }

               if (data.progress !== undefined) {
                 setImportProgress({
                   progress: data.progress,
                   message: data.message || 'Обработка...',
                 })
               }

               if (data.success && data.data) {
                 setImportResult(data.data)
                 setIsImporting(false)
                 return
               }
             } catch (e) {
               console.error('Ошибка парсинга SSE данных:', e)
             }
           }
         }
       }
     } catch (error) {
       alert('Ошибка при импорте')
       console.error(error)
       setIsImporting(false)
     }
   }

  const handleAnalyze = async () => {
    if (!syncFile) {
      alert('Выберите файл для анализа')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    const formData = new FormData()
    formData.append('file', syncFile)

    try {
      const response = await fetch('/api/admin/analyze-excel', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при анализе')
      }

      setAnalysisResult(data.data)
      console.log('Результат анализа файла:', data.data)
    } catch (error) {
      alert(
        `Ошибка при анализе: ${
          error instanceof Error ? error.message : 'Неизвестная ошибка'
        }`,
      )
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSync = async () => {
    if (!syncFile) {
      alert('Выберите файл для синхронизации')
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    const formData = new FormData()
    formData.append('file', syncFile)

    try {
      const response = await fetch('/api/admin/sync-stock', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при синхронизации')
      }

      setSyncResult(data.data)
    } catch (error) {
      alert(
        `Ошибка при синхронизации: ${
          error instanceof Error ? error.message : 'Неизвестная ошибка'
        }`,
      )
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }

   return (
     <div className={styles.container}>
      {isImporting && (
        <div className={styles.importOverlay}>
          <div className={styles.importProgress}>
            {importProgress.progress < 100 && (
              <div className={styles.progressSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}
            <h3 className={styles.progressTitle}>Импорт данных</h3>
            <p className={styles.progressText}>
              {importProgress.message}
            </p>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressBarFill}
                style={{ width: `${importProgress.progress}%` }}
              ></div>
            </div>
            <div className={styles.progressPercent}>
              {Math.round(importProgress.progress)}%
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

      <div className={styles.topGrid}>
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
              <label className={`${styles.optionLabel} ${importOptions.replaceAll ? styles.warning : ''}`}>
                <input
                  type="checkbox"
                  checked={importOptions.replaceAll}
                  onChange={(e) => {
                    const replaceAll = e.target.checked
                    setImportOptions({ 
                      ...importOptions, 
                      replaceAll,
                      // При включении replaceAll отключаем другие опции
                      skipExisting: replaceAll ? false : importOptions.skipExisting,
                      updateExisting: replaceAll ? false : importOptions.updateExisting,
                    })
                  }}
                />
                <span>
                  <strong>Полная замена каталога</strong>
                  {importOptions.replaceAll && (
                    <span className={styles.warningText}>
                      {' '}(ВНИМАНИЕ: Удалит все существующие категории и товары!)
                    </span>
                  )}
                </span>
              </label>
              <label className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={importOptions.skipExisting}
                  onChange={(e) =>
                    setImportOptions({ ...importOptions, skipExisting: e.target.checked })
                  }
                  disabled={importOptions.replaceAll}
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
                  disabled={importOptions.replaceAll}
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

      <div className={styles.syncSection}>
        <h2 className={styles.sectionTitle}>Синхронизация каталога</h2>
        <div className={styles.card}>
          <p className={styles.description}>
            Загрузите Excel файл с остатками товаров для синхронизации каталога.
            Товары идентифицируются по названию (колонка &quot;Номенклатура&quot;). Если товар есть в каталоге, но
            отсутствует в файле или имеет остаток 0, его остаток будет установлен в 0, но
            товар не будет удален из каталога.
          </p>

          <div className={styles.fileUpload}>
            <label className={styles.uploadButton}>
              <svg
                className={styles.uploadIcon}
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12V6M9 6L6 9M9 6L12 9M3 15H15C15.5523 15 16 14.5523 16 14V4C16 3.44772 15.5523 3 15 3H3C2.44772 3 2 3.44772 2 4V14C2 14.5523 2.44772 15 3 15Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{syncFile ? 'Изменить файл' : 'Выбрать файл Excel'}</span>
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setSyncFile(e.target.files?.[0] || null)}
                className={styles.fileInput}
                disabled={isSyncing}
              />
            </label>

            {syncFile && (
              <div className={styles.fileInfo}>
                <svg
                  className={styles.fileIcon}
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4H18.6667L24 9.33333V26.6667C24 27.3739 23.719 28.0522 23.219 28.5522C22.7189 29.0523 22.0406 29.3333 21.3333 29.3333H10.6667C9.95942 29.3333 9.28115 29.0523 8.78105 28.5522C8.28095 28.0522 8 27.3739 8 26.6667V5.33333C8 4.62609 8.28095 3.94781 8.78105 3.44772C9.28115 2.94762 9.95942 2.66667 10.6667 2.66667H8V4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.6667 2.66667V9.33333H24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className={styles.fileDetails}>
                  <div className={styles.fileName}>{syncFile.name}</div>
                  <div className={styles.fileSize}>
                    {(syncFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <button
                  className={styles.removeFile}
                  onClick={() => {
                    setSyncFile(null)
                    setSyncResult(null)
                  }}
                  disabled={isSyncing}
                  type="button"
                  aria-label="Удалить файл"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4L4 12M4 4L12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className={styles.syncInfo}>
            <p className={styles.syncInfoText}>
              <strong>Требования к файлу:</strong>
            </p>
            <ul className={styles.syncInfoList}>
              <li>Файл должен содержать колонку &quot;Номенклатура&quot; с названием товара</li>
              <li>Файл должен содержать колонку &quot;Конечный остаток&quot; с количеством товара</li>
              <li>После заголовков должна быть строка &quot;Магазин&quot; или &quot;Склад&quot;, после которой начинаются данные</li>
              <li>Поддерживаются форматы: .xls, .xlsx</li>
              <li>Товары сопоставляются по названию (точное или частичное совпадение)</li>
            </ul>
          </div>

          <button
            onClick={handleSync}
            disabled={!syncFile || isSyncing}
            className={styles.syncButton}
          >
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
          </button>

          {syncResult && (
            <div className={`${styles.result} ${styles.success}`}>
              <h3>Результат синхронизации:</h3>
              <div className={styles.syncStats}>
                <p>
                  <strong>Всего в файле:</strong> {syncResult.totalInFile || 0}
                </p>
                <p>
                  <strong>Обновлено:</strong> {syncResult.updated || 0}
                </p>
                <p>
                  <strong>Установлено в 0:</strong> {syncResult.setToZero || 0}
                </p>

                {syncResult.notFound > 0 && (
                  <p className={styles.warningText}>
                    <strong>Не найдено в каталоге:</strong> {syncResult.notFound}
                    <br />
                    <small>
                      Эти товары из файла не были найдены в каталоге. Проверьте названия товаров в файле и каталоге.
                    </small>
                  </p>
                )}

                {syncResult.matchedProducts && syncResult.matchedProducts.length > 0 && (
                  <div className={styles.syncMatched}>
                    <strong>Найдено и обновлено товаров:</strong> {syncResult.matchedProducts.length}
                    {syncResult.matchedProducts.length <= 10 && (
                      <ul>
                        {syncResult.matchedProducts.map((product: string, i: number) => (
                          <li key={i}>{product}</li>
                        ))}
                      </ul>
                    )}
                    {syncResult.matchedProducts.length > 10 && (
                      <p>
                        <small>Показаны первые 10 из {syncResult.matchedProducts.length} товаров</small>
                      </p>
                    )}
                  </div>
                )}

                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className={styles.syncErrors}>
                    <strong>Ошибки:</strong>
                    <ul>
                      {syncResult.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
