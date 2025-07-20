export class WorldPosition {
    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    get x(): number { return this._x; }
    get y(): number { return this._y; }

    equals(other: WorldPosition): boolean {
        return this._x === other._x && this._y === other._y;
    }

    distanceTo(other: WorldPosition): number {
        const dx = this._x - other._x;
        const dy = this._y - other._y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    manhattanDistanceTo(other: WorldPosition): number {
        return Math.abs(this._x - other._x) + Math.abs(this._y - other._y);
    }

    static fromGridPosition(gridPos: { x: number, y: number }): WorldPosition {
        return new WorldPosition(gridPos.x, gridPos.y);
    }
}
