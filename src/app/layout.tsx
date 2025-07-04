import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import { PwaInstallProvider } from '@/context/pwa-install-context';

export const metadata: Metadata = {
  title: 'Dreamland Engine',
  description: 'An AI-driven text-based adventure game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a110f" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..900;1,7..72,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <SettingsProvider>
            <PwaInstallProvider>
              {children}
            </PwaInstallProvider>
          </SettingsProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
