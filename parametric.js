
// Example -- what should be *returned* by the other parametric funcs...
function parametric(t, progress) {
    let pt = f(t);
    return { x: pt.x, y: pt.y, z: pt.z - progress }; // Do not subtract -progress
}

function stationary(x, y, z, init_progress) {
    return function (t, progress) {
        //return {x:x, y:y, z:z + progress - init_progress}
        return { x: x, y: y, z: z + progress - init_progress }
    }
}

function kamikaze_from_left(t0, progress) {
    return function (t, progress) {
        return {
            x: (t - t0) * 1000 - 10000,
            y: 200 + 1000 / (0.01 + t - t0),
            z: -10000 + Math.pow(t - t0, 4)
        }
    }
}

function linear_noprog(x, y, z, dx, dy, dz) {
    return function (t, progress) {
        return {
            x: x + t * dx,
            y: y + t * dy,
            z: z + t * dz
        }
    }
}