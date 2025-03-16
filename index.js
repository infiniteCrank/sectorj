import * as THREE from "three";
import { OrbitControls, GLTFLoader } from "addons"; // Adjust the path as needed

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
// Floor with color #a19a8a
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xa19a8a });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
scene.add(floorMesh);

// Back wall with color #ebddbc (Taller)
const backWallGeometry = new THREE.PlaneGeometry(10, 4);
const backWallMaterial = new THREE.MeshStandardMaterial({ color: 0xebddbc });
const backWallMesh = new THREE.Mesh(backWallGeometry, backWallMaterial);
backWallMesh.position.set(0, 2, -5);
scene.add(backWallMesh);

// Left wall with color #ebddbc
const leftWallGeometry = new THREE.PlaneGeometry(10, 3);
const leftWallMaterial = new THREE.MeshStandardMaterial({ color: 0xebddbc });
const leftWallMesh = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
leftWallMesh.rotation.y = Math.PI / 2;
leftWallMesh.position.set(-5, 1.5, 0);
scene.add(leftWallMesh);

// Right wall with color #ebddbc
const rightWallGeometry = new THREE.PlaneGeometry(10, 3);
const rightWallMaterial = new THREE.MeshStandardMaterial({ color: 0xebddbc });
const rightWallMesh = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
rightWallMesh.rotation.y = -Math.PI / 2;
rightWallMesh.position.set(5, 1.5, 0);
scene.add(rightWallMesh);

// === Load Desk Model ===
const loader = new GLTFLoader();
let desk;

loader.load("desk.glb", function (gltf) {
    desk = gltf.scene;
    desk.position.set(0, 0, -3); // Adjust position in the room
    desk.scale.set(1, 1, 1); // Scale to fit properly
    scene.add(desk);
}, undefined, function (error) {
    console.error("Error loading desk model:", error);
});

// === Raycaster for Click Detection ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    if (desk) {
        const intersects = raycaster.intersectObject(desk, true);
        if (intersects.length > 0) {
            moveCameraToDesk();
        }
    }
}

window.addEventListener("click", onMouseClick, false);

// === Camera Transition to Hover Over Desk ===
function moveCameraToDesk() {
    const hoverPosition = new THREE.Vector3(0, 4.5, -3); // Directly above the desk
    const lookAtPosition = new THREE.Vector3(0, 0, -3); // Look straight down at desk

    gsap.to(camera.position, {
        x: desk.position.x,
        y: desk.position.y + 3,
        z: desk.position.z - 2,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: function () {
            camera.lookAt(lookAtPosition);
        },
    });
}

// === Animation Loop: Sync physics with rendering ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Render the scene
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
