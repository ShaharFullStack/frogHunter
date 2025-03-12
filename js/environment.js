// File: environment.js

function createTerrain() {
    // Generate data
    const data = generateHeight(GAME_CONFIG.worldWidth, GAME_CONFIG.worldDepth);

    // Geometry
    const geometry = new THREE.PlaneGeometry(
        GAME_CONFIG.worldScale,
        GAME_CONFIG.worldScale,
        GAME_CONFIG.worldWidth - 1,
        GAME_CONFIG.worldDepth - 1
    );
    geometry.rotateX(-Math.PI / 2);

    // Apply height data
    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = data[i] * GAME_CONFIG.terrainHeight;
    }
    geometry.computeVertexNormals();

    // Texture
    texture = new THREE.CanvasTexture(generateTexture(data, GAME_CONFIG.worldWidth, GAME_CONFIG.worldDepth));
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // Terrain mesh
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    scene.add(mesh);

    // Store for collisions
    mesh.userData.heightData = data;
}

function createWater() {
    const waterGeometry = new THREE.PlaneGeometry(GAME_CONFIG.worldScale * 2, GAME_CONFIG.worldScale * 2);
    water = new THREE.Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                'https://threejs.org/examples/textures/waternormals.jpg',
                function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }
            ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -50;
    scene.add(water);
}

function createSky() {
    // Sun
    sun = new THREE.Vector3();

    // Sky
    sky = new THREE.Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    // Clouds
    for (let i = 0; i < 10; i++) {
        createCloud(
            (Math.random() - 0.5) * GAME_CONFIG.worldScale,
            500 + Math.random() * 500,
            (Math.random() - 0.5) * GAME_CONFIG.worldScale
        );
    }

    // Stars
    createStars();

    // Rain
    createRain();
}

function createStars() {
    stars = [];
    const numStars = GAME_CONFIG.starCount;
    for (let i = 0; i < numStars; i++) {
        const star = createStar();
        stars.push(star);
    }
}

function createLighting() {
    ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1000, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 500;
    directionalLight.shadow.camera.far = 4000;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    scene.add(directionalLight);

    // Point lights for night
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    for (let i = 0; i < 3; i++) {
        const light = new THREE.PointLight(colors[i % colors.length], 1, 300);
        light.position.set(
            (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.5,
            300 + Math.random() * 200,
            (Math.random() - 0.5) * GAME_CONFIG.worldScale * 0.5
        );
        light.intensity = 0; // Off by default
        scene.add(light);
        pointLights.push(light);
    }
}

function createCloud(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const numSpheres = 3;
    const baseSize = 50 + Math.random() * 100;

    for (let i = 0; i < numSpheres; i++) {
        const geometry = new THREE.SphereGeometry(baseSize * (0.5 + Math.random() * 0.5), 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.9
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(
            (Math.random() - 0.5) * baseSize * 2,
            (Math.random() - 0.5) * baseSize,
            (Math.random() - 0.5) * baseSize * 2
        );
        group.add(sphere);
    }

    group.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20)
    };

    scene.add(group);
    clouds.push(group);
    return group;
}

function createRain() {
    rainDrops = [];
    if (clouds.length === 0) return rainDrops;

    for (let i = 0; i < GAME_CONFIG.rainDropCount; i++) {
        const geometry = new THREE.CylinderGeometry(1, 1, 20, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x6688ff });
        const drop = new THREE.Mesh(geometry, material);

        drop.rotation.x = Math.PI / 2;
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
        drop.userData = {
            velocity: new THREE.Vector3(0, -10, 0)
        };
        scene.add(drop);
        rainDrops.push(drop);
    }
    return rainDrops;
}

function createSplash(x, y, z) {
    // Create splash particles
    const particleCount = 5;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(2, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x6688ff });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.set(x, y, z);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 15,
                (Math.random() - 0.5) * 10
            ),
            lifetime: 0.5
        };

        scene.add(particle);
        particles.push(particle);
    }

    // Animate
    const animateSplash = function () {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            // Move
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= 0.25; // gravity
            particle.userData.lifetime -= 0.0016;

            if (particle.userData.lifetime <= 0) {
                scene.remove(particle);
                particles.splice(i, 1);
            }
        }
        if (particles.length > 0) {
            requestAnimationFrame(animateSplash);
        }
    };
    animateSplash();
}
