// src/lib/logger.ts

/**
 * A simple, centralized logging service for the application.
 *
 * * In serverless environments like Vercel or Firebase App Hosting, the standard
 * `console.log`, `console.warn`, and `console.error` streams are automatically
 * captured, indexed, and displayed in the platform's logging dashboard.
 *
 * This logger acts as a wrapper around the native console methods to:
 * 1.  Ensure consistent log message formatting (e.g., with timestamps and log levels).
 * 2.  Make it easy to swap out the logging mechanism in the future (e.g., to a
 *     third-party service like Sentry or Datadog) without changing code all over the app.
 *
 * It does NOT write to a physical file, as that is not a reliable practice in
 * ephemeral serverless filesystems.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Formats a log message with a timestamp and log level.
 * @param {LogLevel} level - The severity level of the log.
 * @param {string} message - The main log message.
 * @param {unknown} [data] - Optional data to be serialized and included in the log.
 * @returns {string} The formatted log message string.
 */
function formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `${timestamp} [${level}] - ${message}`;
    
    if (data) {
        try {
            // Use JSON.stringify for a consistent, parsable representation of objects/arrays.
            // The 'null, 2' argument pretty-prints the JSON.
            const jsonData = JSON.stringify(data, null, 2);
            formattedMessage += `\nData: ${jsonData}`;
        } catch {
            // Handle circular references or other stringify errors (we don't need the error object here)
            formattedMessage += `\nData: [Could not serialize data]`;
        }
    }
    
    return formattedMessage;
}

/**
 * A simple logger object with methods for different log levels.
 */
export const logger = {
    /**
     * Logs informational messages. Use for general application flow events.
     * @param {string} message - The main log message.
     * @param {unknown} [data] - Optional data to include in the log.
     */
    info: (message: string, data?: unknown): void => {
        console.log(formatMessage('INFO', message, data));
    },

    /**
     * Logs warning messages. Use for non-critical issues that should be noted.
     * @param {string} message - The warning message.
     * @param {unknown} [data] - Optional data to include in the log.
     */
    warn: (message: string, data?: unknown): void => {
        console.warn(formatMessage('WARN', message, data));
    },

    /**
     * Logs error messages. Use for critical failures, exceptions, and errors.
     * @param {string} message - The error message.
     * @param {unknown} [error] - Optional error object or other data to include.
     */
    error: (message: string, error?: unknown): void => {
        // When logging an actual Error object, its message and stack are most important.
        if (error instanceof Error) {
            const errorMessage = `${message} - Error: ${error.message}\nStack: ${error.stack}`;
            console.error(formatMessage('ERROR', errorMessage));
        } else {
            console.error(formatMessage('ERROR', message, error));
        }
    },

    /**
     * Logs debug messages. Use for verbose, detailed information useful during development.
     * These logs will only appear if the NODE_ENV is 'development'.
     * @param {string} message - The debug message.
     * @param {unknown} [data] - Optional data to include in the log.
     */
    debug: (message: string, data?: unknown): void => {
        // In a real app, you might disable debug logs in production based on an environment variable.
        if (process.env.NODE_ENV === 'development') {
            console.debug(formatMessage('DEBUG', message, data));
        }
    }
};
