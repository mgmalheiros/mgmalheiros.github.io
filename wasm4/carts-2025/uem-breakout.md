---
author: Jean Massumi Tamura Aoyagui <Jean-Massumi>
github: 
date: 2025-07-14
---

# UEM Breakout

A clone of the classic Breakout game, developed in C for the fantasy console [WASM-4](https://wasm4.org). 🕹️

The game recreates the timeless arcade experience where the player controls a paddle to hit a ball and break rows of blocks. It features a dynamic ball that reacts to paddle movement and multiple game states, such as menu, game, game over, and victory screen.

## Features

- **Controllable Paddle**: Use the arrow keys to move the paddle at the bottom of the screen.

- **Ball Physics**: The ball bounces off the walls and the paddle. The angle of reflection on the paddle is influenced by the impact location and paddle movement.

- **Destructible Blocks**: A wall of blocks with different colors, each worth a specific score.

- **Game States**: The game has a main menu, game screen, "Game Over" screen, and "Victory" screen.

- **Collision Detection**: Precise collision logic between the ball, blocks, paddle, and walls.

## Controls

- **Left/Right Arrows**: Move the paddle.

- **X Button**: Starts the game in the menu, launches the ball, and restarts the game after "Game Over" or "Victory".

- **Z Button**: Returns to the main menu during the game.

## How to Play

1. On the menu screen, press **X** to start.

2. Use the **directional arrows** to move the paddle.

3. Press **X** to launch the ball.

4. Hit the ball to break the colored blocks at the top.

5. Don't let the ball pass your paddle.

6. The game ends when all blocks are destroyed (victory) or when the ball falls (game over).

## Compiling

To compile the cartridge, run:

```shell
make
```

Then to run:

```shell
w4 run build/UEM-breakout_game.wasm
```
