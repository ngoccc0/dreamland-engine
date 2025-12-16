/**
 * Simple Event Bus for pub/sub event handling
 *
 * @remarks
 * Used by effect executor to emit game events (world.generated, chunk.explored, etc).
 * Allows decoupled event propagation without tight coupling between systems.
 */

type EventListener = (data?: Record<string, unknown>) => void;

/**
 * Basic event bus implementation
 */
export class EventBus {
    private listeners: Map<string, Set<EventListener>> = new Map();

    /**
     * Subscribe to an event
     * @param eventName - Name of the event to listen for
     * @param listener - Callback function to invoke when event is emitted
     * @returns Unsubscribe function
     */
    on(eventName: string, listener: EventListener): () => void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(eventName)?.delete(listener);
        };
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first emission)
     * @param eventName - Name of the event to listen for
     * @param listener - Callback function to invoke when event is emitted
     */
    once(eventName: string, listener: EventListener): () => void {
        const wrapper = (data?: Record<string, unknown>) => {
            listener(data);
            this.listeners.get(eventName)?.delete(wrapper);
        };
        return this.on(eventName, wrapper);
    }

    /**
     * Emit an event to all subscribed listeners
     * @param eventName - Name of the event to emit
     * @param data - Optional data to pass to listeners
     */
    emit(eventName: string, data?: Record<string, unknown>): void {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (err) {
                    console.error(`[EventBus] Error in listener for "${eventName}":`, err);
                }
            });
        }
    }

    /**
     * Unsubscribe from an event
     * @param eventName - Name of the event
     * @param listener - The listener function to remove
     */
    off(eventName: string, listener: EventListener): void {
        this.listeners.get(eventName)?.delete(listener);
    }

    /**
     * Remove all listeners for an event (or all events if eventName omitted)
     * @param eventName - Optional event name; if omitted, clears all listeners
     */
    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get count of listeners for an event
     * @param eventName - Name of the event
     * @returns Number of listeners
     */
    listenerCount(eventName: string): number {
        return this.listeners.get(eventName)?.size || 0;
    }
}
