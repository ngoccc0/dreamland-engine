import { Season } from '../types/game';

export class GameTime {
    private _minutes: number;  // Minutes since start of day (0-1440)
    private _days: number;     // Days since game start
    private _turns: number;    // Game turns
    private _season: Season;   // Current season

    constructor() {
        this._minutes = 360;   // Start at 6 AM
        this._days = 1;
        this._turns = 0;
        this._season = 'spring';
    }

    get minutes(): number {
        return this._minutes;
    }

    get hours(): number {
        return Math.floor(this._minutes / 60);
    }

    get days(): number {
        return this._days;
    }

    get turns(): number {
        return this._turns;
    }

    get season(): Season {
        return this._season;
    }

    get isDay(): boolean {
        return this._minutes >= 360 && this._minutes < 1080; // 6 AM to 6 PM
    }

    advanceTime(minutes: number): void {
        this._minutes += minutes;
        while (this._minutes >= 1440) {
            this._minutes -= 1440;
            this._days++;
            this.checkSeasonChange();
        }
    }

    advanceTurn(): void {
        this._turns++;
        // Each turn takes 15 minutes of game time
        this.advanceTime(15);
    }

    private checkSeasonChange(): void {
        const daysPerSeason = 90;
        const seasonIndex = Math.floor((this._days % 360) / daysPerSeason);
        const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
        this._season = seasons[seasonIndex];
    }
}
