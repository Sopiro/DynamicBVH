import { Matrix3, Vector2 } from "./math.js";

export interface Pair<A, B>
{
    p1: A;
    p2: B;
}

export interface UV
{
    u: number;
    v: number;
}

export function toFixed(value: number, limit = 1e-13): number
{
    return Math.round(value / limit) * limit;
}

// Linearly combine(interpolate) the vector using weights u, v
export function lerpVector(a: Vector2, b: Vector2, uv: UV): Vector2
{
    // return a.mul(uv.u).add(b.mul(uv.v));
    return new Vector2(a.x * uv.u + b.x * uv.v, a.y * uv.u + b.y * uv.v);
}

export function random(left: number = -1, right: number = 1): number
{
    if (left > right)
    {
        let tmp = right;
        right = left;
        left = tmp;
    }

    let range = right - left;
    return Math.random() * range + left
}

export function clamp(value: number, min: number, max: number): number
{
    // return Math.max(min, Math.min(value, max));

    if (value < min) return min;
    else if (value > max) return max;
    else return value;
}

export function cross(scalar: number, vector: Vector2): Vector2
{
    return new Vector2(-scalar * vector.y, scalar * vector.x);
}

// Cantor pairing function, ((N, N) -> N) mapping function
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
export function make_pair_natural(a: number, b: number): number
{
    return (a + b) * (a + b + 1) / 2 + b;
}

// Reverse version of pairing function
// this guarantees initial pairing order
export function separate_pair(p: number): Pair<number, number>
{
    let w = Math.floor((Math.sqrt(8 * p + 1) - 1) / 2.0);
    let t = (w * w + w) / 2.0;

    let y = p - t;
    let x = w - y;

    return { p1: x, p2: y };
}

export function squared_distance(a: Vector2, b: Vector2): number
{
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

export function map(v: number, left: number, right: number, min: number, max: number): number
{
    const per = (v - left) / (right - left);
    return lerp(min, max, per);
}

export function lerp(left: number, right: number, per: number): number
{
    return left + (right - left) * per;
}

export function mid(a: Vector2, b: Vector2): Vector2
{
    return new Vector2((a.x + b.x) / 2.0, (a.y + b.y) / 2.0);
}

// Create a 2D orthographic projection matrix
export function orth(left: number, right: number, bottom: number, top: number): Matrix3
{
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
export function viewport(width: number, height: number, xStart = 0, yStart = 0): Matrix3
{
    let res = new Matrix3();

    // Scale
    res.m00 = width / 2.0;
    res.m11 = height / 2.0;

    // Translation
    res.m02 = xStart + width / 2.0;
    res.m12 = yStart + height / 2.0;

    return res;
}

export function assert(...test: boolean[]): void
{
    for (let i = 0; i < test.length; i++)
        if (!test[i]) throw new Error("Assertion failed");

}

export function hslString(h: number, s: number, l: number): string
{
    return `hsl(${h}, ${s}%, ${l}%)`;
}