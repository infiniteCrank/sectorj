import * as THREE from "three";
import { OrbitControls, FontLoader, TextGeometry } from "addons";

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
    ctx.fillStyle = "blue";
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
const material = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, map: texture, metalness: 0.3, roughness: 0.8 });
const geometry = new THREE.SphereGeometry(2, 32, 32);
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Create a plane (hidden initially)
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const planeGeometry = new THREE.PlaneGeometry(3, 3);
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // Rotate to be horizontal
plane.position.y = -1; // Position just below the sphere
plane.scale.set(0, 0, 0); // Start invisible
scene.add(plane);

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

// Raycaster for detecting interactions
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

let menuClicked = false;
// Handle click event with animation
window.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(sphere);

    if (intersects.length > 0) {
        if (!menuClicked) {
            gsap.to(sphere.scale, { x: sphere.scale.x * 0.5, y: sphere.scale.y * 0.5, z: sphere.scale.z * 0.5, duration: 0.5, ease: "power2.out" });
            menuClicked = true;

            // Animate sphere shrinking
            gsap.to(sphere.scale, {
                x: 0.5, y: 0.5, z: 0.5, duration: 0.5, ease: "power2.out",
                onComplete: () => {
                    // Grow the plane outward
                    gsap.to(plane.scale, {
                        x: 1, y: 1, z: 1, duration: 0.8, ease: "power2.out",
                        onComplete: () => {
                            // Rotate the plane downward to face the viewer
                            gsap.to(plane.rotation, {
                                x: 0, duration: 1, ease: "power2.out",
                                onComplete: () => {
                                    // Move the plane to the right
                                    gsap.to(plane.position, {
                                        x: 2, duration: 1, ease: "power2.out",
                                        onComplete: () => {
                                            // Show the links after all animations are complete
                                            document.getElementById("links").style.display = "block";
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            gsap.to(sphere.scale, { x: sphere.scale.x / 0.5, y: sphere.scale.y / 0.5, z: sphere.scale.z / 0.5, duration: 0.5, ease: "power2.out" });
            menuClicked = false;
        }
    }
});

// Animation loop (adds rotation)
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sphere around the Y-axis like a globe
    sphere.rotation.y -= 0.01; // Adjust speed if needed

    controls.update();
    renderer.render(scene, camera);
}

animate();
