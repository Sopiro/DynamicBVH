import { Matrix3, Vector2 } from "./math.js";
export function toFixed(value, limit = 1e-13) {
    return Math.round(value / limit) * limit;
}
// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a, b, uv) {
    // return a.mul(uv.u).add(b.mul(uv.v));
    return new Vector2(a.x * uv.u + b.x * uv.v, a.y * uv.u + b.y * uv.v);
}
export function random(left = -1, right = 1) {
    if (left > right) {
        let tmp = right;
        right = left;
        left = tmp;
    }
    let range = right - left;
    return Math.random() * range + left;
}
export function clamp(value, min, max) {
    // return Math.max(min, Math.min(value, max));
    if (value < min)
        return min;
    else if (value > max)
        return max;
    else
        return value;
}
export function cross(scalar, vector) {
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}
// Cantor pairing function, ((N, N) -> N) mapping function
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
export function make_pair_natural(a, b) {
    return (a + b) * (a + b + 1) / 2 + b;
}
// Reverse version of pairing function
// this guarantees initial pairing order
export function separate_pair(p) {
    let w = Math.floor((Math.sqrt(8 * p + 1) - 1) / 2.0);
    let t = (w * w + w) / 2.0;
    let y = p - t;
    let x = w - y;
    return { p1: x, p2: y };
}
export function squared_distance(a, b) {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}
export function map(v, left, right, min, max) {
    const per = (v - left) / (right - left);
    return lerp(min, max, per);
}
export function lerp(left, right, per) {
    return left + (right - left) * per;
}
export function mid(a, b) {
    return new Vector2((a.x + b.x) / 2.0, (a.y + b.y) / 2.0);
}
// Create a 2D orthographic projection matrix
export function orth(left, right, bottom, top) {
    let res = new Matrix3();
    // Scale
    res.m00 = 2.0 / (right - left);
    res.m11 = 2.0 / (top - bottom);
    // Translation
    res.m02 = -(right + left) / (right - left);
    res.m12 = -(top + bottom) / (top - bottom);
    return res;
}
// Create a viewport transform matrix
export function viewport(width, height, xStart = 0, yStart = 0) {
    let res = new Matrix3();
    // Scale
    res.m00 = width / 2.0;
    res.m11 = height / 2.0;
    // Translation
    res.m02 = xStart + width / 2.0;
    res.m12 = yStart + height / 2.0;
    return res;
}
export function assert(...test) {
    for (let i = 0; i < test.length; i++)
        if (!test[i])
            throw new Error("Assertion failed");
}
export function hslString(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
}
export function stringHash(s) {
    let hash = 0, i, chr;
    if (s.length === 0)
        return hash;
    for (i = 0; i < s.length; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
;
