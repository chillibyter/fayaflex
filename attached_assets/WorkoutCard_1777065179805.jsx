import React, { useEffect, useRef } from "react";

// Inline styles to keep the component self-contained for Replit
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a1a",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    position: "relative",
    background: "#2a2a2a",
    borderRadius: "24px",
    padding: "32px",
    width: "380px",
    boxShadow: "0 0 60px rgba(255, 100, 0, 0.25), 0 8px 32px rgba(0,0,0,0.5)",
    overflow: "hidden",
    color: "#fff",
  },
  glowOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "200px",
    height: "200px",
    background:
      "radial-gradient(circle at top right, rgba(255,100,0,0.35) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  topSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "28px",
  },
  shoeImage: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
  },
  titleBlock: {
    textAlign: "center",
    flex: 1,
    padding: "0 12px",
  },
  titleActivity: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: "#fff",
    margin: 0,
  },
  titleStatus: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "2px",
    color: "#ff6400",
    marginTop: "4px",
    textTransform: "uppercase",
  },
  flameContainer: {
    width: "72px",
    height: "72px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  flameEmoji: {
    fontSize: "52px",
    animation: "flicker 1.2s ease-in-out infinite alternate",
    filter: "drop-shadow(0 0 12px rgba(255,100,0,0.9))",
    display: "inline-block",
  },
  metricsRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  metricPanel: {
    flex: 1,
    background: "#333",
    borderRadius: "16px",
    padding: "16px 12px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  metricIcon: {
    fontSize: "20px",
    marginBottom: "6px",
  },
  metricLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "1.5px",
    color: "#aaa",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  metricValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
  },
  metricUnit: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#aaa",
    marginLeft: "2px",
  },
  bottomPanel: {
    background: "#333",
    borderRadius: "16px",
    padding: "16px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  paceValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ff6400",
  },
  paceUnit: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#aaa",
    marginLeft: "4px",
  },
  paceLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "2px",
    color: "#aaa",
    textTransform: "uppercase",
    marginTop: "4px",
  },
};

// Keyframe animation injected via a <style> tag
const AnimationStyle = () => (
  <style>{`
    @keyframes flicker {
      0%   { transform: scale(1)   rotate(-2deg); filter: drop-shadow(0 0 10px rgba(255,100,0,0.8)); }
      50%  { transform: scale(1.08) rotate(1deg);  filter: drop-shadow(0 0 18px rgba(255,140,0,1));   }
      100% { transform: scale(1.04) rotate(-1deg); filter: drop-shadow(0 0 14px rgba(255,80,0,0.9));  }
    }
    @keyframes spark {
      0%   { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3); }
    }
    .spark {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff6400;
      animation: spark 1s ease-out infinite;
    }
  `}</style>
);

// Sparks component to simulate ember particles
function Sparks() {
  const sparks = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    tx: `${Math.round(20 + i * 12)}px`,
    ty: `${Math.round(30 + (i % 3) * 20)}px`,
    delay: `${(i * 0.15).toFixed(2)}s`,
    top: `${10 + (i % 4) * 8}px`,
    left: `${30 + (i % 5) * 6}px`,
  }));

  return (
    <>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="spark"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            "--tx": s.tx,
            "--ty": s.ty,
          }}
        />
      ))}
    </>
  );
}

export default function WorkoutCard() {
  return (
    <div style={styles.wrapper}>
      <AnimationStyle />
      <div style={styles.card}>
        {/* Orange glow overlay */}
        <div style={styles.glowOverlay} />

        {/* Top Section */}
        <div style={styles.topSection}>
          {/* Running shoe placeholder — replace src with your shoe image */}
          <img
            src="https://via.placeholder.com/80x80/333/ff6400?text=👟"
            alt="Running shoe"
            style={styles.shoeImage}
          />

          <div style={styles.titleBlock}>
            <p style={styles.titleActivity}>Running</p>
            <p style={styles.titleStatus}>Workout Completed</p>
          </div>

          {/* Animated flame */}
          <div style={styles.flameContainer}>
            <span style={styles.flameEmoji}>🔥</span>
            <Sparks />
          </div>
        </div>

        {/* Metrics Row */}
        <div style={styles.metricsRow}>
          <div style={styles.metricPanel}>
            <div style={styles.metricIcon}>🔥</div>
            <div style={styles.metricLabel}>Calories</div>
            <div style={styles.metricValue}>
              1250<span style={styles.metricUnit}>cal</span>
            </div>
          </div>

          <div style={styles.metricPanel}>
            <div style={styles.metricIcon}>⏱</div>
            <div style={styles.metricLabel}>Time</div>
            <div style={styles.metricValue}>
              1h<span style={styles.metricUnit}> 45m</span>
            </div>
          </div>

          <div style={styles.metricPanel}>
            <div style={styles.metricIcon}>📍</div>
            <div style={styles.metricLabel}>Distance</div>
            <div style={styles.metricValue}>
              12.5<span style={styles.metricUnit}>km</span>
            </div>
          </div>
        </div>

        {/* Bottom Pace Panel */}
        <div style={styles.bottomPanel}>
          <div style={{ fontSize: "20px", marginBottom: "4px" }}>🏃</div>
          <div>
            <span style={styles.paceValue}>7.1</span>
            <span style={styles.paceUnit}>km/h</span>
          </div>
          <div style={styles.paceLabel}>Pace</div>
        </div>
      </div>
    </div>
  );
}
