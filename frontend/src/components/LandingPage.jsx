import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../landing.css';

gsap.registerPlugin(ScrollTrigger);

/* ─── 3D DNA Helix ─── */
function DNACanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* Scene & Camera */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 14);

    /* Lighting */
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const point = new THREE.PointLight(0x0284c7, 2.5, 50);
    point.position.set(5, 10, 10);
    scene.add(point);
    const point2 = new THREE.PointLight(0x059669, 1.8, 50);
    point2.position.set(-5, -5, 8);
    scene.add(point2);

    /* DNA helix parameters */
    const helixGroup = new THREE.Group();
    helixGroup.position.x = -0.5;
    scene.add(helixGroup);

    const PAIRS = 48;
    const RADIUS = 2.2;
    const RISE = 0.38;
    const TWIST = (2 * Math.PI) / 12;

    const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const bondGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);

    const matBlue = new THREE.MeshPhongMaterial({ color: 0x0284c7, shininess: 90 });
    const matGreen = new THREE.MeshPhongMaterial({ color: 0x059669, shininess: 90 });
    const matBond = new THREE.MeshPhongMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    const matBackbone = new THREE.MeshPhongMaterial({ color: 0x0369a1, transparent: true, opacity: 0.35 });

    const strand1Points = [];
    const strand2Points = [];

    for (let i = 0; i < PAIRS; i++) {
      const angle = i * TWIST;
      const y = i * RISE - (PAIRS * RISE) / 2;

      const x1 = Math.cos(angle) * RADIUS;
      const z1 = Math.sin(angle) * RADIUS;
      const x2 = Math.cos(angle + Math.PI) * RADIUS;
      const z2 = Math.sin(angle + Math.PI) * RADIUS;

      strand1Points.push(new THREE.Vector3(x1, y, z1));
      strand2Points.push(new THREE.Vector3(x2, y, z2));

      /* Nucleotide spheres */
      const s1 = new THREE.Mesh(sphereGeo, matBlue);
      s1.position.set(x1, y, z1);
      helixGroup.add(s1);

      const s2 = new THREE.Mesh(sphereGeo, matGreen);
      s2.position.set(x2, y, z2);
      helixGroup.add(s2);

      /* Bond connecting them */
      const bond = new THREE.Mesh(bondGeo, matBond);
      const mid = new THREE.Vector3((x1 + x2) / 2, y, (z1 + z2) / 2);
      bond.position.copy(mid);
      const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      bond.scale.set(1, dist, 1);
      bond.lookAt(new THREE.Vector3(x1, y, z1));
      bond.rotateX(Math.PI / 2);
      helixGroup.add(bond);
    }

    /* Backbone tubes */
    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const curve2 = new THREE.CatmullRomCurve3(strand2Points);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, 200, 0.06, 8, false);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, 200, 0.06, 8, false);
    helixGroup.add(new THREE.Mesh(tubeGeo1, matBackbone));
    helixGroup.add(new THREE.Mesh(tubeGeo2, matBackbone));

    /* Mouse / Touch interactivity */
    const mouse = { x: 0, y: 0 };

    const handlePointer = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = (clientX / w - 0.5) * 2;
      mouse.y = -(clientY / h - 0.5) * 2;
    };

    window.addEventListener('mousemove', handlePointer);
    window.addEventListener('touchmove', handlePointer, { passive: true });

    /* Intro animation */
    gsap.fromTo(helixGroup.rotation, { y: -Math.PI }, { y: 0, duration: 2.2, ease: 'power3.out' });
    gsap.fromTo(helixGroup.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'elastic.out(1, 0.5)' });

    /* Render loop */
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      helixGroup.rotation.y += 0.015;
      helixGroup.rotation.x += (mouse.y * 0.3 - helixGroup.rotation.x) * 0.05;
      helixGroup.rotation.z += (mouse.x * 0.15 - helixGroup.rotation.z) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    /* Resize */
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handlePointer);
      window.removeEventListener('touchmove', handlePointer);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="lp-dna-canvas" />;
}

/* ─── Floating Particle Background ─── */
function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 30;

    const COUNT = 300;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 50;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({ color: 0x0284c7, size: 0.12, transparent: true, opacity: 0.5 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      points.rotation.y += 0.0005;
      points.rotation.x += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="lp-particle-field" />;
}

/* ─── Main Landing Page Component ─── */
export default function LandingPage({ onNavigateLogin }) {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pipelineRef = useRef(null);
  const statsRef = useRef(null);
  const contactRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    /* Nav background on scroll */
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'bottom top+=80',
      onEnter: () => navRef.current?.classList.add('lp-nav--scrolled'),
      onLeaveBack: () => navRef.current?.classList.remove('lp-nav--scrolled'),
      scroller: '.lp-scroll-container'
    });

    /* Hero text stagger */
    gsap.fromTo('.lp-hero-title span', { y: 80, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.3,
    });
    gsap.fromTo('.lp-hero-sub', { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 1,
    });
    gsap.fromTo('.lp-hero-cta', { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.3,
    });

    /* Feature cards */
    gsap.utils.toArray('.lp-feature-card').forEach((card, i) => {
      gsap.fromTo(card, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 85%', scroller: '.lp-scroll-container' },
        delay: i * 0.1,
      });
    });

    /* Pipeline steps */
    gsap.utils.toArray('.lp-pipeline-step').forEach((step, i) => {
      gsap.fromTo(step, { x: i % 2 === 0 ? -80 : 80, opacity: 0 }, {
        x: 0, opacity: 1, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 80%', scroller: '.lp-scroll-container' },
      });
    });

    /* Stats counter */
    gsap.utils.toArray('.lp-stat-number').forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: target, duration: 2, ease: 'power1.out',
        snap: { innerText: 1 },
        scrollTrigger: { trigger: el, start: 'top 85%', scroller: '.lp-scroll-container' },
      });
    });

    /* Contact section */
    gsap.fromTo('.lp-contact-inner', { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: '.lp-contact-inner', start: 'top 85%', scroller: '.lp-scroll-container' },
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div className="lp-root">
      {/* NAVIGATION */}
      <nav ref={navRef} className="lp-nav">
        <div className="lp-nav-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#lpgrad)"/>
            <path d="M5 18h5.5l2-7 3.5 14 3.5-12 2 5H27" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lpgrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#0d47a1"/><stop offset="1" stopColor="#1976d2"/></linearGradient></defs>
          </svg>
          <span>JeevanSutra</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features" onClick={(e) => { e.preventDefault(); featuresRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a>
          <a href="#pipeline" onClick={(e) => { e.preventDefault(); pipelineRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>How It Works</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); contactRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a>
        </div>
        <div className="lp-nav-auth">
          <button className="lp-btn-ghost" onClick={onNavigateLogin}>Sign In</button>
          <button className="lp-btn-primary" onClick={onNavigateLogin}>Log In</button>
        </div>
      </nav>

      {/* SCROLLABLE CONTENT */}
      <div className="lp-scroll-container">

        {/* ─── HERO ─── */}
        <section ref={heroRef} className="lp-hero">
          <div className="lp-hero-bg-gradient" />
          <DNACanvas />
          <div className="lp-hero-content">
            <h1 className="lp-hero-title">
              <span>Intelligent</span>{' '}
              <span>Clinical</span>{' '}
              <span>Decision</span>{' '}
              <span className="lp-gradient-text">Support</span>
            </h1>
            <p className="lp-hero-sub">
              JeevanSutra is a hybrid AI platform that combines deterministic medical rule engines with
              large language models to deliver real-time ICU diagnostics, antimicrobial resistance alerts,
              and actionable clinical recommendations.
            </p>
            <div className="lp-hero-cta">
              <button className="lp-btn-primary lp-btn-lg" onClick={onNavigateLogin}>
                Access the Platform →
              </button>
              <a href="#features" className="lp-btn-outline lp-btn-lg" onClick={(e) => { e.preventDefault(); featuresRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section ref={featuresRef} id="features" className="lp-section lp-features">
          <ParticleField />
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <span className="lp-tag">Core Capabilities</span>
              <h2>Why JeevanSutra?</h2>
              <p>A unified platform bridging the gap between AI precision and clinical accountability.</p>
            </div>
            <div className="lp-features-grid">
              {[
                { icon: '🧬', title: 'AMR Detection Engine', desc: 'Real-time antimicrobial resistance profiling powered by WHO AWaRe classification. Detects MRSA, ESBL, and VRE patterns instantly.' },
                { icon: '📊', title: 'Clinical Scoring (SOFA / qSOFA)', desc: 'Automated sepsis scoring with organ dysfunction tracking. Catches deterioration before manual assessments can.' },
                { icon: '🛡️', title: 'Deterministic Rule Engine', desc: 'Over 200 clinical rules executing in parallel — no hallucinations, no probabilistic uncertainty. Pure medical logic.' },
                { icon: '🤖', title: 'LLM-Powered Narratives', desc: 'GPT-4 synthesized clinical summaries that translate raw data into human-readable diagnostic reports for physicians.' },
                { icon: '📋', title: 'SBAR Shift Handover', desc: 'Auto-generated standardized handovers reducing information loss during ICU shift transitions.' },
                { icon: '🔬', title: 'Lab Report Ingestion', desc: 'PDF-to-database ingestion pipeline that extracts lab values and links them to patient histories automatically.' },
              ].map((f, i) => (
                <div key={i} className="lp-feature-card">
                  <div className="lp-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS (Pipeline) ─── */}
        <section ref={pipelineRef} id="pipeline" className="lp-section lp-pipeline">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <span className="lp-tag">Architecture</span>
              <h2>How the Pipeline Works</h2>
              <p>A transparent, multi-stage analysis flow that keeps clinicians in control at every step.</p>
            </div>
            <div className="lp-pipeline-track">
              {[
                { step: '01', title: 'Data Ingestion', desc: 'Lab reports (PDF), vitals streams, and EMR feeds are ingested and normalized into a unified patient data model via Supabase.' },
                { step: '02', title: 'Deterministic Rule Engines', desc: 'SOFA/qSOFA scores are computed, AMR patterns are flagged, and outlier values are detected — all through hard-coded, auditable medical logic.' },
                { step: '03', title: 'LLM Agent Synthesis', desc: 'GPT-4 agents receive the rule engine output and synthesize a human-readable clinical narrative, highlighting actionable insights.' },
                { step: '04', title: 'Clinical Decision Output', desc: 'The final report is presented to the physician with risk flags, treatment recommendations, and FHIR-exportable bundles.' },
              ].map((s, i) => (
                <div key={i} className="lp-pipeline-step">
                  <div className="lp-pipeline-number">{s.step}</div>
                  <div className="lp-pipeline-body">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section ref={statsRef} className="lp-section lp-stats">
          <div className="lp-section-inner">
            <div className="lp-stats-grid">
              {[
                { number: 200, suffix: '+', label: 'Clinical Rules Active' },
                { number: 98, suffix: '%', label: 'AMR Detection Accuracy' },
                { number: 15, suffix: 's', label: 'Avg. Analysis Time' },
                { number: 24, suffix: '/7', label: 'Real-Time Monitoring' },
              ].map((s, i) => (
                <div key={i} className="lp-stat-card">
                  <div className="lp-stat-value">
                    <span className="lp-stat-number" data-target={s.number}>0</span>
                    <span className="lp-stat-suffix">{s.suffix}</span>
                  </div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CONTACT ─── */}
        <section ref={contactRef} id="contact" className="lp-section lp-contact">
          <div className="lp-section-inner">
            <div className="lp-contact-inner">
              <div className="lp-section-header">
                <span className="lp-tag">Get In Touch</span>
                <h2>Ready to Transform ICU Care?</h2>
                <p>Reach out to learn more about JeevanSutra or to request a demonstration for your institution.</p>
              </div>
              <div className="lp-contact-grid">
                <div className="lp-contact-card">
                  <div className="lp-contact-icon">📧</div>
                  <h3>Email</h3>
                  <p>jeevansutra.health@gmail.com</p>
                </div>
                <div className="lp-contact-card">
                  <div className="lp-contact-icon">🏥</div>
                  <h3>Institution</h3>
                  <p>JeevanSutra Health Systems</p>
                </div>
                <div className="lp-contact-card">
                  <div className="lp-contact-icon">📞</div>
                  <h3>Phone</h3>
                  <a href="tel:+18005550199" className="lp-contact-link">
                    +1 (800) 555-0199
                  </a>
                </div>
              </div>
              <button className="lp-btn-primary lp-btn-lg lp-contact-cta" onClick={onNavigateLogin}>
                Sign In to JeevanSutra →
              </button>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="10" fill="#0d47a1"/>
                <path d="M5 18h5.5l2-7 3.5 14 3.5-12 2 5H27" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>JeevanSutra</span>
            </div>
            <p className="lp-footer-copy">© 2026 JeevanSutra Health Systems. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
