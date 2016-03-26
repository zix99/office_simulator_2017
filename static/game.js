var pmath = Phaser.Math;

var PLAYER_SPEED = 200;

var player = null;
var map = null;

var characters = {
    'chris' : {
        image: "officeman2",
        name: "Chris"
    },
    'caleb' : {
        image: "russian_f1",
        name: "Caleb",
        _sprite : null,
        update: function() {
            if (pmath.distance(player.position.x, player.position.y, this._sprite.position.x, this._sprite.position.y) < 150) {
                characterSpeechBubble(this, "You're fired!");
            }
        }
    }
};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });

function getPlayerName() {
    return "chris";
}

function preloadSprite(name, img) {
	return game.load.spritesheet(name, 'assets/characters/' + img + '.png', 32, 48, 16);
}

function characterSpeechBubble(person, text) {
    var style = { font: "bold 16px Arial", fill: "#000", boundsAlignH: "center", boundsAlignV: "middle", backgroundColor: "#eee" };
    var speech = game.add.text(16, 0, text, style);

    person._sprite.addChild(speech);

    setTimeout(function(){
        person._sprite.removeChild(speech);
    }, text.length * 75);
}

function createSprite(key, person) {
	var sprite = person._sprite = game.add.sprite(0, 0, key);
	sprite.anchor.setTo(0.5, 0);
	sprite.scale.setTo(1.25);

	var fps = 8;
	sprite.animations.add('stand', [0]);
	sprite.animations.add('walk_down', [0,1,2,3], fps, true);
	sprite.animations.add('walk_left', [4,5,6,7], fps, true);
	sprite.animations.add('walk_right', [8,9,10,11], fps, true);
	sprite.animations.add('walk_up', [12,13,14,15], fps, true);

    //If name label, if able
    if (person.name) {
        var style = { font: "bold 16px Arial", fill: "#333", boundsAlignH: "center", boundsAlignV: "middle" };
        var nameSprite = game.add.text(0, -16, person.name, style);
        nameSprite.anchor.setTo(0.5, 0);
        sprite.addChild(nameSprite);
    }

    //Find start position, if available
    var startObj = _.find(map.objects.players, {name: key});
    if (startObj) {
        sprite.position.x = startObj.x;
        sprite.position.y = startObj.y;
    }

	return sprite;
}

function preload() {
    game.load.image('terrain_atlas', 'assets/tiles/terrain_atlas.png');
    game.load.tilemap('tiled-lvl0', 'assets/levels/test.json', null, Phaser.Tilemap.TILED_JSON);
    
    _.each(characters, function(val, key) {
        console.log(val);
        val._sprite = preloadSprite(key, val.image);
    });
}

function create() {

    //  This creates a simple sprite that is using our loaded image and
    //  displays it on-screen
    map = game.add.tilemap('tiled-lvl0');
    map.addTilesetImage('terrain_atlas', 'terrain_atlas');

    var bgLayer = map.createLayer('Tile Layer 1');

    map._blockedLayer = map.createLayer('layer-objs');
    map.setCollisionBetween(1, 2000, true, 'layer-objs');
    bgLayer.resizeWorld();

    //Init physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //init player
    var playerName = getPlayerName();
    _.each(characters, function(val, key) {
        var sprite = createSprite(key, val);
        if (key === playerName) {
            player = sprite;
        }
    });

    if (player) {
        game.physics.arcade.enable(player);
        game.camera.follow(player);
    }

    //Init AI
    //setTimeout(updateCharacters, 500);
    var aiLoop = game.time.events.add(500, updateCharacters);
    aiLoop.loop = true;
}

function update() {
    //Update player sprite with movement
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

	var moving = false;

    if (game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
        player.body.velocity.x -= PLAYER_SPEED;
        player.animations.play('walk_left');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
        player.body.velocity.x += PLAYER_SPEED;
        player.animations.play('walk_right');
        moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.W))
    {
        player.body.velocity.y -= PLAYER_SPEED;
        player.animations.play('walk_up');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
        player.body.velocity.y += PLAYER_SPEED;
        player.animations.play('walk_down');
        moving = true;
    }

    if (!moving) {
    	player.animations.play('stand');
    }

    //Physics
    game.physics.arcade.collide(player, map._blockedLayer);
}

function updateCharacters() {
    _.each(characters, function(val, key) {
        if (val.update) {
            val.update();
        }
    });
}

function render() {
    game.debug.cameraInfo(game.camera, 32, 32);
    game.debug.spriteCoords(player, 32, 500);
}