---
author: Lorenzo Henrique Zanetti <lorenzohz>, Matheus Cenerini Jacomini <Mathayuz>
date: 2025-07-12
---

# WASM Invaders

A classic arcade shooter, inspired by the classic Space Invaders and reimagined in C for the fantasy console [WASM-4](https://wasm4.org).

![Gameplay Screenshot](wasminvaders.png)

## Description

Pilot your ship at the bottom of the screen and defend the galaxy against swarms of descendant aliens. Fight through endless waves of invaders that become faster and more numerous with each level. Accumulate a high score and show off your skills in this retro-inspired shooter!

## Features

- Endless waves with progressive difficulty.

- Classic alien formation movement.

- Score and wave counter in the interface.

- Particle effects and sounds for action feedback.

- Animated background with parallax effect.

- Custom sprites, color palette, and victory jingle.

- Developed in C, without dependencies on standard libraries.

## Controls

| Action | Keyboard | Gamepad |
| :------------ | :--------------------- | :----------------- |
| Move Ship | Left/Right Arrows | Left/Right D-Pad |
| Shoot | X or Space | Button 1 |
| Start Game | Space or Click | Button 1 |

## Compiling

This project uses the standard WASM-4 compilation system. Make sure you have the [WASM-4 tools configured](https://wasm4.org/docs/getting-started/setup?code-lang=c#quickstart).

To compile the cartridge, run:

```shell
make
```

To run the game, use the command:

```shell
w4 run build/cart.wasm
```
