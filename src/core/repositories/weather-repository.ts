export interface IWeatherRepository {
    getCurrentWeather(): Promise<any>;
    getWeatherAtPosition(position: { x: number, y: number }): Promise<any>;
    saveWeather(weather: any): Promise<void>;
    loadWeather(): Promise<any>;
    getRegionalWeather(center: { x: number, y: number }, radius: number): Promise<any>;
    updateWeather(weather: any): Promise<void>;
    // For modding
    registerCustomWeatherType(type: any): void;
}

// Example in-memory implementation
export class InMemoryWeatherRepository implements IWeatherRepository {
    private weather: any;
    private regionalWeather: Map<string, any> = new Map();
    private customTypes: Map<string, any> = new Map();

    async getCurrentWeather() {
        return this.weather;
    }
    async getWeatherAtPosition(position: { x: number, y: number }) {
        return this.weather;
    }
    async saveWeather(weather: any) {
        this.weather = weather;
    }
    async loadWeather() {
        return this.weather;
    }
    async getRegionalWeather(center: { x: number, y: number }, radius: number) {
        return Array.from(this.regionalWeather.values()).filter(rw => {
            const dx = rw.affectedArea.center.x - center.x;
            const dy = rw.affectedArea.center.y - center.y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }
    async updateWeather(weather: any) {
        this.weather = weather;
    }
    registerCustomWeatherType(type: any) {
        this.customTypes.set(type.modId, type);
    }
}
