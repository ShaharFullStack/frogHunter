// File: /js/objects.js

function createPlayer() {
    player = new THREE.Group();
    player.position.copy(camera.position);
    player.userData.velocity = new THREE.Vector3();
    player.userData.height = GAME_CONFIG.playerHeight;
    scene.add(player);

    // Flashlight
    flashlight = new THREE.SpotLight(0xffffff, 2, 1000, Math.PI / 2, 0.5, 1);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, 1);
    flashlight.visible = false;
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    // טעינת הדמות והאנימציות שלה
    const loader = new THREE.FBXLoader();
    loader.load('animations/Idle.fbx', (fbx) => {
        character = fbx;
        character.scale.set(1, 1, 1); // התאמת גודל הדמות
        character.position.set(200, getTerrainHeight(100, -200), -200);
        scene.add(character);
    
        // ניהול אנימציות
        const mixer = new THREE.AnimationMixer(character);
        character.userData.mixer = mixer;
        
        // Create the idle animation and set it as default
        const idleAction = mixer.clipAction(fbx.animations[0]);
        character.userData.idleAction = idleAction;
    
        // Setup animation tracking properties
        character.userData.currentAction = idleAction;
        character.userData.animationState = 'idle';
        character.userData.velocity = new THREE.Vector3();
        
        // Start the idle animation
        idleAction.play();
        
        // Create animation transition function
        character.userData.fadeToAction = function(newAction, duration = 0.2) {
            if (character.userData.currentAction === newAction) return;
            
            character.userData.transitionInProgress = true;
            
            if (character.userData.currentAction) {
                character.userData.currentAction.fadeOut(duration);
            }
            
            newAction.reset().fadeIn(duration).play();
            character.userData.currentAction = newAction;
            
            // Clear transition flag after duration
            setTimeout(() => {
                character.userData.transitionInProgress = false;
            }, duration * 1000);
        };
    
        // טעינת אנימציית Run
        loader.load('animations/Run.fbx', (fbxRun) => {
            const runAction = mixer.clipAction(fbxRun.animations[0]);
            // Pre-configure the animation to loop and remove pauses
            runAction.setLoop(THREE.LoopRepeat);
            runAction.clampWhenFinished = false;
            runAction.timeScale = 1;
            character.userData.runAction = runAction;
        });
    
        // טעינת אנימציית Jump
        loader.load('animations/Jump.fbx', (fbxJump) => {
            const jumpAction = mixer.clipAction(fbxJump.animations[0]);
            // For jump animation, we might want to only play it once
            jumpAction.setLoop(THREE.LoopOnce);
            jumpAction.clampWhenFinished = true;
            character.userData.jumpAction = jumpAction;
        });
    

        character.userData.mixer = mixer;
        character.userData.idleAction = idleAction;
        setupCharacterAnimations(character, mixer);
        character.userData.velocity = new THREE.Vector3();
    });
}

function setupCharacterAnimations(character, mixer) {
    // Store animation states
    character.userData.currentAction = null;
    character.userData.animationState = 'idle';
    character.userData.transitionInProgress = false;
    
    // Animation crossfade function
    character.userData.fadeToAction = function(newAction, duration = 0.2) {
        if (character.userData.currentAction === newAction) return;
        
        character.userData.transitionInProgress = true;
        
        if (character.userData.currentAction) {
            character.userData.currentAction.fadeOut(duration);
        }
        
        newAction.reset().fadeIn(duration).play();
        character.userData.currentAction = newAction;
        
        // Clear transition flag after duration
        setTimeout(() => {
            character.userData.transitionInProgress = false;
        }, duration * 1000);
    };
}



function createAudio() {
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    backgroundMusic = new THREE.Audio(audioListener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('nintendo.mp3', function (buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(0.5);
    });

    collectSound = new THREE.Audio(audioListener);
    audioLoader.load('./sound/collect.mp3', function (buffer) {
        collectSound.setBuffer(buffer);
        collectSound.setVolume(0.5);
    });

    hitSound = new THREE.Audio(audioListener);
    audioLoader.load('./sound/hit.mp3', function (buffer) {
        hitSound.setBuffer(buffer);
        hitSound.setVolume(0.5);
    });

    shootSound = new THREE.Audio(audioListener);
    audioLoader.load('./sound/shot.mp3', function (buffer) {
        shootSound.setBuffer(buffer);
        shootSound.setVolume(0.5);
    });

    jumpSound = new THREE.Audio(audioListener);
    audioLoader.load('./sound/jump.mp3', function (buffer) {
        jumpSound.setBuffer(buffer);
        jumpSound.setVolume(0.5);
    });
}

function createGameObjects() {
    // Stars
    stars = [];
    for (let i = 0; i < GAME_CONFIG.starCount; i++) {
        const star = createStar();
        stars.push(star);
    }

    // Enemies
    enemies = [];
    for (let i = 0; i < GAME_CONFIG.enemyCount; i++) {
        const enemy = createEnemy();
        enemies.push(enemy);
    }

    // Powerups
    powerups = [];
    for (let i = 0; i < GAME_CONFIG.powerupCount; i++) {
        const powerup = createPowerup();
        powerups.push(powerup);
    }

    // Trees
    trees = [];
    for (let i = 0; i < GAME_CONFIG.treeCount; i++) {
        const tree = createTree();
        trees.push(tree);
    }

    // Flowers
    flowers = [];
    for (let i = 0; i < GAME_CONFIG.flowerCount; i++) {
        const flower = createFlower();
        flowers.push(flower);
    }

    // Birds
    birds = [];
    for (let i = 0; i < GAME_CONFIG.birdCount; i++) {
        const bird = createBird();
        birds.push(bird);
    }

    // Fish
    fish = [];
    for (let i = 0; i < GAME_CONFIG.fishCount; i++) {
        const fishEntity = createFish();
        // הכנסנו את ה־push ל־createFish, כך שזה קורה אוטומטית.
    }
}

function createStar() {
    const geometry = new THREE.OctahedronGeometry(20, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    const star = new THREE.Mesh(geometry, material);

    let x, y, z;
    do {
        x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        y = getTerrainHeight(x, z) + 100 + Math.random() * 200;
    } while (y < water.position.y);

    star.position.set(x, y, z);
    star.userData = {
        baseY: y,
        timeOffset: Math.random() * Math.PI * 2
    };

    // Glow
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            "c": { value: 0.1 },
            "p": { value: 6.0 },
            glowColor: { value: new THREE.Color(0xffff00) },
            viewVector: { value: new THREE.Vector3() }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normal);
                vec3 vNormel = normalize(viewVector);
                intensity = pow(c - dot(vNormal, vNormel), p);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 32), glowMaterial);
    star.add(glowMesh);

    // Light
    const light = new THREE.PointLight(0xffff00, 1, 100);
    light.intensity = 0.5;
    star.add(light);

    scene.add(star);
    return star;
}

function createEnemy() {
    const types = [
        { name: 'basic', color: 0xff0000, size: 40, health: 50, speed: 100, detectionRange: 500 },
        { name: 'fast',  color: 0xff6600, size: 30, health: 30, speed: 200, detectionRange: 600 },
        { name: 'tank',  color: 0x660000, size: 60, health: 100, speed: 50, detectionRange: 400 }
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    let geometry, material, enemy;
    switch (type.name) {
        case 'basic':
        case 'fast':
            geometry = new THREE.ConeGeometry(type.size / 2, type.size, 8);
            material = new THREE.MeshStandardMaterial({ color: type.color });
            enemy = new THREE.Mesh(geometry, material);
            enemy.rotation.x = Math.PI / 2;
            break;
        case 'tank':
            geometry = new THREE.SphereGeometry(type.size / 2, 16, 16);
            material = new THREE.MeshStandardMaterial({ color: type.color });
            enemy = new THREE.Mesh(geometry, material);
            // Spikes
            const spikeGeometry = new THREE.ConeGeometry(10, 20, 8);
            const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            for (let i = 0; i < 8; i++) {
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                const angle = (i / 8) * Math.PI * 2;
                spike.position.set(
                    Math.cos(angle) * (type.size / 2 + 5),
                    Math.sin(angle) * (type.size / 2 + 5),
                    0
                );
                spike.rotation.z = -angle + Math.PI / 2;
                enemy.add(spike);
            }
            break;
    }

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(type.size / 10, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-type.size / 4, type.size / 4, type.size / 2);
    enemy.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(type.size / 4, type.size / 4, type.size / 2);
    enemy.add(rightEye);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(type.size / 20, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0, 0, type.size / 20);
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0, 0, type.size / 20);
    rightEye.add(rightPupil);

    // Random pos
    let x, y, z;
    do {
        x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        y = getTerrainHeight(x, z);
    } while (player.position.distanceTo(new THREE.Vector3(x, y, z)) < 500);

    enemy.position.set(x, y + type.size / 2, z);
    enemy.userData = {
        type: type.name,
        health: type.health,
        speed: type.speed,
        detectionRange: type.detectionRange,
        state: 'patrolling',
        height: type.size / 2,
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            0,
            (Math.random() - 0.5) * 100
        )
    };

    scene.add(enemy);
    return enemy;
}

function createPowerup() {
    const types = [
        { name: 'health', color: 0x00ff00 },
        { name: 'speed',  color: 0x00ffff },
        { name: 'time',   color: 0xffff00 },
        { name: 'shield', color: 0x0000ff }
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    const geometry = new THREE.IcosahedronGeometry(20, 0);
    const material = new THREE.MeshStandardMaterial({
        color: type.color,
        emissive: type.color,
        emissiveIntensity: 0.5,
        metalness: 1.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8
    });
    const powerup = new THREE.Mesh(geometry, material);

    let x, y, z;
    do {
        x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        y = getTerrainHeight(x, z) + 50 + Math.random() * 100;
    } while (y < water.position.y);

    powerup.position.set(x, y, z);
    powerup.userData = {
        type: type.name,
        baseY: y,
        timeOffset: Math.random() * Math.PI * 2
    };

    // Light
    const light = new THREE.PointLight(type.color, 1, 100);
    light.intensity = 0.5;
    powerup.add(light);

    scene.add(powerup);
    return powerup;
}

function createTree() {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(10, 15, 100, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(50, 100, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 80;
    leaves.name = 'leaves';

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);

    let x, z, y;
    do {
        x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        y = getTerrainHeight(x, z);
    } while (y < water.position.y);

    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    return tree;
}

function createFlower() {
    const colors = [0xFF69B4, 0xFF1493, 0xFFD700, 0xFF4500, 0x9932CC, 0x00FFFF];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(1, 1, 30, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);

    // Flower
    const flowerGeometry = new THREE.SphereGeometry(5, 8, 8);
    const flowerMaterial = new THREE.MeshStandardMaterial({ color: color });
    const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
    flower.position.y = 20;

    // Petals
    const petalCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalGeometry = new THREE.SphereGeometry(4, 8, 4);
        petalGeometry.translate(0, 0, 7);
        const petalMaterial = new THREE.MeshStandardMaterial({ color: color });
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.rotation.y = angle;
        flower.add(petal);
    }

    const flowerGroup = new THREE.Group();
    flowerGroup.add(stem);
    flowerGroup.add(flower);

    let x, z, y;
    do {
        x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
        y = getTerrainHeight(x, z);
    } while (y < water.position.y);

    flowerGroup.position.set(x, y, z);
    scene.add(flowerGroup);
    return flowerGroup;
}

function createBird() {
    const colors = [0xFF0000, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Body
    const bodyGeometry = new THREE.SphereGeometry(15, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Head
    const headGeometry = new THREE.SphereGeometry(10, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 15;
    head.position.y = 5;

    // Beak
    const beakGeometry = new THREE.ConeGeometry(5, 10, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA500 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.z = 20;
    beak.rotation.x = -Math.PI / 2;

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(2, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(5, 8, 18);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-5, 8, 18);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(1, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 1;
    leftEye.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 1;
    rightEye.add(rightPupil);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(30, 5, 20);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: color });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(20, 0, 0);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(-20, 0, 0);

    // Tail
    const tailGeometry = new THREE.BoxGeometry(10, 5, 15);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: color });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, -15);

    const bird = new THREE.Group();
    bird.add(body, head, beak, leftEye, rightEye, leftWing, rightWing, tail);

    bird.position.set(
        (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8,
        400 + Math.random() * 400,
        (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8
    );
    bird.userData = {
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 100
        ),
        wingTime: Math.random() * Math.PI * 2
    };
    scene.add(bird);
    return bird;
}

function createFish() {
    const colors = [0xFF0000, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Body
    const bodyGeometry = new THREE.SphereGeometry(15, 16, 16);
    bodyGeometry.scale(1, 0.7, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(10, 20, 4);
    tailGeometry.rotateY(Math.PI / 4);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: color });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = -20;

    // Fins
    const finGeometry = new THREE.BoxGeometry(20, 2, 10);
    const finMaterial = new THREE.MeshStandardMaterial({ color: color });
    const topFin = new THREE.Mesh(finGeometry, finMaterial);
    topFin.position.set(0, 10, 0);
    topFin.rotation.z = Math.PI / 4;
    const leftFin = new THREE.Mesh(finGeometry, finMaterial);
    leftFin.position.set(15, 0, 0);
    leftFin.rotation.z = Math.PI / 2;
    const rightFin = new THREE.Mesh(finGeometry, finMaterial);
    rightFin.position.set(-15, 0, 0);
    rightFin.rotation.z = -Math.PI / 2;

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(3, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(10, 5, 10);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-10, 5, 10);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 1;
    leftEye.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 1;
    rightEye.add(rightPupil);

    // Group
    const fishObj = new THREE.Group();
    fishObj.add(body, tail, topFin, leftFin, rightFin, leftEye, rightEye);

    let x, y, z;
    x = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
    z = (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.8;
    y = Math.max(getTerrainHeight(x, z), water.position.y - 200);
    y = Math.min(y, water.position.y - 10);

    fishObj.position.set(x, y, z);
    fishObj.userData = {
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 50
        ),
        tailTime: Math.random() * Math.PI * 2
    };

    scene.add(fishObj);
    fish.push(fishObj);
    return fishObj;
}