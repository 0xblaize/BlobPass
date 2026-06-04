"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function makeMaterial(color: string, roughness = 0.72, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function addBodyPart(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: THREE.Vector3Tuple,
  scale: THREE.Vector3Tuple,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function RabbitScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 1.1, 11.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.0;
    controls.maxDistance = 20.0;
    controls.target.set(0, 1.0, 0);
    controls.autoRotate = false;

    // Dark ambient sky-ground illumination for rich 3D shading
    scene.add(new THREE.HemisphereLight("#80a0c0", "#080c10", 0.55));

    const key = new THREE.DirectionalLight("#ffffff", 3.7);
    key.position.set(-5, 6, 6);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.001;
    scene.add(key);

    const rim = new THREE.DirectionalLight("#00f0ff", 3.2);
    rim.position.set(5, 4, -4);
    scene.add(rim);

    const rabbit = new THREE.Group();
    rabbit.rotation.y = 0;
    rabbit.scale.setScalar(1.18);
    scene.add(rabbit);

    // Highly responsive 3D materials
    const dark = makeMaterial("#12141c", 0.7, 0.02);
    const blackCloth = makeMaterial("#1c1f26", 0.85, 0);
    const white = makeMaterial("#f4f5f8", 0.5, 0.02);
    const frameMat = makeMaterial("#2b2f3a", 0.4, 0.08);
    const lensMat = new THREE.MeshStandardMaterial({
      color: "#181a20",
      roughness: 0.1,
      metalness: 0.85,
    });
    const cyan = makeMaterial("#40a3e5", 0.55, 0.05);

    const sphere = new THREE.SphereGeometry(1, 72, 48);
    const earGeo = new THREE.CapsuleGeometry(0.24, 2.2, 16, 32);

    // Head
    addBodyPart(rabbit, sphere, dark, [0, 1.64, 0], [1.04, 0.98, 0.98]);

    // Ears (Capsules)
    addBodyPart(rabbit, earGeo, dark, [-0.25, 3.2, -0.08], [1.0, 1.0, 0.8]).rotation.z = -0.015;
    addBodyPart(rabbit, earGeo, dark, [0.25, 3.2, -0.08], [1.0, 1.0, 0.8]).rotation.z = 0.015;

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), dark);
    nose.position.set(0, 1.48, 0.96);
    rabbit.add(nose);

    // Sunglasses Frame Extrusion Settings
    const extrudeSettings = {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const frameShape = new THREE.Shape();
    frameShape.moveTo(-0.46, 0.25);
    frameShape.lineTo(0.46, 0.25);
    frameShape.quadraticCurveTo(0.46, -0.25, 0.32, -0.25);
    frameShape.lineTo(-0.32, -0.25);
    frameShape.quadraticCurveTo(-0.46, -0.25, -0.46, 0.25);

    const leftHole = new THREE.Path();
    leftHole.moveTo(-0.36, 0.16);
    leftHole.lineTo(0.36, 0.16);
    leftHole.lineTo(0.28, -0.16);
    leftHole.lineTo(-0.28, -0.16);
    leftHole.closePath();
    frameShape.holes.push(leftHole);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, extrudeSettings);

    // Left frame half
    const leftFrame = new THREE.Mesh(frameGeo, frameMat);
    leftFrame.position.set(-0.36, 1.70, 0.94);
    leftFrame.rotation.y = 0.14;
    rabbit.add(leftFrame);

    // Right frame half
    const rightFrame = new THREE.Mesh(frameGeo, frameMat);
    rightFrame.position.set(0.36, 1.70, 0.94);
    rightFrame.scale.x = -1;
    rightFrame.rotation.y = -0.14;
    rabbit.add(rightFrame);

    // Sunglasses Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), frameMat);
    bridge.position.set(0, 1.78, 0.96);
    rabbit.add(bridge);

    // Sunglasses Lenses
    const lensShape = new THREE.Shape();
    lensShape.moveTo(-0.37, 0.17);
    lensShape.lineTo(0.37, 0.17);
    lensShape.lineTo(0.29, -0.17);
    lensShape.lineTo(-0.29, -0.17);
    lensShape.closePath();
    const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.01, bevelEnabled: false });

    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-0.36, 1.70, 0.96);
    leftLens.rotation.y = 0.14;
    rabbit.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(0.36, 1.70, 0.96);
    rightLens.scale.x = -1;
    rightLens.rotation.y = -0.14;
    rabbit.add(rightLens);

    // Sunglasses Temples
    const templeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.72), frameMat);
    templeLeft.position.set(-0.7, 1.70, 0.58);
    templeLeft.rotation.y = 0.15;
    rabbit.add(templeLeft);

    const templeRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.72), frameMat);
    templeRight.position.set(0.7, 1.70, 0.58);
    templeRight.rotation.y = -0.15;
    rabbit.add(templeRight);

    // Headphones Band
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.09, 16, 96, Math.PI), white);
    band.position.set(0, 1.64, 0.0);
    band.rotation.x = Math.PI + 0.1;
    rabbit.add(band);

    for (const side of [-1, 1]) {
      // Cushion
      const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.11, 16, 48), white);
      cushion.position.set(side * 0.94, 1.64, 0.0);
      cushion.rotation.y = Math.PI / 2 + side * -0.08;
      cushion.scale.set(1.0, 1.15, 1.0);
      rabbit.add(cushion);

      // Outer Cup
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.22, 32), white);
      cup.position.set(side * 1.15, 1.64, 0.0);
      cup.rotation.z = Math.PI / 2;
      cup.rotation.y = side * -0.08;
      cup.scale.set(1.15, 1.0, 1.0);
      rabbit.add(cup);

      // Metal Connection Pin
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32, 16), makeMaterial("#d0d8e2", 0.2, 0.8));
      pin.position.set(side * 1.08, 1.88, 0.0);
      pin.rotation.z = side * 0.08;
      rabbit.add(pin);
    }

    // Torso (Shirt - Shortened for cute reference proportions)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.66, 0.65, 16, 32), blackCloth);
    torso.position.set(0, 0.46, 0);
    torso.scale.set(1.0, 0.96, 0.88);
    rabbit.add(torso);

    // Shirt sleeves (Organic capsules)
    for (const side of [-1, 1]) {
      const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.22, 12, 24), blackCloth);
      sleeve.position.set(side * 0.56, 0.62, 0.08);
      sleeve.rotation.z = side * -0.65;
      sleeve.rotation.x = 0.1;
      sleeve.scale.set(1.0, 1.1, 1.0);
      rabbit.add(sleeve);
    }

    // Logo (Stylized Bunny Head)
    const logoHead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), white);
    logoHead.position.set(0, 0.52, 0.76);
    logoHead.scale.set(1, 0.8, 0.3);
    rabbit.add(logoHead);

    const logoEarL = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.08, 16), white);
    logoEarL.position.set(-0.025, 0.57, 0.76);
    logoEarL.rotation.z = -0.22;
    logoEarL.rotation.x = -0.1;
    rabbit.add(logoEarL);

    const logoEarR = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.08, 16), white);
    logoEarR.position.set(0.025, 0.57, 0.76);
    logoEarR.rotation.z = 0.22;
    logoEarR.rotation.x = -0.1;
    rabbit.add(logoEarR);

    // Arms & Hands in Pockets
    for (const side of [-1, 1]) {
      // Upper arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.45, 16), dark);
      upperArm.position.set(side * 0.82, 0.3, -0.05);
      upperArm.rotation.z = side * -0.25;
      upperArm.rotation.x = -0.2;
      rabbit.add(upperArm);

      // Forearm bending into pockets
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.55, 16), dark);
      forearm.position.set(side * 0.65, -0.06, 0.16);
      forearm.rotation.z = side * -0.65;
      forearm.rotation.x = 0.7;
      forearm.rotation.y = side * -0.15;
      rabbit.add(forearm);
    }

    // Shorts pelvic waist/body (Sphere for smooth organic crotch coverage)
    const pantsWaist = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 24), white);
    pantsWaist.scale.set(1.12, 0.76, 0.95);
    pantsWaist.position.set(0, -0.22, 0.05);
    rabbit.add(pantsWaist);

    for (const side of [-1, 1]) {
      // Pants legs
      const pantsLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.38, 24), white);
      pantsLeg.position.set(side * 0.3, -0.56, 0.12);
      pantsLeg.rotation.y = side * 0.1;
      rabbit.add(pantsLeg);

      // Rolled cuff
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 12, 32), white);
      cuff.position.set(side * 0.3, -0.75, 0.12);
      cuff.rotation.x = Math.PI / 2;
      rabbit.add(cuff);

      // Legs
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.44, 16), dark);
      leg.position.set(side * 0.3, -0.96, 0.12);
      rabbit.add(leg);

      // Shoes (grouped for V-stance angle)
      const shoe = new THREE.Group();
      shoe.position.set(side * 0.3, -1.24, 0.18);
      shoe.rotation.y = side * -0.22;
      rabbit.add(shoe);

      // Sole
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.68), white);
      sole.position.set(0, -0.065, 0.05);
      shoe.add(sole);

      // Shoe Body
      const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), cyan);
      bodyMesh.position.set(0, 0.04, 0.04);
      bodyMesh.scale.set(1.25, 0.84, 1.48);
      shoe.add(bodyMesh);

      // Shoe Tongue
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.28), cyan);
      tongue.position.set(0, 0.12, 0.08);
      tongue.rotation.x = 0.28;
      shoe.add(tongue);

      // Laces
      for (let i = 0; i < 3; i++) {
        const lace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.05), white);
        lace.position.set(0, 0.13 + i * 0.04, 0.1 + i * 0.02);
        lace.rotation.x = 0.28;
        shoe.add(lace);
      }
    }

    // Invisible shadow receiver floor (removes the blue circle effect)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.ShadowMaterial({
        opacity: 0.12,
      }),
    );
    floor.position.set(0, -1.365, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Dynamic 3D depth: Set shadow casting and receiving on ALL rabbit group meshes
    rabbit.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const clock = new THREE.Clock();

    const resize = () => {
      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 520;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);
    renderer.domElement.style.outline = "none";

    let frame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div className="rabbit-scene" ref={mountRef} />;
}
