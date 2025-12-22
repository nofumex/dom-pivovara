import React from 'react'
import styles from './Input.module.scss'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'rows'> {
  label?: string
  error?: string
  multiline?: boolean
  rows?: number
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, className, multiline, rows = 4, ...props }, ref) => {
    if (multiline) {
      return (
        <div className={styles.wrapper}>
          {label && <label className={styles.label}>{label}</label>}
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${styles.input} ${styles.textarea} ${error ? styles.error : ''} ${className || ''}`}
            rows={rows}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      )
    }

    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'




