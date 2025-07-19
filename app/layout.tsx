
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import { PwaInstallProvider } from '@/context/pwa-install-context';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'Dreamland Engine',
  description: 'An AI-driven text-based adventure game.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#1a110f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..900;1,7..72,400..900&family=Inter:wght@400;700&family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <SettingsProvider>
            <AuthProvider>
              <PwaInstallProvider>
                {children}
              </PwaInstallProvider>
            </AuthProvider>
          </SettingsProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
