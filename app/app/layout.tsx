
'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/auth-context'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    document.title = 'Music U Scheduler';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Music lesson scheduling and management system');
    } else {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.name = 'description';
      newMetaDescription.content = 'Music lesson scheduling and management system';
      document.head.appendChild(newMetaDescription);
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
