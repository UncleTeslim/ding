type SparklineProps = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

export function Sparkline({ data, color = "var(--primary)", width = 120, height = 36 }: SparklineProps) {
  if (data.length < 2) return <div style={{ height, width }} />;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 4;

  const coords = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePoints = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const last = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="currentColor" opacity="0.12" />
      <polygon points={areaPoints} fill={color} opacity={0.1} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </svg>
  );
}
