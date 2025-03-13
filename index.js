import * as THREE from "three";
import { OrbitControls } from "addons";

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a texture with text
function createTextTexture(text, size = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size, size);

    // Text styling
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2);

    return new THREE.CanvasTexture(canvas);
}

// Create a sphere with text texture
const texture = createTextTexture("MENU.MENU.");
const material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.3, roughness: 0.8 });
const geometry = new THREE.SphereGeometry(3, 32, 32);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Add lighting
const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Add a directional light for better shading
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 5, 5);
scene.add(directionalLight);

// Position camera further back
camera.position.set(0, 0, 5);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovering = false; // Track hover state

// Handle window resize
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Handle mouse movement for hover effect
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
        isHovering = true;
    } else if (isHovering) {
        document.body.style.cursor = "default";
        isHovering = false;
    }
});

// Handle click event
window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        sphere.scale.multiplyScalar(0.5);
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sphere around the Y-axis like a globe
    sphere.rotation.y -= 0.01; // Adjust speed if needed

    controls.update();
    renderer.render(scene, camera);
}

animate();