import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function OpeningAnimation({ onComplete }) {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.05);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -2, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. High-Tech Grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x0284c7, 0x1e293b);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -10;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 3. Particles / Data Points
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 400;
    const posArray = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // 4. Advanced ECG Line (Draw Effect)
    const points = [];
    const scaleY = 2.0;
    const segments = 5;
    
    // Create a repeating heartbeat pattern
    for (let i = 0; i < segments; i++) {
      const offsetX = (i - segments/2) * 8;
      points.push(new THREE.Vector3(offsetX - 4, 0, 0));
      points.push(new THREE.Vector3(offsetX - 1.5, 0, 0));
      // P
      points.push(new THREE.Vector3(offsetX - 1.2, 0.3 * scaleY, 0));
      points.push(new THREE.Vector3(offsetX - 0.9, 0, 0));
      // Q
      points.push(new THREE.Vector3(offsetX - 0.5, -0.4 * scaleY, 0));
      // R
      points.push(new THREE.Vector3(offsetX, 2.8 * scaleY, 0));
      // S
      points.push(new THREE.Vector3(offsetX + 0.5, -0.8 * scaleY, 0));
      // ST
      points.push(new THREE.Vector3(offsetX + 0.8, 0, 0));
      // T
      points.push(new THREE.Vector3(offsetX + 1.6, 0.6 * scaleY, 0));
      points.push(new THREE.Vector3(offsetX + 2.0, 0, 0));
      points.push(new THREE.Vector3(offsetX + 4, 0, 0));
    }

    // Spline curve for smooth line
    const curve = new THREE.CatmullRomCurve3(points);
    const smoothPoints = curve.getPoints(600);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(smoothPoints);
    const material = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    
    const line = new THREE.Line(geometry, material);
    // Hide initially by setting draw range to 0
    geometry.setDrawRange(0, 0);
    scene.add(line);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 6. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = function () {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slowly rotate particles
      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = elapsedTime * 0.02;

      // Subtle camera sway
      camera.position.x = Math.sin(elapsedTime * 0.5) * 1.5;
      camera.position.y = Math.cos(elapsedTime * 0.3) * 0.5 - 1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // 7. GSAP Cinematic Sequence
    const drawParams = { count: 0 };
    
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(mountRef.current, {
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut",
          onComplete: () => onComplete()
        });
      }
    });

    // Animate drawing the ECG line
    tl.to(drawParams, {
      count: smoothPoints.length,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => {
        geometry.setDrawRange(0, Math.floor(drawParams.count));
      }
    })
    // Pulse the line color to white then back
    .to(material.color, {
      r: 1, g: 1, b: 1,
      duration: 0.3,
      yoyo: true,
      repeat: 3
    }, "-=1.0")
    // Zoom in dramatically
    .to(camera.position, {
      z: 2,
      duration: 1.5,
      ease: "power3.in"
    }, "-=0.5");

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [onComplete]);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          color: '#0ea5e9', 
          fontFamily: "'JetBrains Mono', monospace", 
          letterSpacing: '4px', 
          fontSize: '0.9rem',
          fontWeight: 600,
          opacity: 0.8,
          textTransform: 'uppercase',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          Initializing JeevanSutra Engine
        </div>
        <div style={{
          width: '200px',
          height: '2px',
          background: 'rgba(14, 165, 233, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, height: '100%', width: '100%',
            background: '#0ea5e9',
            animation: 'barGrow 3s cubic-bezier(0.1, 0.8, 0.2, 1) forwards'
          }} />
        </div>
      </div>
    </div>
  );
}
