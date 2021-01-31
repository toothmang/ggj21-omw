var gamepadAPI = {
    controller: {},
    turbo: false,
    connect: function (evt) {
        gamepadAPI.controller = evt.gamepad;
        gamepadAPI.turbo = true;
        console.log('Gamepad connected.');
    },
    disconnect: function (evt) {
        gamepadAPI.turbo = false;
        delete gamepadAPI.controller;
        console.log('Gamepad disconnected.');
    },
    update: function () {
        var gps = navigator.getGamepads();
        if (gps.length <= 0) return;
        var gp = gps[0];
        if (!gp || !gp.connected) return;
        gamepadAPI.controller = gp;

        // Update the list of pressed buttons
        gamepadAPI.buttonsCache = {};
        for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {
            gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
        }
        gamepadAPI.buttonsStatus = {};
        //var c = gamepadAPI.controller || {};
        var pressed = {};
        for (var b = 0, t = gp.buttons.length; b < t; b++) {
            if (gp.buttons[b].pressed) {
                pressed[gamepadAPI.buttonNames[b]] = gp.buttons[b];
            }
        }
        var axes = [];
        for (var a = 0, x = gp.axes.length; a < x; a++) {
            axes.push(gp.axes[a].toFixed(2));
        }
        gamepadAPI.axesStatus = axes;
        gamepadAPI.buttonsStatus = pressed;
        return pressed;
    },
    /*buttonPressed: function(button, hold) {
        var newPress = false;
        for(var i=0,s=gamepadAPI.buttonsStatus.length; i<s; i++) {
            if(gamepadAPI.buttonsStatus[i] == button) {
                newPress = true;
                if(!hold) {
                    for(var j=0,p=gamepadAPI.buttonsCache.length; j<p; j++) {
                        if(gamepadAPI.buttonsCache[j] == button) {
                            newPress = false;
                        }
                    }
                }
            }
        }
        return newPress;
    },*/
    // Arranged in increasing button index order
    buttonNames: [ // XBox360 layout
        'A',
        'B',
        'X',
        'Y',
        'LB',
        'RB',
        'LT',
        'RT',
        'Select',
        'Start',
        'LS',
        'RS',
        'Up',
        'Down',
        'Left',
        'Right',
        'Power'
    ],
    buttonsCache: {},
    buttonsStatus: {},
    axesStatus: []
};

/**
 * This class allows easy usage of gamepad controls
 */
class GamepadControls {

    constructor() {

        this.setupListeners();

        // a list of bound keys and their corresponding actions
        this.boundKeys = {};
    }

    update() {
        if (gamepadAPI.controller.buttons == null) return;
        gamepadAPI.update();

        var buttonsDown = "";


        // Check pressed buttons
        //for(var i = 0; i < gamepadAPI.buttonsStatus.length; i++) {
        //    if (gamepadAPI.buttonNames[i] == 'A' && )
        //}


        Object.keys(gamepadAPI.buttonsStatus).forEach(function (buttonName) {
            var button = gamepadAPI.buttonsStatus[buttonName];
            if (button.pressed && (
                buttonName == 'RT'
                || buttonName == 'LT'
                || buttonName == 'RB'
                || buttonName == 'LB'
                || buttonName == 'LS'
                || buttonName == 'RS')) {
                //cEngine.sendInput("fire", { weapon: buttonName });
                channel.emit("fire", { weapon: buttonName });
            }
        });

        // for(var i = 0; i < gamepadAPI.controller.buttons.length; i++) {
        //     var val = gamepadAPI.controller.buttons[i];
        //     if (gamepadAPI.buttonPressed(i, true)) {
        //         buttonsDown = buttonsDown + stringify(i) + " ";
        //         this.clientEngine.sendInput("up", { movement: true });
        //     }
        // }

        var lx = 0.0, ly = 0.0, rx = 0.0, ry = 0.0;
        var sendmove = false, sendsteer = false;
        var deadzone = 0.2;

        // Get left stick values
        if (Math.abs(gamepadAPI.axesStatus[0]) > deadzone) {
            //this.clientEngine.sendInput("down", { movement: true });
            lx = gamepadAPI.axesStatus[0];
            sendmove = true;
        }

        if (Math.abs(gamepadAPI.axesStatus[1]) > deadzone) {
            //this.clientEngine.sendInput("down", { movement: true });
            ly = gamepadAPI.axesStatus[1];
            sendmove = true;
        }

        if (Math.abs(gamepadAPI.axesStatus[2]) > deadzone) {
            //this.clientEngine.sendInput("left", { movement: true });
            rx = gamepadAPI.axesStatus[2];
            sendsteer = true;
        }
        if (Math.abs(gamepadAPI.axesStatus[3]) > deadzone) {
            //this.clientEngine.sendInput("left", { movement: true });
            ry = gamepadAPI.axesStatus[3];
            sendsteer = true;
        }

        if (sendmove) {
            this.leftStick = [Number(lx), Number(ly)];
            this.leftStickHeld = true;
            //this.clientEngine.sendInput("move", { x: -lx, y: -ly }); // FIXME: Investigate sign flip
            //channel.emit("playerMove")
        }
        else {
            this.leftStick = [0.0, 0.0];
            this.leftStickHeld = false;
        }
        if (sendsteer) {
            this.rightStick = [Number(-rx), Number(-ry)];
            this.rightStickHeld = true;
            //this.clientEngine.sendInput("steer", { x: -rx, y: -ry }); // FIXME: Investigate sign flip
        }
        else {
            this.rightStick = [0.0, 0.0];
            this.rightStickHeld = false;
        }
    }

    /*
    onFrame() {
        let conCheck = gpLib.testForConnections();

        // Check for connection or disconnection
        if (conCheck) {
            console.log(conCheck + " new connections");

            // And reconstruct the UI if it happened
            rebuildUI();
        }

        // Update all the UI elements
        updateUI();

        requestAnimationFrame(onFrame);
    }
    */

    setupListeners() {
        window.addEventListener("gamepadconnected", gamepadAPI.connect);
        window.addEventListener("gamepaddisconnected", gamepadAPI.disconnect);

        //this.clientEngine.controls.bindKey('left', 'left', { repeat: true });
        //this.clientEngine.controls.bindKey('right', 'right', { repeat: true });
        //this.clientEngine.controls.bindKey('A', 'up', { repeat: true } );
        //this.clientEngine.controls.bindKey('space', 'space');
    }

    // bindKey(keys, actionName, options) {
    //     if (!Array.isArray(keys)) keys = [keys];

    //     let keyOptions = Object.assign({
    //         repeat: false
    //     }, options);

    //     keys.forEach(keyName => {
    //         this.boundKeys[keyName] = { actionName, options: keyOptions };
    //     });
    // }

    // todo implement unbindKey

    // onKeyChange(e, isDown) {
    //     e = e || window.event;

    //     let keyName = keyCodeTable[e.keyCode];
    //     if (keyName && this.boundKeys[keyName]) {
    //         if (this.keyState[keyName] == null) {
    //             this.keyState[keyName] = {
    //                 count: 0
    //             };
    //         }
    //         this.keyState[keyName].isDown = isDown;

    //         // key up, reset press count
    //         if (!isDown) this.keyState[keyName].count = 0;

    //         // keep reference to the last key pressed to avoid duplicates
    //         this.lastKeyPressed = isDown ? e.keyCode : null;
    //         // this.renderer.onKeyChange({ keyName, isDown });
    //         e.preventDefault();
    //     }
    // }
}