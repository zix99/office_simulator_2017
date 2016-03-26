var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render });

var characters = {
    'chris' : {
        image: "officeman2",
        name: "Chris"
    },
    'caleb' : {
        image: "russian_f1"
    }
};

var PLAYER_SPEED = 200;

var player = null;
var map = null;

function getPlayerName() {
    return "chris";
}

function preloadSprite(name, img) {
	return game.load.spritesheet(name, 'assets/characters/' + img + '.png', 32, 48, 16);
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

    game.physics.p2.enable(sprite);
    
    if (person.name) {
        var nameSprite = game.add.text(0,0, person.name);
        sprite.addChild(nameSprite);
    }

	return sprite;
}

function preload() {
	game.add.plugin(Phaser.Plugin.Tiled);

    var cacheKey = Phaser.Plugin.Tiled.utils.cacheKey;

    game.load.tiledmap(cacheKey('tiled-lvl0', 'tiledmap'), 'assets/levels/test.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image(cacheKey('tiled-lvl0', 'tileset', 'terrain_atlas'), 'assets/tiles/terrain_atlas.png');
    
    _.each(characters, function(val, key) {
        console.log(val);
        val._sprite = preloadSprite(key, val.image);
    });
}

function create() {

    //  This creates a simple sprite that is using our loaded image and
    //  displays it on-screen
    //game.add.sprite(0, 0, 'einstein');
    map = game.add.tiledmap('tiled-lvl0');

    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.convertTiledCollisionObjects(map, 'collision');

    var playerName = getPlayerName();
    _.each(characters, function(val, key) {
        var sprite = createSprite(key, val);
        if (key === playerName) {
            player = sprite;
        }
    });
    if (player) {
        //game.physics.p2.enable(player);
        game.camera.follow(player);
    }
}

function update() {
    //Update player sprite with movement
    player.body.setZeroVelocity();
    player.body.setZeroRotation();
    //player.body.setZeroForce();
    player.body.rotation = 0;

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
}

function render() {
    game.debug.cameraInfo(game.camera, 32, 32);
    game.debug.spriteCoords(player, 32, 500);
}