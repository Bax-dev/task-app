import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import StoreProvider from '@/store/provider';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'TaskFlow - Project Management & Team Collaboration Platform',
    template: '%s | TaskFlow',
  },
  description:
    'TaskFlow is a modern project management platform that helps teams organize tasks, track progress, collaborate in real-time, and deliver projects on time. Free to get started.',
  keywords: [
    'project management',
    'task management',
    'team collaboration',
    'task tracker',
    'project tracker',
    'kanban board',
    'agile project management',
    'productivity tool',
    'team workspace',
    'task organizer',
  ],
  authors: [{ name: 'TaskFlow' }],
  creator: 'TaskFlow',
  publisher: 'TaskFlow',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'TaskFlow',
    title: 'TaskFlow - Project Management & Team Collaboration Platform',
    description:
      'Organize tasks, track progress, and collaborate with your team in one powerful platform. Free to get started.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaskFlow - Project Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow - Project Management & Team Collaboration',
    description:
      'Organize tasks, track progress, and collaborate with your team. Free to get started.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={APP_URL} />
      </head>
      <body className={`${geist.className} antialiased`}>
        <StoreProvider>
          {children}
          <Toaster position="top-right" richColors />
        </StoreProvider>
      </body>
    </html>
  );
}
