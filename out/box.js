import { Entity } from "./entity.js";
import { PRNG } from "./prng.js";
export class Box extends Entity {
    constructor(position, width, height) {
        super();
        this.position = position;
        this.width = width;
        this.height = height;
        this.color = uniqueColor(this);
    }
}
export function toBox(aabb) {
    let size = aabb.max.sub(aabb.min);
    return new Box(aabb.min, size.x, size.y);
}
const rand = new PRNG(1234);
export function uniqueColor(box) {
    rand.setSeed((box.position.x << 16) + (box.position.y << 8) + (box.width << 4) + box.height);
    return rand.nextColor();
}
