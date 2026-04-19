'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ---- Renderer ---- */
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    /* ---- Scene & Camera ---- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 6;

    /* ---- Mouse tracking ---- */
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    /* ---- (a) Main centerpiece: TorusKnot wireframe ---- */
    const torusKnotGeo = new THREE.TorusKnotGeometry(1.4, 0.35, 80, 12, 2, 3);
    const torusKnotEdges = new THREE.EdgesGeometry(torusKnotGeo);
    const torusKnotMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      opacity: 0.55,
      transparent: true,
    });
    const torusKnot = new THREE.LineSegments(torusKnotEdges, torusKnotMat);
    scene.add(torusKnot);

    /* ---- (b) 4 orbiting shapes ---- */
    const orbiters: THREE.LineSegments[] = [];
    const orbiterColors = [0xf59e0b, 0x8b5cf6, 0xf59e0b, 0x8b5cf6];

    for (let i = 0; i < 4; i++) {
      const geo =
        i % 2 === 0
          ? new THREE.IcosahedronGeometry(0.35, 1)
          : new THREE.OctahedronGeometry(0.45);
      const edges = new THREE.EdgesGeometry(geo);
      const mat = new THREE.LineBasicMaterial({
        color: orbiterColors[i],
        opacity: 0.55,
        transparent: true,
      });
      const mesh = new THREE.LineSegments(edges, mat);
      scene.add(mesh);
      orbiters.push(mesh);
    }

    /* ---- (c) Particle field ---- */
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ---- Clock & Animation ---- */
    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // (a) TorusKnot rotation + float
      torusKnot.rotation.x += delta * 0.15;
      torusKnot.rotation.y += delta * 0.2;
      torusKnot.position.y = Math.sin(elapsed * 0.6) * 0.25;

      // (b) Orbiting shapes
      for (let i = 0; i < orbiters.length; i++) {
        const angle = elapsed * 0.35 + (i / 4) * Math.PI * 2;
        orbiters[i].position.x = Math.cos(angle) * 3.5;
        orbiters[i].position.y = Math.sin(angle * 0.7) * 1.8;
        orbiters[i].position.z = Math.sin(angle * 0.5) * 1;
        orbiters[i].rotation.x += delta * 0.5;
        orbiters[i].rotation.y += delta * 0.7;
      }

      // (c) Particles slow rotation
      particles.rotation.y = elapsed * 0.03;

      // (d) Mouse parallax
      target.x += (mouse.x * 0.8 - target.x) * 0.04;
      target.y += (mouse.y * 0.5 - target.y) * 0.04;
      camera.rotation.y = target.x * 0.05;
      camera.rotation.x = target.y * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    /* ---- Resize handler ---- */
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    /* ---- Cleanup ---- */
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose geometries and materials
      torusKnotGeo.dispose();
      torusKnotEdges.dispose();
      torusKnotMat.dispose();
      orbiters.forEach((o) => {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      });
      particleGeo.dispose();
      particleMat.dispose();

      renderer.dispose();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
