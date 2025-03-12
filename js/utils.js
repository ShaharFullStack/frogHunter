// File: utils.js

function getTerrainHeight(x, z) {
    if (!mesh || !mesh.userData.heightData) return 0;

    // Convert world coordinates to heightmap coordinates
    const worldSize = GAME_CONFIG.worldScale;
    const heightmapSize = GAME_CONFIG.worldWidth;

    const halfWorldSize = worldSize / 2;

    // Normalize coordinates (0..1)
    const nx = (x + halfWorldSize) / worldSize;
    const nz = (z + halfWorldSize) / worldSize;

    // Convert to indices
    let ix = Math.floor(nx * heightmapSize);
    let iz = Math.floor(nz * heightmapSize);

    // Clamp
    ix = Math.max(0, Math.min(heightmapSize - 1, ix));
    iz = Math.max(0, Math.min(heightmapSize - 1, iz));

    // Index
    const index = iz * heightmapSize + ix;
    if (index >= 0 && index < mesh.userData.heightData.length) {
        const heightValue = mesh.userData.heightData[index] * GAME_CONFIG.terrainHeight;
        return heightValue;
    }

    return 0;
}

function generateHeight(width, height) {
    const size = width * height;
    const data = new Uint8Array(size);
    const perlin = new THREE.ImprovedNoise();
    const z = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
            const x = i % width, y = ~~(i / width);
            data[i] = (data[i] || 0) + Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1);
        }
        quality *= 5;
    }
    return data;
}

function generateTexture(data, width, height) {
    let context, image, imageData, shade;
    const vector3 = new THREE.Vector3(0, 0, 0);
    const sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        // Calculate normal
        vector3.x = data[j - 2] - data[j + 2] || 0;
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2] || 0;
        vector3.normalize();

        shade = vector3.dot(sun);
        const heightVal = data[j] || 0;

        if (heightVal < 10) {
            // Sand
            imageData[i] = (210 + shade * 32) * (0.5 + heightVal * 0.007);
            imageData[i + 1] = (190 + shade * 32) * (0.5 + heightVal * 0.007);
            imageData[i + 2] = (160 + shade * 32) * (0.5 + heightVal * 0.007);
        } else if (heightVal < 60) {
            // Grass
            imageData[i] = (50 + shade * 96) * (0.5 + heightVal * 0.007);
            imageData[i + 1] = (100 + shade * 96) * (0.5 + heightVal * 0.007);
            imageData[i + 2] = (50 + shade * 96) * (0.5 + heightVal * 0.007);
        } else if (heightVal < 100) {
            // Stone
            imageData[i] = (120 + shade * 64) * (0.5 + heightVal * 0.007);
            imageData[i + 1] = (120 + shade * 64) * (0.5 + heightVal * 0.007);
            imageData[i + 2] = (120 + shade * 64) * (0.5 + heightVal * 0.007);
        } else {
            // Snow
            imageData[i] = (220 + shade * 32) * (0.5 + heightVal * 0.007);
            imageData[i + 1] = (220 + shade * 32) * (0.5 + heightVal * 0.007);
            imageData[i + 2] = (220 + shade * 32) * (0.5 + heightVal * 0.007);
        }
        imageData[i + 3] = 255;
    }

    context.putImageData(image, 0, 0);

    // Upscale
    const canvasScaled = document.createElement('canvas');
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext('2d');
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    // Add noise
    for (let i = 0, l = imageData.length; i < l; i += 4) {
        const v = Math.floor(Math.random() * 5);
        imageData[i] += v;
        imageData[i + 1] += v;
        imageData[i + 2] += v;
    }

    context.putImageData(image, 0, 0);
    return canvasScaled;
}

function createHitEffect(x, y, z) {
    // Hit particles
    const particleCount = 10;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(3, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.set(x, y, z);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            ),
            lifetime: 0.5
        };
        scene.add(particle);
        particles.push(particle);
    }

    // Flash
    const flashGeometry = new THREE.SphereGeometry(10, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(x, y, z);
    scene.add(flash);

    let flashScale = 1;

    const animateHit = function () {
        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.position.add(particle.userData.velocity);
            particle.userData.lifetime -= 0.016;
            if (particle.userData.lifetime <= 0) {
                scene.remove(particle);
                particles.splice(i, 1);
            }
        }

        // Flash fade
        flashScale += 0.5;
        flash.scale.set(flashScale, flashScale, flashScale);
        flash.material.opacity -= 0.04;
        if (flash.material.opacity <= 0) {
            scene.remove(flash);
        } else {
            requestAnimationFrame(animateHit);
        }
    };
    animateHit();
}
