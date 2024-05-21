import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let cylinder, ring1, ring2, ring3, mobiusStrip, skydome;
let cylinderReferencial, ring1Referencial, ring2Referencial, ring3Referencial;
let ringThickness = 2;
let speed = 0.1; 

const cameras = [];
let activeCamera, controls;
let directionalLight; 

let keys = {};
let objects = [];
let spotlights = [];
const pointlights = [];

function createSkydome(radius, widthSegments, heightSegments, texture) {
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI / 2);
    const materials = [
        new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide }),
        new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide }),
        new THREE.MeshToonMaterial({ map: texture, side: THREE.DoubleSide }),
        new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    ];
    skydome = new THREE.Mesh(geometry, materials[0]);
    skydome.materials = materials;
    return skydome;
}

function addSkydome() {
    const radius = 30;
    const widthSegments = 32;
    const heightSegments = 16;

    const loader = new THREE.TextureLoader();
    loader.load('../img/frame.png', function (texture) {
        const skydome = createSkydome(radius, widthSegments, heightSegments, texture);
        skydome.position.set(0, 0, 0);
        scene.add(skydome);
    });
}

function createMobiusStrip(uSegments, vSegments, radius, width) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    for (let i = 0; i <= uSegments; i++) {
        const u = i / uSegments * Math.PI * 2;
        for (let j = 0; j <= vSegments; j++) {
            const v = j / vSegments - 0.5;

            const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
            const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
            const z = v * Math.sin(u / 2);

            vertices.push(x, y, z);

            if (i < uSegments && j < vSegments) {
                const a = i * (vSegments + 1) + j;
                const b = i * (vSegments + 1) + j + 1;
                const c = (i + 1) * (vSegments + 1) + j;
                const d = (i + 1) * (vSegments + 1) + j + 1;

                indices.push(a, b, d);
                indices.push(a, d, c);
            }
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function addMobiusStrip(cylinder, cylinderReferencial) {
    const radius = 2; // Radius of the Möbius strip
    const width = 1;  // Width of the Möbius strip
    const uSegments = 30; // Number of segments along the u direction
    const vSegments = 10; // Number of segments along the v direction

    const mobiusGeometry = createMobiusStrip(uSegments, vSegments, radius, width);
    
    const materials = [
        new THREE.MeshLambertMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
        new THREE.MeshPhongMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
        new THREE.MeshToonMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
        new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    ];

    mobiusStrip = createObject(cylinderReferencial, mobiusGeometry, materials, [0, cylinder.geometry.parameters.height - 1, 0], identityVector, [Math.PI / 2, 0, 0]);
    mobiusStrip.materials = materials; // Store materials for later use

    // point lights
    for (let i = 0; i < 8; i++) {
        const angle = 2 * Math.PI / 8 * i; // Divide the circle into 8 parts
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const pointlight = new THREE.PointLight(0xffffff, 1);
        pointlight.position.set(x, 0, z);
        mobiusStrip.add(pointlight);
        pointlights.push(pointlight);
    }
}

function createObject(parent, geometry, materials, position, scale, rotation) {
    'use strict';
    const mesh = new THREE.Mesh(geometry, materials[0]);
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
        const materials = [
            new THREE.MeshLambertMaterial({ color: color }),
            new THREE.MeshPhongMaterial({ color: color }),
            new THREE.MeshToonMaterial({ color: color }),
            new THREE.MeshNormalMaterial()
        ];
        
        const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
        const scale = [Math.random() * 2, Math.random() * 2, Math.random() * 2];

        const object = createObject(ringReferencial, geometries[i], materials, [x, 1, z], scale, rotation);
        object.materials = materials; // Store materials for later use

        objects.push(object);

        const spotlight = new THREE.SpotLight(0xffffff, 1);
        spotlight.position.set(x, 0, z);
        spotlight.target = object;
        ringReferencial.add(spotlight);
        spotlights.push(spotlight);
    }
}

function createCarrossel(x, z) {
    'use strict';
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 8);
    const materials = [
        new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
        new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
        new THREE.MeshToonMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
        new THREE.MeshNormalMaterial()
    ];

    const sceneReferencial = createReferencial(scene, [x, 0, z], identityVector, zeroVector);

    // cylinder
    cylinderReferencial = createReferencial(sceneReferencial, [0, 4, 0], identityVector, zeroVector);
    cylinder = createObject(cylinderReferencial, cylinderGeometry, materials, zeroVector, [1, 1, 1], zeroVector);
    cylinder.materials = materials;

    // ring 1
    const ringGeometry1 = createRingWithThickness(5, 7, ringThickness, 32);
    ring1Referencial = createReferencial(sceneReferencial, [0, 2, 0], identityVector, zeroVector);
    ring1 = createObject(ring1Referencial, ringGeometry1, materials, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring1Referencial, ring1);
    ring1.direction = 'up';
    ring1.materials = materials;

    // ring 2
    const ringGeometry2 = createRingWithThickness(3, 5, ringThickness, 32);
    ring2Referencial = createReferencial(sceneReferencial, [0, 4, 0], identityVector, zeroVector);
    ring2 = createObject(ring2Referencial, ringGeometry2, materials, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring2Referencial, ring2);
    ring2.direction = 'up';
    ring2.materials = materials;

    // ring 3
    const ringGeometry3 = createRingWithThickness(1, 3, ringThickness, 32);
    ring3Referencial = createReferencial(sceneReferencial, [0, 6, 0], identityVector, zeroVector);
    ring3 = createObject(ring3Referencial, ringGeometry3, materials, zeroVector, [1, 1, 1], [Math.PI / 2, 0, 0]);
    addObjectsToRing(ring3Referencial, ring3);
    ring3.direction = 'up';
    ring3.materials = materials;

    return sceneReferencial;
}

function createScene() {
    'use strict';
    let light = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xff8c00, 0.8);
    directionalLight.position.set(0, Math.tan(Math.PI / 4), 1);
    scene.add(directionalLight);

    createCarrossel(0, 0).name = "Carrossel";
    addMobiusStrip(cylinder, cylinderReferencial);
    addSkydome();
}

function setupCameras() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    // Perspective camera
    const cameraPerspective = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraPerspective.position.set(-17, 17, 17);
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
    if (keys['d']) {
        directionalLight.intensity = directionalLight.intensity === 0 ? 0.8 : 0;
        keys['d'] = false;
    }
    if (keys['p']) {
        spotlights.forEach(spotlight => {
            spotlight.intensity = 1;
        });
        pointlights.forEach(pointlight => {
            pointlight.intensity = 1;
        });
        keys['p'] = false;
    }
    if (keys['s']) {
        spotlights.forEach(spotlight => {
            spotlight.intensity = 0;
        });
        pointlights.forEach(pointlight => {
            pointlight.intensity = 0;
        });
        keys['s'] = false;
    }
    if (keys['q']) {
        switchMaterial('MeshLambertMaterial');
    }
    if (keys['w']) {
        switchMaterial('MeshPhongMaterial');
    }
    if (keys['e']) {
        switchMaterial('MeshToonMaterial');
    }
    if (keys['r']) {
        switchMaterial('MeshNormalMaterial');
    }

    objects.forEach(object => {
        object.rotation.x += speed;
    });

    cylinderReferencial.rotation.y += speed;
}

function switchMaterial(materialType) {
    objects.forEach(object => {
        switch (materialType) {
            case 'MeshLambertMaterial':
                object.material = object.materials[0];
                break;
            case 'MeshPhongMaterial':
                object.material = object.materials[1];
                break;
            case 'MeshToonMaterial':
                object.material = object.materials[2];
                break;
            case 'MeshNormalMaterial':
                object.material = object.materials[3];
                break;
        }
    });

    switch (materialType) {
        case 'MeshLambertMaterial':
            mobiusStrip.material = mobiusStrip.materials[0];
            cylinder.material = cylinder.materials[0];
            ring1.material = ring1.materials[0];
            ring2.material = ring2.materials[0];
            ring3.material = ring3.materials[0];
            skydome.material = skydome.materials[0];
            break;
        case 'MeshPhongMaterial':
            mobiusStrip.material = mobiusStrip.materials[1];
            cylinder.material = cylinder.materials[1];
            ring1.material = ring1.materials[1];
            ring2.material = ring2.materials[1];
            ring3.material = ring3.materials[1];
            skydome.material = skydome.materials[1];
            break;
        case 'MeshToonMaterial':
            mobiusStrip.material = mobiusStrip.materials[2];
            cylinder.material = cylinder.materials[2];
            ring1.material = ring1.materials[2];
            ring2.material = ring2.materials[2];
            ring3.material = ring3.materials[2];
            skydome.material = skydome.materials[2];
            break;
        case 'MeshNormalMaterial':
            mobiusStrip.material = mobiusStrip.materials[3];
            cylinder.material = cylinder.materials[3];
            ring1.material = ring1.materials[3];
            ring2.material = ring2.materials[3];
            ring3.material = ring3.materials[3];
            skydome.material = skydome.materials[3];
            break;
    }
}

function animate() {
    'use strict';

    update();
    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);


