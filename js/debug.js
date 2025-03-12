// Add this script after all other scripts in index.html
// <script src="js/debug.js"></script>

// Error handling and debugging
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error occurred:", message);
    console.error("Source:", source);
    console.error("Line:", lineno, "Column:", colno);
    console.error("Error object:", error);
    
    // Display error on screen
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.innerHTML = `
            <strong>Error:</strong><br>
            ${message}<br>
            <small>at line ${lineno}:${colno} in ${source.split('/').pop()}</small><br><br>
            Try reloading the page. If the error persists, check the console for details.
        `;
        messageElement.style.display = 'block';
    }
    
    return true; // Prevents the default error handler
};

// Debug utility to check resource loading
function checkResourceLoading() {
    console.log("Checking resources...");
    
    // Check Three.js
    if (typeof THREE === 'undefined') {
        console.error("THREE is not defined");
    } else {
        console.log("THREE version:", THREE.REVISION);
    }
    
    // Check game components
    const components = [
        { name: "THREE.FirstPersonControls", obj: THREE.FirstPersonControls },
        { name: "THREE.ImprovedNoise", obj: THREE.ImprovedNoise },
        { name: "THREE.Water", obj: THREE.Water },
        { name: "THREE.Sky", obj: THREE.Sky },
        { name: "THREE.GLTFLoader", obj: THREE.GLTFLoader },
        { name: "Stats", obj: Stats }
    ];
    
    components.forEach(component => {
        if (typeof component.obj === 'undefined') {
            console.error(`${component.name} is not defined`);
        } else {
            console.log(`${component.name} is loaded`);
        }
    });
    
    // Check game variables
    const gameVariables = [
        "GAME_STATES", "GAME_CONFIG", "getTerrainHeight", "createTerrain", 
        "createWater", "createSky", "createPlayer", "init"
    ];
    
    gameVariables.forEach(varName => {
        if (typeof window[varName] === 'undefined') {
            console.error(`${varName} is not defined`);
        } else {
            console.log(`${varName} is defined`);
        }
    });
}

// Check resource loading after a short delay
window.addEventListener('load', function() {
    setTimeout(checkResourceLoading, 1000);
});

// Initialize performance monitoring
let lastTime = 0;
let frames = 0;
let fps = 0;

function updatePerformanceStats(time) {
    frames++;
    
    if (time >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (time - lastTime));
        
        // Log FPS every second
        console.log("FPS:", fps);
        
        frames = 0;
        lastTime = time;
    }
    
    requestAnimationFrame(updatePerformanceStats);
}

requestAnimationFrame(updatePerformanceStats);

// Add keyboard shortcut to toggle detailed debugging
let debugMode = false;

window.addEventListener('keydown', function(event) {
    // Ctrl+Shift+D to toggle debug mode
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyD') {
        debugMode = !debugMode;
        console.log("Debug mode:", debugMode ? "ON" : "OFF");
        
        if (debugMode) {
            // Add debug visualization
            addDebugVisualization();
        } else {
            // Remove debug visualization
            removeDebugVisualization();
        }
    }
});

// Debug visualization
function addDebugVisualization() {
    if (!scene) return;
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(1000);
    axesHelper.name = "debugAxes";
    scene.add(axesHelper);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(5000, 50);
    gridHelper.name = "debugGrid";
    scene.add(gridHelper);
    
    // Log camera position
    console.log("Camera position:", camera.position);
    
    // Create debug info display
    let debugInfo = document.createElement('div');
    debugInfo.id = 'debugInfo';
    debugInfo.style.position = 'absolute';
    debugInfo.style.bottom = '10px';
    debugInfo.style.right = '10px';
    debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugInfo.style.color = '#fff';
    debugInfo.style.padding = '10px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.fontSize = '12px';
    debugInfo.style.zIndex = '1000';
    document.body.appendChild(debugInfo);
    
    // Update debug info each frame
    function updateDebugInfo() {
        if (!debugMode) return;
        
        const debugInfo = document.getElementById('debugInfo');
        if (!debugInfo) return;
        
        let info = '';
        
        if (camera) {
            info += `Camera: x=${camera.position.x.toFixed(1)}, y=${camera.position.y.toFixed(1)}, z=${camera.position.z.toFixed(1)}<br>`;
        }
        
        if (player) {
            info += `Player: x=${player.position.x.toFixed(1)}, y=${player.position.y.toFixed(1)}, z=${player.position.z.toFixed(1)}<br>`;
            if (player.userData.velocity) {
                info += `Velocity: x=${player.userData.velocity.x.toFixed(1)}, y=${player.userData.velocity.y.toFixed(1)}, z=${player.userData.velocity.z.toFixed(1)}<br>`;
            }
        }
        
        if (typeof getTerrainHeight === 'function' && camera) {
            const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
            info += `Terrain height: ${terrainHeight.toFixed(1)}<br>`;
        }
        
        if (typeof fps !== 'undefined') {
            info += `FPS: ${fps}<br>`;
        }
        
        info += `Game state: ${gameState}<br>`;
        info += `Entities: ${stars.length} stars, ${enemies.length} enemies, ${powerups.length} powerups<br>`;
        
        debugInfo.innerHTML = info;
        
        requestAnimationFrame(updateDebugInfo);
    }
    
    updateDebugInfo();
}

function removeDebugVisualization() {
    if (!scene) return;
    
    // Remove axes helper
    const axesHelper = scene.getObjectByName("debugAxes");
    if (axesHelper) scene.remove(axesHelper);
    
    // Remove grid helper
    const gridHelper = scene.getObjectByName("debugGrid");
    if (gridHelper) scene.remove(gridHelper);
    
    // Remove debug info display
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) debugInfo.remove();
}

// Console log when the game actually starts
const originalStartGame = startGame;
if (typeof startGame === 'function') {
    startGame = function() {
        console.log("Game started!");
        return originalStartGame.apply(this, arguments);
    };
}

console.log("Debug script loaded!");