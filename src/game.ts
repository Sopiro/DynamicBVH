import { Matrix3, Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { Settings } from "./settings.js";
import { AABB, detectCollisionAABB } from "./aabb.js";
import { PRNG } from "./prng.js";
import { AABBTree, debugCount } from "./aabbtree.js";
import { Box, toAABB, toBox } from "./box.js";
import { Timer } from "./timer.js";

export class Game
{
    private renderer: Renderer;
    public camera: Camera;

    private cameraPosStart!: Vector2;
    private cursorStart!: Vector2;
    private cameraMove = false;

    public cursorPos: Vector2 = new Vector2(0, 0);
    public deltaTime: number = 0.0;
    public time: number = 0.0;
    public frame: number = 0;

    private tree: AABBTree;

    private initRoutines: NodeJS.Timer[] = [];
    private creating: boolean = false;
    private grabbing: boolean = false;
    private removing: boolean = false;
    private clickStart: Vector2 = new Vector2(0, 0);
    private clickEnd: Vector2 = new Vector2(0, 0);

    private grabbedBox!: Box;
    private grabStart!: Vector2;

    private boxCount = 0;

    private collsionPairsLabel: HTMLDivElement;
    private surfaceAreaLabel: HTMLDivElement;
    private efficientCheckLabel: HTMLDivElement;

    private timer: Timer = new Timer();

    constructor(renderer: Renderer)
    {
        this.renderer = renderer;
        this.camera = new Camera();
        this.camera.position = new Vector2(0, 0);

        let projectionTransform = Util.orth(
            -Settings.clipWidth / 2.0, Settings.clipWidth / 2.0,
            -Settings.clipHeight / 2.0, Settings.clipHeight / 2.0
        );
        let viewportTransform = Util.viewport(Settings.width, Settings.height);

        this.renderer.init(viewportTransform, projectionTransform, this.camera.cameraTransform);

        this.tree = new AABBTree();

        const restartBtn = document.querySelector("#restart") as HTMLButtonElement;
        restartBtn.addEventListener("click", () =>
        {
            this.init();
        });

        this.collsionPairsLabel = document.querySelector("#collsionPairsLabel") as HTMLDivElement;
        this.surfaceAreaLabel = document.querySelector("#surfaceAreaLabel") as HTMLDivElement;
        this.efficientCheckLabel = document.querySelector("#efficientCheckLabel") as HTMLDivElement;

        this.init();
    }

    init(): void
    {
        this.timer.reset();
        this.tree.reset();

        for (let r of this.initRoutines)
            clearInterval(r);

        // Random initial spread
        let rand = new PRNG(1);

        let minW = 0.2;
        let minH = 0.2;
        let maxW = 0.9;
        let maxH = 0.9;
        this.boxCount = 0;
        this.timer.mark();
        let routine = setInterval(() =>
        {
            let bottomLeft = this.renderer.pick(new Vector2(0, 0));
            let topRight = this.renderer.pick(new Vector2(Settings.width, Settings.height));

            this.boxCount++;
            let rx = rand.nextRange(bottomLeft.x, topRight.x - maxW);
            let ry = rand.nextRange(bottomLeft.y, topRight.y - maxH);
            let rw = rand.nextRange(minW, maxW);
            let rh = rand.nextRange(minH, maxH);

            this.tree.add(new Box(new Vector2(rx, ry), rw, rh));

            if (this.boxCount >= Settings.boxCount)
            {
                clearInterval(routine);
                this.timer.mark();
                console.log((this.timer.lastElapsed / 1000.0).toFixed(2) + "s");
            }
        }, Settings.genSpeed);

        this.initRoutines.push(routine);
    }

    update(delta: number): void
    {
        this.deltaTime = delta;
        this.frame++;
        this.time += delta;
        this.handleInput(delta);

        this.tree.update();

        // Broad phase
        let collisionPairs = this.tree.getCollisionPairs();

        let realCollisionPairs: Util.Pair<Box, Box>[] = [];
        for (let pair of collisionPairs)
        {
            let tightAABB1 = toAABB(pair.p1.item!);
            let tightAABB2 = toAABB(pair.p2.item!);

            // Narrow phase
            if (detectCollisionAABB(tightAABB1, tightAABB2))
            {
                realCollisionPairs.push({ p1: pair.p1.item!, p2: pair.p2.item! });
            }
        }

        this.collsionPairsLabel.innerHTML = "Collision pairs: " + realCollisionPairs.length;
        if (this.timer.times.length < 2)
        {
            this.updateCostLabel();
        }


        let nSquared = (this.boxCount * this.boxCount - this.boxCount) / 2.0;
        let bvh = nSquared / debugCount;

        this.efficientCheckLabel.innerHTML = "Box count: " + this.boxCount + "<br>"
            + "BruteForce: " + nSquared + "<br>"
            + "Dynamic BVH: " + debugCount + "<br>"
            + "Dynamic BVH is " + (isNaN(bvh) ? "0" : bvh.toFixed(2)) + " times more efficient";
    }

    private handleInput(delta: number): void
    {
        const mx = Input.isKeyDown("ArrowLeft") ? -1 : Input.isKeyDown("ArrowRight") ? 1 : 0;
        const my = Input.isKeyDown("ArrowDown") ? -1 : Input.isKeyDown("ArrowUp") ? 1 : 0;

        this.camera.translate(new Vector2(mx, my).mul(delta * 10 * this.camera.scale.x));
        let tmpCursorPos = this.renderer.pick(Input.mousePosition);

        this.cursorPos.x = tmpCursorPos.x;
        this.cursorPos.y = tmpCursorPos.y;

        if (Input.isScrolling())
        {
            this.camera.scale.x += Input.mouseScroll.y * 0.1;
            this.camera.scale.y += Input.mouseScroll.y * 0.1;

            if (this.camera.scale.x < 0.1)
            {
                this.camera.scale.x = 0.1;
                this.camera.scale.y = 0.1;
            }
        }

        if (!this.cameraMove && Input.isMousePressed(2))
        {
            this.cameraMove = true;
            this.cursorStart = Input.mousePosition.copy();
            this.cameraPosStart = this.camera.position.copy();
        }
        else if (Input.isMouseReleased(2))
        {
            this.cameraMove = false;
        }

        if (this.cameraMove)
        {
            let dist = Input.mousePosition.sub(this.cursorStart);
            dist.x *= -(Settings.clipWidth / Settings.width) * this.camera.scale.x;
            dist.y *= -(Settings.clipHeight / Settings.height) * this.camera.scale.y;
            this.camera.position = this.cameraPosStart.add(dist);
        }

        if (Input.isKeyPressed("r"))
        {
            this.init();
        }

        if (Input.isMousePressed(0))
        {
            if (!this.creating && !this.removing)
            {
                this.clickStart = this.renderer.pick(Input.mousePosition);

                let queryResult = this.tree.queryPoint(this.clickStart);

                if (queryResult.length == 0)
                {
                    this.creating = true;
                }
                else
                {
                    this.grabbedBox = queryResult[0].item!;
                    this.grabStart = this.grabbedBox.position.copy();
                    this.grabbing = true;
                }
            }
        }

        if (Input.isMousePressed(1))
        {
            if (!this.creating && !this.removing)
            {
                this.clickStart = this.renderer.pick(Input.mousePosition);
                this.removing = true;
            }
        }

        if (Input.isMouseDown(0))
        {
            if (this.creating)
            {
                this.clickEnd = this.renderer.pick(Input.mousePosition);
            }
            else if (this.grabbing)
            {
                this.clickEnd = this.renderer.pick(Input.mousePosition);

                let delta = this.clickEnd.sub(this.clickStart);

                this.grabbedBox.position = this.grabStart.add(delta);
                this.updateCostLabel();
            }
        }

        if (Input.isMouseDown(1))
        {
            if (this.removing)
            {
                this.clickEnd = this.renderer.pick(Input.mousePosition);
            }
        }

        if (Input.isMouseReleased(0))
        {
            if (this.creating)
            {
                if (this.clickEnd.sub(this.clickStart).length > 0.000001)
                {
                    let aabb = new AABB(this.clickStart, this.clickEnd);

                    this.tree.add(toBox(aabb));
                    this.boxCount++;
                    this.updateCostLabel();
                }

                this.creating = false;
            }
        }

        if (Input.isMouseReleased(1))
        {
            if (this.removing)
            {
                let res = this.tree.queryRegion(new AABB(this.clickStart, this.clickEnd));

                this.boxCount -= res.length;
                for (let n of res)
                {
                    this.tree.remove(n);
                }

                this.removing = false;
                this.updateCostLabel();
            }
        }

        if (Input.isMousePressed(2))
        {
            let mp = this.renderer.pick(Input.mousePosition);
            let res = this.tree.queryPoint(mp);

            this.boxCount -= res.length;

            for (let n of res)
            {
                this.tree.remove(n);
            }
            this.updateCostLabel();
        }
    }

    private updateCostLabel(): void
    {
        this.surfaceAreaLabel.innerHTML = "Tree surface area: " + this.tree.cost.toFixed(2);
    }

    render(r: Renderer): void
    {
        r.setCameraTransform(this.camera.cameraTransform);
        r.setModelTransform(new Matrix3());

        this.tree.traverse(node =>
        {
            if (node.isLeaf && Settings.colorizeBox)
            {
                let box = node.item!;
                let aabb = toAABB(box);
                r.drawAABB(aabb, box.color);
            }

            r.drawAABB(node.aabb, "#00000000", "#00000055");
        });

        if (this.creating || this.removing)
        {
            r.drawAABB(new AABB(this.clickStart.copy(), this.clickEnd.copy()));
        }
    }
}