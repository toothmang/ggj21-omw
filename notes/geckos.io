PvE, multiplayer scalable up to reasonable level (16?)

1:17 AM saturday: got the phaser-multiplayer demo workin! FINALLY
    issue: subdomain redirect to nodejs app took care of port, so using anything
    but 443 was causing it to fail. 

    currently: parsing through the example to see what's all going on and work
    up a kind of source map of equivalent code we need to write in our own.

                                              _      
                                             | |     
 ___  ___ _ ____   _____ _ __    ___ ___   __| | ___ 
/ __|/ _ \ '__\ \ / / _ \ '__|  / __/ _ \ / _` |/ _ \
\__ \  __/ |   \ V /  __/ |    | (_| (_) | (_| |  __/
|___/\___|_|    \_/ \___|_|     \___\___/ \__,_|\___|
                                                     
                                                     

server's gameScene has:
    init() which does the geckos.io setup and adds the http server to its list
    getId() which returns the last playerId and increments. 
    prepareToSync(player) gets a message representing the player pos and state
    getState(): iterates over player children and adds their state to a string
    
    create(): initializes the scene. Registers io.onConnection(channel), which has:
        channel.onDisconnect, on('messageType') like addDummy, getId, playerMove, addPlayer

        when these are all finished, channel emits 'ready' 

    update(): iterates over players, finds out which ones have changed positions or state
        adds their prepareToSync() to an updates string, then calls player.postUpdate() 
            does this mean a function that runs after each player state updates, or 
            is it posting an update?

            answer: it runs after player updates to set prevX to X and so on. 
        
        if the updates string isn't empty, then it does this.io.room.emit('updateObjects', [updates])
        presumably to give all players the update string (in server state)

server's game and config just seem like wrappers for how Phaser should behave

server itself has all of the nodejs setup and http serving. but it's doing something
else that makes it work without the client failing on fetchAdditionalCandidates...

server's player has data members: x, y, and dead
    its constructor mainly initializes these and sets up physics objects with Phaser
        also takes dummy, to make it dumb jump

    setDummy() makes a player auto-jump with random delay if true

    kill() sets dead to true and deactivates Phaser object
    revive() is like a dumb init to recycle objects I think?
    setMove(data) tries to parse data saying how the player is moving, then updates this.move
    update() converts player movement data into velocity using Phaser
    postUpdate() lets each player object remember its last state

      _ _            _                   _      
     | (_)          | |                 | |     
  ___| |_  ___ _ __ | |_    ___ ___   __| | ___ 
 / __| | |/ _ \ '_ \| __|  / __/ _ \ / _` |/ _ \
| (__| | |  __/ | | | |_  | (_| (_) | (_| |  __/
 \___|_|_|\___|_| |_|\__|  \___\___/ \__,_|\___|

client.js 
    also sets Phaser configuration, loads BootScene and GameScene, and sets up fullscreen for window.load

components/controls.js
    just maps the left/right/up visible buttons to set equivalent state
    emits playerMove

components/cursors.js
    same but for cursor keys from keyboard
    also emits playerMove on the channel

components/player.js
    wrapper for Phaser sprite, also sets channelId

scenes/bootScene.js
    creates channel using geckos.io
    register channel.on('ready') to start the Phaser scene

scenes/gameScene.js
    init(): sets channel
    preload(): loads images
    async create(): creates controls/cursors, fullscreen/dummy buttons, 
        has lambda for parsing updates message string
        registers channel.on('updateObjects') event handler
            this parses the first entry in the updates string (or array or strings?)
            then passes the new state to the updatesHandler
        parseUpdates(updates)
            splits updates string, pops the first (why?) and then reads 4 values per player ng
        channel.on('removePlayer')

        after all of this, it tries to get an async result from the server/getState API call
            I think making this first request initializes things by setting it up as an async?

        then it registers channel.on("getId") to prepare for a response from the server
            the value is assigned to the playerId

        then it emits "getId" so the server will return its value of playerId++