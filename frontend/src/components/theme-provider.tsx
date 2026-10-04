import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

export function ThemeProvider({ children }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      attribute="data-theme"
      defaultTheme="light"
      enableSystem
      enableColorScheme
      storageKey="color-scheme"
      themes={['light', 'dark']}>
      {children}
    </NextThemesProvider>
  )
}
