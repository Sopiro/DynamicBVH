import * as Util from "./util.js";

export class PRNG 
{
    private m: number;
    private a: number;
    private c: number;

    private state!: number;

    constructor(seed: number)
    {
        this.m = 0x80000000; // 2^31;
        this.a = 1103515245;
        this.c = 12345;

        this.setSeed(seed);
    }

    setSeed(seed: number)
    {
        this.state = (seed != undefined) ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt(): number
    {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    // 0.0 ~ 1.0
    nextFloat(): number
    {
        return this.nextInt() / (this.m - 1);
    }

    nextRange(left: number, right: number): number
    {
        let range = right - left;

        return left + this.nextFloat() * range;
    }

    nextColor(): string
    {
        return Util.hslString(this.nextRange(0, 255), 100, 75)
    }
}