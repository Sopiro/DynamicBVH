import { Matrix3, Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Renderer } from "./renderer.js";
import { Camera } from "./camera.js";
import { Settings } from "./settings.js";
import { AABB, newAABB, uniqueColor } from "./aabb.js";
import { PRNG } from "./prng.js";
import { AABBTree } from "./aabbtree.js";

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
    private removing: boolean = false;
    private clickStart: Vector2 = new Vector2(0, 0);
    private clickEnd: Vector2 = new Vector2(0, 0);

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

        this.init();
    }

    init(): void
    {
        this.tree.root = undefined;

        for (let r of this.initRoutines)
            clearInterval(r);

        // Random initial spread
        let rand = new PRNG(Math.random());

        let mw = 0.9;
        let mh = 0.9;
        let count = 0;
        let routine = setInterval(() =>
        {
            count++;
            let rx = rand.nextRange(-Settings.clipWidth / 2.0, Settings.clipWidth / 2.0 - mw);
            let ry = rand.nextRange(-Settings.clipHeight / 2.0, Settings.clipHeight / 2.0 - mh);
            let rw = rand.nextRange(0.2, mw);
            let rh = rand.nextRange(0.2, mh);

            this.tree.add(newAABB(rx, ry, rw, rh));

            if (count >= 15) clearInterval(routine);
        }, 50);

        this.initRoutines.push(routine);
    }

    update(delta: number): void
    {
        this.deltaTime = delta;
        this.frame++;
        this.time += delta;
        this.handleInput(delta);
    }

    private handleInput(delta: number)
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
                this.creating = true;
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
                    this.tree.add(new AABB(this.clickStart, this.clickEnd));
                }

                this.creating = false;
            }
        }

        if (Input.isMouseReleased(1))
        {
            if (this.removing)
            {
                let res = this.tree.queryRegion(new AABB(this.clickStart, this.clickEnd));

                for (let n of res)
                {
                    this.tree.remove(n);
                }

                this.removing = false;
            }
        }

        if (Input.isMousePressed(2))
        {
            let mp = this.renderer.pick(Input.mousePosition);
            let res = this.tree.queryPoint(mp);

            for (let n of res)
            {
                this.tree.remove(n);
            }
        }
    }

    render(r: Renderer): void
    {
        r.setCameraTransform(this.camera.cameraTransform);
        r.setModelTransform(new Matrix3());

        if (this.creating || this.removing)
        {
            r.drawAABB(new AABB(this.clickStart.copy(), this.clickEnd.copy()), undefined);
        }

        let q = [this.tree.root];

        while (q.length != 0)
        {
            let current = q.shift()!;

            if (current == undefined) break;

            r.drawAABB(current!.aabb, current.isLeaf ? uniqueColor(current!.aabb) : undefined);
            if (!current.isLeaf)
            {
                q.push(current.child1!);
                q.push(current.child2!);
            }
        }

        let cp = this.tree.getCollisionPairs();

        r.log("Collision pairs: " + cp.length);
    }
}