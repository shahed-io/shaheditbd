import { useEffect, useRef } from 'react';

// Canvas-based matrix rain — only used as decorative background
const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}<>[]()=>const let var import export function return if else for while';

interface MatrixRainProps {
  opacity?: number;
  speed?: number;
}

const MatrixRain = ({ opacity = 0.13, speed = 1 }: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1).map(() => Math.random() * -50);

    const charSet = CHARS.split('');

    let frameId: number;
    const draw = () => {
      ctx.fillStyle = `rgba(7, 11, 19, 0.06)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'Fira Code', monospace`;

      cols = Math.floor(canvas.width / fontSize);
      if (drops.length < cols) drops.push(...Array(cols - drops.length).fill(1));

      for (let i = 0; i < cols; i++) {
        const char = charSet[Math.floor(Math.random() * charSet.length)];

        // Leading char — bright neon cyan
        if (drops[i] * fontSize > 0) {
          ctx.fillStyle = `rgba(80, 255, 230, 0.95)`;
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        }

        // Trail — violet fading
        ctx.fillStyle = i % 3 === 0
          ? `rgba(168, 85, 247, 0.5)`
          : `rgba(100, 220, 255, 0.3)`;
        ctx.fillText(char, i * fontSize, (drops[i] - 1) * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4 * speed;
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity, mixBlendMode: 'screen' }}
    />
  );
};

export default MatrixRain;
