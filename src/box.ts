import { AABB } from "./aabb.js";
import { Entity } from "./entity.js";
import { Vector2 } from "./math.js";
import { Node } from "./aabbtree.js";
import { PRNG } from "./prng.js";

export class Box extends Entity
{
    public color: string;
    public width: number;
    public height: number;

    // Pointer to the node in the AABB tree
    public node?: Node;

    constructor(position: Vector2, width: number, height: number)
    {
        super();

        this.position = position;
        this.width = width;
        this.height = height;
        
        this.color = uniqueColor(this);
    }
}

export function toAABB(box: Box, margin: number = 0.0): AABB
{
    return new AABB(
        new Vector2(box.position.x - margin, box.position.y - margin),
        new Vector2(box.position.x + box.width + margin, box.position.y + box.height + margin)
    );
}

export function toBox(aabb: AABB): Box
{
    let size = aabb.max.sub(aabb.min);

    return new Box(aabb.min, size.x, size.y);
}

const rand = new PRNG(1234);

export function uniqueColor(box: Box): string
{
    rand.setSeed((box.position.x << 16) + (box.position.y << 8) + (box.width << 4) + box.height);
    return rand.nextColor();
}