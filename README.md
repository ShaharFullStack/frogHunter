# Adventure World Game

## Overview

Adventure World is an immersive 3D exploration game built with Three.js. Navigate through a procedurally generated landscape featuring dynamic day/night cycles, weather effects, and interactive elements. Collect stars, avoid enemies, and discover power-ups in this open-world adventure.

![Adventure World Game Screenshot](screenshot.jpg)

## Features

- **Procedurally Generated Terrain**: Every game presents a unique landscape with mountains, valleys, and bodies of water
- **Dynamic Environment**: Experience day/night cycles, weather systems, and atmospheric effects
- **Rich Ecosystem**: Encounter trees, flowers, birds, and fish throughout the world
- **Interactive Gameplay**: Collect stars, avoid or fight enemies, and find power-ups
- **Multiple Camera Modes**: Switch between first-person and third-person perspectives
- **Physics & Collisions**: Realistic movement with jumping, gravity, and collision detection
- **3D Character Animations**: Character model with running, jumping, and idle animations
- **Sound Effects & Music**: Immersive audio experience with spatial sound

## Installation

### Prerequisites

- A modern web browser with WebGL support (Chrome, Firefox, Safari, or Edge recommended)
- Local web server for development (optional but recommended)

### Option 1: Quick Start

1. Download the latest release from the [releases page](https://github.com/yourusername/adventure-world/releases)
2. Extract the ZIP file to a location of your choice
3. Open `index.html` in your web browser

### Option 2: Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/adventure-world.git
   ```

2. Navigate to the project directory:
   ```
   cd adventure-world
   ```

3. Start a local web server. For example, using Python:
   ```
   # Python 3.x
   python -m http.server
   
   # Python 2.x
   python -m SimpleHTTPServer
   ```

4. Open your browser and navigate to `http://localhost:8000`

## How to Play

### Controls

- **W, A, S, D**: Move forward, left, backward, right
- **Mouse**: Look around
- **Space**: Jump
- **Left Mouse Button**: Shoot
- **F**: Toggle flashlight
- **C**: Switch camera mode
- **ESC**: Pause game

### Gameplay

1. **Objective**: Collect all stars in each level to progress
2. **Health**: Avoid enemies and stay out of water to maintain health
3. **Power-ups**:
   - **Green** (Health): Restores health
   - **Cyan** (Speed): Temporarily increases movement speed
   - **Yellow** (Time): Adds extra time to the clock
   - **Blue** (Shield): Temporary invincibility

## Technical Architecture

The game is built with a modular architecture, with each JavaScript file handling specific aspects of the game:

- **config.js**: Game states, configuration settings, and global variables
- **utils.js**: Utility functions for terrain generation and effects
- **environment.js**: Terrain, water, sky, and environmental elements
- **objects.js**: Game objects like player, enemies, stars, trees, etc.
- **game.js**: Core game loop, player controls, and state management
- **debug.js**: Development tools and performance monitoring

### Dependencies

- [Three.js](https://threejs.org/): 3D graphics library
- [Stats.js](https://github.com/mrdoob/stats.js/): Performance monitoring
- [FBXLoader](https://threejs.org/docs/#examples/en/loaders/FBXLoader): For loading character animations

## Configuration

The game can be customized by modifying the `GAME_CONFIG` object in `config.js`:

```javascript
const GAME_CONFIG = {
    // World dimensions
    worldWidth: 256,
    worldDepth: 256,
    worldScale: 15000,
    terrainHeight: 10,
    
    // Player settings
    playerHeight: 200,
    playerSpeed: 400,
    jumpHeight: 350,
    gravity: 1.8,
    
    // Game mechanics
    dayDuration: 300, // seconds for a day/night cycle
    
    // Object counts
    starCount: 7,
    enemyCount: 10,
    powerupCount: 5,
    rainDropCount: 50,
    treeCount: 50,
    flowerCount: 100,
    birdCount: 10,
    fishCount: 15,
    
    // Camera settings
    minZoomDistance: -150,
    maxZoomDistance: -20,
    cameraOffset: { x: 0, y: 50, z: -150 }
};
```

Adjusting these values allows you to change the world size, difficulty, and visual density.

## Troubleshooting

### Common Issues

1. **Game doesn't load or loads with errors**:
   - Ensure all JavaScript files are properly included in the correct order
   - Check for any console errors in your browser's developer tools
   - Try clearing your browser cache and reloading

2. **Performance issues (low FPS)**:
   - Reduce object counts in `GAME_CONFIG` (especially stars, enemies, trees)
   - Close other browser tabs and applications
   - Try a different browser

3. **Missing character animations**:
   - Verify that the FBX animation files are in the correct location (`animations/Idle.fbx`, etc.)
   - Check for console errors related to FBXLoader
   - Ensure the fflate library is loaded before FBXLoader

4. **Sound issues**:
   - Make sure sound files exist in the correct locations
   - Some browsers require user interaction before playing audio
   - Check if your browser has audio permissions for the page

### Debug Mode

The game includes a built-in debug mode that can help identify issues:

1. Press **Ctrl+Shift+D** to toggle debug mode
2. Debug visualization will show:
   - Axis helpers and grid
   - Performance metrics
   - Object positions and counts
   - Terrain information

## Credits

- Game Engine: Three.js (https://threejs.org/)
- 3D Models & Animations: [Source/Creator]
- Sound Effects: [Source/Creator]
- Background Music: [Source/Creator]
- Development: [Your Name/Team]

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

[Your Name] - [email@example.com]

Project Link: [https://github.com/yourusername/adventure-world](https://github.com/yourusername/adventure-world)
