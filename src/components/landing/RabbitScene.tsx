"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type RabbitSceneProps = {
  className?: string;
};

export function RabbitScene({ className = "" }: RabbitSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const rabbitRoot = new THREE.Group();
    scene.add(rabbitRoot);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.domElement.className = "block h-full w-full";
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.HemisphereLight("#9fb8d2", "#06080b", 0.7));

    const key = new THREE.DirectionalLight("#ffffff", 4);
    key.position.set(-5, 6, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight("#dcecff", 1.3);
    fill.position.set(3, 2, 5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight("#00c853", 2.7);
    rim.position.set(5, 4, -4);
    scene.add(rim);

    let modelReady = false;
    let isVisible = true;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;

    const fitCameraToModel = () => {
      const box = new THREE.Box3().setFromObject(rabbitRoot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const visibleHeight = Math.max(size.y, size.x / camera.aspect);
      const distance =
        visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));

      camera.position.set(center.x, center.y, center.z + distance * 1.35);
      controls.target.copy(center);
      controls.update();
      camera.updateProjectionMatrix();
    };

    const loader = new GLTFLoader();
    loader.load(
      "/rabbit.glb",
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 5.2 / Math.max(size.x, size.y, size.z);

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );
        model.rotation.set(0, 0, 0);

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((material) => {
              if (material instanceof THREE.MeshStandardMaterial) {
                material.metalness = Math.min(material.metalness, 0.15);
                material.roughness = Math.max(material.roughness, 0.68);
              }
            });
          }
        });

        rabbitRoot.add(model);
        fitCameraToModel();
        modelReady = true;
      },
      undefined,
      (error) => {
        console.error("Error loading the 3D model:", error);
      },
    );

    const resize = () => {
      const width = mount.clientWidth || 360;
      const height = mount.clientHeight || 360;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (modelReady) fitCameraToModel();
    };

    resize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);

    const ro = new ResizeObserver(() => resize());
    ro.observe(mount);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    visibilityObserver.observe(mount);

    let frame = 0;
    const animate = () => {
      if (!isVisible) {
        frame = window.requestAnimationFrame(animate);
        return;
      }

      if (!prefersReducedMotion) {
        controls.autoRotate = mount.matches(":hover");
      }
      
      controls.update();
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      visibilityObserver.disconnect();
      ro.disconnect();
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

  return <div className={className} ref={mountRef} />;
}
