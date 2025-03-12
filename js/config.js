// File: /js/config.js

// Game state and configuration
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

const CAMERA_MODES = {
    FIRST_PERSON: 'FPS',
    THIRD_PERSON: 'TPS',
    FAR_THIRD_PERSON: 'FAR_TPS'
};

// Default camera offsets for each mode
const CAMERA_OFFSETS = {
    [CAMERA_MODES.FIRST_PERSON]: { x: 0, y: 20, z: 0 },
    [CAMERA_MODES.THIRD_PERSON]: { x: 0, y: 50, z: -150 },
    [CAMERA_MODES.FAR_THIRD_PERSON]: { x: 0, y: 120, z: -300 }
};

const GAME_CONFIG = {
    worldWidth: 256,
    worldDepth: 256,
    worldScale: 15000,
    terrainHeight: 10,
    playerHeight: 200,
    playerSpeed: 400,
    jumpHeight: 350,
    gravity: 1.8,
    dayDuration: 300, // seconds for a day/night cycle
    starCount: 7,      // instead of 25
    enemyCount: 10,     // instead of 15
    powerupCount: 5,    // instead of 10
    rainDropCount: 50,  // instead of 200
    treeCount: 50,      // instead of 100
    flowerCount: 100,   // instead of 200
    birdCount: 10,      // instead of 20
    fishCount: 15,
    minZoomDistance: -150,  // Zoomed out (farther away)
    maxZoomDistance: -20,   // Zoomed in (closer)
    cameraOffset:  { x: 0, y: 50, z: -150 }
};

// Game variables
let container, stats, scoreElement, healthElement, levelElement, timerElement, messageElement;
let camera, controls, scene, renderer;
let mesh, texture, water, sky, sun;
let stars = [], rainDrops = [], clouds = [], trees = [], flowers = [], birds = [], fish = [];
let enemies = [], powerups = [], projectiles = [];
let player, flashlight, character;
let score = 0, health = 100, level = 1, timeRemaining = 180;
let gameState = GAME_STATES.MENU;
let keyboard = {};
let mousePosition = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let clock = new THREE.Clock();
let deltaTime = 0, elapsedTime = 0;
let isShooting = false, canJump = true, isUnderwater = false;
let dayTime = 0;
let ambientLight, directionalLight, pointLights = [];
let audioListener, backgroundMusic, collectSound, hitSound, shootSound, jumpSound;
let loadingManager, assetLoader;
let currentCameraMode = CAMERA_MODES.THIRD_PERSON;
let models = {}, textures = {};

// Export to global scope - CRITICAL FOR MAKING THE GAME WORK
window.GAME_STATES = GAME_STATES;
window.GAME_CONFIG = GAME_CONFIG;

window.CAMERA_MODES = CAMERA_MODES;
window.CAMERA_OFFSETS = CAMERA_OFFSETS;
window.currentCameraMode = currentCameraMode;

// Make all variables accessible from the global scope
window.container = container;
window.stats = stats;
window.scoreElement = scoreElement;
window.healthElement = healthElement;
window.levelElement = levelElement;
window.timerElement = timerElement;
window.messageElement = messageElement;

window.camera = camera;
window.controls = controls;
window.scene = scene;
window.renderer = renderer;

window.mesh = mesh;
window.texture = texture;
window.water = water;
window.sky = sky;
window.sun = sun;

window.stars = stars;
window.rainDrops = rainDrops;
window.clouds = clouds;
window.trees = trees;
window.flowers = flowers;
window.birds = birds;
window.fish = fish;

window.enemies = enemies;
window.powerups = powerups;
window.projectiles = projectiles;

window.player = player;
window.flashlight = flashlight;
window.character = character;

window.score = score;
window.health = health;
window.level = level;
window.timeRemaining = timeRemaining;
window.gameState = gameState;

window.keyboard = keyboard;
window.mousePosition = mousePosition;
window.raycaster = raycaster;
window.clock = clock;
window.deltaTime = deltaTime;
window.elapsedTime = elapsedTime;

window.isShooting = isShooting;
window.canJump = canJump;
window.isUnderwater = isUnderwater;
window.dayTime = dayTime;

window.ambientLight = ambientLight;
window.directionalLight = directionalLight;
window.pointLights = pointLights;

window.audioListener = audioListener;
window.backgroundMusic = backgroundMusic;
window.collectSound = collectSound;
window.hitSound = hitSound;
window.shootSound = shootSound;
window.jumpSound = jumpSound;

window.loadingManager = loadingManager;
window.assetLoader = assetLoader;
window.models = models;
window.textures = textures;

window.switchCameraMode = switchCameraMode;
window.updateCameraPosition = updateCameraPosition;

console.log("Config loaded, GAME_STATES and GAME_CONFIG available globally");