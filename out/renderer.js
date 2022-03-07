import { Vector2 } from "./math.js";
import { Settings } from "./settings.js";
export class Renderer {
    // Call init function before you start using renderer
    constructor(gfx) {
        this.gfx = gfx;
    }
    init(viewportTransform, projectionTransform, cameraTransform) {
        this.viewportTransform = viewportTransform;
        this.projectionTransform = projectionTransform;
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }
    // Mouse picking
    pick(screenPosition) {
        let inv_vp = this.vpc.inverted();
        return inv_vp.mulVector2(screenPosition, 1.0);
    }
    log(content, line = 0) {
        let y = 75 + line * 20;
        this.drawText(15, y, content, 20);
    }
    setCameraTransform(cameraTransform) {
        this.cameraTransform = cameraTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }
    setProjectionTransform(projectionTransform) {
        this.projectionTransform = projectionTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }
    setViewportTransform(viewportTransform) {
        this.viewportTransform = viewportTransform;
        this.vpc = this.viewportTransform.mulMatrix(this.projectionTransform).mulMatrix(this.cameraTransform);
    }
    setModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }
    resetModelTransform() {
        this.modelTransform.loadIdentity();
    }
    drawCircle(x, y, radius = 0.05, filled = false) {
        this.drawCircleV(new Vector2(x, y), radius, filled);
    }
    drawCircleV(v, radius = 0.05, filled = false) {
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
    drawLine(x0, y0, x1, y1, lineWidth = 1) {
        this.drawLineV(new Vector2(x0, y0), new Vector2(x1, y1), lineWidth);
    }
    drawLineV(v0, v1, lineWidth = 1) {
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
    drawText(x, y, content, fontSize = 20) {
        this.gfx.font = fontSize + "px verdana";
        this.gfx.fillText(content, x, y);
    }
    // Draw vector from point p toward direction v
    drawVector(p, v, arrowSize = 0.03) {
        this.drawLine(p.x, p.y, p.x + v.x, p.y + v.y);
        let n = new Vector2(-v.y, v.x).normalized().mul(3 * arrowSize);
        const nv = v.normalized();
        arrowSize *= 4;
        this.drawLine(p.x + v.x + n.x - nv.x * arrowSize, p.y + v.y + n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
        this.drawLine(p.x + v.x - n.x - nv.x * arrowSize, p.y + v.y - n.y - nv.y * arrowSize, p.x + v.x, p.y + v.y);
    }
    // Draw p1 to p2 vector
    drawVectorP(p1, p2, arrowSize = 0.03) {
        this.drawVector(p1, p2.sub(p1), arrowSize);
    }
    drawAABB(aabb, fillStyle) {
        let vpcm = this.vpc.mulMatrix(this.modelTransform);
        let tv0 = vpcm.mulVector2(aabb.min, 1);
        let tv1 = vpcm.mulVector2(aabb.max, 1);
        this.gfx.lineWidth = 1;
        this.gfx.strokeStyle = "#000000";
        if (fillStyle != undefined)
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
    }
}
