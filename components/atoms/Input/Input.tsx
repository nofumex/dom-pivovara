import React from 'react'
import styles from './Input.module.scss'

type InputPropsBase = {
  label?: string
  error?: string
}

type InputPropsWithTextarea = InputPropsBase & 
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    textarea: true
  }

type InputPropsWithoutTextarea = InputPropsBase & 
  React.InputHTMLAttributes<HTMLInputElement> & {
    textarea?: false
  }

type InputProps = InputPropsWithTextarea | InputPropsWithoutTextarea

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, textarea, ...props }, ref) => {
    if (textarea) {
      const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>
      return (
        <div className={styles.wrapper}>
          {label && <label className={styles.label}>{label}</label>}
          <textarea
            className={`${styles.input} ${styles.textarea} ${error ? styles.error : ''} ${className || ''}`}
            {...textareaProps}
          />
          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      )
    }

    const inputProps = props as React.InputHTMLAttributes<HTMLInputElement>
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={`${styles.input} ${error ? styles.error : ''} ${className || ''}`}
          {...inputProps}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
