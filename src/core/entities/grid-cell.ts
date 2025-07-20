import { GridPosition } from '../values/grid-position';
import { Terrain, TerrainType, SoilType } from './terrain';

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

export class GridCell {
    private _lastUpdated: number;

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

    get position(): GridPosition { return this._position; }
    get terrain(): Terrain { return this._terrain; }
    get attributes(): Readonly<GridCellAttributes> { return this._attributes; }
    get explored(): boolean { return this._explored; }
    get lastVisited(): number { return this._lastVisited; }
    get regionId(): number { return this._regionId; }
    get lastUpdated(): number { return this._lastUpdated; }

    visit(): void {
        this._explored = true;
        this._lastVisited = Date.now();
        this.update();
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);
        
        // Update attributes based on time passed and current conditions
        if (hoursSinceLastUpdate > 1) {
            this._attributes = this.calculateNewAttributes(hoursSinceLastUpdate);
            this._lastUpdated = now;
        }
    }

    private calculateNewAttributes(hoursPassed: number): GridCellAttributes {
        // This will implement the actual attribute evolution over time
        // For now, return current attributes
        return { ...this._attributes };
    }

    static createFromData(data: any): GridCell {
        return new GridCell(
            new GridPosition(data.x, data.y),
            new Terrain(
                data.terrain as TerrainType,
                {} as any, // Need to add proper terrain attributes
                data.terrain, // Temporary: using terrain type as name
                '' // Need to add proper description
            ),
            {
                vegetationDensity: data.vegetationDensity,
                elevation: data.elevation,
                dangerLevel: data.dangerLevel,
                magicAffinity: data.magicAffinity,
                humanPresence: data.humanPresence,
                predatorPresence: data.predatorPresence,
                temperature: data.temperature,
                moisture: data.moisture,
                windLevel: data.windLevel,
                lightLevel: data.lightLevel,
                explorability: data.explorability,
                soilType: data.soilType as SoilType,
                travelCost: data.travelCost
            },
            data.explored,
            data.lastVisited,
            data.regionId
        );
    }

    toJSON() {
        return {
            x: this.position.x,
            y: this.position.y,
            explored: this._explored,
            lastVisited: this._lastVisited,
            regionId: this._regionId,
            terrain: this._terrain.type,
            ...this._attributes
        };
    }
}
