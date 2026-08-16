export function GuideLegend() {
  return (
    <div className="guide-legend">
      <span className="guide-swatch guide-swatch-red" aria-hidden="true" />
      <span>full contraction</span>
      <span className="guide-swatch guide-swatch-red-faint" aria-hidden="true" />
      <span>stabilizing tension</span>
      <span className="guide-swatch guide-swatch-blue" aria-hidden="true" />
      <span>relaxing</span>
      <strong>Reference animation — not your data.</strong>
    </div>
  );
}
