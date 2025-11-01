import { Season } from '../types/game';

/**
 * Manages the progression of in-game time, including minutes, hours, days, turns, and seasons.
 */
export class GameTime {
    private _minutes: number;  // Minutes since the start of the current day (0-1439).
    private _days: number;     // Total days elapsed since the game began.
    private _turns: number;    // Total game turns elapsed.
    private _season: Season;   // The current season.

    /**
     * Creates an instance of GameTime, initializing it to the start of the first day (6 AM, Spring).
     */
    constructor() {
        this._minutes = 360;   // Initialize to 6 AM (6 * 60 minutes).
        this._days = 1;        // Start on day 1.
        this._turns = 0;       // No turns elapsed yet.
        this._season = 'spring'; // Start in spring.
    }

    /** Gets the current minutes past midnight for the current day. */
    get minutes(): number {
        return this._minutes;
    }

    /** Gets the current hour of the day (0-23). */
    get hours(): number {
        return Math.floor(this._minutes / 60);
    }

    /** Gets the total number of days elapsed since the game started. */
    get days(): number {
        return this._days;
    }

    /** Gets the total number of game turns elapsed. */
    get turns(): number {
        return this._turns;
    }

    /** Gets the current season. */
    get season(): Season {
        return this._season;
    }

    /**
     * Checks if the current time falls within daytime hours (6 AM to 6 PM).
     * @returns `true` if it's daytime, `false` otherwise.
     */
    get isDay(): boolean {
        return this._minutes >= 360 && this._minutes < 1080; // 6 AM (360 min) to 6 PM (1080 min).
    }

    /**
     * Advances the in-game time by a specified number of minutes.
     * Handles day and season transitions automatically.
     * @param minutes - The number of minutes to advance.
     */
    advanceTime(minutes: number): void {
        this._minutes += minutes;
        // Loop to handle multiple day transitions if a large number of minutes is added.
        while (this._minutes >= 1440) { // 1440 minutes in a day.
            this._minutes -= 1440;
            this._days++;
            this.checkSeasonChange(); // Check for season change at the start of each new day.
        }
    }

    /**
     * Advances the game by one turn.
     * Each turn is defined as 15 minutes of in-game time.
     */
    advanceTurn(): void {
        this._turns++;
        // Each turn takes 15 minutes of game time.
        this.advanceTime(15);
    }

    /**
     * Checks if the season should change based on the current day count.
     * Updates the `_season` property accordingly.
     */
    private checkSeasonChange(): void {
        const daysPerSeason = 90; // Assuming 90 days per season.
        // Calculate the current season index based on total days.
        const seasonIndex = Math.floor((this._days % 360) / daysPerSeason); // 360 days in a year (4 seasons * 90 days/season).
        const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
        this._season = seasons[seasonIndex];
    }
}
