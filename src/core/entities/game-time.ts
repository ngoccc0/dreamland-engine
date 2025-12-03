import { Season } from '../types/game';

/**
 * OVERVIEW: In-game time progression system
 *
 * Manages passage of time at multiple scales: minutes (within day), hours, days, seasons, and turns.
 * Each unit triggers different game mechanics (time-based creature spawning, plant growth, weather change).
 * Starts at 6 AM (360 minutes) on Spring Day 1 for player-friendly experience.
 *
 * ## Time Scales
 *
 * ### Minutes (Tick-Level)
 * - Range: 0-1439 per day (24 hours × 60 minutes)
 * - 0 = midnight, 360 = 6 AM, 720 = noon, 1080 = 6 PM
 * - Used for: Exact time-based events, combat turn sequences, animations
 * - Example: Healing potion cooled down at 500 minutes
 *
 * ### Hours
 * - Range: 0-23 per day
 * - Calculated: floor(minutes / 60)
 * - Used for: Day/night cycle, NPC behavior changes, shop hours
 * - Example: Merchants leave at hour 20 (8 PM)
 *
 * ### Days
 * - Cumulative counter starting at 1
 * - Increments at midnight (0 minutes)
 * - Used for: Quest timers, crop maturity, seasonal tracking
 * - Example: "Return in 3 days" = must reach day + 3
 *
 * ### Seasons
 * - Four-value enum: SPRING, SUMMER, FALL (AUTUMN), WINTER
 * - Changes every 90 days (quarter year)
 * - Affects: Plant growth rates, creature behavior, weather probability, temperature
 * - Progression: Spring (D1-D90) → Summer (D91-D180) → Fall (D181-D270) → Winter (D271-D360) → Spring
 *
 * ### Turns
 * - Pure turn counter (action queue)
 * - Each character action = 1 turn increment
 * - Combat uses turns for action priority
 * - Used for: Cooldown counting, effect duration, async scheduling
 *
 * ## Time Progression Flow
 *
 * ```
 * Player Action → +1 Turn (game logic tick)
 * 1 Turn = 15 Game Minutes (simulation advancement)
 * 4 turns pass → +60 minutes = +1 Hour (hourly events trigger)
 * 96 turns pass → +1440 minutes = +1 Day (daily events trigger)
 * 8640 turns pass → 90 days = Season changes
 * ```
 *
 * ### Turn-to-Minute Conversion
 *
 * **Key Formula: 1 Turn = 15 Game Minutes**
 *
 * ```
 * Combat round = 1 turn = 15 minutes game time
 * 1 hour = 4 turns
 * 1 day = 96 turns
 * 1 week = 672 turns
 * 1 season = 8,640 turns (90 days)
 * 1 year = 34,560 turns (360 days)
 *
 * Examples:
 * - Combat 1v1 (6 rounds): 6 turns = 90 game minutes (1.5 hours)
 * - Exploration (1 chunk = 20 turns): 20 turns = 300 game minutes (5 hours)
 * - Quest timer (3 days): 3 × 96 = 288 turns
 * ```
 *
 * ## Seasonal Calendar
 *
 * | Season | Days | Length | Temperature | Plant Growth | Weather |
 * |--------|------|--------|-------------|------|---------|
 * | SPRING | 1-90 | Start | 10-15°C | 1.5× | Rain 30% |
 * | SUMMER | 91-180 | Mid | 20-25°C | 2.0× | Clear 60% |
 * | FALL | 181-270 | End | 10-15°C | 1.2× | Wind 40% |
 * | WINTER | 271-360 | End | -5-0°C | 0.5× | Snow 50% |
 *
 * ### Season Effects
 *
 * **Plant Growth Multipliers:**
 * ```typescript
 * seasonGrowthBonus = {
 *   spring: 1.5,   // High growth, rains help
 *   summer: 2.0,   // Peak season, hot
 *   fall: 1.2,     // Declining growth
 *   winter: 0.5    // Slow/dormant
 * }
 * final_growth = base_growth × seasonGrowthBonus
 * ```
 *
 * **Creature Activity:**
 * ```typescript
 * creatureBehavior = {
 *   spring: 'breeding',      // Aggressive, territorial
 *   summer: 'active',        // Hunting frequently
 *   fall: 'storing',         // Preparing for winter
 *   winter: 'dormant'        // Low activity
 * }
 * ```
 *
 * ## GameTime Class
 *
 * Core time manager:
 *
 * ```typescript
 * class GameTime {
 *   minutes: number,          // 0-1439 per day
 *   hours: number,            // Calculated from minutes
 *   days: number,             // Cumulative days
 *   turns: number,            // Cumulative turns
 *   season: Season,           // SPRING/SUMMER/FALL/WINTER
 *
 *   // Progression
 *   tick(minutes): void        // Advance time
 *   advanceTurn(): void        // Increment turn counter
 *   advanceDay(): void         // Move to next day
 *   getSeasonDay(): number     // Days into current season
 *
 *   // Queries
 *   isDaytime(): boolean       // 6 AM - 6 PM?
 *   isNight(): boolean         // 6 PM - 6 AM?
 *   isWeekend(): boolean       // Day of week (optional)
 *   getTimeOfDay(): string     // 'morning', 'afternoon', 'night'
 * }
 * ```
 *
 * ## Time-Based Game Events
 *
 * ### Hourly (Every 60 minutes)
 * - NPC behavior changes (open shop, go home)
 * - Hourly creatures (nocturnal only at night)
 * - Cooldown reduction check
 *
 * ### Daily (Every 1440 minutes)
 * - Plant growth calculation
 * - Creature hunger depletion
 * - Weather change probability
 * - NPC routine reset (back to village center)
 * - Crop harvest eligibility check
 *
 * ### Seasonal (Every 90 days)
 * - Seasonal crop availability
 * - Creature spawn pool change
 * - Temperature shift
 * - Weather pattern change
 * - Environmental effects (snow, heat, rain)
 *
 * ### Quest Timers
 * ```typescript
 * quest.deadline = startDay + 7  // 7-day timer
 *
 * if gameTime.days >= quest.deadline:
 *   quest.failed = true
 * ```
 *
 * ## Daily Cycle Example (Full Day Progression)
 *
 * | Time | Minutes | Hour | Event |
 * |------|---------|------|-------|
 * | 6 AM | 360 | 6 | Day start, NPCs wake |
 * | 9 AM | 540 | 9 | Shops open |
 * | 12 PM | 720 | 12 | Noon, lunch, creatures rest |
 * | 3 PM | 900 | 15 | Afternoon, hunting resumes |
 * | 6 PM | 1080 | 18 | Dusk, shops close |
 * | 9 PM | 1260 | 21 | Night, nocturnal creatures spawn |
 * | 12 AM | 0/1440 | 0/24 | Midnight, new day |
 * | 3 AM | 180 | 3 | Deep night, dangerous |
 *
 * ## Optimization Techniques
 *
 * ### Batch Time Advancement
 * ```typescript
 * // Instead of:
 * for (let i = 0; i < 100; i++) gameTime.tick(1)
 *
 * // Do:
 * gameTime.tick(100)  // Single operation
 * ```
 *
 * ### Event Registration
 * ```typescript
 * gameTime.onHourChange(hour => {
 *   if (hour === 20) npcs.goHome()
 * })
 * gameTime.onSeasonChange(season => {
 *   weather.setSeason(season)
 * })
 * ```
 *
 * ## Design Philosophy
 *
 * - **Progression Clarity**: Minutes → Hours → Days → Seasons (escalating scales)
 * - **Real-World Mapping**: 24-hour clock feels natural to players
 * - **Fairness**: Days start at 6 AM (avoids midnight confusion)
 * - **Realism**: Seasons affect environment dynamically
 * - **Flexibility**: Turn system independent for combat sequencing
 * - **Performance**: Efficient time queries (no loop calculations)
 *
 * ## Example: Multi-Day Quest
 *
 * ```typescript
 * // Day 1, 2 PM
 * gameTime = {days: 1, hours: 14, minutes: 840}
 * player.startQuest('retrieve_artifact')
 *
 * // Day 3, 6 AM (next morning)
 * gameTime.tick(2400)  // 2400 minutes = 1 day 18 hours
 * gameTime = {days: 3, hours: 6, minutes: 360}
 * if (gameTime.days >= quest.deadline)
 *   fail()
 * ```
 *
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
