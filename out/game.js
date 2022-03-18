import { Matrix3, Vector2 } from "./math.js";
import * as Input from "./input.js";
import * as Util from "./util.js";
import { Camera } from "./camera.js";
import { Settings } from "./settings.js";
import { AABB } from "./aabb.js";
import { PRNG } from "./prng.js";
import { AABBTree, debugCount } from "./aabbtree.js";
import { Box, toBox } from "./box.js";
import { Timer } from "./timer.js";
import { detectCollision } from "./detection.js";
export class Game {
    constructor(renderer) {
        this.cameraMove = false;
        this.cursorPos = new Vector2(0, 0);
        this.deltaTime = 0.0;
        this.time = 0.0;
        this.frame = 0;
        this.initRoutines = [];
        this.creating = false;
        this.grabbing = false;
        this.removing = false;
        this.clickStart = new Vector2(0, 0);
        this.clickEnd = new Vector2(0, 0);
        this.entityCount = 0;
        this.timer = new Timer();
        this.renderer = renderer;
        this.camera = new Camera();
        this.camera.position = new Vector2(0, 0);
        let projectionTransform = Util.orth(-Settings.clipWidth / 2.0, Settings.clipWidth / 2.0, -Settings.clipHeight / 2.0, Settings.clipHeight / 2.0);
        let viewportTransform = Util.viewport(Settings.width, Settings.height);
        this.renderer.init(viewportTransform, projectionTransform, this.camera.cameraTransform);
        this.tree = new AABBTree();
        const restartBtn = document.querySelector("#restart");
        restartBtn.addEventListener("click", () => {
            this.init();
        });
        this.collsionPairsLabel = document.querySelector("#collsionPairsLabel");
        this.surfaceAreaLabel = document.querySelector("#surfaceAreaLabel");
        this.efficiencyCheckLabel = document.querySelector("#efficiencyCheckLabel");
        this.seedTextBox = document.querySelector("#seedTextBox");
        this.init();
    }
    init() {
        this.timer.reset();
        this.tree.reset();
        for (let r of this.initRoutines)
            clearInterval(r);
        // Random initial spread
        let seedString = this.seedTextBox.value;
        let seed = seedString.length == 0 ? Util.random(0, 10000) : Util.stringHash(seedString);
        let rand = new PRNG(seed);
        let minW = 0.2;
        let minH = 0.2;
        let maxW = 0.9;
        let maxH = 0.9;
        this.entityCount = 0;
        this.timer.mark();
        let routine = setInterval(() => {
            let bottomLeft = this.renderer.pick(new Vector2(0, 0));
            let topRight = this.renderer.pick(new Vector2(Settings.width, Settings.height));
            this.entityCount++;
            let rx = rand.nextRange(bottomLeft.x, topRight.x - maxW);
            let ry = rand.nextRange(bottomLeft.y, topRight.y - maxH);
            let rw = rand.nextRange(minW, maxW);
            let rh = rand.nextRange(minH, maxH);
            this.tree.add(new Box(new Vector2(rx, ry), rw, rh));
            if (this.entityCount >= Settings.boxCount) {
                clearInterval(routine);
                this.timer.mark();
                console.log((this.timer.lastElapsed / 1000.0).toFixed(2) + "s");
            }
        }, Settings.genSpeed);
        this.initRoutines.push(routine);
    }
    update(delta) {
        this.deltaTime = delta;
        this.frame++;
        this.time += delta;
        this.handleInput(delta);
        this.tree.update();
        // Broad phase
        let collisionPairs = this.tree.getCollisionPairs();
        let realCollisionPairs = [];
        for (let pair of collisionPairs) {
            let e1 = pair.p1.entity;
            let e2 = pair.p2.entity;
            // Narrow phase
            if (detectCollision(e1, e2)) {
                realCollisionPairs.push({ p1: pair.p1.entity, p2: pair.p2.entity });
            }
        }
        this.collsionPairsLabel.innerHTML = "Collision pairs: " + realCollisionPairs.length;
        if (this.timer.times.length < 2) {
            this.updateCostLabel();
        }
        let nSquared = (this.entityCount * this.entityCount - this.entityCount) / 2.0;
        let bvh = nSquared / debugCount;
        this.efficiencyCheckLabel.innerHTML = "Box count: " + this.entityCount + "<br>"
            + "BruteForce: " + nSquared + "<br>"
            + "Dynamic BVH: " + debugCount + "<br>"
            + "Dynamic BVH is " + (isNaN(bvh) ? "0" : bvh.toFixed(2)) + " times more efficient";
    }
    handleInput(delta) {
        const mx = Input.isKeyDown("ArrowLeft") ? -1 : Input.isKeyDown("ArrowRight") ? 1 : 0;
        const my = Input.isKeyDown("ArrowDown") ? -1 : Input.isKeyDown("ArrowUp") ? 1 : 0;
        this.camera.translate(new Vector2(mx, my).mul(delta * 10 * this.camera.scale.x));
        let tmpCursorPos = this.renderer.pick(Input.mousePosition);
        this.cursorPos.x = tmpCursorPos.x;
        this.cursorPos.y = tmpCursorPos.y;
        if (Input.isScrolling()) {
            this.camera.scale.x += Input.mouseScroll.y * 0.1;
            this.camera.scale.y += Input.mouseScroll.y * 0.1;
            if (this.camera.scale.x < 0.1) {
                this.camera.scale.x = 0.1;
                this.camera.scale.y = 0.1;
            }
        }
        if (!this.cameraMove && Input.isMousePressed(2)) {
            this.cameraMove = true;
            this.cursorStart = Input.mousePosition.copy();
            this.cameraPosStart = this.camera.position.copy();
        }
        else if (Input.isMouseReleased(2)) {
            this.cameraMove = false;
        }
        if (this.cameraMove) {
            let dist = Input.mousePosition.sub(this.cursorStart);
            dist.x *= -(Settings.clipWidth / Settings.width) * this.camera.scale.x;
            dist.y *= -(Settings.clipHeight / Settings.height) * this.camera.scale.y;
            this.camera.position = this.cameraPosStart.add(dist);
        }
        if (Input.isKeyPressed("r")) {
            this.init();
        }
        if (Input.isMousePressed(0)) {
            if (!this.creating && !this.removing) {
                this.clickStart = this.renderer.pick(Input.mousePosition);
                let queryResult = this.tree.queryPoint(this.clickStart);
                if (queryResult.length == 0) {
                    this.creating = true;
                }
                else {
                    this.grabbedEntity = queryResult[0].entity;
                    this.grabStart = this.grabbedEntity.position.copy();
                    this.grabbing = true;
                }
            }
        }
        if (Input.isMousePressed(1)) {
            if (!this.creating && !this.removing) {
                this.clickStart = this.renderer.pick(Input.mousePosition);
                this.removing = true;
            }
        }
        if (Input.isMouseDown(0)) {
            if (this.creating) {
                this.clickEnd = this.renderer.pick(Input.mousePosition);
            }
            else if (this.grabbing) {
                this.clickEnd = this.renderer.pick(Input.mousePosition);
                let delta = this.clickEnd.sub(this.clickStart);
                this.grabbedEntity.position = this.grabStart.add(delta);
                this.updateCostLabel();
            }
        }
        if (Input.isMouseDown(1)) {
            if (this.removing) {
                this.clickEnd = this.renderer.pick(Input.mousePosition);
            }
        }
        if (Input.isMouseReleased(0)) {
            if (this.creating) {
                if (this.clickEnd.sub(this.clickStart).length > 0.000001) {
                    let aabb = new AABB(this.clickStart, this.clickEnd);
                    this.tree.add(toBox(aabb));
                    this.entityCount++;
                    this.updateCostLabel();
                }
                this.creating = false;
            }
        }
        if (Input.isMouseReleased(1)) {
            if (this.removing) {
                let res = this.tree.queryRegion(new AABB(this.clickStart, this.clickEnd));
                this.entityCount -= res.length;
                for (let n of res) {
                    this.tree.remove(n);
                }
                this.removing = false;
                this.updateCostLabel();
            }
        }
        if (Input.isMousePressed(2)) {
            let mp = this.renderer.pick(Input.mousePosition);
            let res = this.tree.queryPoint(mp);
            this.entityCount -= res.length;
            for (let n of res) {
                this.tree.remove(n);
            }
            this.updateCostLabel();
        }
    }
    updateCostLabel() {
        this.surfaceAreaLabel.innerHTML = "Tree surface area: " + this.tree.cost.toFixed(2);
    }
    render(r) {
        r.setCameraTransform(this.camera.cameraTransform);
        r.setModelTransform(new Matrix3());
        this.tree.traverse(node => {
            if (node.isLeaf && Settings.colorize) {
                let entity = node.entity;
                r.drawEntity(entity);
            }
            r.drawAABB(node.aabb, "#00000000", "#00000055");
        });
        if (this.creating || this.removing) {
            r.drawAABB(new AABB(this.clickStart.copy(), this.clickEnd.copy()));
        }
    }
}
