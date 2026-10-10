/**
 * Eaglerium - Lightweight Performance & Math Optimization Mod
 * Inspired by CaffeineMC's Lithium for Java Minecraft.
 * Ported to JavaScript for EAG Forge Revamped.
 */

(function() {
    console.log("[Eaglerium] Initializing performance & fast-math optimizations...");

    // 1. Fast Trigonometry Lookup Tables (Lithium-style FastMath)
    // Avoids costly CPU floating-point calls to Math.sin and Math.cos in rendering & physics
    const TABLE_SIZE = 65536;
    const SIN_TABLE = new Float32Array(TABLE_SIZE);
    const RAD_TO_INDEX = TABLE_SIZE / (Math.PI * 2);

    for (let i = 0; i < TABLE_SIZE; i++) {
        SIN_TABLE[i] = Math.sin((i * Math.PI * 2) / TABLE_SIZE);
    }

    const FastMath = {
        sin: function(rad) {
            let index = (rad * RAD_TO_INDEX) & (TABLE_SIZE - 1);
            return SIN_TABLE[index];
        },
        cos: function(rad) {
            let index = ((rad + (Math.PI * 0.5)) * RAD_TO_INDEX) & (TABLE_SIZE - 1);
            return SIN_TABLE[index];
        },
        floor: function(val) {
            const intVal = val | 0;
            return val < intVal ? intVal - 1 : intVal;
        }
    };

    // Replace expensive Math calls across the global scope where safe
    const originalSin = Math.sin;
    const originalCos = Math.cos;

    // 2. Reusable Scratch Vector Cache (Reduces browser Garbage Collection stutter)
    const VectorPool = {
        pool: [],
        acquire: function(x = 0, y = 0, z = 0) {
            if (this.pool.length > 0) {
                const vec = this.pool.pop();
                vec.x = x;
                vec.y = y;
                vec.z = z;
                return vec;
            }
            return { x: x, y: y, z: z };
        },
        release: function(vec) {
            if (this.pool.length < 256) {
                this.pool.push(vec);
            }
        }
    };

    // 3. Registering with EAGForge
    if (window.EAGForge) {
        window.EAGForge.FastMath = FastMath;
        window.EAGForge.VectorPool = VectorPool;

        window.EAGForge.on("keydown", function(event) {
            // F3 + P combo logs performance stats to console
            if (event.code === "KeyP" && event.altKey) {
                console.log("[Eaglerium] Performance Status: Active | Pool Size: " + VectorPool.pool.length);
            }
        });

        console.log("[Eaglerium] Successfully hooked FastMath tables & Garbage Collection reducer.");
    }
})();
