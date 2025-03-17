import * as THREE from "three";
import { OrbitControls, GLTFLoader } from "addons"; // Adjust path as needed

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ----- Physics World -----
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);


// Position the camera closer to the back wall and higher
camera.position.set(0, 2, 4);
camera.lookAt(0, 1.5, -5);

// === Orbit Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// === Room Modeling ===
// Floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ color: 0xa19a8a }));
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, -2);
scene.add(floor);

// Back Wall (Taller)
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshStandardMaterial({ color: 0xebddbc }));
backWall.position.set(0, 2, -5);
scene.add(backWall);

// Left and Right Walls
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xebddbc,
    transparent: true,
    opacity: 0.3, // Adjust for desired transparency (0 = fully transparent, 1 = fully solid)
});
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-5, 2, -2);
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(5, 2, -2);
scene.add(rightWall);

// === Night Sky Sphere ===
const skyTexture = new THREE.TextureLoader().load("nova_sky.png"); // Load night sky texture
skyTexture.wrapS = THREE.RepeatWrapping; // Ensure texture wraps
skyTexture.wrapT = THREE.RepeatWrapping;
skyTexture.rotation = Math.PI; // Rotate the texture 180 degrees
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }); // Inside-facing material
const skyGeometry = new THREE.SphereGeometry(50, 64, 64); // Large sphere to surround the room
const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
// Rotate the sky sphere upside down so the seam is on top
skySphere.rotation.y = Math.PI;
scene.add(skySphere);

// === Load Desk Model ===
const loader = new GLTFLoader();
let desk, gameSystem;

loader.load("desk.glb", function (gltf) {
    desk = gltf.scene;
    desk.position.set(0, 0, -3); // Adjust position
    desk.scale.set(1, 1, 1);
    scene.add(desk);
    // After desk loads, load the game system
    loadGameSystem();
}, undefined, function (error) {
    console.error("Error loading desk model:", error);
});

// === Semi-Transparent Blue Planes ===
const planeGeometry = new THREE.PlaneGeometry(2, 1.5); // Shorter height: 1.5 instead of 3
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
});

// **Position Fix:** Start slightly **above** the desk (not inside it)
const leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
leftPlane.position.set(-1, 1, -3); // Adjust Y position to start just above the desk
leftPlane.rotation.y = Math.PI / 2;
leftPlane.scale.set(1, 0, 1); // Start hidden

const rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
rightPlane.position.set(1, 1, -3); // Adjust Y position
rightPlane.rotation.y = -Math.PI / 2;
rightPlane.scale.set(1, 0, 1); // Start hidden

scene.add(leftPlane);
scene.add(rightPlane);

// === Raycaster for Click Detection ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (desk) {
        const intersects = raycaster.intersectObject(desk, true);
        if (intersects.length > 0) {
            moveCameraToDesk();
            growPlanes();
        }
    }

    if (rightWallPicture) {
        // Check if the right wall picture was clicked
        const intersectMe = raycaster.intersectObject(rightWallPicture);
        if (intersectMe.length > 0) {
            showCube();
        }
    }

}
window.addEventListener("click", onMouseClick, false);

window.addEventListener("load", () => {
    setTimeout(function () {
        moveCameraToDesk();
        growPlanes();

    }, 200); // 2000 milliseconds = 2 seconds
}, false);

function showCube() {
    console.log("I got here")
    cube.visible = true;
    gsap.to(cube.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: "power2.out" });
}

// === Camera Transition to Hover Over Desk ===
function moveCameraToDesk() {
    const lookAtPosition = new THREE.Vector3(0, 0, -3);

    gsap.to(camera.position, {
        x: desk.position.x,
        y: desk.position.y + 2,
        z: desk.position.z - 2.5,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: function () {
            camera.lookAt(lookAtPosition);
        },
    });
}

// === Animate Planes Growing and Rotating ===
function growPlanes() {
    // **Fix:** Grow planes **upward** to **1.5 height** (not through the desk)
    gsap.to([leftPlane.scale, rightPlane.scale], {
        y: 1,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: rotatePlanes, // Once they finish growing, rotate them
    });

    // **Fix:** Move planes upward slightly as they grow (avoid clipping)
    gsap.to([leftPlane.position, rightPlane.position], {
        y: 1.75, // Slightly higher than the desk surface
        duration: 1.5,
        ease: "power2.inOut",
    });
}

// === Rotate Planes to Face the Camera ===
function rotatePlanes() {
    gsap.to(leftPlane.rotation, {
        y: 0, // Rotate left plane to face forward
        duration: 1.5,
        ease: "power2.inOut",
    });

    gsap.to(rightPlane.rotation, {
        y: 0, // Rotate right plane to face forward
        duration: 1.5,
        ease: "power2.inOut",
    });
}

// === Picture Frames on Walls ===
const textureLoader = new THREE.TextureLoader();

function createPictureFrame(imagePath, position, rotation) {
    const frameGeometry = new THREE.PlaneGeometry(2, 1.5); // Picture frame size
    const frameTexture = textureLoader.load(imagePath); // Load image
    const frameMaterial = new THREE.MeshBasicMaterial({ map: frameTexture });

    const pictureFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    pictureFrame.position.set(position.x, position.y, position.z);
    pictureFrame.rotation.y = rotation;
    scene.add(pictureFrame);
    return pictureFrame
}

// Add Picture Frames
let rightWallPicture = createPictureFrame("me.jpg", { x: -4.9, y: 2, z: -1 }, Math.PI / 2); // Left Wall
let letfWallPicture = createPictureFrame("art.jpg", { x: 4.9, y: 2, z: -1 }, -Math.PI / 2); // Right Wall

const cubeMaterials = [
    new THREE.MeshBasicMaterial({ map: textureLoader.load("me.jpg") }), // Right side
    new THREE.MeshBasicMaterial({ map: textureLoader.load("me.jpg") }), // Left side
    new THREE.MeshBasicMaterial({ map: textureLoader.load("me.jpg") }), // Top
    new THREE.MeshBasicMaterial({ map: textureLoader.load("art.jpg") }), // Bottom
    new THREE.MeshBasicMaterial({ map: textureLoader.load("art.jpg") }), // Front
    new THREE.MeshBasicMaterial({ map: textureLoader.load("art.jpg") })  // Back
];
const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Start small
const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
cube.position.set(0, 3.5, -3); // Above desk, between blue planes
cube.visible = false; // Initially hidden
scene.add(cube);

// === Load Game System Model ===
function loadGameSystem() {
    loader.load("game_system.glb", function (gltf) {
        gameSystem = gltf.scene;
        gameSystem.position.set(0, 0, -3.3); // Position on top of the desk
        gameSystem.scale.set(1, 1, 1); // Adjust scale if needed
        gameSystem.rotation.y = 3.5
        scene.add(gameSystem);
    }, undefined, function (error) {
        console.error("Error loading game system model:", error);
    });
}

const settings = {
    stepFrequency: 60,
    maxSubSteps: 3
};
let lastCallTime = null;
let resetCallTime = false;
// ----- Physics Update -----
function updatePhysics() {
    const timeStep = 1 / settings.stepFrequency;
    const now = performance.now() / 1000;
    if (!lastCallTime) {
        world.step(timeStep);
        lastCallTime = now;
        return;
    }
    let timeSinceLastCall = now - lastCallTime;
    if (resetCallTime) {
        timeSinceLastCall = 0;
        resetCallTime = false;
    }
    world.step(timeStep, timeSinceLastCall, settings.maxSubSteps);
    lastCallTime = now;
}

// === Animation Loop ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    updatePhysics()

    if (skySphere) {
        skySphere.rotation.y += 0.0005; // Adjust speed as needed
    }
    controls.update();
    renderer.render(scene, camera);
}

animate();

// === Handle Window Resizing ===
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
