import * as THREE from "three";
import { OrbitControls } from "addons";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Function to Create a Texture with Text
function createTextTexture(text, size = 512, fontSize = 50, color = "white") {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size / 6;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return new THREE.CanvasTexture(canvas);
}

// Sphere with Text
const texture = createTextTexture("MENU");
const material = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, map: texture, metalness: 0.5, roughness: 0.3 });
const geometry = new THREE.SphereGeometry(2, 32, 32);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Create a Plane (Menu Background)
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const planeGeometry = new THREE.PlaneGeometry(3, 4);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -1;
plane.scale.set(0, 0, 0);
scene.add(plane);

// Create Menu Items (Stacked Vertically)
const menuItems = ["Home", "About", "Contact", "Games"];
const textMeshes = [];

menuItems.forEach((item, index) => {
    const textMaterial = new THREE.MeshBasicMaterial({ map: createTextTexture(item) });
    const textGeometry = new THREE.PlaneGeometry(2, 0.5);
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    textMesh.position.set(2, .03 - index * 0.8, 0.1); // Stack vertically
    textMesh.userData = { name: item };
    textMesh.visible = false;

    textMeshes.push(textMesh);
    scene.add(textMesh);
});

// Lighting
const light = new THREE.PointLight(0xffffff, 2, 100);
light.position.set(5, 5, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Camera Position
camera.position.set(0, 0, 5);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Raycaster & Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovering = false;

// Handle Mouse Hover Over Links
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(textMeshes);

    if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
        isHovering = true;
    } else if (isHovering) {
        document.body.style.cursor = "default";
        isHovering = false;
    }
});

// Handle Clicks on Links
window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(textMeshes);

    if (intersects.length > 0) {
        alert(`You clicked: ${intersects[0].object.userData.name}`);
    }
});

// Sphere Click Event
window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        animateSphereAndMenu();
    }
});

function animateSphereAndMenu() {
    gsap.to(sphere.scale, {
        x: 0.5, y: 0.5, z: 0.5, duration: 0.5, ease: "power2.out",
        onComplete: () => {
            gsap.to(plane.scale, {
                x: 1, y: 1, z: 1, duration: 0.8, ease: "power2.out",
                onComplete: () => {
                    gsap.to(plane.rotation, {
                        x: 0, duration: 1, ease: "power2.out",
                        onComplete: () => {
                            gsap.to(plane.position, {
                                x: 2, duration: 1, ease: "power2.out",
                                onComplete: () => {
                                    textMeshes.forEach(text => text.visible = true);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y -= 0.01; // Rotate sphere like a globe
    controls.update();
    renderer.render(scene, camera);
}

animate();
