/**
 * PointerLockControls implementation based on three.js
 * Simplified version for direct inclusion in the game
 */

export class PointerLockControls {
	constructor(camera, domElement) {
	  this.camera = camera;
	  this.domElement = domElement || document.body;
	  
	  this.isLocked = false;
	  
	  // Initial camera position and rotation
	  this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
	  this.vector = new THREE.Vector3();
	  
	  // Tracking mouse movement
	  this.PI_2 = Math.PI / 2;
	  this.minPolarAngle = 0;
	  this.maxPolarAngle = Math.PI;
	  
	  // Bound method references
	  this.onMouseMove = this.onMouseMove.bind(this);
	  this.onPointerlockChange = this.onPointerlockChange.bind(this);
	  this.onPointerlockError = this.onPointerlockError.bind(this);
	  
	  // Setup event listeners
	  this.domElement.addEventListener('click', this.onClick.bind(this));
	  document.addEventListener('pointerlockchange', this.onPointerlockChange);
	  document.addEventListener('pointerlockerror', this.onPointerlockError);
	}
	
	onMouseMove(event) {
	  if (!this.isLocked) return;
	  
	  const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
	  const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
	  
	  this.euler.setFromQuaternion(this.camera.quaternion);
	  
	  this.euler.y -= movementX * 0.002;
	  this.euler.x -= movementY * 0.002;
	  
	  this.euler.x = Math.max(this.PI_2 - this.maxPolarAngle, Math.min(this.PI_2 - this.minPolarAngle, this.euler.x));
	  
	  this.camera.quaternion.setFromEuler(this.euler);
	}
	
	onPointerlockChange() {
	  this.isLocked = document.pointerLockElement === this.domElement;
	  
	  if (this.isLocked) {
		document.addEventListener('mousemove', this.onMouseMove);
	  } else {
		document.removeEventListener('mousemove', this.onMouseMove);
	  }
	}
	
	onPointerlockError() {
	  console.error('PointerLockControls: Unable to use Pointer Lock API');
	}
	
	onClick() {
	  this.lock();
	}
	
	lock() {
	  this.domElement.requestPointerLock();
	}
	
	unlock() {
	  document.exitPointerLock();
	}
	
	getObject() {
	  return this.camera;
	}
	
	dispose() {
	  document.removeEventListener('mousemove', this.onMouseMove);
	  document.removeEventListener('pointerlockchange', this.onPointerlockChange);
	  document.removeEventListener('pointerlockerror', this.onPointerlockError);
	}
  }