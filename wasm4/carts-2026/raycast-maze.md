---
author: Bruno Rafael Comin Scheffel <brsctoo>, José Luis Peres de Sousa
date: 2026-07-01
---

# Raycast Maze

Find the exit before the timer runs out! A first-person maze game
built with a raycasting engine, running on the WASM-4 fantasy console.

## How to play

Navigate a 3D maze from a first-person view and reach the exit
(the blinking wall) before the countdown hits zero.

- **Arrow Up / Down**: Move forward / backward
- **Arrow Left / Right**: Turn left / right
- **X**: Start the game / confirm
- **Z**: Return to the main menu (during gameplay)

## Features

- Real-time raycasting engine (Wolfenstein-style 3D)
- Three difficulty levels (Easy, Medium, Hard) with larger, denser 32x32 mazes and their own time limits
- Linked portal pair: step into one portal to teleport across the maze, shown with a glitchy animated wall
- A compass that always points north to help you stay oriented
- A countdown timer and sound effects for menus, steps, and events

## Tips

Use the compass in the top-right corner to keep track of direction.
The two portals are a shortcut across the map — find them to save
time on the harder mazes. On Hard, the layout is denser and larger,
so plan your route and watch the clock.
