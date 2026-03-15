import { useEffect, useState, memo } from 'react';

// Floating code snippets that drift across the background
const SNIPPETS = [
  'const price = ৳599;',
  'if (deal.active) {',
  '  return <Buy />;',
  '}',
  'npm install win11',
  'git commit -m "deal"',
  '// Instant Delivery',
  'async function order()',
  'export default Store',
  '=> license.key',
  'import { Win11 }',
  'status: "active"',
  '0x4F6669636521',
  'SHAHED_STORE_v2',
  '01010111 01101001',
  'type: "digital"',
  '{ id: "win-pro" }',
  '.then(deliver)',
  'await payment.verify()',
  '/* Genuine Keys */',
  'db.orders.insert({})',
  'return 200 OK',
];

interface Floater {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
  color: string;
  delay: number;
}

const COLORS = [
  'hsla(271,91%,75%,',
  'hsla(185,90%,62%,',
  'hsla(158,80%,58%,',
  'hsla(320,90%,72%,',
];

const CodeFloaters = memo(() => {
  const [floaters] = useState<Floater[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      text: SNIPPETS[i % SNIPPETS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 18 + Math.random() * 30,
      opacity: 0.06 + Math.random() * 0.1,
      size: 10 + Math.random() * 3,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * -30,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {floaters.map(f => (
        <span
          key={f.id}
          className="absolute font-fira whitespace-nowrap"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: f.size,
            color: `${f.color}${f.opacity})`,
            animation: `code-float-up ${f.speed}s ${f.delay}s linear infinite`,
            textShadow: `0 0 8px ${f.color}0.3)`,
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
});

CodeFloaters.displayName = 'CodeFloaters';
export default CodeFloaters;
