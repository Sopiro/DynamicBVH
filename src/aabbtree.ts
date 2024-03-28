import { AABB, union } from "./aabb.js";
import { Heap } from "./heap.js";
import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import { assert, make_pair_natural, Pair } from "./util.js";

export interface Node
{
    id: number;
    parent?: Node;
    child1?: Node;
    child2?: Node;
    isLeaf: boolean;
    aabb: AABB;
    data?: any; // User data
}

export class AABBTree
{
    private uid: number = 0;
    public root?: Node = undefined;

    reset(): void
    {
        this.uid = 0;
        this.root = undefined;
    }

    createNode(entity: any, aabb: AABB): Node
    {
        let enlargedAABB: AABB = aabb;
        enlargedAABB.max.x += Settings.aabbMargin;
        enlargedAABB.max.y += Settings.aabbMargin;
        enlargedAABB.min.x -= Settings.aabbMargin;
        enlargedAABB.min.y -= Settings.aabbMargin;

        let newNode: Node =
        {
            id: this.uid++,
            aabb: enlargedAABB,
            isLeaf: true,
            data: entity,
            parent: undefined,
            child1: undefined,
            child2: undefined,
        }

        this.insertLeaf(newNode);

        return newNode;
    }

    destroyNode(node: Node): void
    {
        assert(node.isLeaf);

        this.removeLeaf(node);
    }

    moveNode(node: Node, newAABB: AABB, displacement: Vector2, forceMove: boolean = false): boolean
    {
        assert(node.isLeaf);

        let treeAABB: AABB = node.aabb;
        if (treeAABB.contains(newAABB) && forceMove == false)
        {
            return false;
        }

        let enlargedAABB = newAABB.copy();
        let d = displacement.mul(Settings.aabbMultiplier);

        if (d.x > 0.0)
        {
            enlargedAABB.max.x += d.x;
        }
        else
        {
            enlargedAABB.min.x += d.x;
        }

        if (d.y > 0.0)
        {
            enlargedAABB.max.y += d.y;
        }
        else
        {
            enlargedAABB.min.y += d.y;
        }

        // Fatten the aabb
        enlargedAABB.max.x += Settings.aabbMargin;
        enlargedAABB.max.y += Settings.aabbMargin;
        enlargedAABB.min.x -= Settings.aabbMargin;
        enlargedAABB.min.y -= Settings.aabbMargin;

        // Remove and re-insert

        this.removeLeaf(node);

        node.aabb = enlargedAABB;

        this.insertLeaf(node);

        return true;
    }

    private insertLeaf(leaf: Node): void
    {
        if (this.root == undefined)
        {
            this.root = leaf;
            return;
        }

        let aabb: AABB = leaf.aabb;

        // Find the best sibling for the new leaf
        let bestSibling = this.root;
        let bestCost = union(this.root.aabb, aabb).perimeter;

        // let q: Pair<Node, number>[] = [];

        // Using priority queue
        let q = new Heap<Pair<Node, number>>([], (a, b) => { return a.p2 < b.p2 });

        q.push({ p1: this.root, p2: 0.0 });

        while (q.length > 0)
        {
            let front = q.pop()!;
            let current = front.p1;
            let inheritedCost = front.p2;

            let combined = union(current.aabb, aabb);
            let directCost = combined.perimeter;

            let costForCurrent = directCost + inheritedCost;
            if (costForCurrent < bestCost)
            {
                bestCost = costForCurrent;
                bestSibling = current;
            }

            inheritedCost += directCost - current.aabb.perimeter;

            let lowerBoundCost = aabb.perimeter + inheritedCost;
            if (lowerBoundCost < bestCost)
            {
                if (!current.isLeaf)
                {
                    q.push({ p1: current.child1!, p2: inheritedCost });
                    q.push({ p1: current.child2!, p2: inheritedCost });
                }
            }
        }

        // Create a new parent
        let oldParent: Node = bestSibling.parent!;
        let newParent: Node =
        {
            id: this.uid++,
            parent: oldParent,
            aabb: union(aabb, bestSibling.aabb),
            isLeaf: false
        }

        newParent.child1 = bestSibling;
        newParent.child2 = leaf;
        bestSibling.parent = newParent;
        leaf.parent = newParent;

        if (oldParent != undefined)
        {
            if (oldParent.child1 == bestSibling)
            {
                oldParent.child1 = newParent;
            } else
            {
                oldParent.child2 = newParent;
            }
        } else
        {
            this.root = newParent;
        }

        // Walk back up the tree refitting ancestors' AABB and applying rotations
        let ancestor: Node | undefined = newParent;
        while (ancestor != undefined)
        {
            let child1 = ancestor.child1!;
            let child2 = ancestor.child2!;

            ancestor.aabb = union(child1.aabb, child2.aabb);

            if (Settings.applyRotation)
            {
                this.rotate(ancestor);
            }

            ancestor = ancestor.parent;
        }
    }

    private removeLeaf(leaf: Node): void
    {
        let parent = leaf.parent;

        // node is root
        if (parent == undefined)
        {
            assert(this.root == leaf);
            this.root = undefined;
            return;
        }

        let grandParent = parent.parent;
        let sibling = parent.child1 == leaf ? parent.child2! : parent.child1!;

        // node has grandparent
        if (grandParent != undefined)
        {
            sibling.parent = grandParent;
            if (grandParent.child1 == parent)
            {
                grandParent.child1 = sibling;
            }
            else
            {
                grandParent.child2 = sibling;
            }

            let ancestor: Node | undefined = grandParent;
            while (ancestor != undefined)
            {
                let child1 = ancestor.child1!;
                let child2 = ancestor.child2!;

                ancestor.aabb = union(child1.aabb, child2.aabb);

                this.rotate(ancestor);

                ancestor = ancestor.parent;
            }
        }
        else
        {
            this.root = sibling;
            sibling.parent = undefined;
        }
    }

    private rotate(node: Node): void
    {
        if (node.isLeaf) 
        {
            return;
        }

        let child1 = node.child1!;
        let child2 = node.child2!;

        let costDiffs: number[] = [0, 0, 0, 0];

        if (child1.isLeaf == false)
        {
            let area1 = child1.aabb.perimeter;
            costDiffs[0] = union(child1.child1!.aabb, child2.aabb).perimeter - area1;
            costDiffs[1] = union(child1.child2!.aabb, child2.aabb).perimeter - area1;
        }

        if (child2.isLeaf == false)
        {
            let area2 = child2.aabb.perimeter;
            costDiffs[2] = union(child2.child1!.aabb, child1.aabb).perimeter - area2;
            costDiffs[3] = union(child2.child2!.aabb, child1.aabb).perimeter - area2;
        }

        let bestDiffIndex = 0;
        for (let i = 1; i < 4; i++)
        {
            if (costDiffs[i] < costDiffs[bestDiffIndex])
            {
                bestDiffIndex = i;
            }
        }

        // Rotate only if it reduce the suface area
        if (costDiffs[bestDiffIndex] >= 0)
        {
            return;
        }

        console.log("Tree rotation: type " + bestDiffIndex);
        switch (bestDiffIndex)
        {
            case 0:
                // this.swap(child2, child1.child2!);
                child1.child2!.parent = node;
                node.child2 = child1.child2!;

                child1.child2 = child2;
                child2.parent = child1;

                child1.aabb = union(child1.child1!.aabb, child1.child2!.aabb);
                break;
            case 1:
                // this.swap(child2, child1.child1!);
                child1.child1!.parent = node;
                node.child2 = child1.child1;

                child1.child1 = child2;
                child2.parent = child1;

                child1.aabb = union(child1.child1!.aabb, child1.child2!.aabb);
                break;
            case 2:
                // this.swap(child1, child2.child2!);
                child2.child2!.parent = node;
                node.child1 = child2.child2;

                child2.child2 = child1;
                child1.parent = child2;

                child2.aabb = union(child2.child1!.aabb, child2.child2!.aabb);
                break;
            case 3:
                // this.swap(child1, child2.child1!);
                child2.child1!.parent = node;
                node.child1 = child2.child1;

                child2.child1 = child1;
                child1.parent = child2;

                child2.aabb = union(child2.child1!.aabb, child2.child2!.aabb);
                break;
        }
    }

    private swap(node1: Node, node2: Node): void
    {
        let parent1 = node1.parent!;
        let parent2 = node2.parent!;

        if (parent1 == parent2)
        {
            parent1.child1 = node2;
            parent1.child2 = node1;
            return;
        }

        if (parent1.child1 == node1)
        {
            parent1.child1 = node2;
        }
        else
        {
            parent1.child2 = node2;
        }
        node2.parent = parent1;

        if (parent2.child1 == node2)
        {
            parent2.child1 = node1;
        }
        else
        {
            parent2.child2 = node1;
        }
        node1.parent = parent2;
    }

    queryPoint(point: Vector2): Node[]
    {
        let res: Node[] = [];

        if (this.root == undefined)
        {
            return res;
        }

        let q = [this.root];

        while (q.length != 0)
        {
            let current = q.shift()!;

            if (!current.aabb.testPoint(point))
            {
                continue;
            }

            if (current.isLeaf)
            {
                res.push(current);
            }
            else
            {
                q.push(current.child1!);
                q.push(current.child2!);
            }
        }

        return res;
    }

    queryRegion(region: AABB): Node[]
    {
        let res: Node[] = [];

        if (this.root == undefined) 
        {
            return res;
        }

        let stack = [this.root];

        while (stack.length != 0)
        {
            let current = stack.pop()!;

            if (!current.aabb.testOverlap(region))
            {
                continue;
            }

            if (current.isLeaf)
            {
                res.push(current);
            }
            else
            {
                stack.push(current.child1!);
                stack.push(current.child2!);
            }
        }

        return res;
    }

    getCollisionPairs(): Pair<Node, Node>[]
    {
        debugCount = 0;

        if (this.root == undefined) 
        {
            return [];
        }

        let res: Pair<Node, Node>[] = [];
        let checked: Set<number> = new Set<number>();

        if (!this.root.isLeaf)
        {
            this.checkCollision(this.root.child1!, this.root.child2!, res, checked);
        }

        return res;
    }

    private checkCollision(a: Node, b: Node, pairs: Pair<Node, Node>[], checked: Set<number>): void
    {
        const key = make_pair_natural(a.id, b.id);
        if (checked.has(key)) 
        {
            return;
        }

        checked.add(key);

        debugCount++;

        if (a.isLeaf && b.isLeaf)
        {
            if (a.aabb.testOverlap(b.aabb))
            {
                pairs.push({ p1: a, p2: b });
            }
        }
        else if (!a.isLeaf && !b.isLeaf)
        {
            this.checkCollision(a.child1!, a.child2!, pairs, checked);
            this.checkCollision(b.child1!, b.child2!, pairs, checked);

            if (a.aabb.testOverlap(b.aabb))
            {
                this.checkCollision(a.child1!, b.child1!, pairs, checked);
                this.checkCollision(a.child1!, b.child2!, pairs, checked);
                this.checkCollision(a.child2!, b.child1!, pairs, checked);
                this.checkCollision(a.child2!, b.child2!, pairs, checked);
            }
        }
        else if (a.isLeaf && !b.isLeaf)
        {
            this.checkCollision(b.child1!, b.child2!, pairs, checked);

            if (a.aabb.testOverlap(b.aabb))
            {
                this.checkCollision(a, b.child1!, pairs, checked);
                this.checkCollision(a, b.child2!, pairs, checked);
            }
        }
        else if (!a.isLeaf && b.isLeaf)
        {
            this.checkCollision(a.child1!, a.child2!, pairs, checked);

            if (a.aabb.testOverlap(b.aabb))
            {
                this.checkCollision(b, a.child1!, pairs, checked);
                this.checkCollision(b, a.child2!, pairs, checked);
            }
        }
    }

    // DFS tree traversal
    traverse(callback: (node: Node) => void)
    {
        let q = [this.root];

        while (q.length != 0)
        {
            let current = q.pop()!;
            if (current == undefined) 
            {
                break;
            }

            callback(current);

            if (!current.isLeaf)
            {
                q.push(current.child1!);
                q.push(current.child2!);
            }
        }
    }

    get cost(): number
    {
        let cost = 0;

        this.traverse(node =>
        {
            cost += node.aabb.perimeter;
        });

        return cost;
    }
}

export let debugCount = 0;