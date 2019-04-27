class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distance(other: Point) {
        const x = this.x - other.x;
        const y = this.y - other.y;
        return Math.sqrt(x * x + y * y);
    }
}

export default Point
