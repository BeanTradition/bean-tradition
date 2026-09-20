/**
 * Subtle, fixed, non-interactive brand watermark rendered behind page content.
 * Sits above the page background but below all foreground text and controls
 * (negative z-index), so it stays "slightly visible" without hurting legibility.
 */
export function BrandWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center"
    >
      <img
        src="/bean-tradition-logo.png"
        alt=""
        className="w-[420px] max-w-[70vw] object-contain opacity-[0.05]"
      />
    </div>
  );
}

export default BrandWatermark;
