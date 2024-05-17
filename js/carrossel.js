import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let cylinder, ring1, ring2, ring3;
let ring1Referencial, ring2Referencial, ring3Referencial;
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

function addObjectsToRing(ringReferencial, ring) {
    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.ConeGeometry(0.5, 1, 32),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
        new THREE.TorusGeometry(0.5, 0.2, 16, 100),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.IcosahedronGeometry(1, 0)
    ];

    const radius = (ring.geometry.innerRadius + ring.geometry.outerRadius) / 2;

    for (let i = 0; i < 8; i++) {
        let angle = 2 * Math.PI / 8 * i; // Divide the circle into 8 parts
        let x = radius * Math.cos(angle);
        let z = radius * Math.sin(angle);

        const color = new THREE.Color(Math.random() * 0xffffff);
        const material = new THREE.MeshStandardMaterial({ color: color });
        
        const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
        const scale = [Math.random() * 2, Math.random() * 2, Math.random() * 2];

        const object = createObject(ringReferencial, geometries[i], material, [x, 1, z], scale, rotation);

        const spotlight = new THREE.SpotLight(0xffffff, 1);
        spotlight.position.set(x, 0, z);
        spotlight.target = object;
        ringReferencial.add(spotlight);
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
    ring1Referencial = createReferencial(sceneReferencial, [0, 2, 0], identityVector, zeroVector);
    ring1 = createObject(ring1Referencial, ringGeometry1, material, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring1Referencial, ring1);
    ring1.direction = 'up';

    // ring 2
    const ringGeometry2 = createRingWithThickness(3, 5, ringThickness, 32);
    ring2Referencial = createReferencial(sceneReferencial, [0, 4, 0], identityVector, zeroVector);
    ring2 = createObject(ring2Referencial, ringGeometry2, material, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring2Referencial, ring2);
    ring2.direction = 'up';

    // ring 3
    const ringGeometry3 = createRingWithThickness(1, 3, ringThickness, 32);
    ring3Referencial = createReferencial(sceneReferencial, [0, 6, 0], identityVector, zeroVector);
    ring3 = createObject(ring3Referencial, ringGeometry3, material, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring3Referencial, ring3);
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


function moveRing(ring, ringReferencial, speed) {
    let cylinderHeight = cylinder.geometry.parameters.height;
    if (ring.direction === 'up') {
        if (ringReferencial.position.y + speed <= cylinderHeight) {
            ringReferencial.position.y += speed;
        } else {
            // Change direction if the ring is at the top
            ring.direction = 'down';
        }
    } else { // ring.direction === 'down'
        if (ringReferencial.position.y - speed >= ringThickness) {
            ringReferencial.position.y -= speed;
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
        moveRing(ring1, ring1Referencial, speed);
    }
    if (keys['2']) {
        moveRing(ring2, ring2Referencial, speed);
    }
    if (keys['3']) {
        moveRing(ring3, ring3Referencial, speed);
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
