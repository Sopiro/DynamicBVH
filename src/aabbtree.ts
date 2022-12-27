import { AABB, containsAABB, detectCollisionAABB, testPointInside, union, toAABB } from "./aabb.js";
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

    destoryNode(node: Node): void
    {
        assert(node.isLeaf);

        this.removeLeaf(node);
    }

    moveNode(node: Node, newAABB: AABB, displacement: Vector2, forceMove: boolean = false): boolean
    {
        assert(node.isLeaf);

        let treeAABB: AABB = node.aabb;
        if (containsAABB(treeAABB, newAABB) && forceMove == false)
        {
            return false;
        }

        let enlargedAABB: AABB = newAABB;
        let d: Vector2 = displacement.mul(Settings.aabbMultiplier);

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
        // Enlarged AABB
        if (this.root == undefined)
        {
            this.root = leaf;
            return;
        }

        let aabb: AABB = leaf.aabb;

        // Find the best sibling for the new leaf
        let bestSibling = this.root;
        let bestCost = union(this.root.aabb, aabb).area;
        let q: Pair<Node, number>[] = [{ p1: this.root, p2: 0.0 }];

        while (q.length != 0)
        {
            let front: Pair<Node, number> = q.shift()!;
            let current = front.p1;
            let inheritedCost = front.p2;

            let combined = union(current.aabb, aabb);
            let directCost = combined.area;

            let costForCurrent = directCost + inheritedCost;
            if (costForCurrent < bestCost)
            {
                bestCost = costForCurrent;
                bestSibling = current;
            }

            inheritedCost += directCost - current.aabb.area;

            let lowerBoundCost = aabb.area + inheritedCost;
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

        if (oldParent != undefined)
        {
            if (oldParent.child1 == bestSibling)
            {
                oldParent.child1 = newParent;
            } else
            {
                oldParent.child2 = newParent;
            }

            newParent.child1 = bestSibling;
            newParent.child2 = leaf;
            bestSibling.parent = newParent;
            leaf.parent = newParent;
        } else
        {
            newParent.child1 = bestSibling;
            newParent.child2 = leaf;
            bestSibling.parent = newParent;
            leaf.parent = newParent;
            this.root = newParent;
        }

        // Walk back up the tree refitting ancestors' AABB and applying rotations
        let ancestor: Node | undefined = leaf.parent;

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

    private rotate(node: Node): void
    {
        if (node.parent == undefined) 
        {
            return;
        }

        let parent = node.parent;
        let sibling = parent.child1 == node ? parent.child2! : parent.child1!;

        let costDiffs: number[] = [];
        let nodeArea = node.aabb.area;

        costDiffs.push(union(sibling.aabb, node.child1!.aabb).area - nodeArea);
        costDiffs.push(union(sibling.aabb, node.child2!.aabb).area - nodeArea);

        if (!sibling.isLeaf)
        {
            let siblingArea = sibling.aabb.area;
            costDiffs.push(union(node.aabb, sibling.child1!.aabb).area - siblingArea);
            costDiffs.push(union(node.aabb, sibling.child2!.aabb).area - siblingArea);
        }

        let bestDiffIndex = 0;
        for (let i = 1; i < costDiffs.length; i++)
        {
            if (costDiffs[i] < costDiffs[bestDiffIndex])
            {
                bestDiffIndex = i;
            }
        }

        if (costDiffs[bestDiffIndex] < 0.0)
        {
            console.log("Tree rotation: type " + bestDiffIndex);
            switch (bestDiffIndex)
            {
                case 0:
                    // this.swap(sibling, node.child2!);

                    if (parent.child1 == sibling)
                    {
                        parent.child1 = node.child2;
                    }
                    else
                    {
                        parent.child2 = node.child2;
                    }

                    node.child2!.parent = parent;

                    node.child2 = sibling;
                    sibling.parent = node;
                    node.aabb = union(sibling.aabb, node.child1!.aabb);
                    break;
                case 1:
                    // this.swap(sibling, node.child1!);

                    if (parent.child1 == sibling)
                    {
                        parent.child1 = node.child1;
                    }
                    else
                    {
                        parent.child2 = node.child1;
                    }

                    node.child1!.parent = parent;

                    node.child1 = sibling;
                    sibling.parent = node;
                    node.aabb = union(sibling.aabb, node.child2!.aabb);
                    break;
                case 2:
                    // this.swap(node, sibling.child2!);

                    if (parent.child1 == node)
                    {
                        parent.child1 = sibling.child2;
                    }
                    else
                    {
                        parent.child2 = sibling.child2;
                    }

                    sibling.child2!.parent = parent;

                    sibling.child2 = node;
                    node.parent = sibling;
                    sibling.aabb = union(node.aabb, sibling.child2!.aabb);
                    break;
                case 3:
                    // this.swap(node, sibling.child1!);

                    if (parent.child1 == node)
                    {
                        parent.child1 = sibling.child1;
                    }
                    else
                    {
                        parent.child2 = sibling.child1;
                    }

                    sibling.child1!.parent = parent;

                    sibling.child1 = node;
                    node.parent = sibling;
                    sibling.aabb = union(node.aabb, sibling.child1!.aabb);
                    break;
            }
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

    private removeLeaf(leaf: Node): void
    {
        let parent = leaf.parent;

        if (parent != undefined)
        {
            let sibling = parent.child1 == leaf ? parent.child2! : parent.child1!;

            if (parent.parent != undefined)
            {
                sibling.parent = parent.parent;
                if (parent.parent.child1 == parent)
                {
                    parent.parent.child1 = sibling;
                }
                else
                {
                    parent.parent.child2 = sibling;
                }
            }
            else
            {
                this.root = sibling;
                sibling.parent = undefined;
            }

            let ancestor = sibling.parent;
            while (ancestor != undefined)
            {
                let child1 = ancestor.child1!;
                let child2 = ancestor.child2!;

                ancestor.aabb = union(child1.aabb, child2.aabb);
                ancestor = ancestor.parent;
            }

        } else
        {
            if (this.root == leaf)
            {
                this.root = undefined;
            }
        }
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

            if (!testPointInside(current.aabb, point))
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

        let q = [this.root];

        while (q.length != 0)
        {
            let current = q.shift()!;

            if (!detectCollisionAABB(current.aabb, region))
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
            if (detectCollisionAABB(a.aabb, b.aabb))
            {
                pairs.push({ p1: a, p2: b });
            }
        }
        else if (!a.isLeaf && !b.isLeaf)
        {
            this.checkCollision(a.child1!, a.child2!, pairs, checked);
            this.checkCollision(b.child1!, b.child2!, pairs, checked);

            if (detectCollisionAABB(a.aabb, b.aabb))
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

            if (detectCollisionAABB(a.aabb, b.aabb))
            {
                this.checkCollision(a, b.child1!, pairs, checked);
                this.checkCollision(a, b.child2!, pairs, checked);
            }
        }
        else if (!a.isLeaf && b.isLeaf)
        {
            this.checkCollision(a.child1!, a.child2!, pairs, checked);

            if (detectCollisionAABB(a.aabb, b.aabb))
            {
                this.checkCollision(b, a.child1!, pairs, checked);
                this.checkCollision(b, a.child2!, pairs, checked);
            }
        }
    }

    // BFS tree traversal
    traverse(callback: (node: Node) => void)
    {
        let q = [this.root];

        while (q.length != 0)
        {
            let current = q.shift()!;
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
            cost += node.aabb.area;
        });

        return cost;
    }
}

export let debugCount = 0;