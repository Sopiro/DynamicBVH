import { Vector2 } from "./math.js";
export class AABB {
    constructor(min = new Vector2(), max = new Vector2()) {
        this.min = min;
        this.max = max;
        this.ensure();
    }
    ensure() {
        let minX = Math.min(this.min.x, this.max.x);
        let maxX = Math.max(this.min.x, this.max.x);
        let minY = Math.min(this.min.y, this.max.y);
        let maxY = Math.max(this.min.y, this.max.y);
        this.min.x = minX;
        this.min.y = minY;
        this.max.x = maxX;
        this.max.y = maxY;
    }
    get area() {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }
}
export function newAABB(x, y, w, h) {
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
