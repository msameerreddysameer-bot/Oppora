import { useEffect, useRef, useState } from "react";
import { Check, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Professional Skeleton Avatar Component
 * Displayed by default when the user has not uploaded a profile picture.
 */
export function PersonSkeletonAvatar({
  className = "h-24 w-24",
  pulse = true,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-linear-to-b from-slate-100 to-slate-200/90 shadow-inner dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900 ${className}`}
      aria-label="Default profile skeleton"
    >
      {/* Subtle professional animated skeleton shimmer */}
      {pulse && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent dark:via-white/10" />
      )}

      {/* Modern Person Silhouette SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full translate-y-2 text-slate-400 dark:text-slate-500"
      >
        {/* Head */}
        <circle cx="50" cy="38" r="18" fill="currentColor" />
        {/* Neck */}
        <path d="M44 53h12v8h-12z" fill="currentColor" opacity="0.95" />
        {/* Shoulders & Torso */}
        <path
          d="M20 86c0-14 13-23 30-23s30 9 30 23v6H20v-6z"
          fill="currentColor"
        />
        {/* Modern collar / tie subtle accent */}
        <path
          d="M45 61l5 7 5-7"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-200 dark:text-slate-700"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
}

/**
 * AvatarCropModal: Professional Circular Cropper Modal
 * Allows repositioning (pan), zooming (1x - 3x), 90-degree rotation, and exports a sharp circular crop.
 */
export default function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
}: AvatarCropModalProps) {
  // Crop adjustments
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Drag tracking
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  offsetRef.current = offset;

  const imgRef = useRef<HTMLImageElement>(null);

  // Viewport and Crop Circle Constants
  const VIEWPORT_SIZE = 320; // 320px x 320px viewport
  const CIRCLE_RADIUS = 110; // 220px diameter circle crop
  const CIRCLE_DIAMETER = CIRCLE_RADIUS * 2;

  // Reset transforms when a new image is loaded
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const nw = img.naturalWidth || 1;
      const nh = img.naturalHeight || 1;
      setNaturalSize({ width: nw, height: nh });

      // Compute baseScale so the image fully covers the circle crop
      const initialScale = Math.max(CIRCLE_DIAMETER / nw, CIRCLE_DIAMETER / nh);
      setBaseScale(initialScale);
    };
  }, [isOpen, imageSrc, CIRCLE_DIAMETER]);

  if (!isOpen || !imageSrc) return null;

  // Pointer drag event handlers for mouse & touch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Perform High-Resolution Canvas Circular Crop Export
  const handleApplyCrop = () => {
    if (!imageSrc || naturalSize.width === 0) return;

    const OUTPUT_SIZE = 512; // 512x512 high resolution circular avatar
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1. Create circular clip path
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 2. Scale multiplier from preview circle to output resolution
    const multiplier = OUTPUT_SIZE / CIRCLE_DIAMETER;

    // 3. Coordinate transform matching the preview box
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.translate(offset.x * multiplier, offset.y * multiplier);
    ctx.rotate((rotation * Math.PI) / 180);

    const effectiveScale = zoom * baseScale * multiplier;
    ctx.scale(effectiveScale, effectiveScale);

    // 4. Draw image centered
    const img = imgRef.current;
    if (img) {
      ctx.drawImage(
        img,
        -naturalSize.width / 2,
        -naturalSize.height / 2,
        naturalSize.width,
        naturalSize.height
      );
    }

    const croppedDataUrl = canvas.toDataURL("image/png", 0.95);
    onSave(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Crop Profile Picture
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Drag to reposition within the circle • Zoom to fit
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body / Cropper Viewport */}
        <div className="flex flex-col items-center bg-slate-950/5 p-5 dark:bg-slate-950/40">
          <div
            className="relative flex h-[320px] w-[320px] select-none items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-inner dark:border-slate-700"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          >
            {/* Draggable Image Layer */}
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Upload preview for crop"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${
                    zoom * baseScale
                  })`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  userSelect: "none",
                }}
              />
            </div>

            {/* Circular Mask Overlay */}
            <div className="pointer-events-none absolute inset-0">
              <svg
                className="h-full w-full"
                viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`}
              >
                <defs>
                  <mask id="circle-crop-mask">
                    <rect
                      x="0"
                      y="0"
                      width={VIEWPORT_SIZE}
                      height={VIEWPORT_SIZE}
                      fill="white"
                    />
                    <circle
                      cx={VIEWPORT_SIZE / 2}
                      cy={VIEWPORT_SIZE / 2}
                      r={CIRCLE_RADIUS}
                      fill="black"
                    />
                  </mask>
                </defs>

                {/* Shaded Area Outside the Circle */}
                <rect
                  x="0"
                  y="0"
                  width={VIEWPORT_SIZE}
                  height={VIEWPORT_SIZE}
                  fill="rgba(15, 23, 42, 0.75)"
                  mask="url(#circle-crop-mask)"
                />

                {/* Circle Boundary Guide */}
                <circle
                  cx={VIEWPORT_SIZE / 2}
                  cy={VIEWPORT_SIZE / 2}
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="drop-shadow-md"
                />

                {/* Center Target Crosshairs */}
                <line
                  x1={VIEWPORT_SIZE / 2 - 8}
                  y1={VIEWPORT_SIZE / 2}
                  x2={VIEWPORT_SIZE / 2 + 8}
                  y2={VIEWPORT_SIZE / 2}
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                <line
                  x1={VIEWPORT_SIZE / 2}
                  y1={VIEWPORT_SIZE / 2 - 8}
                  x2={VIEWPORT_SIZE / 2}
                  y2={VIEWPORT_SIZE / 2 + 8}
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
              </svg>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="mt-4 flex w-full max-w-[320px] flex-col gap-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))
                }
                disabled={zoom <= 1}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700"
              />
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))
                }
                disabled={zoom >= 3}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <span className="w-10 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
              >
                <RotateCw size={13} />
                Rotate 90°
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                Reset Position
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-98"
          >
            <Check size={14} />
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}
