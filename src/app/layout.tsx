import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap'
})

export const metadata = {
  title: 'CarpeDoEm',
  icons: {
    icon: 'data:image/x-icon;base64,',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>
        {children}
      </body>
    </html>
  )
}
