
// Example -- what should be *returned* by the other parametric funcs...
function parametric(t, progress) {
    let pt = f(t);
    return { x: pt.x, y: pt.y, z: pt.z - progress }; // Do not subtract -progress
}

function stationary(args) { // (x,y,z,progress)
    return function(t, p) {
        //return {x:x, y:y, z:z + p - progress}
        return {x:args.x, y:args.y, z:args.z + p - args.progress}
    }
}

function kamikaze_from_side(args) { // (t0, progress, left=true)
    x_offset = 10000;
    if ("offset" in args) x_offset += args.offset;
    let left = true;
    if ("left" in args) left = args.left;

    return function(t, p) {
        return {x:((t-args.t0) * 1000 - x_offset) * (left ? 1 : -1),
                y: 200 + 1000 / (0.01+t-args.t0),
                z: -10000 + Math.pow(t-args.t0, 4)
            }
    }
}

function stationary_hover(args) { // x,y,z, amplitude,frequency, t0, progress)
    return function(t, p) {
        return {x:args.x, z:args.z + p - args.progress,
                y:args.y + args.amplitude * Math.sin((t-args.t0)*args.frequency*2*Math.PI) }
    }
}

function linear_noprog(x,y,z,dx,dy,dz) {
    return function(t, progress) {
        return {x:x + t*dx,
                y:y + t*dy,
                z:z + t*dz
            }
    }
}

const parametric_mode = {
    "stationary":stationary,
    "kamikaze_from_side":kamikaze_from_side,
    "stationary_hover":stationary_hover
}
