import { Box } from "./box.js";
import { Vector2 } from "./math.js";
export class AABB {
    constructor(min = new Vector2(), max = new Vector2()) {
        this.min = min;
        this.max = max;
        fix(this);
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
export function testPointInside(aabb, point) {
    if (aabb.min.x > point.x || aabb.max.x < point.x)
        return false;
    if (aabb.min.y > point.y || aabb.max.y < point.y)
        return false;
    return true;
}
export function detectCollisionAABB(a, b) {
    if (a.min.x > b.max.x || a.max.x < b.min.x)
        return false;
    if (a.min.y > b.max.y || a.max.y < b.min.y)
        return false;
    return true;
}
export function containsAABB(container, target) {
    return container.min.x <= target.min.x
        && container.min.y <= target.min.y
        && container.max.x >= target.max.x
        && container.max.y >= target.max.y;
}
export function toAABB(entity, margin = 0.0) {
    if (entity instanceof Box) {
        return new AABB(new Vector2(entity.position.x - margin, entity.position.y - margin), new Vector2(entity.position.x + entity.width + margin, entity.position.y + entity.height + margin));
    }
    else {
        throw "Not a supported shape";
    }
}
