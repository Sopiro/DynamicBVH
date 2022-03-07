import { Vector2 } from "./math.js";

export class AABB
{
    public min: Vector2;
    public max: Vector2;

    constructor(min: Vector2 = new Vector2(), max: Vector2 = new Vector2())
    {
        this.min = min;
        this.max = max;

        this.ensure();
    }

    private ensure(): void
    {
        let minX = Math.min(this.min.x, this.max.x);
        let maxX = Math.max(this.min.x, this.max.x);
        let minY = Math.min(this.min.y, this.max.y);
        let maxY = Math.max(this.min.y, this.max.y);

        this.min.x = minX;
        this.min.y = minY;
        this.max.x = maxX;
        this.max.y = maxY;
    }

    get area(): number
    {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }
}

export function newAABB(x: number, y: number, w: number, h: number): AABB
{
    return new AABB(new Vector2(x, y), new Vector2(x + w, y + h));
}

export function union(b1: AABB, b2: AABB): AABB
{
    let minX = Math.min(b1.min.x, b2.min.x);
    let minY = Math.min(b1.min.y, b2.min.y);
    let maxX = Math.max(b1.max.x, b2.max.x);
    let maxY = Math.max(b1.max.y, b2.max.y);

    let res = new AABB(new Vector2(minX, minY), new Vector2(maxX, maxY));

    return res;
}