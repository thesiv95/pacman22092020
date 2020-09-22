import { LEVEL, OBJECT_TYPE } from "./setup";
import { randomMovement } from "./ghostMoves";

// Classes
import GameBoard from "./GameBoard";
import Pacman from "./Pacman";
import Ghost from "./Ghost";

// sounds
import soundDot from "./sounds/munch.wav";
import soundPill from "./sounds/pill.wav";
import soundGameStart from "./sounds/game_start.wav";
import soundGameOver from "./sounds/death.wav";
import soundGhost from "./sounds/eat_ghost.wav";

// dom elements
const gameGrid = document.querySelector("#game");
const scoreTable = document.querySelector("#score");
const startButton = document.querySelector("#start-button");
const speedControl = document.querySelector("#speed-control");
const speedControlLabel = document.querySelector("#speed-control-label");

// game constants
const POWER_PILL_TIME = 10000; // ms
const GLOBAL_SPEED = 80; // ms
const gameBoard = GameBoard.createGameBoard(gameGrid, LEVEL);

// initial setup
let score = 0;
let timer = null;
let gameWin = false;
let powerPillActive = false;
let powerPillTimer = null;

// Audio
function playAudio(audio) {
  const soundEffect = new Audio(audio);
  soundEffect.play();
}

function gameOver(pacman, grid) {
  playAudio(soundGameOver);
  document.removeEventListener("keydown", (e) =>
    pacman.handleKeyInput(e, gameGrid.objectExist.bind(gameBoard)),
  );

  gameBoard.showGameStatus(gameWin);

  clearInterval(timer);

  startButton.classList.remove("hide");
  speedControl.classList.remove("hide");
  speedControlLabel.classList.remove("hide");
}

function checkCollision(pacman, ghosts) {
  const collidedGhost = ghosts.find((ghost) => pacman.pos === ghost.pos);

  if (collidedGhost) {
    // returns undefined if didn't find
    if (pacman.powerPill) {
      playAudio(soundGhost);

      gameBoard.removeObject(collidedGhost.pos, [
        OBJECT_TYPE.GHOST,
        OBJECT_TYPE.SCARED,
        collidedGhost.name,
      ]);
      ghosts.pop();
      collidedGhost.pos = collidedGhost.startPos;
      score += 100;
    } else {
      gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
      gameBoard.rotateDiv(pacman.pos, 0);
      gameOver(pacman, gameGrid);
    }
  }
}

function gameLoop(pacman, ghosts) {
  gameBoard.moveCharacter(pacman);
  checkCollision(pacman, ghosts);

  ghosts.forEach((ghost) => gameBoard.moveCharacter(ghost));
  checkCollision(pacman, ghosts);

  // Check if Pacman eats a dot
  if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.DOT)) {
    playAudio(soundDot);
    gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.DOT]);
    gameBoard.dotCount--;
    score += 10;
  }

  // Check if Pacman eats the powerpill
  if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.PILL)) {
    playAudio(soundPill);

    gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PILL]);

    pacman.powerPill = true;
    score += 50;

    clearTimeout(powerPillTimer);
    powerPillTimer = setTimeout(
      () => (pacman.powerPill = false),
      POWER_PILL_TIME,
    );
  }

  // change ghost scare mode depending on powerpill
  if (pacman.powerPill !== powerPillActive) {
    powerPillActive = pacman.powerPill;
    ghosts.forEach((ghost) => (ghost.isScared = pacman.powerPill));
  }

  // check if all dots have been eaten
  if (gameBoard.dotCount === 0) {
    gameWin = true;
    gameOver(pacman, ghosts);
  }

  // check if all ghosts have been eaten
  if (!ghosts.length) {
    gameWin = true;
    gameOver(pacman, ghosts);
  }

  // show the score
  scoreTable.innerHTML = score;
}

function startGame() {
  playAudio(soundGameStart);

  gameWin = false;
  powerPillActive = false;
  score = 0;

  startButton.classList.add("hide");
  speedControl.classList.add("hide");
  speedControlLabel.classList.add("hide");

  gameBoard.createGrid(LEVEL);
  const pacman = new Pacman(parseInt(speedControl.value), 287);
  gameBoard.addObject(287, [OBJECT_TYPE.PACMAN]);
  document.addEventListener("keydown", (e) =>
    pacman.handleKeyInput(e, gameBoard.objectExist.bind(gameBoard)),
  );

  const ghosts = [
    new Ghost(5, 188, randomMovement, OBJECT_TYPE.BLINKY),
    new Ghost(4, 209, randomMovement, OBJECT_TYPE.PINKY),
    new Ghost(3, 230, randomMovement, OBJECT_TYPE.INKY),
    new Ghost(2, 251, randomMovement, OBJECT_TYPE.CLYDE),
  ];

  timer = setInterval(() => gameLoop(pacman, ghosts), GLOBAL_SPEED);
}

// initialize game
startButton.addEventListener("click", startGame);
