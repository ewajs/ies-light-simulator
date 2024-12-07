import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IESLoader } from 'three/examples/jsm/loaders/IESLoader.js';
import { IESSpotLight, WebGPURenderer } from 'three/webgpu';
// Note: Ensure you have the correct path to IESLoader.js. Adjust if needed.
// If using from node_modules, you might need a copy in your project or adjust paths accordingly.

let renderer, scene, camera, controls;
let spotLight;
let currentIesTexture = null;

init();
animate();

async function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 20);

    renderer = new WebGPURenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.enablePan = true;

    // Create a simple room: a box geometry with inverted normals
    const roomWidth = 10;
    const roomHeight = 4;
    const roomDepth = 10;

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load('textures/wall-4-granite-DIFFUSE.jpg'); // Replace with your texture path
    const wallNormalMap = textureLoader.load('textures/wall-4-granite-NORMAL.jpg'); // Replace with your normal map path
    const floorTexture = textureLoader.load('textures/wall-4-granite-DIFFUSE.jpg'); // Replace with your floor texture path

    // Wall material with texture and normal map
    const wallMaterial = new THREE.MeshPhongMaterial({
        map: wallTexture,
        normalMap: wallNormalMap,
    });

    // Floor material
    const floorMaterial = new THREE.MeshPhongMaterial({
        map: floorTexture,
    });

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2; // Lay flat on the XZ plane
    floorMesh.position.y = 0; // Position at floor level
    scene.add(floorMesh);

    // Walls
    const wallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);

    // Back wall (Z+)
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2; // Center on the Y axis
    scene.add(backWall);

    // Front wall (Z-)
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.rotation.y = Math.PI;
    frontWall.position.z = roomDepth / 2;
    frontWall.position.y = roomHeight / 2;
    scene.add(frontWall);

    // Left wall (X-)
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2;
    scene.add(leftWall);

    // Right wall (X+)
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = roomWidth / 2;
    rightWall.position.y = roomHeight / 2;
    scene.add(rightWall);

    // Add a simple ambient light and a floor spotlight to visualize after loading IES
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    // Placeholder spotlight - will set IES map once file is chosen
    spotLight = new IESSpotLight(0xffffff, 500);
    spotLight.position.set(-4, roomHeight * 0.8, 0); // near the ceiling
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.7;
    spotLight.distance = 20;
    scene.add(spotLight);

    window.addEventListener('resize', onWindowResize);

    // Set up file input handling
    const iesFileInput = document.getElementById('iesFileInput');
    iesFileInput.addEventListener('change', handleFileChange);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const iesData = e.target.result;

        const iesLoader = new IESLoader();
        // Load the IES from data string
        const iesTexture = iesLoader.parse(iesData);
        if (currentIesTexture) {
            currentIesTexture.dispose();
        }
        currentIesTexture = iesTexture;

        spotLight.iesMap = iesTexture;
        spotLight.needsUpdate = true;

        console.log('IES file loaded and applied to the spotlight.');
    };
    fileReader.readAsText(file);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
