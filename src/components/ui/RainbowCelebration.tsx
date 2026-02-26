'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './RainbowCelebration.module.css';

const COLORS = [
  '#FF3B5C', '#FF6B35', '#FFD23F', '#44D492',
  '#3BAAFF', '#7B5CFF', '#FF5CDB', '#00E5CC',
  '#FF9F43', '#54A0FF', '#FF6B81', '#C56CF0',
];

const SHAPES = ['circle', 'rect', 'diamond'] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: typeof SHAPES[number];
  size: number;
  angle: number;
  velocity: number;
  spin: number;
  delay: number;
}

function createParticles(count: number, originX: number, originY: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: originX,
    y: originY,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 4 + Math.random() * 8,
    angle: (Math.random() * 360) * (Math.PI / 180),
    velocity: 200 + Math.random() * 400,
    spin: Math.random() * 720 - 360,
    delay: Math.random() * 0.15,
  }));
}

interface Props {
  active: boolean;
  originRef?: React.RefObject<HTMLElement | null>;
}

export default function RainbowCelebration({ active, originRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const duration = 1.4;

    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particlesRef.current) {
      const t = Math.max(0, elapsed - p.delay);
      if (t <= 0) continue;

      const progress = t / (duration - p.delay);
      const gravity = 600;
      const drag = 0.96;

      const vx = Math.cos(p.angle) * p.velocity * Math.pow(drag, t * 60);
      const vy = Math.sin(p.angle) * p.velocity * Math.pow(drag, t * 60) + gravity * t;

      const px = p.x + vx * t;
      const py = p.y + vy * t - 0.5 * gravity * t * t + gravity * t * t;

      const opacity = 1 - Math.pow(progress, 2);
      const scale = 1 - progress * 0.5;
      const rotation = (p.spin * t * Math.PI) / 180;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.fillStyle = p.color;

      const s = p.size;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'rect') {
        ctx.fillRect(-s / 2, -s / 4, s, s / 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, 0);
        ctx.lineTo(0, s / 2);
        ctx.lineTo(-s / 2, 0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (originRef?.current) {
      const rect = originRef.current.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    particlesRef.current = createParticles(60, originX, originY);
    startTimeRef.current = performance.now();

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, originRef, draw]);

  if (!active) return null;

  return (
    <div ref={containerRef} className={styles.overlay}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
