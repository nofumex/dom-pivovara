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
  const [syncProgress, setSyncProgress] = useState({
    progress: 0,
    message: 'Инициализация...',
  })
  const [syncOptions, setSyncOptions] = useState({
    setMissingToZero: false, // По умолчанию НЕ устанавливаем в 0 товары, которых нет в файле
  })
  const [expandedSections, setExpandedSections] = useState({
    notFound: false,
    matches: false,
  })

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
      const response = await fetch('/api/admin/analyze-stock', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при анализе')
      }

      setAnalysisResult(data.data)
      console.log('Результат анализа сопоставления:', data.data)
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
    setSyncProgress({ progress: 0, message: 'Инициализация...' })

    const formData = new FormData()
    formData.append('file', syncFile)
    formData.append('options', JSON.stringify(syncOptions))

    // Создаем AbortController для возможности отмены запроса
    const abortController = new AbortController()
    // Убираем таймаут - операция может занимать много времени для больших файлов
    // Вместо этого полагаемся на keepalive и проверку прогресса

    try {
      const response = await fetch('/api/admin/sync-stock', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Неизвестная ошибка')
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('Не удалось получить поток данных')
      }

      let lastProgressTime = Date.now()
      const progressTimeout = 5 * 60 * 1000 // 5 минут без обновления прогресса

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Обновляем время последнего прогресса
        lastProgressTime = Date.now()

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          // Пропускаем keepalive сообщения
          if (line.trim() === ': keepalive' || line.trim() === '') {
            continue
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                alert('Ошибка при синхронизации: ' + data.error)
                setIsSyncing(false)
                return
              }

              if (data.progress !== undefined) {
                setSyncProgress({
                  progress: data.progress,
                  message: data.message || 'Обработка...',
                })
                lastProgressTime = Date.now()
              }

              if (data.success && data.data) {
                setSyncResult(data.data)
                setIsSyncing(false)
                return
              }
            } catch (e) {
              console.error('Ошибка парсинга SSE данных:', e, 'Строка:', line)
            }
          }
        }

        // Проверяем, не завис ли процесс (нет обновлений прогресса)
        if (Date.now() - lastProgressTime > progressTimeout) {
          throw new Error('Процесс синхронизации завис. Нет обновлений прогресса более 5 минут.')
        }
      }
    } catch (error) {
      let errorMessage = 'Неизвестная ошибка'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          errorMessage = 'Операция была прервана из-за таймаута. Файл слишком большой или операция занимает слишком много времени. Попробуйте разбить файл на части или повторить позже.'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету и попробуйте повторить операцию. Если проблема сохраняется, возможно, сервер перегружен - попробуйте позже.'
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorMessage = 'Превышено время ожидания. Файл слишком большой. Попробуйте разбить файл на части или повторить позже.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(`Ошибка при синхронизации: ${errorMessage}`)
      console.error('Ошибка синхронизации:', error)
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
      {isSyncing && (
        <div className={styles.importOverlay}>
          <div className={styles.importProgress}>
            {syncProgress.progress < 100 && (
              <div className={styles.progressSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}
            <h3 className={styles.progressTitle}>Синхронизация остатков</h3>
            <p className={styles.progressText}>
              {syncProgress.message}
            </p>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressBarFill}
                style={{ width: `${syncProgress.progress}%` }}
              ></div>
            </div>
            <div className={styles.progressPercent}>
              {Math.round(syncProgress.progress)}%
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

          <div className={styles.syncOptions}>
            <label className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={syncOptions.setMissingToZero}
                onChange={(e) =>
                  setSyncOptions({ ...syncOptions, setMissingToZero: e.target.checked })
                }
                disabled={isSyncing}
              />
              <span>
                <strong>Установить в 0 товары, которых нет в файле</strong>
                <br />
                <small style={{ color: '#666', fontWeight: 'normal' }}>
                  Если включено, все товары из каталога, которых нет в файле, будут установлены в 0.
                  Если выключено, будут обновлены только товары, найденные в файле.
                </small>
              </span>
            </label>
          </div>

          <div className={styles.syncActions}>
            <button
              onClick={handleAnalyze}
              disabled={!syncFile || isAnalyzing || isSyncing}
              className={styles.analyzeButton}
            >
              {isAnalyzing ? 'Анализ...' : '🔍 Проанализировать файл'}
            </button>
            <button
              onClick={handleSync}
              disabled={!syncFile || isSyncing}
              className={styles.syncButton}
            >
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
            </button>
          </div>

          {analysisResult && (
            <div className={`${styles.result} ${styles.analysisResult}`}>
              <h3>📊 Результат анализа сопоставления</h3>
              
              <div className={styles.analysisStats}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Всего товаров в файле:</span>
                  <span className={styles.statValue}>{analysisResult.stats?.totalInFile || 0}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Найдено совпадений:</span>
                  <span className={styles.statValue} style={{ color: '#22c55e' }}>
                    {analysisResult.stats?.found || 0}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Не найдено:</span>
                  <span className={styles.statValue} style={{ color: '#ef4444' }}>
                    {analysisResult.stats?.notFound || 0}
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Процент найденных:</span>
                  <span className={styles.statValue} style={{ color: '#3b82f6' }}>
                    {analysisResult.stats?.foundPercent || '0'}%
                  </span>
                </div>
              </div>

              {analysisResult.stats?.matchTypes && (
                <div className={styles.matchTypes}>
                  <h4>Типы совпадений:</h4>
                  <ul>
                    <li>
                      <span>Точное совпадение:</span>
                      <strong>{analysisResult.stats.matchTypes.exact || 0}</strong>
                    </li>
                    <li>
                      <span>Без префикса:</span>
                      <strong>{analysisResult.stats.matchTypes.prefix_removed || 0}</strong>
                    </li>
                    <li>
                      <span>По ключевым словам:</span>
                      <strong>{analysisResult.stats.matchTypes.keywords || 0}</strong>
                    </li>
                    <li>
                      <span>Частичное:</span>
                      <strong>{analysisResult.stats.matchTypes.partial || 0}</strong>
                    </li>
                    <li>
                      <span>По похожести:</span>
                      <strong>{analysisResult.stats.matchTypes.similarity || 0}</strong>
                    </li>
                  </ul>
                </div>
              )}

              {analysisResult.notFound && analysisResult.notFound.length > 0 && (
                <div className={styles.accordionSection}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => setExpandedSections({ ...expandedSections, notFound: !expandedSections.notFound })}
                  >
                    <span>
                      ❌ Не найденные товары ({analysisResult.totalNotFound || analysisResult.notFound.length})
                    </span>
                    <span className={styles.accordionIcon}>
                      {expandedSections.notFound ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.notFound && (
                    <div className={styles.accordionContent}>
                      <div className={styles.notFoundList}>
                        {analysisResult.notFound.slice(0, 50).map((item: any, index: number) => (
                          <div key={index} className={styles.notFoundItem}>
                            <div className={styles.notFoundProduct}>
                              <strong>{item.fileProduct}</strong>
                            </div>
                            {item.suggestions && item.suggestions.length > 0 && (
                              <div className={styles.suggestions}>
                                <span>Возможные совпадения:</span>
                                <ul>
                                  {item.suggestions.map((suggestion: any, idx: number) => (
                                    <li key={idx}>
                                      {suggestion.title} ({Math.round(suggestion.similarity * 100)}%)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                        {analysisResult.notFound.length > 50 && (
                          <p className={styles.moreItems}>
                            ... и еще {analysisResult.notFound.length - 50} товаров
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {analysisResult.matches && analysisResult.matches.length > 0 && (
                <div className={styles.accordionSection}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => setExpandedSections({ ...expandedSections, matches: !expandedSections.matches })}
                  >
                    <span>
                      ✅ Найденные совпадения ({analysisResult.totalMatches || analysisResult.matches.length})
                    </span>
                    <span className={styles.accordionIcon}>
                      {expandedSections.matches ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedSections.matches && (
                    <div className={styles.accordionContent}>
                      <div className={styles.matchesList}>
                        {analysisResult.matches.slice(0, 20).map((match: any, index: number) => (
                          <div key={index} className={styles.matchItem}>
                            <span className={styles.matchFrom}>{match.fileProduct}</span>
                            <span className={styles.matchArrow}>→</span>
                            <span className={styles.matchTo}>{match.matchedProduct}</span>
                            <span className={styles.matchType}>({match.matchType})</span>
                            {match.similarity && (
                              <span className={styles.matchSimilarity}>
                                {Math.round(match.similarity * 100)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

                {syncResult.setToZeroProducts && syncResult.setToZeroProducts.length > 0 && (
                  <div className={styles.syncMatched}>
                    <strong>Товаров установлено в 0 (нет в файле):</strong> {syncResult.setToZeroProducts.length}
                    {syncResult.setToZeroProducts.length <= 10 && (
                      <ul>
                        {syncResult.setToZeroProducts.map((product: string, i: number) => (
                          <li key={i}>{product}</li>
                        ))}
                      </ul>
                    )}
                    {syncResult.setToZeroProducts.length > 10 && (
                      <p>
                        <small>Показаны первые 10 из {syncResult.setToZeroProducts.length} товаров</small>
                      </p>
                    )}
                  </div>
                )}

                {syncResult.updates && syncResult.updates.length > 0 && (
                  <div className={styles.syncErrors}>
                    <strong>Детали обработки (первые 20):</strong>
                    <ul>
                      {syncResult.updates.slice(0, 20).map((update: any, i: number) => (
                        <li key={i}>
                          {update.name}
                          {update.productTitle && ` → ${update.productTitle}`}
                          {': '}
                          {update.success ? (
                            <span style={{ color: 'green' }}>✓ Остаток: {update.stock}</span>
                          ) : (
                            <span style={{ color: 'red' }}>✗ {update.error || 'Ошибка'}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {syncResult.updates.length > 20 && (
                      <p>
                        <small>Показаны первые 20 из {syncResult.updates.length} записей</small>
                      </p>
                    )}
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
