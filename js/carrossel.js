import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let cylinder, ring1, ring2, ring3;
let ringThickness = 2;
let speed = 0.1; 

const cameras = [];
let activeCamera, controls;
let directionalLight; 

let keys = {};

function createObject(parent, geometry, material, position, scale, rotation) {
    'use strict';
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.position.set(position[0], position[1], position[2]);
    parent.add(mesh);
    return mesh;
}

function createReferencial(parent, position, scale, rotation) {
    'use strict';
    const ref = new THREE.Object3D();
    ref.scale.set(scale[0], scale[1], scale[2]);
    ref.rotation.set(rotation[0], rotation[1], rotation[2]);
    ref.position.set(position[0], position[1], position[2]);
    parent.add(ref);
    return ref;
}

function createRingWithThickness(innerRadius, outerRadius, thickness, radialSegments) {
    const shape = new THREE.Shape();

    // Outer circle
    shape.moveTo(outerRadius, 0);
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    // Inner circle (hole)
    const holePath = new THREE.Path();
    holePath.moveTo(innerRadius, 0);
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = {
        depth: thickness,
        bevelEnabled: false,
        steps: 1,
        curveSegments: radialSegments
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    geometry.innerRadius = innerRadius;
    geometry.outerRadius = outerRadius;

    return geometry;
}

function addSquaresToRing(ringReferencial, ring) {
    const squareGeometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });

    const radius = (ring.geometry.innerRadius + ring.geometry.outerRadius) / 2;

    for (let i = 0; i < 8; i++) {
        let angle = 2 * Math.PI / 8 * i; // Divide the circle into 8 parts
        let x = radius * Math.cos(angle);
        let z = radius * Math.sin(angle);
        console.log("x: " + x + " z: " + z);
        createObject(ringReferencial, squareGeometry, material, [x, 0, z], [1, 1, 1], [0, 0, 0]);
    }
}

function createCarrossel(x, z) {
    'use strict';
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    const sceneReferencial = createReferencial(scene, [x, 0, z], identityVector, zeroVector);

    // cylinder
    cylinder = createObject(sceneReferencial, cylinderGeometry, material, [0, 4, 0], [1, 1, 1], zeroVector);

    // ring 1
    const ringGeometry1 = createRingWithThickness(5, 7, ringThickness, 32);
    ring1 = createObject(sceneReferencial, ringGeometry1, material, [0, 2, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    const ring1Referencial = createReferencial(sceneReferencial, [0, 2, 0], identityVector, zeroVector);
    addSquaresToRing(ring1Referencial, ring1);
    ring1.direction = 'up';

    // ring 2
    const ringGeometry2 = createRingWithThickness(3, 5, ringThickness, 32);
    ring2 = createObject(sceneReferencial, ringGeometry2, material, [0, 4, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    const ring2Referencial = createReferencial(sceneReferencial, [0, 4, 0], identityVector, zeroVector);
    addSquaresToRing(ring2Referencial, ring2);
    ring2.direction = 'up';

    // ring 3
    const ringGeometry3 = createRingWithThickness(1, 3, ringThickness, 32);
    ring3 = createObject(sceneReferencial, ringGeometry3, material, [0, 6, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    const ring3Referencial = createReferencial(sceneReferencial, [0, 6, 0], identityVector, zeroVector);
    addSquaresToRing(ring3Referencial, ring3);
    ring3.direction = 'up';

    return sceneReferencial;
}

function createScene() {
    'use strict';
    scene.add(new THREE.AxesHelper(20));

    let light = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, Math.tan(Math.PI / 4), 1);
    scene.add(directionalLight);

    createCarrossel(0, 0).name = "Carrossel";
}

function setupCameras() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    // Perspective camera
    const cameraPerspective = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraPerspective.position.set(30, 60, 60);
    cameraPerspective.lookAt(0, 0, 0);
    cameras.push(cameraPerspective);

    activeCamera = cameraPerspective;
    controls = new OrbitControls(activeCamera, renderer.domElement);
}

function onResize() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameras.forEach(cam => {
        if (cam instanceof THREE.PerspectiveCamera) {
            cam.aspect = window.innerWidth / window.innerHeight;
            cam.updateProjectionMatrix();
        } else if (cam instanceof THREE.OrthographicCamera) {
            const aspectRatio = window.innerWidth / window.innerHeight;
            cam.left = -50 * aspectRatio;
            cam.right = 50 * aspectRatio;
            cam.updateProjectionMatrix();
        }
    });
}

function render() {
    'use strict';
    renderer.render(scene, activeCamera);
}


function init() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    setupCameras();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener("resize", onResize);
}


function moveRing(ring, speed) {
    let cylinderHeight = cylinder.geometry.parameters.height;
    if (ring.direction === 'up') {
        if (ring.position.y + speed <= cylinderHeight) {
            ring.position.y += speed;
        } else {
            // Change direction if the ring is at the top
            ring.direction = 'down';
        }
    } else { // ring.direction === 'down'
        if (ring.position.y - speed >= ringThickness) {
            ring.position.y -= speed;
        } else {
            // Change direction if the ring is at the bottom
            ring.direction = 'up';
        }
    }
}

function onKeyDown(e) {
    'use strict';
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'q') {
        if (directionalLight.intensity === 0) {
            directionalLight.intensity = 0.8;
        } else {
            directionalLight.intensity = 0;
        }
    }
}

function onKeyUp(e) {
    'use strict';
    keys[e.key.toLowerCase()] = false;
}

function update() {
    if (keys['1']) {
        moveRing(ring1, speed);
    }
    if (keys['2']) {
        moveRing(ring2, speed);
    }
    if (keys['3']) {
        moveRing(ring3, speed);
    }

    cylinder.rotation.y += speed;
}

function animate() {
    'use strict';

    update()
    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
