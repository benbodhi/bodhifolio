import type { Metadata } from "next"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nns.variable}`}>
      <head />
      <body className={`${inter.className} ${nns.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}