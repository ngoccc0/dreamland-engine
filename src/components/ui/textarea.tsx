import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <div className="relative group">
        <div
          className="absolute -inset-0.5 bg-gradient-to-r from-chart-1 via-chart-4 to-chart-5 rounded-lg blur opacity-0 group-focus-within:opacity-75 transition duration-500 animate-gradient-glow"
          style={{ backgroundSize: '400% 400%' }}
        />
        <textarea
          className={cn(
            'relative flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
