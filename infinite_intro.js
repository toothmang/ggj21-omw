// Updated to use UNPKG CDN instead of serving THREE locally.
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { FirstPersonControls } from 'https://unpkg.com/three/examples/jsm/controls/FirstPersonControls.js';

//noise.seed(Math.random());

let camera, controls, scene, renderer, gamepad;

let grid0, grid1, geometry, material, clock;
//let noise2D = makeNoise2D(0);

//const worldWidth = 128, worldDepth = 128;
const worldWidth = 1024, worldDepth = 1024;
const junkCount = 150;
const gridspan = 20000;
const virtualSpeed = 5000;
const progress_threshold = 1000;
const movementSpeed = 1000;
const lookSpeed = 0.05;
const controllerLookSpeed = 2.0;
const cameraOffset = 500.0;
var world_progress = 0;
var space_junk = [];
var space_junk_worldcoords = [];

var world_object_store = []; // Array of {mesh, x, y, p}
var spherepool;
var playerpool = {};    // Dictionary of playerId: mesh

// For third-person camera
var playerObj;

function fract(x) {
    return x - Math.floor(x);
}

function InterleavedGradientNoise(x, y) {
    return fract(52.9829189 * fract(x * 0.06711056 + y * 0.00583715));
}

function new_object(wobj, progress, x, y) {
    world_object_store.push({ mesh: wobj, x: x, y: y, p: progress });
    scene.add(wobj);
}

function world_object_swap(idx0, idx1) {
    const temp = world_object_store[idx0];
    world_object_store[idx0] = world_object_store[idx1];
    world_object_store[idx1] = temp;
}

function world_object_nuke(index) {
    scene.remove(world_object_store[index].mesh);
    world_object_store[index].mesh.material.dispose();
    if (index != world_object_store.length - 1) {
        world_object_swap(index, world_object_store.length - 1);
    }
    world_object_store.pop()
}

function world_object_resurrect(index) {
    world_object_store[index].mesh.material.color.setHex(Math.random() * 0xffffff);
    world_object_store[index].p = -world_progress - 40000 * Math.random();
    world_object_store[index].x = (Math.random() - .5) * 20000;
    world_object_store[index].y = Math.random() * 5000;
}

var sphere_geom = new THREE.SphereGeometry(70, 32, 16);
function new_sphere_mesh() {
    var sphere_mat = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff, specular: 0x222222, shininess: Math.random() * 100 });
    return new THREE.Mesh(sphere_geom, sphere_mat);
}

var box_geom = new THREE.BoxGeometry(32, 16, 70);
function new_box_mesh() {
    var box_mat = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff, specular: 0x222222, shininess: Math.random() * 100 });
    return new THREE.Mesh(box_geom, box_mat);
}

function makesphere() {
    var progress = -world_progress - 40000 * Math.random(); // Up to 10k units *ahead* of the player.
    var sphere_mesh = new_sphere_mesh();

    new_object(sphere_mesh, progress, (Math.random() - .5) * 20000, Math.random() * 5000);
}

function test() {
    const time = clock.getElapsedTime();
    const count = 5;
    const delay = 0.1

    let start_x = (Math.random() - .5) * 2000;
    let delta_x = 100;
    if (Math.random() < 0.5) delta_x *= -1;
    let start_y = 500;
    let start_z = -40000;
    for (let i = 0; i < count; i++) {
        spherepool.new({ path: kamikaze_from_left(time + delay * i, world_progress) })
        //spherepool.new( {path:stationary(start_x+delta_x*i, start_y, start_z, world_progress)} )
    }
    console.log("New objects created at (" + start_x + ", " + start_y + ", " + start_z + "). " + spherepool.active + " active spheres.");
}
document._test = test;

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.y = 200;

    clock = new THREE.Clock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff);
    scene.fog = new THREE.FogExp2(0xaaccff, 0.00007);

    geometry = new THREE.PlaneGeometry(gridspan, gridspan, worldWidth - 1, worldDepth - 1);
    //geometry = new THREE.PlaneGeometry( 2000, 2000, worldWidth - 1, worldDepth - 1 );
    //// Removing waves in plane - does that help reduce stuttering?
    geometry.rotateX(- Math.PI / 2);
    //
    const position = geometry.attributes.position;
    // position.usage = THREE.DynamicDrawUsage;

    for (let i = 0; i < position.count; i++) {
        let ix = i % worldDepth;
        let iz = Math.floor(i / worldDepth);
        let d2b = Math.min(ix, iz, worldDepth - 1 - ix, worldDepth - 1 - iz);
        let scale = Math.min(d2b / 4, 1);

        const y = 200 * noise.perlin2(position.getX(i) / 1000, position.getZ(i) / 1000) + 50 * noise.perlin2(position.getX(i) / 200, position.getZ(i) / 300)
        //const y = 100 * noise2D(position.getX(i),position.getZ(i))
        //const y = 100 * InterleavedGradientNoise(position.getX(i)/508.30293875, position.getZ(i)/509.98764537);
        position.setY(i, y * scale);
    }

    // const texture = new THREE.TextureLoader().load( 'textures/water.jpg' );
    // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set( 5, 5 );

    // material = new THREE.MeshBasicMaterial( { color: 0x0044ff, map: texture } );
    //material = new THREE.LineBasicMaterial( {color: 0x8822DD, linewidth: 1} )
    //material = new THREE.MeshBasicMaterial( { color: 0x8822DD, wireframe: true } );
    material = new THREE.MeshPhongMaterial({ color: 0x2244AA, specular: 0xBBBBBB, shininess: 90, flatShading: true });
    grid0 = new THREE.Mesh(geometry, material);
    grid1 = new THREE.Mesh(geometry, material);
    scene.add(grid0);
    scene.add(grid1);

    // var widget = new THREE.SphereGeometry( 70, 32, 16 );
    for (let i = 0; i < junkCount; i++) {
        makesphere();
    }

    scene.add(new THREE.AmbientLight(0x888888));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.125);

    // directionalLight.position.x = Math.random() - 0.5;
    // directionalLight.position.y = Math.random() - 0.5;
    // directionalLight.position.z = Math.random() - 0.5;
    directionalLight.position.x = 0;
    directionalLight.position.y = 10;
    directionalLight.position.z = -50;
    //directionalLight.position.normalize();

    scene.add(directionalLight);

    //scene.add( new THREE.HemisphereLight( 0x0000ff, 0xff0000) );

    // pointLight = new THREE.PointLight( 0xffffff, 1 );
    // scene.add( pointLight );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = movementSpeed;
    controls.lookSpeed = 0.05;

    gamepad = new GamepadControls();

    //

    window.addEventListener('resize', onWindowResize);

    spherepool = new object_pool(scene, new_sphere_mesh);


    //goal = new THREE.Object3D;
    //follow = new THREE.Object3D;
    
    playerObj = new THREE.Object3D;
    playerObj.position.set(0, 200, 0);
    playerObj.add(camera);
    camera.position.set(0, 200, cameraOffset);
    //follow.add(camera);
    
    //follow.position.set = (0, 0, -cameraOffset);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    controls.handleResize();

}

//

function animate() {

    requestAnimationFrame(animate);

    gamepad.update();

    render();

}

function render() {

    const delta = clock.getDelta();
    const time = clock.getElapsedTime() * 10;

    world_progress += virtualSpeed * delta;

    if (gamepad.leftStickHeld) {
        let actualMoveSpeed = movementSpeed * delta;

        if (gamepad.leftStick[0] != 0) {
            playerObj.translateX(actualMoveSpeed * gamepad.leftStick[0]);
        }
        if (gamepad.leftStick[1] != 0) {
            // Use this line for forward/backwards control
            playerObj.translateZ(actualMoveSpeed * gamepad.leftStick[1]);

            // Use this for quadcopter-style up/down control
            //playerObj.translateY(-actualMoveSpeed * gamepad.leftStick[1]);
        }
    }

    if (gamepad.rightStickHeld) {
        controls.enabled = false;
        let actualTurnSpeed = controllerLookSpeed * delta;

        if (gamepad.rightStick[0] != 0) {
            let yrot = actualTurnSpeed * gamepad.rightStick[0];
            playerObj.rotateY(yrot);
        }
        if (gamepad.rightStick[1] != 0) {
            let xrot = actualTurnSpeed * gamepad.rightStick[1];
            playerObj.rotateX(xrot);
        }

        //controls.enabled = true;
    }

    camera.lookAt(playerObj.position);

    // const position = geometry.attributes.position;
    //
    // for ( let i = 0; i < position.count; i ++ ) {
    // 	//const y = 35 * Math.sin(i / 5 + ( time + i ) / 7 );
    // 	const x = position.getX(i);
    // 	const z = position.getZ(i);
    // 	const y = 100 * Math.sin(x / 500 + z / 200 + time);
    // 	position.setY( i, y );
    // }
    //
    // position.needsUpdate = true;

    const grid_cell_size = gridspan / worldDepth;
    let world_offset_x = Math.trunc(world_progress / grid_cell_size) * grid_cell_size;
    let world_phase_x = world_progress - world_offset_x;

    let grid_wrapcount = world_progress / gridspan
    let world_wrap_offset = (grid_wrapcount - Math.floor(grid_wrapcount)) * gridspan

    grid0.position.z = world_wrap_offset;
    grid1.position.z = world_wrap_offset - gridspan;

    for (let i = 0; i < world_object_store.length; i++) {
        var progress = world_object_store[i].p + world_progress;

        if (progress > progress_threshold) {
            // makesphere();
            // world_object_swap(i, world_object_store.length-1);
            // world_object_nuke(world_object_store.length-1);
            world_object_resurrect(i);

            // New progress for new object....
            progress = world_object_store[i].p + world_progress;
        }

        world_object_store[i].mesh.position.x = world_object_store[i].x;
        world_object_store[i].mesh.position.y = world_object_store[i].y;
        world_object_store[i].mesh.position.z = progress;
    }

    // for ( let i = 0; i < junkCount; i ++) {
    // 	space_junk[i].position.z = space_junk_worldcoords[i]["z"] + world_progress;
    // 	// space_junk[i].needsUpdate = true;  // Not needed?
    // }

    spherepool.update(clock.getElapsedTime(), world_progress);

    controls.update(delta);

    for (let playerId in window.playerObjects) {
        if (!(playerId in playerpool)) {
            playerpool[playerId] = new_box_mesh();
            scene.add(playerpool[playerId]);
        }

        if (channel && parseInt(playerId) !== myPlayerId) {
            playerpool[playerId].position.x = window.playerObjects[playerId].coords.x;
            playerpool[playerId].position.y = window.playerObjects[playerId].coords.y;
            playerpool[playerId].position.z = window.playerObjects[playerId].coords.z;

            let q = new THREE.Quaternion(window.playerObjects[playerId].coords.qx,
                window.playerObjects[playerId].coords.qy,
                window.playerObjects[playerId].coords.qz,
                window.playerObjects[playerId].coords.qw);
            playerpool[playerId].setRotationFromQuaternion(q);
        }
        //playerpool[playerId].rotation.y = window.playerObjects[playerId].roty;
        //playerpool[playerId].rotation.z = window.playerObjects[playerId].rotz;
    }

    playerpool[myPlayerId].position.copy(playerObj.position);
    playerpool[myPlayerId].setRotationFromQuaternion(playerObj.quaternion);

    if (channel) {
        channel.emit("playerMove", {
            x: playerObj.position.x,
            y: playerObj.position.y,
            z: playerObj.position.z,
            qx: playerObj.quaternion.x,
            qy: playerObj.quaternion.y,
            qz: playerObj.quaternion.z,
            qw: playerObj.quaternion.w,
        });
    }

    renderer.render(scene, camera);
}