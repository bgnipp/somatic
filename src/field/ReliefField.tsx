import { useLayoutEffect, useRef } from "react";
import { paintRelief, buildTorsoMask } from "./renderRelief";
import type { FieldSite } from "./sites";
import { FIELD_COLS, FIELD_ROWS } from "./tunables";

type Props = {
  sites: FieldSite[];
  depth: number;
};

/**
 * Lit height-field drawn on a canvas, placed in the SVG via foreignObject
 * so it clips with #torso-clip and sits between anatomy and landmarks.
 * Avoids per-frame data-URL churn.
 */
export function ReliefField({ sites, depth }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (!maskRef.current) maskRef.current = buildTorsoMask(canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintRelief(ctx, sites, maskRef.current, depth);
  }, [sites, depth]);

  return (
    <foreignObject x="0" y="0" width="240" height="250" pointerEvents="none">
      <canvas
        ref={canvasRef}
        width={FIELD_COLS}
        height={FIELD_ROWS}
        className="relief-canvas"
      />
    </foreignObject>
  );
}
