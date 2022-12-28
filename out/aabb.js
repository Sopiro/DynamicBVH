import { Box } from "./box.js";
import { Vector2 } from "./math.js";
export class AABB {
    constructor(min = new Vector2(), max = new Vector2()) {
        this.min = min;
        this.max = max;
        fix(this);
    }
    copy() {
        return new AABB(this.min, this.max);
    }
    contains(other) {
        return this.min.x <= other.min.x
            && this.min.y <= other.min.y
            && this.max.x >= other.max.x
            && this.max.y >= other.max.y;
    }
    testPoint(point) {
        if (this.min.x > point.x || this.max.x < point.x)
            return false;
        if (this.min.y > point.y || this.max.y < point.y)
            return false;
        return true;
    }
    testOverlap(other) {
        if (this.min.x > other.max.x || this.max.x < other.min.x)
            return false;
        if (this.min.y > other.max.y || this.max.y < other.min.y)
            return false;
        return true;
    }
    get area() {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }
}
export function fix(aabb) {
    let minX = Math.min(aabb.min.x, aabb.max.x);
    let maxX = Math.max(aabb.min.x, aabb.max.x);
    let minY = Math.min(aabb.min.y, aabb.max.y);
    let maxY = Math.max(aabb.min.y, aabb.max.y);
    aabb.min.x = minX;
    aabb.min.y = minY;
    aabb.max.x = maxX;
    aabb.max.y = maxY;
}
export function createAABB(x, y, w, h) {
    return new AABB(new Vector2(x, y), new Vector2(x + w, y + h));
}
export function union(b1, b2) {
    let minX = Math.min(b1.min.x, b2.min.x);
    let minY = Math.min(b1.min.y, b2.min.y);
    let maxX = Math.max(b1.max.x, b2.max.x);
    let maxY = Math.max(b1.max.y, b2.max.y);
    let res = new AABB(new Vector2(minX, minY), new Vector2(maxX, maxY));
    return res;
}
export function toAABB(entity, margin = 0.0) {
    if (entity instanceof Box) {
        return new AABB(new Vector2(entity.position.x - margin, entity.position.y - margin), new Vector2(entity.position.x + entity.width + margin, entity.position.y + entity.height + margin));
    }
    else {
        throw "Not a supported shape";
    }
}
