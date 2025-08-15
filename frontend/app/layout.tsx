
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import Navigation from '@/components/layout/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Music-U-Scheduler',
  description: 'Professional music lesson scheduling and management system',
  keywords: 'music, lessons, scheduling, education, piano, guitar, violin',
  authors: [{ name: 'Music-U-Scheduler Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
              <Navigation />
              <main className="relative">
                {children}
              </main>
            </div>
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              expand={false}
              toastOptions={{
                duration: 4000,
                className: 'backdrop-blur-sm',
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
