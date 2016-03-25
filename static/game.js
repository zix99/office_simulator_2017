var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render });

var characters = {

};

function preloadSprite(name, img) {
	return game.load.spritesheet(name, 'assets/characters/' + img + '.png', 32, 48, 16);
}

function createSprite(name) {
	var sprite = game.add.sprite(0, 0, name);
	sprite.anchor.setTo(0.5, 0);
	sprite.scale.setTo(1.25);

	var fps = 8;
	sprite.animations.add('stand', [0]);
	sprite.animations.add('walk_down', [0,1,2,3], fps, true);
	sprite.animations.add('walk_left', [4,5,6,7], fps, true);
	sprite.animations.add('walk_right', [8,9,10,11], fps, true);
	sprite.animations.add('walk_up', [12,13,14,15], fps, true);

	return sprite;
}

function preload() {
	game.add.plugin(Phaser.Plugin.Tiled);
    //  You can fill the preloader with as many assets as your game requires

    //  Here we are loading an image. The first parameter is the unique
    //  string by which we'll identify the image later in our code.

    //  The second parameter is the URL of the image (relative)
    //game.load.image('einstein', 'assets/tiles/indoors.png');
    var cacheKey = Phaser.Plugin.Tiled.utils.cacheKey;

    game.load.tiledmap(cacheKey('tiled-lvl0', 'tiledmap'), 'assets/levels/test.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image(cacheKey('tiled-lvl0', 'tileset', 'terrain_atlas'), 'assets/tiles/terrain_atlas.png');
    
    preloadSprite('player', 'officeman2');
}

function create() {

    //  This creates a simple sprite that is using our loaded image and
    //  displays it on-screen
    //game.add.sprite(0, 0, 'einstein');
    var map = game.add.tiledmap('tiled-lvl0');
/*
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    player.anchor.setTo(0.5, 0.5);
    player.scale.setTo(1.5,1.5);

    player.animations.add('stand', [0]);
    player.animations.add('walk_down', [0,1,2,3], 8, true);

    player.animations.play('walk_down');*/

    player = createSprite('player');
}

function update() {
	var moving = false;

    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
    {
        player.x -= 4;
        player.animations.play('walk_left');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
    {
        player.x += 4;
        player.animations.play('walk_right');
        moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
    {
        player.y -= 4;
        player.animations.play('walk_up');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))
    {
        player.y += 4;
        player.animations.play('walk_down');
        moving = true;
    }

    if (!moving) {
    	player.animations.play('stand');
    }
}

function render() {

}