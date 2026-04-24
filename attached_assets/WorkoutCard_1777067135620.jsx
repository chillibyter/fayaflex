import React, { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────
   WorkoutCard.jsx
   Drop into any React (Vite / CRA / Replit) project.
   No external dependencies required.
   ───────────────────────────────────────────── */

// ── Canvas-based fire + particle engine ──────────────────────────────────────
function FireCanvas({ burst }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    flames: [],
    animId: null,
    burstTriggered: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W * 0.55; // flame origin x
    const cy = H * 0.62; // flame origin y
    const s = stateRef.current;

    // ── Flame particle factory ──
    function makeFlame() {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 0.6 + Math.random() * 1.1;
      return {
        x: cx + (Math.random() - 0.5) * 18,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.014,
        size: 14 + Math.random() * 22,
        type: "flame",
      };
    }

    // ── Burst spark factory ──
    function makeSpark(big) {
      const angle = Math.random() * Math.PI * 2;
      const speed = big
        ? 3.5 + Math.random() * 5.5
        : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 20 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1,
        decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05,
        type: "spark",
        // white → orange → red colour progression
        r: 255,
        g: Math.floor(200 + Math.random() * 55),
        b: Math.floor(Math.random() * 60),
      };
    }

    // ── Trigger the big burst ──
    function triggerBurst() {
      for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
      for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
    }

    // ── Draw gradient flame blob ──
    function drawFlame(p) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      const a = p.life;
      grad.addColorStop(0,   `rgba(255,255,200,${(a * 0.95).toFixed(2)})`);
      grad.addColorStop(0.2, `rgba(255,200,50,${(a * 0.85).toFixed(2)})`);
      grad.addColorStop(0.5, `rgba(255,100,10,${(a * 0.6).toFixed(2)})`);
      grad.addColorStop(0.8, `rgba(200,30,0,${(a * 0.3).toFixed(2)})`);
      grad.addColorStop(1,   `rgba(100,0,0,0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // ── Draw spark dot ──
    function drawSpark(p) {
      // colour cools as life drops
      const heat = p.life;
      const r = Math.floor(p.r);
      const g = Math.floor(p.g * heat);
      const b = Math.floor(p.b);
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${(heat).toFixed(2)})`);
      grd.addColorStop(0.4, `rgba(${r},${Math.floor(g*0.5)},0,${(heat*0.7).toFixed(2)})`);
      grd.addColorStop(1,   `rgba(100,0,0,0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // bright core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${(heat * 0.9).toFixed(2)})`;
      ctx.fill();
    }

    // ── Ambient glow behind flame ──
    function drawGlow() {
      const grd = ctx.createRadialGradient(cx, cy - 30, 0, cx, cy - 30, 110);
      grd.addColorStop(0,   "rgba(255,120,0,0.22)");
      grd.addColorStop(0.5, "rgba(255,60,0,0.10)");
      grd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 110, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    let frame = 0;
    function loop() {
      ctx.clearRect(0, 0, W, H);

      // Spawn steady flame particles
      if (frame % 2 === 0) {
        for (let i = 0; i < 5; i++) s.particles.push(makeFlame());
      }

      drawGlow();

      // Update + draw
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const p of s.particles) {
        if (p.type === "flame") {
          p.x += p.vx + Math.sin(frame * 0.08 + p.size) * 0.4;
          p.y += p.vy;
          p.vy -= 0.02;
          p.life -= p.decay;
          p.size *= 0.992;
          drawFlame(p);
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.985;
          p.life -= p.decay;
          drawSpark(p);
        }
      }

      frame++;
      s.animId = requestAnimationFrame(loop);
    }

    loop();

    // Auto-trigger burst on mount after 600ms
    const autoTimer = setTimeout(() => triggerBurst(), 600);

    return () => {
      cancelAnimationFrame(s.animId);
      clearTimeout(autoTimer);
    };
  }, []);

  // External burst trigger
  useEffect(() => {
    if (!burst) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W * 0.55;
    const cy = H * 0.62;
    const s = stateRef.current;

    function makeSpark(big) {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? 3.5 + Math.random() * 5.5 : 1.2 + Math.random() * 3.2;
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 1.5 : 0.5),
        life: 1,
        decay: big ? 0.018 + Math.random() * 0.018 : 0.022 + Math.random() * 0.022,
        size: big ? 2 + Math.random() * 3.5 : 1 + Math.random() * 2,
        gravity: 0.07 + Math.random() * 0.05,
        type: "spark",
        r: 255,
        g: Math.floor(200 + Math.random() * 55),
        b: Math.floor(Math.random() * 60),
      };
    }
    for (let i = 0; i < 260; i++) s.particles.push(makeSpark(true));
    for (let i = 0; i < 120; i++) s.particles.push(makeSpark(false));
  }, [burst]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      style={{
        position: "absolute",
        top: "-30px",
        right: "-20px",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}

// ── Metric panel ──────────────────────────────────────────────────────────────
function MetricPanel({ icon, label, value, unit, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(145deg,#2e2e2e,#252525)",
        borderRadius: "14px",
        padding: "16px 10px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "1.8px",
          color: "#888",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "3px" }}>
        <span style={{ fontSize: "24px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 500, color: "#888" }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Main WorkoutCard ──────────────────────────────────────────────────────────
export default function WorkoutCard() {
  const [cardVisible, setCardVisible] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  // Auto-load: card fades/slides in on mount
  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111; }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(255,90,0,0.18), 0 12px 48px rgba(0,0,0,0.7); }
          50%       { box-shadow: 0 0 100px rgba(255,90,0,0.32), 0 12px 48px rgba(0,0,0,0.7); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes paceSlide {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dividerGrow {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>

      {/* Page wrapper */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 60% 40%, #1c1008 0%, #0d0d0d 70%)",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        {/* Card */}
        <div
          style={{
            position: "relative",
            width: "min(420px, 100%)",
            background: "linear-gradient(160deg, #2b2b2b 0%, #1e1e1e 100%)",
            borderRadius: "28px",
            padding: "28px 24px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            animation: cardVisible ? "pulseGlow 3s ease-in-out infinite" : "none",
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
            transition: "opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)",
            overflow: "visible",
          }}
        >
          {/* Right-side orange glow bleed */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "260px",
              height: "260px",
              background:
                "radial-gradient(circle, rgba(255,100,0,0.28) 0%, rgba(255,60,0,0.10) 50%, transparent 75%)",
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* ── TOP SECTION ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Shoe image */}
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "18px",
                background: "linear-gradient(135deg,#2a2a2a,#1a1a1a)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "52px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                flexShrink: 0,
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? "translateX(0)" : "translateX(-20px)",
                transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
              }}
            >
              👟
            </div>

            {/* Title block */}
            <div
              style={{
                flex: 1,
                padding: "0 16px",
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? "translateY(0)" : "translateY(-10px)",
                transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s",
              }}
            >
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "0.5px",
                  lineHeight: 1.1,
                }}
              >
                Running
              </div>
              <div
                style={{
                  marginTop: "5px",
                  display: "inline-block",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: "#ff6a00",
                  textTransform: "uppercase",
                  background: "rgba(255,106,0,0.12)",
                  border: "1px solid rgba(255,106,0,0.3)",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  animation: cardVisible ? "badgePop 0.5s ease 0.8s both" : "none",
                }}
              >
                ✓ Workout Completed
              </div>
            </div>

            {/* Fire canvas */}
            <div
              style={{
                position: "relative",
                width: "88px",
                height: "88px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              title="Tap for fireworks!"
              onClick={() => setBurstCount((n) => n + 1)}
            >
              <FireCanvas burst={burstCount} />
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,106,0,0.4), transparent)",
              marginBottom: "20px",
              animation: cardVisible ? "dividerGrow 0.8s ease 0.6s both" : "none",
              zIndex: 1,
              position: "relative",
            }}
          />

          {/* ── METRICS ROW ── */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "14px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <MetricPanel icon="🔥" label="Calories" value="1250" unit="cal" delay={500} />
            <MetricPanel icon="⏱" label="Time"     value="1h 45m" unit=""    delay={650} />
            <MetricPanel icon="📍" label="Distance" value="12.5"  unit="km"  delay={800} />
          </div>

          {/* ── PACE PANEL ── */}
          <div
            style={{
              background: "linear-gradient(145deg,#2e2e2e,#252525)",
              borderRadius: "14px",
              padding: "18px 16px",
              textAlign: "center",
              border: "1px solid rgba(255,106,0,0.18)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,80,0,0.08)",
              position: "relative",
              zIndex: 1,
              animation: cardVisible ? "paceSlide 0.6s ease 1s both" : "none",
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>🏃</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#ff6a00",
                  lineHeight: 1,
                  textShadow: "0 0 20px rgba(255,106,0,0.5)",
                }}
              >
                7.1
              </span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#aaa" }}>km/h</span>
            </div>
            <div
              style={{
                marginTop: "5px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "2.5px",
                color: "#888",
                textTransform: "uppercase",
              }}
            >
              Pace
            </div>
          </div>

          {/* ── FOOTER CTA ── */}
          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
              opacity: cardVisible ? 1 : 0,
              transition: "opacity 0.6s ease 1.3s",
            }}
          >
            <button
              onClick={() => setBurstCount((n) => n + 1)}
              style={{
                background: "linear-gradient(135deg,#ff6a00,#ee0979)",
                border: "none",
                borderRadius: "50px",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "1px",
                padding: "12px 32px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,106,0,0.4)",
                textTransform: "uppercase",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(255,106,0,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,106,0,0.4)";
              }}
            >
              🔥 Keep the Streak Going!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
