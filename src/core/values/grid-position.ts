export class GridPosition {
    constructor(
        private readonly _x: number,
        private readonly _y: number
    ) {}

    get x(): number { return this._x; }
    get y(): number { return this._y; }

    equals(other: GridPosition): boolean {
        return this._x === other.x && this._y === other.y;
    }

    toString(): string {
        return `${this._x},${this._y}`;
    }

    static fromString(str: string): GridPosition {
        const [x, y] = str.split(',').map(Number);
        return new GridPosition(x, y);
    }
}
