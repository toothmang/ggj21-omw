const { Ammo: ammo, Physics, ServerClock } = require('@enable3d/ammo-on-nodejs')
const express = require('express')
const http = require('http')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const app = express()
const server = http.createServer(app)
const geckos = require('@geckos.io/server').default

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


class ServerScene {
    constructor() {
        this.init()
        this.create()
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
                //if (Math.random() < 0.01) 
                {
                    console.log("Got playerMove from player " + channel.playerId);
                    console.log(data);
                }
                if (channel.playerId in this.players) {
                    let p = this.players[channel.playerId];
                    console.log("Fuckin data is ")
                    console.log(data);
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

            channel.emit('ready')
            serverScene.begin()
        })
    }

    begin() {
        if (!this.hasBegun) {
            this.hasBegun = true;
            console.log("IT HAS BEGUN")
        }
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