
// Config
var PLAYER_SPEED = 200;
var DEBUG = 0;
var DIFFICULTY_MOD = 1;

var playerName = window.location.hash.substr(1) || 'chris';

var player = null;
var map = null;
var items = [];

var gameState = {
    score: 0,
    timeLeft: 60
};

var itemTypes = {
    "coffee" : {
        image: "coffee"
    }
}

// Characters
var characters = {
    'chris' : {
        image: "officeman2",
        name: "Chris"
    },
    'caleb' : {
        image: "pirate_m2",
        name: "Caleb",
        update: function() {
            if (spriteDist(player._sprite, this._sprite) < 100) {
                characterSpeechBubble(this, "You're fired!");
                setTimeout(function(){
                    var respawn = _.find(map.objects.spawns, {name: "respawn"});
                    player._sprite.position = {x: respawn.x, y: respawn.y};
                }, 750);
            }
        },
        init: function() {
            var self = this;
            var patrol = function() {
                movePath(self._sprite, 'caleb_path', 100, patrol);
            };
            patrol();
        }
    },
    'halbe' : {
        image: "officeman1",
        name: "Matt",
        update: function() {
            if (spriteDist(player._sprite, this._sprite) < 150) {
                if (player._hasCoffee) {
                    characterSpeechBubble(this, "Yay coffee!");
                    player._hasCoffee = false;
                    gameState.score++;
                    gameState.timeLeft = 60;
                } else {
                    characterSpeechBubble(this, "Could you find me coffee?\nI can't code without coffee...");
                }
            }

            if (gameState.timeLeft <= 0) {
                characterSpeechBubble(this, "I'm tired.\nTime to go home", 120 * 1000);
                movePath(self._sprite, 'matt_leave', 150);
            }
        }
    },
    'noah' : {
        image: 'schoolboy',
        name: 'Noah',
        update: function() {
            if (spriteDist(player._sprite, this._sprite) < 200) {
                characterSpeechBubble(this, "Cat's and milk...");
            }
        }
    },
    'john' : {
        image: 'steampunk_m7',
        name: 'John',
        _boosts: 3,
        update: function() {
            if (player._speedModifier <= 1.1 && this._boosts > 0 && spriteDist(player._sprite, this._sprite) < 50) {
                this._boosts--;
                characterSpeechBubble(this, "I betroth upon you a speed boost");
                player._speedModifier = 2;
                setTimeout(function(){ player._speedModifier = 1; }, 10000);
            }
        }
    },
    'nate' : {
        image: 'tremel',
        name: 'Nate'
    },
    'shawn' : {
        image: 'officeman5',
        name: 'Shawn',
        update: function() {
            if (!this._state && spriteDist(player._sprite, this._sprite) < 100) {
                this._state = 1;
                movePath(this._sprite, 'shawn_out');
                characterSpeechBubble(this, "Caleb's on a firing spree! RUN!");
                this._sprite.animations.play('walk_left');
            }
        }
    }
};

// ================ AI HELPERS ================

var pmath = Phaser.Math;

function spriteDist(s0, s1) {
    return pmath.distance(s0.position.x, s0.position.y, s1.position.x, s1.position.y);
}

function characterSpeechBubble(person, text, time) {

    if (!person._activeSpeech) {
        var style = { font: "bold 16px Arial", fill: "#000", boundsAlignH: "center", boundsAlignV: "middle", backgroundColor: "#eee" };
        var speech = person._activeSpeech = game.add.text(16, 0, text, style);

        person._sprite.addChild(speech);

        setTimeout(function(){
            person._sprite.removeChild(speech);
            person._activeSpeech = null;
        }, time || text.length * 75);
    }
}

function getPath(key) {
    var path = _.find(map.objects.paths, {name: key});
    if (!path) {
        return null;
    }
    
    out = [];
    _.each(path.polyline, function(offset){
        out.push( {x: offset[0] + path.x, y: offset[1] + path.y} );
    });
    return out;
}

function movePath(sprite, pathKey, speed, onComplete) {
    if (!speed)
        speed = 200;

    var path = getPath(pathKey);
    if (path) {
        console.log("Moving along path " + pathKey);

        var firstTween = null;
        var prevTween = null;
        var lastPt = {x: sprite.x, y: sprite.y};

        _.each(path, function(pt){
            console.log(pt);

            var dist = pmath.distance(pt.x, pt.y, lastPt.x, lastPt.y);
            var tweenTime = dist * 1000 / speed;

            var tween = game.add.tween(sprite).to(pt, tweenTime);
            if (prevTween) {
                prevTween.chain(tween);
            }
            if (!firstTween) {
                firstTween = tween;
            }
            prevTween = tween;
            lastPt = pt;
        });

        if (onComplete) {
            prevTween.onComplete.add(onComplete);
        }

        firstTween.start();
    } else {
        console.log("Path not found " + pathKey);
    }
}

// =============== UI =========================

var ui = {
    _style: {font: "32px Arial", fill: "#fff"},

    _timeLeft: null,
    _timeLabel: null,
    _score: null,

    preload: function() {
        game.load.image('grad_redgreen', 'assets/grad_redgreen.png');
    },

    init: function() {
        this.score = game.add.text(0, 0, "Score: 0", this._style);
        this.score.fixedToCamera = true;

        this.timeLabel = game.add.text(0, 32, "Time:", this._style);
        this.timeLabel.fixedToCamera = true;

        var graphics = game.add.graphics(100,100);

        this.timeLeft = game.add.sprite(90, 40, "grad_redgreen");
        this.timeLeft.fixedToCamera = true;
        this.timeLeft.width = 100;
        this.timeLeft.height = 24;
    },

    update: function() {
        this.score.setText("Score: " + gameState.score);
        this.timeLeft.width = gameState.timeLeft * 4;
    }
}


// =============== MAIN GAME ==================

var game = new Phaser.Game(800, 600, Phaser.WEBGL, 'game', { preload: preload, create: create, update: update, render: render });

function preloadSprite(name, img) {
	return game.load.spritesheet(name, 'assets/characters/' + img + '.png', 32, 48, 16);
}

function createSprite(key, person) {
	var sprite = person._sprite = game.add.sprite(0, 0, key);
	sprite.anchor.setTo(0.5, 0);
	//sprite.scale.setTo(1.25);

    //Set up animations
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
    var startObj = _.find(map.objects.spawns, {name: key});
    if (startObj) {
        sprite.position.x = startObj.x;
        sprite.position.y = startObj.y;
    }

	return sprite;
}

function preload() {
    game.load.image('indoors', 'assets/tiles/indoors.png');
    game.load.image('indoors_2', 'assets/tiles/indoors_2.png');
    game.load.tilemap('tiled-lvl0', 'assets/levels/webs.json', null, Phaser.Tilemap.TILED_JSON);
    
    _.each(characters, function(val, key) {
        console.log(val);
        val._sprite = preloadSprite(key, val.image);
    });

    _.each(itemTypes, function(val, key){
        game.load.image(key, "assets/items/" + val.image + ".png");
    });

    ui.preload();
}

function create() {

    //  This creates a simple sprite that is using our loaded image and
    //  displays it on-screen
    map = game.add.tilemap('tiled-lvl0');
    map.addTilesetImage('indoors', 'indoors');
    map.addTilesetImage('indoors_2', 'indoors_2');

    var bgLayer = map.createLayer('bg');

    map._walls = map.createLayer('walls');
    map.setCollisionBetween(1, 10000, true, 'walls');

    map._objects = map.createLayer('objects');
    map.setCollisionBetween(1, 10000,true,'objects');

    bgLayer.resizeWorld();

    //Init physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //init characters
    _.each(characters, function(person, key) {
        var sprite = createSprite(key, person);
        if (key === playerName) {
            player = person;
        }
        if (person.init) {
            person.init();
        }
    });

    //init player, if able
    if (player) {
        game.physics.arcade.enable(player._sprite);
        game.camera.follow(player._sprite);

        //Reduce size of collision box
        player._sprite.body.width = 16;
        player._sprite.body.height = 16;
        player._sprite.body.offset.y = 32;
        player._sprite.body.offset.x = 0;

        //Player logic
        player._hasCoffee = false;
        player._speedModifier = 1;
    }

    //init items
    _.each(map.objects.items, function(item){
        if (item.name in itemTypes) {
            console.log("Spawn item " + item.name);
            sprite = game.add.sprite(item.x, item.y, item.name);
            items.push(sprite);
        } else {
            console.log("WARN: Unknown item type " + item.name);
        }
    });

    //Set up score UI
    ui.init();

    //Init AI
    //setTimeout(updateCharacters, 500);d
    var aiLoop = game.time.events.add(500, updateCharacters);
    aiLoop.loop = true;

    //Score loop
    var scoreLoop = game.time.events.add(250, function(){
        gameState.timeLeft = Math.max(gameState.timeLeft - (gameState.score + 1) * 0.11 * DIFFICULTY_MOD, 0);
    });
    scoreLoop.loop = true;
}

function update() {
    //Update player sprite with movement
    player._sprite.body.velocity.x = 0;
    player._sprite.body.velocity.y = 0;

	var moving = false;

    if (game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
        player._sprite.body.velocity.x -= PLAYER_SPEED * player._speedModifier;
        player._sprite.animations.play('walk_left');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
        player._sprite.body.velocity.x += PLAYER_SPEED * player._speedModifier;
        player._sprite.animations.play('walk_right');
        moving = true;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.W))
    {
        player._sprite.body.velocity.y -= PLAYER_SPEED * player._speedModifier;
        player._sprite.animations.play('walk_up');
        moving = true;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
        player._sprite.body.velocity.y += PLAYER_SPEED * player._speedModifier;
        player._sprite.animations.play('walk_down');
        moving = true;
    }

    if (!moving) {
    	player._sprite.animations.play('stand');
    }

    //Physics
    game.physics.arcade.collide(player._sprite, map._walls);
    game.physics.arcade.collide(player._sprite, map._objects);

    //Getting items
    _.each(items, function(item, i){
        if (spriteDist(player._sprite, item) < 50) {
            if (!player._hasCoffee) {
                player._hasCoffee = true;
                characterSpeechBubble(player, "Got it!");
                items.splice(i, 1);
                item.destroy();
                return false;
            } else {
                characterSpeechBubble(player, "I can only carry one");
            }
        }
    });

    //UI
    ui.update();
}

function updateCharacters() {
    _.each(characters, function(val, key) {
        if (val.update) {
            val.update();
        }
    });
}

function render() {
    if (DEBUG) {
        game.debug.cameraInfo(game.camera, 32, 32);
        game.debug.spriteCoords(player._sprite, 32, 500);
    }
}