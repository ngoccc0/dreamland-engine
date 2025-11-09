
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import { PwaInstallProvider } from '@/context/pwa-install-context';
import { AuthProvider } from '@/context/auth-context';
import ClientInit from '@/components/client/client-init';
import { AudioProvider } from '@/lib/audio/AudioProvider';

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
        {/* Inline pre-init script: attempt to unregister any stale service workers and clear caches
            before the client bundles load. This helps recover from a stale SW that serves old
            chunk filenames (common during local development). Only runs in non-production.
         */}
        {process.env.NODE_ENV !== 'production' && (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              try {
                if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    regs.forEach(reg => { try { reg.unregister(); console.debug('[inline ClientInit] Unregistered service worker', reg); } catch(e){} });
                  }).catch(()=>{});
                }
                if (typeof caches !== 'undefined' && caches.keys) {
                  caches.keys().then(keys => { keys.forEach(k => { try { caches.delete(k).then(()=>console.debug('[inline ClientInit] Deleted cache', k)).catch(()=>{}); } catch(e){} }); }).catch(()=>{});
                }
              } catch(e) {
                // don't block render
              }
            })();
          ` }} />
        )}
        {/* Client-side initializer that helps recover from stale chunk/service-worker issues */}
        <ClientInit />
        <LanguageProvider>
          <SettingsProvider>
            <AuthProvider>
              <PwaInstallProvider>
                <AudioProvider>
                  {children}
                </AudioProvider>
              </PwaInstallProvider>
            </AuthProvider>
          </SettingsProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
