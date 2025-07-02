
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/context/language-context";
import { LifeBuoy } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface TutorialPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TutorialPopup({ open, onOpenChange }: TutorialPopupProps) {
  const { t } = useLanguage();

  const sections: { title: TranslationKey; content: TranslationKey }[] = [
    { title: 'gettingStartedTitle', content: 'gettingStartedContent' },
    { title: 'uiTitle', content: 'uiContent' },
    { title: 'combatTitle', content: 'combatContent' },
    { title: 'craftingBuildTitle', content: 'craftingBuildContent' },
    { title: 'survivalTitle', content: 'survivalContent' },
    { title: 'customActionsTitle', content: 'customActionsContent' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <LifeBuoy /> {t('tutorialTitle')}
          </DialogTitle>
          <DialogDescription>{t('tutorialDesc')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4">
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{t(section.title)}</AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm dark:prose-invert whitespace-pre-line">
                    {t(section.content)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
