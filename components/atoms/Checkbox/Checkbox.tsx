'use client'

import React from 'react'
import styles from './Checkbox.module.scss'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className={`${styles.checkbox} ${className || ''}`}>
      <input type="checkbox" className={styles.input} {...props} />
      <span className={styles.checkmark}></span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}


