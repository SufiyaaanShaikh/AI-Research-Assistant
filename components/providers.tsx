'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  )
}
