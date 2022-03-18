import { detectCollisionAABB, toAABB } from "./aabb.js";
import { Box } from "./box.js";
export function detectCollision(e1, e2) {
    if (e1 instanceof Box && e2 instanceof Box) {
        let aabb1 = toAABB(e1);
        let aabb2 = toAABB(e2);
        if (detectCollisionAABB(aabb1, aabb2)) {
            return true;
        }
        else {
            return false;
        }
    }
    throw "Not a supported shape";
}
