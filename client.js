// import geckos.io client
const geckos = require('@geckos.io/client').default
//const { AmmoPhysics, PhysicsLoader, ServerClock } = require('@enable3d/ammo-on-nodejs')

//import * as THREE from 'https://unpkg.com/three/build/three.module.js';
//import * as THREE from 'three';
//const THREE = require('@three/three')

//import GameScene from './scenes/gameScene'

console.log("Clienting!");

//serverObjects = {};
//playerObjects = {};

channel = null;


window.addEventListener('load', () => {
    port = 443
    if (process.env.NODE_ENV === 'local') port = 9208
    channel = geckos({ port: port, portRange: { min: 50000, max: 51000 }, })

    channel.onConnect(error => {
        if (error) console.error(error.message)

        //const game = new GameScene(channel)

        channel.on('ready', () => {
            //game.start()
            console.log("Server says scene is ready!")
            //this.scene.start('GameScene', { channel: channel })
        })

        const parseUpdates = updates => {
            if (typeof updates === undefined || updates === '') return []

            // parse
            console.log("parsing updates for : " + updates)

            let u = updates.split(',')
            u.pop()

            let u2 = []
            /*
            u.forEach((el, i) => {
              if (i % 4 === 0) {
                u2.push({
                  playerId: u[i + 0],
                  x: parseInt(u[i + 1], 36),
                  y: parseInt(u[i + 2], 36),
                  dead: parseInt(u[i + 3]) === 1 ? true : false
                })
              }
            })
            */
            return u2
        }

        const updatesHandler = updates => {
            updates.forEach(gameObject => {
                //const { playerId, x, y, dead } = gameObject
                //const alpha = dead ? 0 : 1

                /*
                if (Object.keys(this.objects).includes(playerId)) {
                // if the gameObject does already exist,
                // update the gameObject
                //let sprite = this.objects[playerId].sprite
                //sprite.setAlpha(alpha)
                //sprite.setPosition(x, y)
                } else {
                // if the gameObject does NOT exist,
                // create a new gameObject
                let newGameObject = {
                    sprite: new Player(this, playerId),
                    playerId: playerId
                }
                //newGameObject.sprite.setAlpha(alpha)
                this.objects = { ...this.objects, [playerId]: newGameObject }
                }
                */
            })
        }

        channel.on('updateObjects', updates => {
            //window.serverObjects = JSON.parse(updates[0])
        })

        channel.on('updatePlayers', updates => {

            window.playerObjects = JSON.parse(updates);

            if (Math.random() < 0.005) 
            { // Stochastic logging. Use at own risk!
                //console.log("Object " + i + " has Z coord " + pos.z + " at t=" + t + " and p=" + progress);
                //console.log("Channel " + channel.id + " receiving updates");
                console.log(window.playerObjects);
            }
            
        })

        channel.on('getId', playerId36 => {
            this.playerId = parseInt(playerId36, 36)
            console.log("Got player id " + this.playerId);
            window.myPlayerId = this.playerId;
            channel.emit('addPlayer')
        })

        channel.emit('getId')
    })



    //FullScreenEvent(() => resize(game))
})

