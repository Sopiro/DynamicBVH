export class Heap<T>
{
    public heap: T[];
    private compare;

    constructor(array: T[], comparator: (a: T, b: T) => boolean)
    {
        this.heap = array;
        this.compare = comparator;

        this.heapify();
    }

    public push(value: T)
    {
        this.heap.push(value);

        let index = this.heap.length - 1;
        while (index > 0)
        {
            let parent = Math.trunc((index - 1) / 2);

            if (this.compare(this.heap[parent], this.heap[index]))
            {
                break;
            }

            let tmp = this.heap[parent];
            this.heap[parent] = this.heap[index];
            this.heap[index] = tmp;

            index = parent;
        }
    }

    public pop(): T | undefined
    {
        let value = this.heap[0];

        this.heap[0] = this.heap[this.heap.length - 1];
        this.heap.pop();

        this.downHeap(0);

        return value;
    }

    private downHeap(index: number)
    {
        let size = this.length;

        let largest = index;
        let left = 2 * index + 1;
        let right = 2 * index + 2;

        if (left < size && this.compare(this.heap[left], this.heap[largest]))
        {
            largest = left;
        }

        if (right < size && this.compare(this.heap[right], this.heap[largest]))
        {
            largest = right;
        }

        if (largest != index)
        {
            // swap
            let tmp = this.heap[index];
            this.heap[index] = this.heap[largest];
            this.heap[largest] = tmp;

            // recurse down
            this.downHeap(largest);
        }
    }

    heapify()
    {
        // start from middle
        for (let i = Math.trunc((this.length / 2) - 1); i >= 0; --i)
        {
            this.downHeap(i);
        }
    }

    get length()
    {
        return this.heap.length;
    }
}
