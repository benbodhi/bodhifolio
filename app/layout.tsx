import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import localFont from 'next/font/local'
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

// Nouns Name Service (NNS) font - Modified Londrina Solid with support for .⌐◨-◨
const nns = localFont({
  src: '../public/fonts/LondrinaSolid-NNS.ttf',
  display: 'swap',
  variable: '--font-nns',
})

export const metadata: Metadata = {
  title: "Benbodhi",
  description: "The Life, The Mind, The Man",
  icons: {
    icon: [
      { url: "/favicon.svg" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
}

// Separate viewport export as recommended by Next.js
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nns.variable}`}>
      <head>
        {/* Script to prevent flash of unstyled content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get stored theme or default to system
                  const theme = localStorage.getItem('theme') || 'system';
                  
                  // Apply the dark class based on theme or system preference
                  if (theme === 'dark' || 
                      (theme === 'system' && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // Fail silently if localStorage is not available
                  console.error('Error accessing localStorage:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${nns.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen render-boost">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}