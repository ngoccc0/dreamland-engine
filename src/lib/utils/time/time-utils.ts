/**
 * Calculates if the current game time falls within the "day" period.
 * @param gameTime The current game time in minutes (0-dayDuration).
 * @param startTime The minute of the day when "day" starts (e.g., 360 for 6 AM).
 * @param dayDuration The total duration of a game day in minutes (e.g., 1440 for 24 hours).
 * @returns True if it's daytime, false otherwise.
 */
export const isDay = (gameTime: number, startTime: number, dayDuration: number): boolean => {
    // Assuming day lasts for 12 hours (720 minutes) from startTime
    const dayEndTime = (startTime + dayDuration / 2) % dayDuration;
    if (startTime < dayEndTime) {
        return gameTime >= startTime && gameTime < dayEndTime;
    } else {
        // Day spans across midnight
        return gameTime >= startTime || gameTime < dayEndTime;
    }
};

/**
 * Calculates if the current game time falls within the "night" period.
 * @param gameTime The current game time in minutes (0-dayDuration).
 * @param startTime The minute of the day when "day" starts (e.g., 360 for 6 AM).
 * @param dayDuration The total duration of a game day in minutes (e.g., 1440 for 24 hours).
 * @returns True if it's nighttime, false otherwise.
 */
export const isNight = (gameTime: number, startTime: number, dayDuration: number): boolean => {
    return !isDay(gameTime, startTime, dayDuration);
};

/**
 * Returns a string representation of the current time of day (e.g., "day" or "night").
 * @param gameTime The current game time in minutes (0-dayDuration).
 * @param startTime The minute of the day when "day" starts (e.g., 360 for 6 AM).
 * @param dayDuration The total duration of a game day in minutes (e.g., 1440 for 24 hours).
 * @returns "day" or "night".
 */
export const getTimeOfDay = (gameTime: number, startTime: number, dayDuration: number): 'day' | 'night' => {
    return isDay(gameTime, startTime, dayDuration) ? 'day' : 'night';
};

/**
 * Formats game time (in minutes) into a human-readable HH:MM string.
 * @param gameTime The current game time in minutes (0-dayDuration).
 * @param dayDuration The total duration of a game day in minutes (e.g., 1440 for 24 hours).
 * @returns Formatted time string (e.g., "06:00").
 */
export const formatGameTime = (gameTime: number, dayDuration: number): string => {
    const minutesInDay = dayDuration;
    const currentMinutes = gameTime % minutesInDay;
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;

    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}`;
};
