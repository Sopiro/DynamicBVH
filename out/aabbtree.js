import { union } from "./aabb.js";
export class AABBTree {
    constructor() {
        this.root = undefined;
    }
    add(aabb) {
        let newNode = {
            aabb: aabb,
            isLeaf: true,
        };
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
            this.root = undefined;
        }
    }
}
