export interface Position {
    x: number;
    y: number;
}

export class WorldPosition {
    constructor(
        private readonly _x: number,
        private readonly _y: number
    ) {}

    get x(): number { return this._x; }
    get y(): number { return this._y; }

    equals(other: WorldPosition): boolean {
        return this._x === other.x && this._y === other.y;
    }

    distanceTo(other: WorldPosition): number {
        return Math.sqrt(Math.pow(this._x - other.x, 2) + Math.pow(this._y - other.y, 2));
    }

    manhattanDistanceTo(other: WorldPosition): number {
        return Math.abs(this._x - other.x) + Math.abs(this._y - other.y);
    }

    toString(): string {
        return `${this._x},${this._y}`;
    }

    static fromString(str: string): WorldPosition {
        const [x, y] = str.split(',').map(Number);
        return new WorldPosition(x, y);
    }
}
