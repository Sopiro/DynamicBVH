# Dynamic Bounding Volume Hierarchies
Dynamic BVH(Dynamic AABB tree) implementation in TypeScript.  

Dynamic BVH is one of the spatial partitioning algorithms. You can accelerate a operation like volumetric querying and ray casting with this data structure. The code is written for 2D, but can be easily extended to 3D or higher dimensions.  

*I used this algorithm for my physics engine to accelerate the broad phase collision detection process!*

---

Live demo: https://sopiro.github.io/DynamicBVH/  
Video: https://youtu.be/lBe_qYDuG8I  
Fairly optimized c++ version: https://github.com/Sopiro/Muli/blob/master/include/muli/aabbtree.h  

## Preview
![img](.github/preview.gif)

## Reference
- https://box2d.org/publications/
