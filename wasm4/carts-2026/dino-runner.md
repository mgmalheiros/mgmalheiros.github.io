---
author: Gabriel Ortega, Vinicius Kondo
date: 2026-07-10
---

# DINO RUNNER

A endless runner game inspired by the Chrome offline dinosaur game, built for the WASM-4 fantasy console.

## 🎮 About the Game

Jump, duck, and dodge obstacles in this fast-paced retro-style runner! Control the dinosaur as it runs through a prehistoric landscape, avoiding cacti, rocks, and flying creatures. How far can you go?

## 🕹️ Controls

| Key | Action |
|-----|--------|
| **↑** or **Z** or **Space** | Jump (hold for higher jump) |
| **↓** | Duck (reduces hitbox) |
| **↑** (Title Screen) | Start Game |
| **↑** (Game Over) | Restart |

## 🦕 Features

- **3 Lives**: You start with 3 lives. Each collision costs 1 life.
- **Progressive Difficulty**: Speed increases every 3 seconds, making obstacles appear more frequently.
- **Dynamic Obstacles**: 6 different types of obstacles including small/big/double cacti, rocks, pterodactyls, and birds.
- **High Score**: Your best score is saved during the session.
- **Parallax Background**: Mountains and clouds move at different speeds for depth effect.
- **Dino Animation**: Running, jumping, ducking, and surprised sprites.

## 📊 Scoring System

| Action | Points |
|--------|--------|
| Dodge an obstacle | 10 + (speed × 2) |
| Survival bonus (every ~3 seconds) | +50 points |

## 🎨 Visual Style

The game uses a custom Game Boy-inspired color palette:
- White (#f8f8f8)
- Light Green (#a0c070)
- Medium Green (#407040)
- Dark Green (#082018)

## 🛠️ Technical Details

- **Platform**: WASM-4 Fantasy Console
- **Language**: C
- **Resolution**: 160×160 pixels
- **Color Depth**: 4 colors (1-bit sprites)
- **Sprites**: 8×8 and 8×12 pixel art

## 🚀 How to Play

1. Press **x** on the title screen to start
2. Press **x** to jump over ground obstacles
3. Press **↓** to duck under flying obstacles
4. Press **x** (hold) to jump higher
5. Survive as long as possible and beat your high score!

## 💀 Game Over

When you lose all 3 lives, the game ends. Your final score will be displayed and compared to your high score. Press **↑** to restart.

## 📝 Tips

- **Hold the jump button** to gain extra height!
- **Duck** to avoid birds and pterodactyls
- The game speed increases gradually - stay alert!
- Watch the pattern - sometimes obstacles spawn in pairs

---

*Created with profissionalism using WASM-4*

[Download WASM-4](https://wasm4.org)
