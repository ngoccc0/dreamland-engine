import { GridPosition } from '../values/grid-position';
import { Terrain, SoilType } from './terrain';

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
/**
 * World structure entities: Chunk, GridCell, Region
 * Merged and refactored for clarity, modding, and clean architecture.
 * @module src/core/entities/world
 */



/**
 * Attributes for a grid cell (fine-grained world tile)
 */
export interface GridCellAttributes {
    vegetationDensity: number;
    elevation: number;
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    predatorPresence: number;
    temperature: number;
    moisture: number;
    windLevel: number;
    lightLevel: number;
    explorability: number;
    soilType: SoilType;
    travelCost: number;
}

/**
 * Represents a single cell in the world grid.
 * @remarks Used for fine-grained world simulation and modding.
 */
export class GridCell {
    private _lastUpdated!: number;

    constructor(
        private readonly _position: GridPosition,
        private readonly _terrain: Terrain,
        private _attributes: GridCellAttributes,
        private _explored: boolean = false,
        private _lastVisited: number = 0,
        private readonly _regionId: number
    ) {
        this._lastUpdated = Date.now();
    }

    /**
     * Vị trí của ô trong lưới thế giới.
     */
    get position(): GridPosition {
        return this._position;
    }

    /**
     * Địa hình của ô.
     */
    get terrain(): Terrain {
        return this._terrain;
    }

    /**
     * Thuộc tính của ô.
     */
    get attributes(): GridCellAttributes {
        return this._attributes;
    }

    /**
     * Kiểm tra xem ô đã được khám phá hay chưa.
     */
    get explored(): boolean {
        return this._explored;
    }

    /**
     * Thời gian lần cuối ô được truy cập.
     */
    get lastVisited(): number {
        return this._lastVisited;
    }

    /**
     * ID của vùng mà ô thuộc về.
     */
    get regionId(): number {
        return this._regionId;
    }

    /**
     * Cập nhật thuộc tính cho ô.
     * @param attributes - Thuộc tính mới để cập nhật.
     */
    updateAttributes(attributes: Partial<GridCellAttributes>): void {
        this._attributes = { ...this._attributes, ...attributes };
        this._lastUpdated = Date.now();
    }

    /**
     * Đánh dấu ô là đã được khám phá.
     */
    markExplored(): void {
        this._explored = true;
        this._lastVisited = Date.now();
    }

    /**
     * Đánh dấu ô là chưa được khám phá.
     */
    markUnexplored(): void {
        this._explored = false;
    }
}
