let spriteSheet;

let spriteSheetFilenames = ["Ants.png"];
let spriteSheets = [];
let animations = [];
let overallSpeed;
let antClicked = false;
let spritesClicked;
const synth = new Tone.Synth().toDestination();
let waitingMusic = new Tone.Sequence((time, note) => {
  synth.triggerAttackRelease(note, 0.1, time);
}, ["A3", "G2", "F2", "B3"] );
let normalInGameMusic = new Tone.Sequence((time, note) => {
  instrument.triggerAttackRelease(note, 0.1, time);
}, ["D3", "E3", "F3"] );
let panicInGameMusic = new Tone.Sequence((time, note) => {
  instrument.triggerAttackRelease(note, 0.1, time);
}, [ "D4", "D5", "E4", "E5", "F4", "F5" ] );

let sounds = new Tone.Players({
  "Bug Splat": "sounds/splat.mp3",
  "Miss": "sounds/dangit.mp3",
  "TimeUp": "sounds/timeUp.mp3",
  "Winner": "sounds/winner.mp3",
  "Loser": "sounds/loser.mp3"
})

let instrument = new Tone.MonoSynth({
  "portamento": 0.01,
  "oscillator": {
      "type": "sawtooth"
  },
  "filter": {
      "Q": 2,
      "type": "lowpass",
      "rolloff": -24
  },
  "envelope": {
      "attack": 0.1,
      "decay": 0.1,
      "sustain": 0.6,
      "release": 0.5
  },
  "filterEnvelope": {
      "attack": 0.05,
      "decay": 0.8,
      "sustain": 0.4,
      "release": 1.5,
      "baseFrequency": 2000,
      "octaves": 1.5
  }
});

var effect1 = new Tone.AutoFilter({
  "frequency": 5,
	"type": "square4",
	"depth": 0.4,
	"baseFrequency": 150,
	"octaves": 3.1,
	"filter": {
		"type": "lowpass",
		"rolloff": -24,
		"Q": 4
	},
    "wet": 0.5
});

// Lowers volume and connects instruments and effects to destination
instrument.volume.value = -15;
instrument.connect(effect1);
effect1.toDestination();
const vol = new Tone.Volume(-10).toDestination();


const GameState = {
  Start: "Start",
  Playing: "Playing",
  GameOver: "GameOver",
  YouWin: "YouWin"
};

let game = { score: 0, maxScore: 0, maxTime: 30, elapsedTime: 0, totalSprites: 15, state: GameState.Start };

function preload() {
  for(let i=0; i < spriteSheetFilenames.length; i++) {
    spriteSheets[i] = loadImage("assets/" + spriteSheetFilenames[i]);
  }
}

function setup() {
  createCanvas(600, 600);
  imageMode(CENTER);
  angleMode(DEGREES);
  sounds.connect(vol);
  vol.toDestination();
  reset();
}

function reset() {
  game.elapsedTime = 0;
  game.score = 0;
  game.totalSprites = ceil(random(30,40));
  overallSpeed = 1;
  spritesClicked = 0;

  animations = [];
  for(let i=0; i < game.totalSprites; i++) {
    animations[i] = new WalkingAnimation(random(spriteSheets),48,48,random(100,300),random(100,300),6,random(1,3),12,random([0,1]));
  }
  Tone.Transport.start();
}

function draw() {
  switch(game.state) {
    case GameState.Playing:
      background('rgb(193, 154, 107)');
  
      for(let i=0; i < animations.length; i++) {
        animations[i].draw();
      }
      fill(0);
      textSize(40);
      text("Score: ",65,40)
      text(game.score,150,40);
      let currentTime = game.maxTime - game.elapsedTime;
      text("Time:", 475, 40);
      text(ceil(currentTime), 550,40);
      game.elapsedTime += deltaTime / 1000;
      if (currentTime <= 10) {
        normalInGameMusic.stop();
        panicInGameMusic.start();
      }
      if (currentTime < 0)
      {
        panicInGameMusic.stop();
        sounds.player("Loser").start();
        game.state = GameState.GameOver;
      }
      if (spritesClicked === game.totalSprites)
      {
          normalInGameMusic.stop();
          panicInGameMusic.stop();
          sounds.player("Winner").start();
          game.state = GameState.YouWin;
      }
        
      break;
    case GameState.GameOver:
      game.maxScore = max(game.score,game.maxScore);
      background('black');
      waitingMusic.start();
      fill('rgb(175,0,0)');
      textSize(40);
      textAlign(CENTER);
      text("Game Over! You lose!",300,200);
      textSize(35);
      text("Score: " + game.score,300,270);
      text("Max Score: " + game.maxScore,300,320);
      text("Press any key to restart",300,400);
      break;
    case GameState.Start:
      background('rgb(0, 150, 255)');
      fill(255);
      textSize(30);
      textAlign(CENTER);
      text("There's ants on the carpet!",300,250);
      text("Click each one to squish it!",300,300)
      textSize(30);
      text("Press any key to start",300,400);
      break;
    case GameState.YouWin:
      game.maxScore = max(game.score,game.maxScore);
      waitingMusic.start();
      background('rgb(0, 150, 0)');
      fill(255);
      textSize(40);
      textAlign(CENTER);
      text("Game Over! You win!",300,200);
      textSize(35);
      text("Score: " + game.score,300,270);
      text("Max Score: " + game.maxScore,300,320);
      text("Press any key to restart",300,400);
      break;
  }
  
}

function keyPressed() {
  switch(game.state) {
    case GameState.Start:
      normalInGameMusic.start();
      Tone.Transport.start();
      game.state = GameState.Playing;
      break;
    case GameState.GameOver:
      reset();
      waitingMusic.stop();
      normalInGameMusic.start();
      game.state = GameState.Playing;
      break;
    case GameState.YouWin:
      reset();
      waitingMusic.stop();
      normalInGameMusic.start();
      game.state = GameState.Playing;
      break;
  }
}

function mousePressed() {
  switch(game.state) {
    case GameState.Playing:
      for (let i=0; i < animations.length; i++) {
        let contains = animations[i].contains(mouseX,mouseY);
        if (contains) {
          if (animations[i].moving != 0) {
            sounds.player("Bug Splat").start(0);
            antClicked = true;
            animations[i].stop();
            game.score += 1;
            overallSpeed += 0.1;
            spritesClicked += 1;
          }
        }
      }
      if (antClicked === false) {
        sounds.player("Miss").start(0);
      }
      antClicked = false;
      break;
  }
}



class WalkingAnimation {
  constructor(spritesheet, sw, sh, dx, dy, animationLength, speed, framerate, vertical = false, offsetX = 0, offsetY = 0) {
    this.spritesheet = spritesheet;
    this.sw = sw;
    this.sh = sh;
    this.dx = dx;
    this.dy = dy;
    this.u = 0;
    this.v = 0;
    this.animationLength = animationLength;
    this.currentFrame = 0;
    this.moving = 1;
    this.xDirection = 1;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.speed = speed;
    this.framerate = framerate*speed;
    this.vertical = vertical;
  }

  draw() {
    this.u = (this.moving != 0) ? this.currentFrame % this.animationLength : this.u;
    push();
    translate(this.dx,this.dy);
    if (this.vertical)
      rotate(90);
    scale(this.xDirection,1);

    image(this.spritesheet,0,0,this.sw,this.sh,this.u*this.sw+this.offsetX,this.v*this.sh+this.offsetY,this.sw,this.sh);
    pop();
    let proportionalFramerate = round(frameRate() / this.framerate);
    if (frameCount % proportionalFramerate == 0) {
      this.currentFrame++;
    }
  
    if (this.vertical) {
      this.dy += this.moving*this.speed*overallSpeed;
      this.move(this.dy,this.sw / 4,height - this.sw / 4);
    }
    else {
      this.dx += this.moving*this.speed*overallSpeed;
      this.move(this.dx,this.sw / 4,width - this.sw / 4);
    }

    
  }

  move(position,lowerBounds,upperBounds) {
    if (position > upperBounds) {
      this.moveLeft();
    } else if (position < lowerBounds) {
      this.moveRight();
    }
  }

  moveRight() {
    this.moving = 1;
    this.xDirection = 1;
    this.v = 0;
  }

  moveLeft() {
    this.moving = -1;
    this.xDirection = -1;
    this.v = 0;
  }

  keyPressed(right, left) {
    if (keyCode === right) {
      
      this.currentFrame = 1;
    } else if (keyCode === left) {

      this.currentFrame = 1;
    }
  }

  keyReleased(right,left) {
    if (keyCode === right || keyCode === left) {
      this.moving = 0;
    }
  }

  contains(x,y) {
    let insideX = x >= this.dx - 25 && x <= this.dx + 25;
    let insideY = y >= this.dy - 20 && y <= this.dy + 20;
    return insideX && insideY;
  }

  stop() {
    this.moving = 0;
    this.u = 0;
    this.v = 1;
  }
}