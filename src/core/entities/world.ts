import { WorldPosition } from '../values/position';
import { Terrain } from './terrain';
import { TerrainType, SoilType } from '../../lib/definitions/terrain-definitions';
import { WeatherSystem } from './weather';
import { WeatherCondition } from '../types/weather';
import { Effect, EffectType } from '../types/effects';

/**
 * Thuộc tính môi trường của thế giới, dùng cho mỗi ô hoặc vùng.
 */
export interface WorldAttributes {
    /** Mật độ thực vật (0-100) */
    vegetationDensity: number;
    /** Độ ẩm (0-100) */
    moisture: number;
    /** Độ cao địa hình */
    elevation: number;
    /** Mức độ ánh sáng */
    lightLevel: number;
    /** Mức độ nguy hiểm */
    dangerLevel: number;
    /** Độ tương tác với ma thuật */
    magicAffinity: number;
    /** Mức độ hiện diện của con người */
    humanPresence: number;
    /** Độ dễ khám phá */
    explorability: number;
    /** Loại đất */
    soilType: SoilType;
    /** Mức độ xuất hiện thú săn mồi */
    predatorPresence: number;
    /** Mức độ gió */
    windLevel: number;
    /** Nhiệt độ */
    temperature: number;
}

/**
 * Đại diện cho một ô (chunk) trong thế giới, chứa thông tin vị trí, địa hình và thuộc tính môi trường.
 */
export class WorldChunk {
    /** Thời điểm cuối cùng ô này được ghé thăm */
    private _lastVisited: number = 0;
    /** Đánh dấu ô đã được khám phá */
    private _explored: boolean = false;
    /** Thuộc tính môi trường có thể thay đổi */
    private _mutableAttributes: WorldAttributes;

    /**
     * @param _position Vị trí của ô trong thế giới
     * @param _terrain Địa hình của ô
     * @param _attributes Thuộc tính môi trường ban đầu
     * @param _regionId ID vùng chứa ô này
     * @param _description Mô tả ô
     */
    constructor(
        private readonly _position: WorldPosition,
        private readonly _terrain: Terrain,
        private readonly _attributes: WorldAttributes,
        private readonly _regionId: number,
        private _description: string = ''
    ) {
        this._mutableAttributes = { ...this._attributes };
    }

    /** Vị trí của ô */
    get position(): WorldPosition { return this._position; }
    /** Địa hình của ô */
    get terrain(): Terrain { return this._terrain; }
    /** Thuộc tính môi trường hiện tại (readonly) */
    get attributes(): Readonly<WorldAttributes> { return this._mutableAttributes; }
    /** ID vùng chứa ô này */
    get regionId(): number { return this._regionId; }
    /** Mô tả ô */
    get description(): string { return this._description; }
    /** Thời điểm cuối cùng được ghé thăm */
    get lastVisited(): number { return this._lastVisited; }
    /** Đã khám phá chưa */
    get explored(): boolean { return this._explored; }

    /** Đánh dấu ô đã được ghé thăm */
    visit(timestamp: number): void {
        this._lastVisited = timestamp;
        this._explored = true;
    }

    /**
     * Cập nhật thuộc tính môi trường dựa trên thời tiết hiện tại
     */
    updateAttributes(weatherSystem: WeatherSystem): void {
        // Lấy WeatherCondition từ WeatherSystem (giả định luôn có 1 condition chính)
        const weather = weatherSystem.getPrimaryCondition();
        this._mutableAttributes = {
            ...this._mutableAttributes,
            moisture: this.calculateMoisture(weatherSystem),
            windLevel: weather.windSpeed,
            temperature: weather.temperature
        };
    }

    /**
     * Tính toán lại độ ẩm dựa trên lượng mưa
     */
    private calculateMoisture(weatherSystem: WeatherSystem): number {
        const weather = weatherSystem.getPrimaryCondition();
        const baseMoisture = this._mutableAttributes.moisture;
        const precipitationEffect = weather.precipitation * 0.01;
        return Math.min(100, Math.max(0, baseMoisture + precipitationEffect));
    }
}

/**
 * Đại diện cho một vùng (region) trong thế giới, quản lý các ô (chunk) và trạng thái thời tiết.
 */
export class WorldRegion {
    /** Danh sách các ô trong vùng, key là vị trí */
    private _chunks: Map<string, WorldChunk> = new Map();
    /** Thời điểm cập nhật gần nhất */
    private _lastUpdated: number = Date.now();
    /** Hệ thống thời tiết hiện tại */
    private _weather: WeatherSystem;
    /** Thời tiết hiện tại */
    private _currentWeather: WeatherCondition;

    /**
     * @param _id ID vùng
     * @param _position Vị trí vùng
     * @param _terrain Địa hình vùng
     * @param weather Hệ thống thời tiết
     * @param initialWeather Thời tiết ban đầu
     */
    constructor(
        private readonly _id: number,
        private readonly _position: WorldPosition,
        private readonly _terrain: Terrain,
        weather: WeatherSystem,
        initialWeather: WeatherCondition
    ) {
        this._weather = weather;
        this._currentWeather = initialWeather;
    }

    /** ID vùng */
    get id(): number { return this._id; }
    /** Thêm ô vào vùng */
    addChunk(chunk: WorldChunk): void {
        this._chunks.set(chunk.position.toString(), chunk);
    }
    /** Lấy ô theo vị trí */
    getChunk(position: WorldPosition): WorldChunk | undefined {
        return this._chunks.get(position.toString());
    }
    /**
     * Cập nhật thời tiết vùng và cập nhật các ô bên trong
     */
    updateWeather(weatherSystem: WeatherSystem): void {
        this._weather = weatherSystem;
        // Lấy WeatherCondition đầu tiên nếu có, hoặc ép kiểu
        this._currentWeather = weatherSystem.getPrimaryCondition();
        for (const chunk of this._chunks.values()) {
            chunk.updateAttributes(weatherSystem);
        }
    }
    /**
     * Cập nhật hiệu ứng thời tiết lên các ô mỗi giờ
     */
    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);
        if (hoursSinceLastUpdate >= 1) {
            // Update chunks based on weather effects
            for (const chunk of this._chunks.values()) {
                // Apply weather effects to chunk's mutable attributes
                const mutableChunk = chunk as any;
                for (const effect of this._currentWeather.effects) {
                    this.applyEffect(effect, mutableChunk);
                }
            }
            this._lastUpdated = now;
        }
    }
    /**
     * Áp dụng hiệu ứng thời tiết lên thuộc tính môi trường của ô
     */
    private applyEffect(effect: Effect, chunk: any): void {
        switch (effect.type) {
            case EffectType.TEMPERATURE:
                chunk._mutableAttributes.temperature += effect.value;
                break;
            case EffectType.MOISTURE:
                chunk._mutableAttributes.moisture += effect.value;
                break;
            case EffectType.WIND:
                chunk._mutableAttributes.windLevel += effect.value;
                break;
            // Add more effect handlers as needed
        }
    }
    /** Lấy hệ thống thời tiết */
    get weather(): WeatherSystem {
        return this._weather;
    }
    /** Lấy thời tiết hiện tại */
    get currentWeather(): WeatherCondition {
        return this._currentWeather;
    }
    /** Lấy thời tiết tại vị trí (hiện tại trả về chung cho cả vùng) */
    getWeatherAt(position: WorldPosition): WeatherCondition {
        return this._currentWeather;
    }
}

/**
 * Quản lý toàn bộ thế giới, các vùng và hệ thống thời tiết toàn cục.
 */
export class GameWorld {
    /** Danh sách các vùng trong thế giới, key là id */
    private _regions: Map<number, WorldRegion> = new Map();
    /** Hệ thống thời tiết toàn cục */
    private _weatherSystem: WeatherSystem;
    /**
     * @param weatherSystem Hệ thống thời tiết toàn cục
     * @param regions Danh sách vùng ban đầu
     */
    constructor(
        weatherSystem: WeatherSystem,
        regions: WorldRegion[] = []
    ) {
        this._weatherSystem = weatherSystem;
        regions.forEach(region => this._regions.set(region.id, region));
    }
    /** Thêm vùng mới vào thế giới */
    addRegion(region: WorldRegion): void {
        this._regions.set(region.id, region);
    }
    /** Lấy vùng theo id */
    getRegion(id: number): WorldRegion | undefined {
        return this._regions.get(id);
    }
    /** Lấy ô theo vị trí (tìm trong tất cả các vùng) */
    getChunkAt(position: WorldPosition): WorldChunk | undefined {
        for (const region of this._regions.values()) {
            const chunk = region.getChunk(position);
            if (chunk) return chunk;
        }
        return undefined;
    }
    /**
     * Cập nhật thời gian/thời tiết toàn cục và cập nhật các vùng
     */
    updateTime(elapsedSeconds: number): void {
        this._weatherSystem.update(elapsedSeconds);
        // Update all regions with new weather
        for (const region of this._regions.values()) {
            region.updateWeather(this._weatherSystem);
        }
    }
    /** Lấy thời tiết tại vị trí (tìm vùng chứa vị trí đó) */
    getWeatherAt(position: WorldPosition): WeatherCondition {
        // Find the region containing this position and get its weather
        for (const region of this._regions.values()) {
            if (region.getChunk(position)) {
                return region.currentWeather;
            }
        }
        // Return global weather if no region found
        // Lấy WeatherCondition đầu tiên nếu có, hoặc ép kiểu
        return this._weatherSystem.getPrimaryCondition();
    }
}
