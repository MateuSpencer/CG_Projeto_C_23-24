import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cameras = [];
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let activeCamera, controls;
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
    return geometry;
}

function createCarrossel(x, z) {
    'use strict';
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });

    const sceneReferencial = createReferencial(scene, [x, 0, z], identityVector, zeroVector);

    // cylinder
    createObject(sceneReferencial, cylinderGeometry, material, [0, 5, 0], [1, 1, 1], zeroVector);

    // ring 1
    const ringGeometry1 = createRingWithThickness(3.5, 4, 0.5, 32);
    createObject(sceneReferencial, ringGeometry1, material, [0, 2, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

    // ring 2
    const ringGeometry2 = createRingWithThickness(2.5, 3, 0.5, 32);
    createObject(sceneReferencial, ringGeometry2, material, [0, 4, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

    // ring 3
    const ringGeometry3 = createRingWithThickness(1.5, 2, 0.5, 32);
    createObject(sceneReferencial, ringGeometry3, material, [0, 6, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

    return sceneReferencial;
}


function createSquare(x, z) {
    'use strict';
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const objectY = boxGeometry.parameters.height / 2;

    const boxReferencial = createReferencial(scene, [x, objectY, z], identityVector, zeroVector);

    createObject(boxReferencial, boxGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    return boxReferencial;
}

function createDodecahedron(x, z) {
    'use strict';
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(2.5, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const objectY = dodecahedronGeometry.parameters.radius / 2;

    const dodecahedronReferencial = createReferencial(scene, [x, objectY, z], identityVector, zeroVector);

    createObject(dodecahedronReferencial, dodecahedronGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    return dodecahedronReferencial;
}

function createIcosahedron(x, z) {
    'use strict';
    const icosahedronGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const objectY = icosahedronGeometry.parameters.radius / 2;

    const icosahedronReferencial = createReferencial(scene, [x, objectY, z], identityVector, zeroVector);

    createObject(icosahedronReferencial, icosahedronGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    return icosahedronReferencial;
}

function createTorus(x, z) {
    'use strict';
    const torusGeometry = new THREE.TorusGeometry(1, 0.75, 16, 100);;
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const objectY = torusGeometry.parameters.radius / 2;

    const torusReferencial = createReferencial(scene, [x, objectY, z], identityVector, zeroVector);

    createObject(torusReferencial, torusGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    return torusReferencial;
}

function createTorusKnot(x, z) {
    'use strict';
    const torusKnotGeometry = new THREE.TorusKnotGeometry(1.4, 1.3, 8, 75);;
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const objectY = torusKnotGeometry.parameters.radius / 2;

    const torusKnotReferencial = createReferencial(scene, [x, objectY, z], identityVector, zeroVector);

    createObject(torusKnotReferencial, torusKnotGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    return torusKnotReferencial;
}

function createScene() {
    'use strict';
    scene.background = new THREE.Color(0xadd8e6);
    scene.add(new THREE.AxesHelper(20));

    let light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

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
    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener("resize", onResize);
}


function moveRingUp() {

}

function moveClawBaseDown() {

}


function onKeyDown(e) {
    'use strict';
    keys[e.key.toLowerCase()] = true;
}

function onKeyUp(e) {
    'use strict';
    keys[e.key.toLowerCase()] = false;
}

function animate() {
    'use strict';

    if (keys['1']) {
        rotateBoomGroup(speed);
    }
    if (keys['2']) {
        rotateBoomGroup(speed);
    }
    if (keys['3']) {
        rotateBoomGroup(speed);
    }

    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
