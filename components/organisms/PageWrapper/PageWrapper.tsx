import styles from './PageWrapper.module.scss'

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className={styles.pageWrapper}>
      {children}
    </div>
  )
}

