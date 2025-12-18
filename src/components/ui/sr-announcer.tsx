/**
 * Screen Reader Announcer Component
 *
 * @remarks
 * Renders an invisible div that screen readers can access via aria-live.
 * Used for announcing game events like "Added Meat to the pot" without
 * requiring visual feedback or DOM changes that might confuse screen reader users.
 *
 * **Usage Pattern:**
 * Parent component maintains announcement state and updates it when events occur:
 * ```typescript
 * const [announcement, setAnnouncement] = useState('');
 * const onItemAdded = (item) => setAnnouncement(`Added ${item.name} to the pot.`);
 * return <ScreenReaderAnnouncer message={announcement} />;
 * ```
 *
 * **Accessibility:**
 * - `aria-live="polite"`: Screen reader announces changes without interrupting
 * - `aria-atomic="true"`: Announces entire region content, not just changes
 * - `className="sr-only"`: Hidden from visual display via CSS
 */

'use client';

import React from 'react';

export interface ScreenReaderAnnouncerProps {
    /**
     * Message to announce to screen reader users
     */
    message: string;
}

/**
 * Invisible announcer for screen reader accessibility
 *
 * @param props - Component props
 * @returns Rendered div element (invisible on screen)
 */
export const ScreenReaderAnnouncer = ({ message }: ScreenReaderAnnouncerProps) => {
    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            role="status"
        >
            {message}
        </div>
    );
};
