import * as THREE from "three";
import { OrbitControls } from "addons";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Utility: Create a texture with text drawn on canvas
function createTextTexture(text, size = 512, fontSize = 30, bgColor = "blue", txtColor = "white") {
    const canvas = document.createElement("canvas");
    // Make the canvas a wide rectangle
    canvas.width = size;
    canvas.height = size / 6;
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = txtColor;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return new THREE.CanvasTexture(canvas);
}

// Create the sphere with a text texture ("MENU")
// const sphereTexture = createTextTexture("MENU ");
// const sphereMaterial = new THREE.MeshStandardMaterial({
//     color: 0xc0c0c0,
//     map: sphereTexture,
//     metalness: 0.3,
//     roughness: 0.8
// });
// const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
// const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// scene.add(sphere);

// Create a texture for the cube face (with "MENU" text)
const menuTexture = createTextTexture("MENU", 300, 30, "blue", "white");

// Create six materials for the cube (one for each face)
const cubeMaterials = [
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: menuTexture, metalness: 0.5, roughness: 0.3 })
];

// Create a spinning cube instead of a sphere
const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
scene.add(cube);

// Create a plane (menu background) that will later display the links
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});
const planeGeometry = new THREE.PlaneGeometry(3, 3);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // horizontal
plane.position.y = -1;
plane.scale.set(0, 0, 0); // initially hidden
scene.add(plane);

// --- Create Menu Items (Links) ---
// These will be stacked vertically on the plane.
// For each link, we create two textures:
// • normalTexture: e.g. blue background with white text
// • hoverTexture: swapped colors (white background, blue text)
const menuItems = ["Home", "About", "Contact"];
const textMeshes = [];

menuItems.forEach((item, index) => {
    // Create both textures for normal and hover states
    const normalTexture = createTextTexture(item, 512, 50, "blue", "white");
    const hoverTexture = createTextTexture(item, 512, 50, "white", "blue");

    // Use a PlaneGeometry for the link.
    // We set material.transparent = true so we can fade its opacity.
    const textGeometry = new THREE.PlaneGeometry(2, 0.5);
    const textMaterial = new THREE.MeshBasicMaterial({
        map: normalTexture,
        transparent: true,
        opacity: 0
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the links so they stack vertically.
    // Here, adjust the y-position so that the links are evenly spaced.
    textMesh.position.set(2, 0.8 - index * 0.8, 0.1);

    // Save both textures for later swapping on hover.
    textMesh.userData = {
        name: item,
        normalTexture: normalTexture,
        hoverTexture: hoverTexture
    };
    textMesh.visible = false; // start hidden until animation completes
    textMeshes.push(textMesh);
    scene.add(textMesh);
});

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 5, 5);
scene.add(directionalLight);

// Camera position
camera.position.set(0, 0, 5);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Raycaster and Mouse for interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovering = false;

// Handle window resize
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Handle mouse movement for hover effects over links
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(textMeshes);

    // For each link, swap texture depending on whether it's hovered.
    textMeshes.forEach(mesh => {
        if (intersects.find(inter => inter.object === mesh)) {
            // Hover state: use hover texture.
            mesh.material.map = mesh.userData.hoverTexture;
            document.body.style.cursor = "pointer";
        } else {
            // Normal state: revert to normal texture.
            mesh.material.map = mesh.userData.normalTexture;
            document.body.style.cursor = "default";
        }
        mesh.material.needsUpdate = true;
    });
});

// Handle click events: links and sphere
window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);

    // Check for link clicks
    let linkIntersects = raycaster.intersectObjects(textMeshes);
    if (linkIntersects.length > 0) {
        alert(`You clicked: ${linkIntersects[0].object.userData.name}`);
        return; // Do not continue if a link was clicked.
    }

    // Check if sphere is clicked
    const sphereIntersects = raycaster.intersectObject(cube);
    if (sphereIntersects.length > 0) {
        animateSphereAndMenu();
    }
});

// Animate sphere shrinking and then animate plane to appear.
// After plane animation, fade in the links one by one.
function animateSphereAndMenu() {
    gsap.to(cube.scale, {
        x: 0.5, y: 0.5, z: 0.5,
        duration: 0.5, ease: "power2.out",
        onComplete: () => {
            gsap.to(plane.scale, {
                x: 1, y: 1, z: 1,
                duration: 0.8, ease: "power2.out",
                onComplete: () => {
                    gsap.to(plane.rotation, {
                        x: 0,
                        duration: 1, ease: "power2.out",
                        onComplete: () => {
                            gsap.to(plane.position, {
                                x: 2,
                                duration: 1, ease: "power2.out",
                                onComplete: () => {
                                    // Fade in the links one by one
                                    textMeshes.forEach((mesh, i) => {
                                        mesh.visible = true;
                                        gsap.to(mesh.material, {
                                            opacity: 1,
                                            duration: 0.5,
                                            delay: i * 0.3,
                                            ease: "power2.out"
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sphere for a globe-like effect
    cube.rotation.y -= 0.02;

    controls.update();
    renderer.render(scene, camera);
}

animate();
