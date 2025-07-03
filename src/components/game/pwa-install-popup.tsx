
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { usePwaInstall } from '@/context/pwa-install-context';

interface PwaInstallPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PwaInstallPopup({ open, onOpenChange }: PwaInstallPopupProps) {
  const { t } = useLanguage();
  const { installPrompt, setInstallPrompt } = usePwaInstall();

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      setInstallPrompt(null);
      onOpenChange(false);
    });
  };

  if (!open || !installPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download />
          {t('installAppTitle')}
        </CardTitle>
        <CardDescription>{t('installAppDesc')}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          <X className="mr-2" />
          {t('dismiss')}
        </Button>
        <Button onClick={handleInstallClick}>
          <Download className="mr-2" />
          {t('install')}
        </Button>
      </CardFooter>
    </Card>
  );
}
