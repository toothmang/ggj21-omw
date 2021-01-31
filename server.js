const { Ammo: ammo, Physics, ServerClock } = require('@enable3d/ammo-on-nodejs')
const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const geckos = require('@geckos.io/server').default
const random = require('random-js')

//const GameScene = require('./game/gameScene')

app.use(cors())
app.use(compression())

app.use('/', express.static(path.join(__dirname, './dist')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './dist/index.html'))
})

port = 9208

const { iceServers } = require('@geckos.io/server')

options = {
    iceServers: iceServers,
    portRange: { min: 50000, max: 51000 }
}

console.log("Running options")
console.log(options)
io = geckos(options)
io.addServer(server)

//const game = new GameScene(server)
//game.init()

server.listen(port, () => {
    console.log('Express is listening on http://localhost:' + port)
})


//// Enemy Wave Generation

class RNG {
    constructor(seed) {
        this.mt = random.MersenneTwister19937.seed(seed);
    }
    float() {
        return ((this.mt.next() / 4294967296) * 0.5) + 0.5;
    }
    int(m,M) {
        return Math.min(M-1, Math.floor(this.float() * (M-m) + m));
    }
    bool() {
        return this.mt.next() < 2147483648;
    }
    choice(list) {
        let index = this.int(0,list.length);
        return list[index];
    }
    subset(list, count) {
        let sublist = [];
        let choices = [];
        for (let i = 0; i < count; i++) choices.push(i);

        for (let i = 0; i < count; i++) {
            index = this.int(0,choices.length);
            choice = choices[index];
            delete choices[index];
            sublist.push(list[choice]);
        }

        return sublist;
    }
}

const max_x = 10000;
const max_y = 5000;
const spawn_z = -20000;

function merge(d0, d1) {
    let d = {};
    for (let k in d0)  d[k] = d0[k];
    for (let k in d1)  d[k] = d1[k];
    return d;
}

// Movement Modes

function stationary(args) { // (x,y,z,progress)
    return function(t, p) {
        //return {x:x, y:y, z:z + p - progress}
        return {x:args.x, y:args.y, z:args.z + p - args.progress}
    }
}

function kamikaze_from_side(args) { // (t0, progress, left=true)
    x_offset = 10000;
    if ("offset" in args) x_offset += offset;
    let left = true;
    if ("left" in args) left = args["left"];

    return function(t, p) {
        return {x:((t-t0) * 1000 - x_offset) * (left ? 1 : -1),
                y: 200 + 1000 / (0.01+t-t0),
                z: -10000 + Math.pow(t-t0, 4)
            }
    }
}

function stationary_hover(args) { // x,y,z, amplitude,frequency, t0, progress)
    return function(t, p) {
        return {x:x, z:z + p - progress,
                y:y + amplitude * Math.sin((t-t0)*frequency*2*Math.PI) }
    }
}

// Layout Modes

function facing_star(rng, enemy, count, progress) {
    // ADDS x,y,z,progress
    let radius = enemy.radius;
    let spawn_x = 2 * (rng.float() - .5) * max_x;
    let spawn_y = rng.float() *  max_y;

    let perp = { x: -spawn_z, z: spawn_x };
    let scale = Math.sqrt( perp.x*perp.x + perp.z*perp.z );
    perp.x = perp.x / scale;
    perp.z = perp.z / scale;

    let enemy_packs = []

    for (let i = 0; i < count; i++) {
        let angle = Math.PI / 2 + Math.PI * 2 * i / count;
        let s = Math.sin(angle);
        let c = Math.cos(angle);
        let dx = radius * c * perp.x;
        let dy = radius * s;
        let dz = radius * c * perp.z;

        let pack = merge(enemy, {x: spawn_x + dx,
                                 y: spawn_y + dy,
                                 z: spawn_z + dz,
                                 progress: progress});
        delete pack["radius"];
        enemy_packs.push(pack);
    }

    return enemy_packs;
}

function random_line(rng, enemy, count, progress) {
    let angle = rng.float() * Math.PI * 2;
    let spawn_x = 2 * (rng.float() - .5) * max_x;
    let spawn_y = rng.float() *  max_y;

    let s = Math.sin(angle);
    let c = Math.cos(angle);

    let enemy_packs = []

    for (let i = 0; i < count; i++)
    {
        let dx = s * i * enemy.spread;
        let dz = c * i * enemy.spread;
        let pack = merge(enemy, {x: spawn_x + dx,
                                 y: spawn_y,
                                 z: spawn_z + dz,
                                 progress: progress});
        enemy_packs.push(pack);
    }

    return enemy_packs;
}

function facing_line(rng, enemy, count, progress) {
    let spawn_x = 2 * (rng.float() - .5) * max_x;
    let spawn_y = rng.float() *  max_y;

    let perp_x =  spawn_z;
    let perp_z = -spawn_x;
    let scale = Math.sqrt(perp_x*perp_x + perp_z*perp_z);
    perp_x = perp_x / scale;
    perp_z = perp_z / scale;

    let enemy_packs = []

    for (let i = 0; i < count; i++)
    {
        let dx = s * i * enemy.spread;
        let dz = c * i * enemy.spread;
        let pack = merge(enemy, {x: spawn_x + dx,
                                 y: spawn_y,
                                 z: spawn_z + dz,
                                 progress: progress});
        enemy_packs.push(pack);
    }

    return enemy_packs;
}

function wherever(rng, enemy, count, progress) {
    let enemy_packs = []

    for (let i = 0; i < count; i++)
    {
        let spawn_x = 2 * (rng.float() - .5) * max_x;
        let spawn_y = rng.float() *  max_y;

        let pack = merge(enemy, {x: spawn_x,
                                 y: spawn_y,
                                 z: spawn_z,
                                 progress: progress});
        enemy_packs.push(pack);
    }

    return enemy_packs;
}

function staggered_progress(rng, enemy, count, progress) {
    let left = rng.bool();
    let twin = false;
    if ("twin" in enemy) twin = enemy.twin;

    let enemy_packs = []

    for (let i = 0; i < count; i++)
    {
        let pack = merge(enemy, {left: left,
                                 progress: progress + i * enemy.stagger});
        if ("twin" in pack) delete pack["twin"]
        delete pack["stagger"]
        enemy_packs.push(pack);

        if (twin) {
            let pack = merge(enemy, {left: !left,
                                     progress: progress + i * enemy.stagger});
            delete pack["twin"]
            delete pack["stagger"]
            enemy_packs.push(pack);
        }
    }

    return enemy_packs;
}


const enemies = [
    {name:"tower",    model:"tower",  mode:"stationary",         difficulty:1, group_min:1, group_max:10, layout:wherever},
    {name:"tower",    model:"tower",  mode:"stationary",         difficulty:1, group_min:1, group_max:10, layout:random_line, spread:1000},
    {name:"arch",     model:"arch",   mode:"stationary",         difficulty:1, group_min:1, group_max:10, layout:random_line, spread:1000},
    {name:"floater",  model:"sphere", mode:"stationary_hover",   difficulty:3, group_min:1, group_max:3,  layout:facing_star, radius:150, amplitude:500, frequency:.5},
    {name:"floater",  model:"sphere", mode:"stationary_hover",   difficulty:5, group_min:4, group_max:10, layout:facing_star, radius:150, amplitude:600, frequency:.5},
    {name:"attacker", model:"dart",   mode:"kamikaze_from_side", difficulty:7, group_min:4, group_max:10, layout:staggered_progress, stagger:0.2},
    {name:"herder",   model:"dart",   mode:"kamikaze_from_side", difficulty:7, group_min:4, group_max:10, layout:staggered_progress, stagger:0.2, offset:1000},
    {name:"flanker",  model:"dart",   mode:"kamikaze_from_side", difficulty:9, group_min:4, group_max:6,  layout:staggered_progress, stagger:0.2, twin:true}
]

function levelgen(difficulty, duration, rng, step=0.25) {
    let entity_queue = [];

    let running_progress = 0;
    let running_difficulty = 0;

    while (running_progress < duration) {

        if (running_difficulty > 0) {
            let enemy = rng.choice(enemies);
            if (enemy.group_min == enemy.group_max) {
                count = enemy.group_min;
            } else {
                count = rng.int(enemy.group_min, enemy.group_max+1);
            }

            let wave = enemy.layout(rng, enemy, count, running_progress);
            for (let i = 0; i < wave.length; i++) entity_queue.push(wave[i]);
            running_difficulty -= enemy.difficulty;
        }
        running_progress += step;
        running_difficulty += difficulty * step;
    }

    for (let i = 0; i < entity_queue.length; i++) {
        delete entity_queue[i]["difficulty"]
        delete entity_queue[i]["group_min"]
        delete entity_queue[i]["group_max"]
        delete entity_queue[i]["layout"]
    }

    return entity_queue;
}

class ServerScene {
    constructor() {
        this.init()
        this.create()
        this.makeLevel();
    }

    init() {
        // test if we have access to Ammo
        console.log('Ammo', new Ammo.btVector3(1, 2, 3).y() === 2)

        // init the Physics
        this.physics = new Physics()
        this.factory = this.physics.factory
        this.playerId = 0;
        this.players = {};
        this.objects = [];
        this.hasBegun = false;

        this.transmitLookahead = 5; // Will transmit spawns <- seconds before they spawn in-game.
        this.levelWarmup = 5; // Const?
        this.levelCooldown = 30;

        this.levelSpeed = 5000; // Needs to match client virtualSpeed;
        this.levelRunning = false;
        this.levelSeed = 8675309;
        this.levelDifficulty = 10;
        this.levelDuration = 180;
        this.levelProgress = 0;
        this.level = []; // Will be populated later!

        this.spawnedEnemyCount = 0;
        this.activeEnemyCount = 0;
        this.activeEnemies = [];
    }

    create() {
        const ground = this.physics.add.box({
            name: 'ground',
            width: 40,
            depth: 40,
            collisionFlags: 2,
            mass: 0
        })

        const box = this.physics.add.box({ name: 'box', y: 5 })


        /*
        console.log("box is: ")
        console.log(box);

        console.log("\n\n\n\nWOOOO");
        console.log(box.body.physics.rigidBodies);
        */

        /*
        for (let key in box) {
            console.log("box val for " + key + ": " + box[key])
        }
        */


        /**
         * "this.physics.add.box({ name: 'box', y: 5 })"
         * is exactly the same as you would do:
         *
         * const geometry = new THREE.BoxGeometry()
         * const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
         * const box = new THREE.Mesh(geometry, material)
         * box.name = 'box' // give it a name
         * box.position.set(0, 5, 0) // set y to 5
         * this.physics.add.existing(box) // add physics to the box
         *
         * of course you would have to include three first
         * const THREE = require('three')
         */

        this.objects = [ground, box]
        this.players = {}

        // clock
        const clock = new ServerClock()
        // for debugging you disable high accuracy
        // high accuracy uses much more cpu power
        if (process.env.NODE_ENV !== 'production') clock.disableHighAccuracy()
        clock.onTick(delta => this.update(delta))

        let serverScene = this

        io.onConnection((channel) => {
            console.log("Connected!");
            channel.onDisconnect(() => {
                console.log('Disconnect user ' + channel.id)
                if (channel.playerId in this.players) {
                    //this.players[channel.playerId].kill();
                    delete this.players[channel.playerId];
                }
                channel.room.emit('removePlayer', channel.playerId)
            })

            //channel.on('addDummy', addDummy)

            channel.on('getId', () => {
                channel.playerId = this.getId()
                console.log("getId() requested, returning " + channel.playerId.toString());
                channel.emit('getId', channel.playerId.toString(36))
            })


            channel.on('playerMove', (data) => {
                // if (Math.random() < 0.01)
                // {
                //     console.log("Got playerMove from player " + channel.playerId);
                //     console.log(data);
                // }
                if (channel.playerId in this.players) {
                    let p = this.players[channel.playerId];
                    //console.log("Fuckin data is ")
                    //console.log(data);
                    p.coords = data;
                    // {
                    //     x: data.x,
                    //     y: data.y,
                    //     z: data.z,

                    //     qx: data.qx,
                    //     qy: data.qy,
                    //     qz: data.qz,
                    //     qw: data.qw
                    // }
                    //p.coords = JSON.parse(data);
                    // p.x = data.position.x;
                    // p.y = data.position.y;
                    // p.z = data.position.z;

                    // p.qx = data.rotation._x;
                    // p.qy = data.rotation._y;
                    // p.qz = data.rotation._z;
                    // p.qw = data.rotation._w;
                }
                //this.playersGroup.children.iterate((player) => {
                    /*
                this.players.forEach(player => {
                    if (player.playerId === channel.playerId) {
                        player.setMove(data)
                    }
                })
                */
            })


            channel.on('addPlayer', (data) => {
                // let dead = this.getFirstDead()
                // if (dead) {
                //     dead.revive(channel.playerId, false)
                // } else {
                //this.players.push(new Player(this, channel.playerId))
                //this.players[channel.playerId] = new Player
                const playerObj = this.physics.add.box({
                    name: 'player' + channel.playerId,
                    collisionFlags: 2
                })
                this.players[channel.playerId] = {
                    physics: playerObj,
                    coords: {
                        x: 0, y: 0, z: 0,
                        qx: 0, qy: 0, qz: 0, qw: 1
                    }
                };
            })

            serverScene.begin();
            channel.emit('ready');
            if (this.levelProgress > 0)
                channel.emit('go', this.levelProgress);
        })
    }

    makeLevel() {
        let rng = new RNG(this.levelSeed);

        this.level = levelgen(this.levelDifficulty, this.levelDuration, rng);
        this.level.sort((e0,e1) => e0.progress - e1.progress);
        console.log("Generated level with difficulty " +this.levelDifficulty+ " and duration " +this.levelDuration+ " with seed " +this.levelSeed+ " will have " +this.level.length+ " spawns.");
    }

    begin() {
        if (!this.hasBegun) {
            this.hasBegun = true;
            console.log("IT HAS BEGUN")
        } else {
            console.log("IT HAS BEGUN ANEW")
        }
        this.levelProgress = -this.levelWarmup;
        io.room().emit('go', this.levelProgress);
    }

    getObjectStr(obj, idx) {
        let str = JSON.stringify({
            index: idx,
            posx: obj.position.x,
            posy: obj.position.y,
            posz: obj.position.z,
            rotx: obj.rotation.x,
            roty: obj.rotation.y,
            rotz: obj.rotation.z,
        });
        return str;
    }

    getObject(obj, idx) {
        return {
            index: idx,
            posx: obj.position.x,
            posy: obj.position.y,
            posz: obj.position.z,
            rotx: obj.rotation.x,
            roty: obj.rotation.y,
            rotz: obj.rotation.z,
        };
    }

    update(delta) {
        if (!this.hasBegun) return;

        this.physics.update(delta * 1000)

        this.levelProgress += delta;

        while (this.level.length > 0 && this.level[0].progress < this.levelProgress + this.transmitLookahead) {
            let enemy = this.level.shift();

            enemy.name += this.spawnedEnemyCount;

            // I'm sorry. Being tired is no excuse.
            // At least the client and server data will match now!
            enemy.t0 = enemy.progress;
            enemy.progress = enemy.progress * this.levelSpeed;

            io.room().emit('newEnemy', JSON.stringify(enemy));
            console.log("Broadcast enemy ", enemy.name);

            this.spawnedEnemyCount += 1;
            this.activeEnemies.push(enemy);
            this.activeEnemyCount += 1;
        }

        /*
        const box = this.objects[1]
        const y = box.position.y.toFixed(2)

        if (y < 1) {
            box.body.setVelocity(0, 4, 0);

            //box.body.setCollisionFlags(2);
            //box.body.setActivationState(4);
            //box.position.set(0, 5, 0);
            //box.body.setCollisionFlags(1);
            //box.body.needUpdate = true;
        }
        */

        // TODO: change this to only send changed updates (per client? or per server jurisdiction?)
        let states = this.getState()

        if (states.objects) {
            io.room().emit('updateObjects', [states.objects])
        }
        if (states.players) {
            io.room().emit('updatePlayers', JSON.stringify(states.players))
        }

        // for (let playerId in this.players) {
        //     let p = this.players[playerId];
        //     console.log("player " + playerId + " position: " + p.position.x + ", " + p.position.y + ", " + p.position.z);
        // }
    }

    getId() {
        return this.playerId++
    }

    getState() {
        let objects = {}
        for (let i = 0; i < this.objects.length; i++) {
            objects[i] = this.getObject(this.objects[i], i);
        }

        let players = {}
        for (let playerId in this.players) {
            //players[playerId] = this.getObject(this.players[playerId], playerId);
            players[playerId] = {
                index: playerId,
                coords: this.players[playerId].coords
            }
        }

        return {objects: objects, players: players};
    }
}

// wait for Ammo to be loaded
ammo().then((ammo) => {
    //globalThis.Ammo = ammo

    // start server scene
    serverScene = new ServerScene()

    app.get('/getState', (req, res) => {
        try {
            return res.json({ state: serverScene.getState() })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: error.message })
        }
    })
})
