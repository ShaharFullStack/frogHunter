// File: /js/game.js

// -------------- אירועי ממשק --------------
function setupEventListeners() {
    // שינוי גודל חלון
    window.addEventListener('resize', onWindowResize);

    // מקשי מקלדת
    window.addEventListener('keydown', function (event) {
        keyboard[event.code] = true;

        switch (event.code) {
            case 'Escape':
                togglePause();
                break;
            case 'KeyF':
                toggleFlashlight();
                break;
            case 'Space':
                if (gameState === GAME_STATES.PLAYING && canJump) {
                    jump();
                } else if (
                    gameState === GAME_STATES.MENU ||
                    gameState === GAME_STATES.PAUSED ||
                    gameState === GAME_STATES.GAME_OVER ||
                    gameState === GAME_STATES.LEVEL_COMPLETE
                ) {
                    startGame();
                }
                break;
        }
    });

    window.addEventListener('keyup', function (event) {
        keyboard[event.code] = false;
    });

    // אירועי עכבר
    window.addEventListener('mousemove', function (event) {
        mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', function (event) {
        if (event.button === 0 && gameState === GAME_STATES.PLAYING) {
            isShooting = true;
            shoot();
        }
    });

    window.addEventListener('mouseup', function (event) {
        if (event.button === 0) {
            isShooting = false;
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
}

// -------------- פונקציות מצב המשחק --------------
function showMenu() {
    gameState = GAME_STATES.MENU;
    messageElement.innerHTML =
        'Adventure World<br><br>Press SPACE to start<br>WASD to move<br>MOUSE to look<br>CLICK to shoot<br>F for flashlight<br>ESC to pause';
    messageElement.style.display = 'block';
    const crosshairElem = document.getElementById('crosshair');
    if (crosshairElem) crosshairElem.style.display = 'none';
}

function startGame() {
    resetGame();
    gameState = GAME_STATES.PLAYING;
    messageElement.style.display = 'none';

    const crosshairElem = document.getElementById('crosshair');
    if (crosshairElem) crosshairElem.style.display = 'block';

    if (backgroundMusic.buffer && !backgroundMusic.isPlaying) {
        backgroundMusic.play();
    }
    clock.start();
}

function togglePause() {
    if (gameState === GAME_STATES.PLAYING) {
        gameState = GAME_STATES.PAUSED;
        messageElement.innerHTML = 'Paused<br><br>Press SPACE to continue<br>ESC to resume';
        messageElement.style.display = 'block';

        const crosshairElem = document.getElementById('crosshair');
        if (crosshairElem) crosshairElem.style.display = 'none';

        if (backgroundMusic.isPlaying) {
            backgroundMusic.pause();
        }
    } else if (gameState === GAME_STATES.PAUSED) {
        gameState = GAME_STATES.PLAYING;
        messageElement.style.display = 'none';

        const crosshairElem = document.getElementById('crosshair');
        if (crosshairElem) crosshairElem.style.display = 'block';

        if (backgroundMusic.buffer && !backgroundMusic.isPlaying) {
            backgroundMusic.play();
        }
    }
}

function gameOver() {
    gameState = GAME_STATES.GAME_OVER;
    messageElement.innerHTML = 'Game Over<br><br>Score: ' + score + '<br><br>Press SPACE to restart';
    messageElement.style.display = 'block';

    const crosshairElem = document.getElementById('crosshair');
    if (crosshairElem) crosshairElem.style.display = 'none';

    if (backgroundMusic.isPlaying) {
        backgroundMusic.stop();
    }
}

function levelComplete() {
    gameState = GAME_STATES.LEVEL_COMPLETE;
    level++;
    timeRemaining = 180;
    messageElement.innerHTML =
        'Level ' + (level - 1) + ' Complete!<br><br>Score: ' + score +
        '<br><br>Press SPACE to continue to Level ' + level;
    messageElement.style.display = 'block';

    const crosshairElem = document.getElementById('crosshair');
    if (crosshairElem) crosshairElem.style.display = 'none';
}

function resetGame() {
    score = 0;
    health = 100;
    level = 1;
    timeRemaining = 180;

    // מיקום דמות
    character.position.set(100, getTerrainHeight(100, -800), -800);
    character.userData.velocity.set(0, 0, 0);
    camera.position.copy(character.position).add(GAME_CONFIG.cameraOffset);

    updateUI();
    resetGameObjects();
}

function resetGameObjects() {
    // מחיקת אובייקטים קיימים
    for (let i = stars.length - 1; i >= 0; i--) scene.remove(stars[i]);
    stars = [];

    for (let i = enemies.length - 1; i >= 0; i--) scene.remove(enemies[i]);
    enemies = [];

    for (let i = powerups.length - 1; i >= 0; i--) scene.remove(powerups[i]);
    powerups = [];

    for (let i = projectiles.length - 1; i >= 0; i--) scene.remove(projectiles[i]);
    projectiles = [];

    // יצירת חדשים
    for (let i = 0; i < GAME_CONFIG.starCount; i++) {
        stars.push(createStar());
    }
    for (let i = 0; i < GAME_CONFIG.enemyCount + Math.floor(level / 2); i++) {
        enemies.push(createEnemy());
    }
    for (let i = 0; i < GAME_CONFIG.powerupCount; i++) {
        powerups.push(createPowerup());
    }
}

// -------------- לולאת המשחק --------------
function gameLoop() {
    deltaTime = clock.getDelta();
    elapsedTime += deltaTime;

    switch (gameState) {
        case GAME_STATES.PLAYING:
            updateGame();
            renderGame();
            break;
        case GAME_STATES.MENU:
        case GAME_STATES.PAUSED:
        case GAME_STATES.GAME_OVER:
        case GAME_STATES.LEVEL_COMPLETE:
            // רק רינדור, בלי עדכונים
            renderGame();
            break;
    }

    stats.update();
}

function updateGame() {
    // זמן
    timeRemaining -= deltaTime;
    if (timeRemaining <= 0) {
        gameOver();
        return;
    }

    updateDayNightCycle();
    updateCharacter();
    updateStars();
    updateEnemies();
    updatePowerups();
    updateProjectiles();
    updateEnvironment();
    checkCollisions();
    updateUI();

    // בדיקה אם אספנו את כל הכוכבים
    if (stars.length === 0) {
        levelComplete();
    }
}

function renderGame() {
    // עדכון מים
    if (water) {
        water.material.uniforms['time'].value += deltaTime;
    }

    // שליטה במצלמה
    if (gameState === GAME_STATES.PLAYING) {
        controls.update(deltaTime);
    }

    renderer.render(scene, camera);
}

// -------------- עדכון יום/לילה --------------
function updateDayNightCycle() {
    dayTime += deltaTime / GAME_CONFIG.dayDuration;
    if (dayTime > 1) dayTime -= 1;

    const phi = 2 * Math.PI * (dayTime - 0.5);
    const theta = Math.PI * (0.25 - 0.1 * Math.cos(phi));

    sun.x = Math.cos(phi) * Math.cos(theta);
    sun.y = Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    // עדכון השמיים
    const uniforms = sky.material.uniforms;
    uniforms['sunPosition'].value.copy(sun);

    // עדכון המים
    if (water) {
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    }

    // מיקום ועוצמה של אור השמש
    directionalLight.position.set(sun.x * 1000, sun.y * 1000, sun.z * 1000);
    const sunHeight = sun.y;
    const dayIntensity = Math.max(0, sunHeight);
    const nightIntensity = Math.max(0, -sunHeight * 0.2);

    directionalLight.intensity = dayIntensity;
    ambientLight.intensity = 0.1 + dayIntensity * 0.2;

    // צבע ערפל ורקע
    const fogColor = new THREE.Color().setHSL(0.6, 0.5, 0.3 + dayIntensity * 0.7);
    scene.fog.color.copy(fogColor);
    scene.background.copy(fogColor);

    // אורות נקודתיים בלילה
    for (let i = 0; i < pointLights.length; i++) {
        pointLights[i].intensity = nightIntensity * 2;
    }
}

// -------------- עדכון הדמות --------------
function updateCharacter() {
    const terrainHeight = getTerrainHeight(character.position.x, character.position.z);
    const isOnGround = character.position.y <= terrainHeight;

    if (isOnGround) {
        character.position.y = terrainHeight;
        character.userData.velocity.y = 0;
        canJump = true;

        // אנימציית Idle כשעומדים
        if (character.userData.idleAction && !character.userData.idleAction.isRunning()) {
            character.userData.idleAction.play();
            if (character.userData.runAction) character.userData.runAction.stop();
            if (character.userData.jumpAction) character.userData.jumpAction.stop();
        }
    } else {
        character.userData.velocity.y -= GAME_CONFIG.gravity;
        canJump = false;
    }
    character.position.y += character.userData.velocity.y * deltaTime;

    // תנועה קדימה/אחורה/צדדים
    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keyboard['KeyW']) {
        character.position.addScaledVector(forward, GAME_CONFIG.playerSpeed * deltaTime);
        if (isOnGround && character.userData.runAction && !character.userData.runAction.isRunning()) {
            character.userData.runAction.play();
            if (character.userData.idleAction) character.userData.idleAction.stop();
            if (character.userData.jumpAction) character.userData.jumpAction.stop();
        }
    } else if (keyboard['KeyS']) {
        character.position.addScaledVector(forward, -GAME_CONFIG.playerSpeed * deltaTime);
        if (isOnGround && character.userData.runAction && !character.userData.runAction.isRunning()) {
            character.userData.runAction.play();
            if (character.userData.idleAction) character.userData.idleAction.stop();
            if (character.userData.jumpAction) character.userData.jumpAction.stop();
        }
    } else if (isOnGround && character.userData.idleAction && !character.userData.idleAction.isRunning()) {
        character.userData.idleAction.play();
        if (character.userData.runAction) character.userData.runAction.stop();
    }

    if (keyboard['KeyA']) character.position.addScaledVector(right, -GAME_CONFIG.playerSpeed * deltaTime);
    if (keyboard['KeyD']) character.position.addScaledVector(right, GAME_CONFIG.playerSpeed * deltaTime);

    // סיבוב הדמות לכיוון המצלמה
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    character.lookAt(character.position.clone().add(cameraDirection));

    // בדיקה אם מתחת למים
    isUnderwater = character.position.y < water.position.y;
    if (isUnderwater) {
        character.userData.velocity.y *= 0.9;
        health -= deltaTime * 5;
        if (health <= 0) {
            gameOver();
        }
    }

    // עדכון אנימציה
    if (character.userData.mixer) {
        character.userData.mixer.update(deltaTime);
    }

    // עדכון מיקום המצלמה
    updateCameraPosition();

    // פנס
    if (flashlight.visible) {
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(camera.quaternion);
        flashlight.target.position.copy(camera.position).add(cameraDirection.multiplyScalar(10));
    }
}

function updateCameraPosition() {
    const offset = new THREE.Vector3(GAME_CONFIG.cameraOffset.x, GAME_CONFIG.cameraOffset.y, GAME_CONFIG.cameraOffset.z);
    offset.applyQuaternion(character.quaternion);
    const targetPosition = character.position.clone().add(offset);
    
    // מניעת חדירה מתחת לאדמה
    const terrainHeight = getTerrainHeight(targetPosition.x, targetPosition.z);
    targetPosition.y = Math.max(targetPosition.y, terrainHeight + 5); // גובה מינימלי מעל הקרקע
    
    camera.position.lerp(targetPosition, 0.1); // תנועה חלקה
    camera.lookAt(character.position);
}

// -------------- פעולות שחקן --------------
function jump() {
    if (canJump) {
        character.userData.velocity.y = GAME_CONFIG.jumpHeight * deltaTime;
        canJump = false;
        if (character.userData.jumpAction && !character.userData.jumpAction.isRunning()) {
            character.userData.jumpAction.play();
            if (character.userData.idleAction) character.userData.idleAction.stop();
            if (character.userData.runAction) character.userData.runAction.stop();
        }
        if (jumpSound.buffer && !jumpSound.isPlaying) {
            jumpSound.play();
        }
    }
}

function shoot() {
    if (shootSound.buffer && !shootSound.isPlaying) {
        shootSound.play();
    }

    const projectileGeometry = new THREE.SphereGeometry(2, 5, 5);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

    projectile.position.copy(camera.position);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    projectile.userData.velocity = direction.multiplyScalar(800 * deltaTime);
    projectile.userData.lifetime = 2.0;

    scene.add(projectile);
    projectiles.push(projectile);
}

function toggleFlashlight() {
    flashlight.visible = !flashlight.visible;
}

// -------------- עדכון אובייקטים בעולם --------------
function updateStars() {
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.rotation.y += deltaTime * 2;
        star.position.y = star.userData.baseY + Math.sin(elapsedTime * 2 + star.userData.timeOffset) * 10;
    }
}

function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        if (enemy.userData.state === 'chasing') {
            // רדיפה אחרי הדמות
            const direction = new THREE.Vector3();
            direction.subVectors(character.position, enemy.position).normalize();

            const terrainHeight = getTerrainHeight(enemy.position.x, enemy.position.z);
            enemy.position.y = terrainHeight + enemy.userData.height;

            enemy.position.x += direction.x * enemy.userData.speed * deltaTime;
            enemy.position.z += direction.z * enemy.userData.speed * deltaTime;

            enemy.lookAt(character.position);
        } else {
            // סיור
            enemy.position.x += enemy.userData.velocity.x * deltaTime;
            enemy.position.z += enemy.userData.velocity.z * deltaTime;

            const terrainHeight = getTerrainHeight(enemy.position.x, enemy.position.z);
            enemy.position.y = terrainHeight + enemy.userData.height;

            // החלפת כיוון אקראית
            if (Math.random() < 0.01) {
                enemy.userData.velocity.x = (Math.random() - 0.5) * 100;
                enemy.userData.velocity.z = (Math.random() - 0.5) * 100;
                enemy.lookAt(
                    enemy.position.x + enemy.userData.velocity.x,
                    enemy.position.y,
                    enemy.position.z + enemy.userData.velocity.z
                );
            }

            // בדיקת טווח זיהוי
            const distanceToCharacter = enemy.position.distanceTo(character.position);
            if (distanceToCharacter < enemy.userData.detectionRange) {
                enemy.userData.state = 'chasing';
            }
        }

        // אנימציית mixer (אם קיימת)
        if (enemy.userData.mixer) {
            enemy.userData.mixer.update(deltaTime);
        }
    }
}

function updatePowerups() {
    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        powerup.rotation.y += deltaTime * 3;
        powerup.position.y = powerup.userData.baseY + Math.sin(elapsedTime * 3 + powerup.userData.timeOffset) * 10;
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.position.add(projectile.userData.velocity);
        projectile.userData.lifetime -= deltaTime;

        if (projectile.userData.lifetime <= 0) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
            continue;
        }

        // פגיעה בקרקע
        const terrainHeight = getTerrainHeight(projectile.position.x, projectile.position.z);
        if (projectile.position.y < terrainHeight) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }
}

function updateEnvironment() {
    // עננים
    for (let i = 0; i < clouds.length; i++) {
        const cloud = clouds[i];
        cloud.position.x += cloud.userData.velocity.x * deltaTime;
        cloud.position.z += cloud.userData.velocity.z * deltaTime;

        // מעין wrap-around לגבולות העולם
        if (cloud.position.x > GAME_CONFIG.worldScale / 2) cloud.position.x = -GAME_CONFIG.worldScale / 2;
        if (cloud.position.x < -GAME_CONFIG.worldScale / 2) cloud.position.x = GAME_CONFIG.worldScale / 2;
        if (cloud.position.z > GAME_CONFIG.worldScale / 2) cloud.position.z = -GAME_CONFIG.worldScale / 2;
        if (cloud.position.z < -GAME_CONFIG.worldScale / 2) cloud.position.z = GAME_CONFIG.worldScale / 2;
    }

    // גשם
    if (rainDrops.length > 0) {
        for (let i = 0; i < rainDrops.length; i++) {
            const drop = rainDrops[i];
            drop.position.add(drop.userData.velocity);

            const terrainHeight = getTerrainHeight(drop.position.x, drop.position.z);
            if (drop.position.y < terrainHeight) {
                // יצירת splash
                createSplash(drop.position.x, terrainHeight, drop.position.z);

                // איפוס מיקום הגשם
                const cloudIndex = Math.floor(Math.random() * clouds.length);
                if (cloudIndex < clouds.length) {
                    drop.position.set(
                        clouds[cloudIndex].position.x + (Math.random() - 0.5) * 200,
                        clouds[cloudIndex].position.y - 50,
                        clouds[cloudIndex].position.z + (Math.random() - 0.5) * 200
                    );
                } else {
                    drop.position.set(
                        (Math.random() - 0.5) * GAME_CONFIG.worldScale,
                        800,
                        (Math.random() - 0.5) * GAME_CONFIG.worldScale
                    );
                }
            }
        }
    }

    // ציפורים
    for (let i = 0; i < birds.length; i++) {
        const bird = birds[i];
        bird.position.add(bird.userData.velocity);

        // Wrap-around
        if (bird.position.x > GAME_CONFIG.worldScale / 2) bird.position.x = -GAME_CONFIG.worldScale / 2;
        if (bird.position.x < -GAME_CONFIG.worldScale / 2) bird.position.x = GAME_CONFIG.worldScale / 2;
        if (bird.position.z > GAME_CONFIG.worldScale / 2) bird.position.z = -GAME_CONFIG.worldScale / 2;
        if (bird.position.z < -GAME_CONFIG.worldScale / 2) bird.position.z = GAME_CONFIG.worldScale / 2;

        // גובה מינימלי ומקסימלי
        const terrainHeight = getTerrainHeight(bird.position.x, bird.position.z);
        if (bird.position.y < terrainHeight + 100) {
            bird.position.y = terrainHeight + 100;
            bird.userData.velocity.y = Math.abs(bird.userData.velocity.y);
        }
        if (bird.position.y > 1000) {
            bird.userData.velocity.y = -Math.abs(bird.userData.velocity.y);
        }

        // החלפת כיוון אקראית
        if (Math.random() < 0.01) {
            bird.userData.velocity.x = (Math.random() - 0.5) * 100;
            bird.userData.velocity.z = (Math.random() - 0.5) * 100;
            bird.userData.velocity.y = (Math.random() - 0.5) * 20;
        }

        // אנימציית כנפיים
        if (bird.userData.wingTime !== undefined) {
            bird.userData.wingTime += deltaTime * 10;
            if (bird.children.length >= 2) {
                bird.children[0].rotation.z = Math.sin(bird.userData.wingTime) * 0.5;
                bird.children[1].rotation.z = -Math.sin(bird.userData.wingTime) * 0.5;
            }
        }

        // שהציפור תסתכל לכיוון התנועה
        const direction = new THREE.Vector3(bird.userData.velocity.x, 0, bird.userData.velocity.z).normalize();
        if (direction.length() > 0) {
            const targetRotation = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                direction
            );
            bird.quaternion.slerp(targetRotation, deltaTime * 2);
        }
    }

    // דגים
    for (let i = 0; i < fish.length; i++) {
        const currentFish = fish[i];
        currentFish.position.add(currentFish.userData.velocity);

        // לוודא שהדג לא עולה מעל פני המים
        if (currentFish.position.y > water.position.y - 10) {
            currentFish.position.y = water.position.y - 10;
            currentFish.userData.velocity.y = -Math.abs(currentFish.userData.velocity.y);
        }

        const terrainHeight = getTerrainHeight(currentFish.position.x, currentFish.position.z);
        if (currentFish.position.y < terrainHeight + 10) {
            currentFish.position.y = terrainHeight + 10;
            currentFish.userData.velocity.y = Math.abs(currentFish.userData.velocity.y);
        }

        // Wrap-around
        if (currentFish.position.x > GAME_CONFIG.worldScale / 2) currentFish.position.x = -GAME_CONFIG.worldScale / 2;
        if (currentFish.position.x < -GAME_CONFIG.worldScale / 2) currentFish.position.x = GAME_CONFIG.worldScale / 2;
        if (currentFish.position.z > GAME_CONFIG.worldScale / 2) currentFish.position.z = -GAME_CONFIG.worldScale / 2;
        if (currentFish.position.z < -GAME_CONFIG.worldScale / 2) currentFish.position.z = GAME_CONFIG.worldScale / 2;

        // החלפת כיוון אקראית
        if (Math.random() < 0.02) {
            currentFish.userData.velocity.x = (Math.random() - 0.5) * 50;
            currentFish.userData.velocity.z = (Math.random() - 0.5) * 50;
            currentFish.userData.velocity.y = (Math.random() - 0.5) * 10;
        }

        // אנימציית זנב
        if (currentFish.userData.tailTime !== undefined) {
            currentFish.userData.tailTime += deltaTime * 5;
            if (currentFish.children.length >= 1) {
                currentFish.children[0].rotation.y = Math.sin(currentFish.userData.tailTime) * 0.3;
            }
        }

        // כיוון התקדמות
        const direction = new THREE.Vector3(
            currentFish.userData.velocity.x,
            0,
            currentFish.userData.velocity.z
        ).normalize();
        if (direction.length() > 0) {
            const targetRotation = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                direction
            );
            currentFish.quaternion.slerp(targetRotation, deltaTime * 2);
        }
    }

    // עצים ופרחים (תנועת "רוח" קלה)
    const windStrength = Math.sin(elapsedTime * 0.5) * 0.1;
    for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];
        if (tree.children.length > 0) {
            for (let j = 0; j < tree.children.length; j++) {
                if (tree.children[j].name === 'leaves') {
                    tree.children[j].rotation.x = Math.sin(elapsedTime + i) * windStrength;
                    tree.children[j].rotation.z = Math.cos(elapsedTime + i) * windStrength;
                }
            }
        }
    }
    for (let i = 0; i < flowers.length; i++) {
        const flower = flowers[i];
        flower.rotation.x = Math.sin(elapsedTime * 0.5 + i) * windStrength * 2;
        flower.rotation.z = Math.cos(elapsedTime * 0.5 + i) * windStrength * 2;
    }
}

// -------------- בדיקת התנגשויות --------------
function checkCollisions() {
    // דמות-כוכב
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        const distance = character.position.distanceTo(star.position);
        if (distance < 50) {
            scene.remove(star);
            stars.splice(i, 1);
            score += 100;
            if (collectSound.buffer && !collectSound.isPlaying) {
                collectSound.play();
            }
        }
    }

    // דמות-אויב
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const distance = character.position.distanceTo(enemy.position);
        if (distance < 80) {
            health -= 20 * deltaTime;
            if (hitSound.buffer && !hitSound.isPlaying) {
                hitSound.play();
            }
            if (health <= 0) {
                gameOver();
                return;
            }
        }
    }

    // דמות-בונוס
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const distance = character.position.distanceTo(powerup.position);
        if (distance < 50) {
            scene.remove(powerup);
            powerups.splice(i, 1);

            switch (powerup.userData.type) {
                case 'health':
                    health = Math.min(100, health + 25);
                    break;
                case 'speed':
                    controls.movementSpeed = GAME_CONFIG.playerSpeed * 1.5;
                    setTimeout(() => {
                        controls.movementSpeed = GAME_CONFIG.playerSpeed;
                    }, 10000);
                    break;
                case 'time':
                    timeRemaining += 30;
                    break;
                case 'shield':
                    const shieldGeometry = new THREE.SphereGeometry(60, 32, 32);
                    const shieldMaterial = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.3
                    });
                    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
                    character.add(shield);
                    setTimeout(() => {
                        character.remove(shield);
                    }, 10000);
                    break;
            }
            if (collectSound.buffer && !collectSound.isPlaying) {
                collectSound.play();
            }
        }
    }

    // קליע-אויב
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const distance = projectile.position.distanceTo(enemy.position);
            if (distance < 50) {
                enemy.userData.health -= 25;
                createHitEffect(projectile.position.x, projectile.position.y, projectile.position.z);

                scene.remove(projectile);
                projectiles.splice(i, 1);

                if (enemy.userData.health <= 0) {
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    score += 50;
                }
                break;
            }
        }
    }
}

// -------------- עדכון ממשק משתמש --------------
function updateUI() {
    scoreElement.innerHTML = 'Score: ' + score;
    healthElement.innerHTML = 'Health: ' + Math.max(0, Math.round(health));
    levelElement.innerHTML = 'Level: ' + level;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    timerElement.innerHTML = 'Time: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

// -------------- הכנת ה־DOM --------------
function setupDOM() {
    container = document.getElementById('container');

    // מכולת UI
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    // מעט עיצוב
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.color = '#fff';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.fontSize = '16px';
    uiContainer.style.textShadow = '1px 1px 2px #000';
    uiContainer.style.zIndex = '100';
    container.appendChild(uiContainer);

    // אלמנטים של UI
    scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.innerHTML = 'Score: 0';
    scoreElement.style.margin = '5px';
    uiContainer.appendChild(scoreElement);

    healthElement = document.createElement('div');
    healthElement.id = 'health';
    healthElement.innerHTML = 'Health: 100';
    healthElement.style.margin = '5px';
    uiContainer.appendChild(healthElement);

    levelElement = document.createElement('div');
    levelElement.id = 'level';
    levelElement.innerHTML = 'Level: 1';
    levelElement.style.margin = '5px';
    uiContainer.appendChild(levelElement);

    timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.innerHTML = 'Time: 3:00';
    timerElement.style.margin = '5px';
    uiContainer.appendChild(timerElement);

    // הודעות (מסך פתיחה/סיום/עצירה)
    messageElement = document.getElementById('message');

    // סטטיסטיקות
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    container.appendChild(stats.domElement);
}

// -------------- הכנת הסצנה --------------
function setupScene() {
    // סצנה
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.00025);

    // מצלמה
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(100, GAME_CONFIG.playerHeight, -800);
    camera.lookAt(-100, GAME_CONFIG.playerHeight, -800);

    // רנדרר
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // שליטת שחקן
    controls = new THREE.FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = GAME_CONFIG.playerSpeed;
    controls.lookSpeed = 0.1;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    controls.verticalMin = Math.PI * 0.1; // מאפשר מבט למטה
    controls.verticalMax = Math.PI * 0.9;

    // מנהל טעינה
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        messageElement.innerHTML = `Loading... ${Math.round(progress)}%`;
        messageElement.style.display = 'block';
    };
    loadingManager.onLoad = function () {
        // הסתרת הודעת טעינה
        messageElement.style.display = 'none';
    };

    // לודר מודלים
    assetLoader = new THREE.GLTFLoader(loadingManager);
}

// -------------- הפונקציה המרכזית של התחלת המשחק --------------
function init() {
    // הכנת ה־DOM
    setupDOM();

    // הכנת הסצנה, מצלמה, רנדרר וכו'
    setupScene();

    // יצירת עולם
    createTerrain();
    createWater();
    createSky();
    createLighting();
    createPlayer();
    createAudio();
    createGameObjects();

    // מאזיני אירועים
    setupEventListeners();

    // לולאה
    renderer.setAnimationLoop(gameLoop);

    // תפריט התחלתי
    showMenu();
}