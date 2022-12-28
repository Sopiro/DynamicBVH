import { Box } from "./box.js";
import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";

export class AABB
{
    public min: Vector2;
    public max: Vector2;

    constructor(min: Vector2 = new Vector2(), max: Vector2 = new Vector2())
    {
        this.min = min;
        this.max = max;

        fix(this);
    }

    copy(): AABB
    {
        return new AABB(this.min, this.max)
    }

    contains(other: AABB): boolean
    {
        return this.min.x <= other.min.x
            && this.min.y <= other.min.y
            && this.max.x >= other.max.x
            && this.max.y >= other.max.y
    }

    testPoint(point: Vector2): boolean
    {
        if (this.min.x > point.x || this.max.x < point.x) return false;
        if (this.min.y > point.y || this.max.y < point.y) return false;

        return true;
    }

    testOverlap(other: AABB): boolean
    {
        if (this.min.x > other.max.x || this.max.x < other.min.x) return false;
        if (this.min.y > other.max.y || this.max.y < other.min.y) return false;

        return true;
    }

    get area(): number
    {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }
}

export function fix(aabb: AABB): void
{
    let minX = Math.min(aabb.min.x, aabb.max.x);
    let maxX = Math.max(aabb.min.x, aabb.max.x);
    let minY = Math.min(aabb.min.y, aabb.max.y);
    let maxY = Math.max(aabb.min.y, aabb.max.y);

    aabb.min.x = minX;
    aabb.min.y = minY;
    aabb.max.x = maxX;
    aabb.max.y = maxY;
}

export function createAABB(x: number, y: number, w: number, h: number): AABB
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

export function toAABB(entity: Entity, margin: number = 0.0): AABB
{
    if (entity instanceof Box)
    {
        return new AABB(
            new Vector2(entity.position.x - margin, entity.position.y - margin),
            new Vector2(entity.position.x + entity.width + margin, entity.position.y + entity.height + margin)
        );
    }
    else
    {
        throw "Not a supported shape";
    }
}
