import { AABB } from "./aabb.js";
import { Matrix3, Vector2 } from "./math.js";
import { Settings } from "./settings.js";
import * as Util from "./util.js";

export class Renderer
{
    private gfx: CanvasRenderingContext2D;

    private cameraTransform!: Matrix3;
    private modelTransform!: Matrix3;
    private projectionTransform!: Matrix3;
    private viewportTransform!: Matrix3;
    private vpc!: Matrix3;

    // Call init function before you start using renderer
    constructor(gfx: CanvasRenderingContext2D)
    {
        this.gfx = gfx;
    }

    init(viewportTransform: Matrix3, projectionTransform: Matrix3, cameraTransform: Matrix3): void
    {
        this.viewportTransform = viewportTransform;
        this.projectionTransform = projectionTransform;
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    // Mouse picking
    pick(screenPosition: Vector2): Vector2
    {
        let inv_vp = this.vpc.inverted();

        return inv_vp.mulVector2(screenPosition, 1.0);
    }

    log(content: any, line: number = 0): void
    {
        let y = 75 + line * 20;
        this.drawText(15, y, content, 20);
    }

    setCameraTransform(cameraTransform: Matrix3)
    {
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setProjectionTransform(projectionTransform: Matrix3): void
    {
        this.projectionTransform = projectionTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setViewportTransform(viewportTransform: Matrix3): void
    {
        this.viewportTransform = viewportTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }

    setModelTransform(modelTransform: Matrix3): void
    {
        this.modelTransform = modelTransform;
    }

    resetModelTransform(): void
    {
        this.modelTransform.loadIdentity();
    }

    drawCircle(x: number, y: number, radius: number = 0.05, filled: boolean = false): void
    {
        this.drawCircleV(new Vector2(x, y), radius, filled);
    }

    drawCircleV(v: Vector2, radius: number = 0.05, filled: boolean = false): void
    {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);

        let tv = vpcm.mulVector2(v, 1);
        let tr = this.vpc.mulVector2(new Vector2(radius, 0), 0).x;

        this.gfx.lineWidth = 1;
        this.gfx.beginPath();
        this.gfx.arc(tv.x, Settings.height - tv.y, tr, 0, 2 * Math.PI);

        if (filled)
            this.gfx.fill();
        else
            this.gfx.stroke();
    }

    drawLine(x0: number, y0: number, x1: number, y1: number, lineWidth = 1): void
    {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }

    drawLineV(v0: Vector2, v1: Vector2, lineWidth: number = 1): void
    {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);

        let tv0 = vpcm.mulVector2(v0, 1);
        let tv1 = vpcm.mulVector2(v1, 1);

        this.gfx.lineWidth = lineWidth;
        this.gfx.beginPath();
        this.gfx.moveTo(tv0.x, Settings.height - tv0.y);
        this.gfx.lineTo(tv1.x, Settings.height - tv1.y);
        this.gfx.stroke();
    }

    // (0, 0) is top left
    drawText(x: number, y: number, content: any, fontSize = 20): void
    {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }

    // Draw vector from point p toward direction v
    drawVector(p: Vector2, v: Vector2, arrowSize: number = 0.03): void
    {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mul(3 * arrowSize);
        const nv = v.normalized();
        arrowSize *= 4;

        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }

    // Draw p1 to p2 vector
    drawVectorP(p1: Vector2, p2: Vector2, arrowSize: number = 0.03): void
    {
        this.drawVector(p1, p2.sub(p1), arrowSize);
    }

    drawAABB(aabb: AABB, fillStyle: string = "#00000000", strokeStyle: string = "#000000"): void
    {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);

        let tv0 = vpcm.mulVector2(aabb.min, 1);
        let tv1 = vpcm.mulVector2(aabb.max, 1);

        this.gfx.lineWidth = 1;
        this.gfx.strokeStyle = strokeStyle;
        this.gfx.fillStyle = fillStyle;

        this.gfx.beginPath();
        this.gfx.moveTo(tv0.x, Settings.height - tv0.y);
        this.gfx.lineTo(tv1.x, Settings.height - tv0.y);
        this.gfx.lineTo(tv1.x, Settings.height - tv1.y);
        this.gfx.lineTo(tv0.x, Settings.height - tv1.y);
        this.gfx.lineTo(tv0.x, Settings.height - tv0.y);
        if (fillStyle != undefined)
            this.gfx.fill();

        this.gfx.stroke();
        this.gfx.fillStyle = "#000000";
    }
}
