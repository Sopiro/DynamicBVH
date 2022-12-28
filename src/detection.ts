import { toAABB } from "./aabb.js";
import { Box } from "./box.js";
import { Entity } from "./entity.js";

export function detectCollision(e1: Entity, e2: Entity): boolean
{
    if (e1 instanceof Box && e2 instanceof Box)
    {
        let aabb1 = toAABB(e1);
        let aabb2 = toAABB(e2);

        if (aabb1.testOverlap(aabb2))
        {
            return true
        }
        else
        {
            return false;
        }
    }

    throw "Not a supported shape";
}