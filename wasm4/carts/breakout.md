---
author: Guilherme Grecco Bononi, Guilherme da Silva Nascimento
github: none
date: 2025-07-31
---

# Breakout

A modern take on the classic Breakout arcade game, built for the WASM-4 console. Experience enhanced gameplay with dynamic power-ups, progressive difficulty scaling, and advanced audio-visual effects.

## Game Overview

Navigate your paddle to bounce the ball and destroy all blocks on the screen. Progress through 50 challenging levels with increasing difficulty, unlock powerful abilities, and master the art of precision timing and strategic positioning.

## Controls

### Basic Movement
- **Arrow Keys (Left/Right)**: Move paddle horizontally
- **X Key**: Rotate paddle counter-clockwise (for strategic ball angles)  
- **Z Key**: Rotate paddle clockwise (for strategic ball angles)
- **UP Key**: 
  - Menu: Start game
  - Game Over: Restart
  - Level Complete: Continue to next level
  - During play: Fire laser (when Laser Paddle power-up is active)

### Paddle Mechanics
- Paddle automatically returns to center rotation when rotation keys are released
- Rotation affects ball bounce angle for strategic gameplay
- Maximum rotation is limited to prevent horizontal ball movement

## Power-Up System

Destroy blocks to randomly obtain power-ups with different rarity levels:

### Common Power-ups (40% chance)
- **Bigger Paddle**: Increases paddle width for easier ball control

### Rare Power-ups (35% chance)
- **Multi Ball**: Spawns additional balls for faster block clearing
- **Laser Paddle**: Enables laser shooting with UP key (limited cooldown)
- **Magnetic Paddle**: Attracts the ball for enhanced control

### Epic Power-ups (20% chance)
- **Ball Through Blocks**: Ball passes through blocks, destroying them instantly
- **Shield**: Provides protection at the bottom of the screen

### Legendary Power-ups (5% chance)
- **Golden Ball**: Ultimate ball with enhanced destructive capabilities
- **Block Destroyer**: Instantly destroys multiple blocks in an area

## Level System

### Progression
- **50 Total Levels** with increasing difficulty
- **5 Difficulty Tiers**: Easy (1-5), Medium (6-12), Hard (13-25), Expert (26-40), Nightmare (41-50)

### Dynamic Scaling
- **Ball Speed**: Increases from 1.2 to 3.5 (max) as levels progress
- **Block Density**: Starts at 60% and increases to 95% maximum
- **Strong Blocks**: Ratio increases from 10% to 70%, requiring multiple hits
- **Power-up Frequency**: Decreases from 12% to 3% minimum as difficulty rises

### Block Patterns
Levels feature 10 different block arrangements:
- Simple, Checkerboard, Diamond, Pyramid
- Spiral, Cross, Fortress, Maze
- Waves, Random formations

## Audio System

Enhanced audio experience with:
- **Dynamic Sound Effects**: Menu navigation, ball bounces, block destruction
- **Power-up Audio**: Unique sounds for each power-up activation
- **Progressive Audio**: Sound complexity increases with level difficulty
- **Spatial Audio**: Different tones for different game events

## Technical Features

### Advanced Physics
- Realistic ball physics with rotation-based bounce angles
- Collision detection with pixel-perfect accuracy
- Dynamic ball speed based on paddle movement

### Visual Effects
- Particle systems for block destruction
- Ball trail effects for enhanced visual feedback
- Animation systems for smooth transitions
- Dynamic color schemes based on level difficulty

### Performance Optimization
- Efficient rendering system optimized for WASM-4's 160x160 resolution
- Memory-conscious particle and effect management
- Smooth 60 FPS gameplay experience

## Gameplay Tips

1. **Master Paddle Rotation**: Use Z/X keys to control ball direction strategically
2. **Power-up Strategy**: Save powerful abilities for dense block formations
3. **Corner Shots**: Aim for difficult-to-reach blocks using angled bounces
4. **Speed Management**: Higher levels require precise timing due to increased ball speed
5. **Pattern Recognition**: Learn block patterns to optimize your clearing strategy


Enjoy the enhanced Breakout experience!
