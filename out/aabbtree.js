import { containsAABB, detectCollisionAABB, testPointInside, union } from "./aabb.js";
import { toAABB } from "./box.js";
import { Settings } from "./settings.js";
import { make_pair_natural } from "./util.js";
export class AABBTree {
    constructor() {
        this.nodeID = 0;
        this.root = undefined;
    }
    update() {
        let invalidNodes = [];
        this.traverse(node => {
            if (node.isLeaf) {
                let box = node.item;
                let tightAABB = toAABB(box, 0.0);
                if (containsAABB(node.aabb, tightAABB))
                    return;
                invalidNodes.push(node);
            }
        });
        // Re-insert the invalid nodes
        for (let node of invalidNodes) {
            this.remove(node);
            this.add(node.item);
        }
    }
    reset() {
        this.nodeID = 0;
        this.root = undefined;
    }
    add(box) {
        // Enlarged AABB
        let aabb = toAABB(box, Settings.aabbMargin);
        let newNode = {
            id: this.nodeID++,
            aabb: aabb,
            isLeaf: true,
            item: box
        };
        box.node = newNode;
        if (this.root == undefined) {
            this.root = newNode;
        }
        else {
            let bestSibling = this.root;
            let bestCost = union(this.root.aabb, aabb).area;
            let q = [this.root];
            while (q.length != 0) {
                let current = q.shift();
                let directCost = union(current.aabb, aabb).area;
                let inheritedCost = 0;
                let ancestor = current.parent;
                while (ancestor != undefined) {
                    inheritedCost += union(ancestor.aabb, aabb).area - ancestor.aabb.area;
                    ancestor = ancestor.parent;
                }
                let costForCurrent = directCost + inheritedCost;
                if (costForCurrent < bestCost) {
                    bestCost = costForCurrent;
                    bestSibling = current;
                }
                let lowerBoundCost = aabb.area + (union(current.aabb, aabb).area - current.aabb.area) + inheritedCost;
                if (lowerBoundCost < bestCost) {
                    if (!current.isLeaf) {
                        q.push(current.child1);
                        q.push(current.child2);
                    }
                }
            }
            let oldParent = bestSibling.parent;
            let newParent = {
                id: this.nodeID++,
                parent: oldParent,
                aabb: union(aabb, bestSibling.aabb),
                isLeaf: false
            };
            if (oldParent != undefined) {
                if (oldParent.child1 == bestSibling) {
                    oldParent.child1 = newParent;
                }
                else {
                    oldParent.child2 = newParent;
                }
                newParent.child1 = bestSibling;
                newParent.child2 = newNode;
                bestSibling.parent = newParent;
                newNode.parent = newParent;
            }
            else {
                newParent.child1 = bestSibling;
                newParent.child2 = newNode;
                bestSibling.parent = newParent;
                newNode.parent = newParent;
                this.root = newParent;
            }
            // Refit ancestors
            let ancestor = newNode.parent;
            while (ancestor != undefined) {
                let child1 = ancestor.child1;
                let child2 = ancestor.child2;
                ancestor.aabb = union(child1.aabb, child2.aabb);
                ancestor = ancestor.parent;
            }
        }
        return newNode;
    }
    remove(node) {
        let parent = node.parent;
        node.item.node = undefined;
        if (parent != undefined) {
            let sibling = parent.child1 == node ? parent.child2 : parent.child1;
            if (parent.parent != undefined) {
                sibling.parent = parent.parent;
                if (parent.parent.child1 == parent) {
                    parent.parent.child1 = sibling;
                }
                else {
                    parent.parent.child2 = sibling;
                }
            }
            else {
                this.root = sibling;
                sibling.parent = undefined;
            }
            let ancestor = sibling.parent;
            while (ancestor != undefined) {
                let child1 = ancestor.child1;
                let child2 = ancestor.child2;
                ancestor.aabb = union(child1.aabb, child2.aabb);
                ancestor = ancestor.parent;
            }
        }
        else {
            if (this.root == node) {
                this.root = undefined;
            }
        }
    }
    queryPoint(point) {
        let res = [];
        if (this.root == undefined)
            return res;
        let q = [this.root];
        while (q.length != 0) {
            let current = q.shift();
            if (!testPointInside(current.aabb, point))
                continue;
            if (current.isLeaf) {
                res.push(current);
            }
            else {
                q.push(current.child1);
                q.push(current.child2);
            }
        }
        return res;
    }
    queryRegion(region) {
        let res = [];
        if (this.root == undefined)
            return res;
        let q = [this.root];
        while (q.length != 0) {
            let current = q.shift();
            if (!detectCollisionAABB(current.aabb, region))
                continue;
            if (current.isLeaf) {
                res.push(current);
            }
            else {
                q.push(current.child1);
                q.push(current.child2);
            }
        }
        return res;
    }
    getCollisionPairs() {
        debugCount = 0;
        if (this.root == undefined)
            return [];
        let res = [];
        let checked = new Set();
        if (!this.root.isLeaf) {
            this.checkCollision(this.root.child1, this.root.child2, res, checked);
        }
        return res;
    }
    checkCollision(a, b, pairs, checked) {
        const key = make_pair_natural(a.id, b.id);
        if (checked.has(key))
            return;
        checked.add(key);
        debugCount++;
        if (a.isLeaf && b.isLeaf) {
            if (detectCollisionAABB(a.aabb, b.aabb)) {
                pairs.push({ p1: a, p2: b });
            }
        }
        else if (!a.isLeaf && !b.isLeaf) {
            this.checkCollision(a.child1, a.child2, pairs, checked);
            this.checkCollision(b.child1, b.child2, pairs, checked);
            if (detectCollisionAABB(a.aabb, b.aabb)) {
                this.checkCollision(a.child1, b.child1, pairs, checked);
                this.checkCollision(a.child1, b.child2, pairs, checked);
                this.checkCollision(a.child2, b.child1, pairs, checked);
                this.checkCollision(a.child2, b.child2, pairs, checked);
            }
        }
        else if (a.isLeaf && !b.isLeaf) {
            this.checkCollision(b.child1, b.child2, pairs, checked);
            if (detectCollisionAABB(a.aabb, b.aabb)) {
                this.checkCollision(a, b.child1, pairs, checked);
                this.checkCollision(a, b.child2, pairs, checked);
            }
        }
        else if (!a.isLeaf && b.isLeaf) {
            this.checkCollision(a.child1, a.child2, pairs, checked);
            if (detectCollisionAABB(a.aabb, b.aabb)) {
                this.checkCollision(b, a.child1, pairs, checked);
                this.checkCollision(b, a.child2, pairs, checked);
            }
        }
    }
    // BFS tree traversal
    traverse(callback) {
        let q = [this.root];
        while (q.length != 0) {
            let current = q.shift();
            if (current == undefined)
                break;
            callback(current);
            if (!current.isLeaf) {
                q.push(current.child1);
                q.push(current.child2);
            }
        }
    }
}
export let debugCount = 0;
