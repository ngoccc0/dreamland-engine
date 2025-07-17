'use client';

import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Language } from '@/lib/i18n';

interface LanguageSelectorProps {
  onLanguageSelected: (lang: Language) => void;
}

export function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const { t } = useLanguage();

  const handleSelect = (lang: Language) => {
    onLanguageSelected(lang);
  };

  return (
    <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4">
      <Card className="w-full max-w-sm animate-in fade-in duration-500">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">{t('selectLanguage')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => handleSelect(Language.VI)} size="lg">
            Tiếng Việt
          </Button>
          <Button onClick={() => handleSelect(Language.EN)} size="lg" variant="secondary">
            English
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
