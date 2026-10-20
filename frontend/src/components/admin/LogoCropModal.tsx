import { useEffect, useRef, useState } from "react";
import {
  Check,
  Maximize2,
  Minimize2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { type LogoCrop } from "@/types/studentTypesData";

interface LogoCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  initialCrop?: LogoCrop | null;
  onClose: () => void;
  onSave: (result: {
    croppedPreviewUrl: string;
    originalImageUrl: string;
    crop: LogoCrop;
  }) => void;
}

/**
 * LogoCropModal: 1:1 Square Cropper
 * - Maintains 1:1 square aspect ratio
 * - Allows pan/drag and resize/zoom
 * - Preserves original image unchanged
 * - Calculates and returns normalized LogoCrop metadata { x, y, width, height }
 * - Restores saved crop on edit
 * - Displays live previews at 40x40, 64x64, 32x32
 */
export default function LogoCropModal({
  isOpen,
  imageSrc,
  initialCrop,
  onClose,
  onSave,
}: LogoCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [cropBoxSize, setCropBoxSize] = useState(220); // Resizable crop square

  // Drag tracking
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);

  const VIEWPORT_SIZE = 320;

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setRotation(0);
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });

    const fitScale = Math.max(
      cropBoxSize / naturalWidth,
      cropBoxSize / naturalHeight
    );
    setBaseScale(fitScale);

    // Restore exact saved crop if provided
    if (initialCrop && initialCrop.width > 0 && initialCrop.height > 0) {
      const restoredWdisp = cropBoxSize / initialCrop.width;
      const restoredZoom = Math.max(
        0.5,
        Math.min(4, restoredWdisp / (naturalWidth * fitScale))
      );
      const finalWdisp = naturalWidth * fitScale * restoredZoom;
      const finalHdisp = naturalHeight * fitScale * restoredZoom;

      const restoredDx =
        finalWdisp / 2 - cropBoxSize / 2 - initialCrop.x * finalWdisp;
      const restoredDy =
        finalHdisp / 2 - cropBoxSize / 2 - initialCrop.y * finalHdisp;

      setZoom(restoredZoom);
      setOffset({ x: restoredDx, y: restoredDy });
    } else {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX - offset.x,
        y: touch.clientY - offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Compute Normalized LogoCrop
  const calculateNormalizedCrop = (): LogoCrop => {
    if (!naturalSize.width || !naturalSize.height) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }

    const currentScale = baseScale * zoom;
    const wDisp = naturalSize.width * currentScale;
    const hDisp = naturalSize.height * currentScale;

    const xRel = wDisp / 2 - cropBoxSize / 2 - offset.x;
    const yRel = hDisp / 2 - cropBoxSize / 2 - offset.y;

    const normX = Math.max(0, Math.min(1, xRel / wDisp));
    const normY = Math.max(0, Math.min(1, yRel / hDisp));
    const normW = Math.max(0.05, Math.min(1 - normX, cropBoxSize / wDisp));
    const normH = normW; // Strictly 1:1

    return {
      x: Number(normX.toFixed(4)),
      y: Number(normY.toFixed(4)),
      width: Number(normW.toFixed(4)),
      height: Number(normH.toFixed(4)),
    };
  };

  // Export cropped 1:1 preview and normalized metadata
  const handleSaveCrop = () => {
    const cropMetadata = calculateNormalizedCrop();

    const canvas = document.createElement("canvas");
    const OUTPUT_SIZE = 400;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");

    if (!ctx || !naturalSize.width || !naturalSize.height) {
      onSave({
        croppedPreviewUrl: imageSrc,
        originalImageUrl: imageSrc,
        crop: cropMetadata,
      });
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const currentScale = baseScale * zoom;
    const scaleRatio = OUTPUT_SIZE / cropBoxSize;

    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(offset.x * scaleRatio, offset.y * scaleRatio);

    const drawWidth = naturalSize.width * currentScale * scaleRatio;
    const drawHeight = naturalSize.height * currentScale * scaleRatio;

    const img = imgRef.current;
    if (img) {
      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
    }

    const croppedBase64 = canvas.toDataURL("image/png", 0.95);

    onSave({
      croppedPreviewUrl: croppedBase64,
      originalImageUrl: imageSrc,
      crop: cropMetadata,
    });
  };

  // Live preview preview metrics
  const activeCrop = calculateNormalizedCrop();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Crop Organization Logo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              1:1 square crop. Move and scale to center your brand logo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          className="relative mx-auto overflow-hidden rounded-2xl bg-slate-950 select-none cursor-move flex items-center justify-center border border-slate-800"
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Target Image with Transforms */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Source to crop"
            onLoad={handleImageLoad}
            draggable={false}
            className="pointer-events-none max-w-none transition-transform duration-75"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${
                baseScale * zoom
              })`,
              transformOrigin: "center center",
            }}
          />

          {/* Darkened Mask Outside the Crop Box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="rounded-2xl border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] pointer-events-none relative transition-all"
              style={{ width: `${cropBoxSize}px`, height: `${cropBoxSize}px` }}
            >
              <span className="absolute -top-6 left-2 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                1:1 Square Crop Area
              </span>
            </div>
          </div>
        </div>

        {/* Zoom and Crop Size Controls */}
        <div className="space-y-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400 shrink-0" />
            <input
              type="range"
              min="0.6"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-400 shrink-0" />
            <span className="text-xs font-mono text-cyan-300 w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <RotateCw size={13} />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOffset({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                  setCropBoxSize(220);
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700"
              >
                Reset
              </button>
            </div>

            {/* Crop Box Size adjust */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Crop Area:</span>
              <button
                type="button"
                onClick={() =>
                  setCropBoxSize((prev) => Math.max(160, prev - 20))
                }
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="Shrink Crop Box"
              >
                <Minimize2 size={13} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCropBoxSize((prev) => Math.min(260, prev + 20))
                }
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="Expand Crop Box"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Multi-Size Previews required by specification */}
        <div className="border border-slate-800 bg-slate-950/40 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Live Rendering Previews
          </div>
          <div className="flex items-center justify-around gap-4 text-center">
            {/* 64x64 Detail Page Preview */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-md">
                <img
                  src={imageSrc}
                  alt="Detail preview"
                  className="absolute max-w-none"
                  style={{
                    width: `${(100 / activeCrop.width).toFixed(1)}%`,
                    height: `${(100 / activeCrop.height).toFixed(1)}%`,
                    left: `${(-activeCrop.x * (100 / activeCrop.width)).toFixed(1)}%`,
                    top: `${(-activeCrop.y * (100 / activeCrop.height)).toFixed(1)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">Detail (64×64)</span>
            </div>

            {/* 40x40 Opportunity Card Preview */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-900 shadow-md">
                <img
                  src={imageSrc}
                  alt="Card preview"
                  className="absolute max-w-none"
                  style={{
                    width: `${(100 / activeCrop.width).toFixed(1)}%`,
                    height: `${(100 / activeCrop.height).toFixed(1)}%`,
                    left: `${(-activeCrop.x * (100 / activeCrop.width)).toFixed(1)}%`,
                    top: `${(-activeCrop.y * (100 / activeCrop.height)).toFixed(1)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">Card (40×40)</span>
            </div>

            {/* 32x32 Table Row Preview */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-cyan-500/40 bg-slate-900 shadow-md">
                <img
                  src={imageSrc}
                  alt="Table preview"
                  className="absolute max-w-none"
                  style={{
                    width: `${(100 / activeCrop.width).toFixed(1)}%`,
                    height: `${(100 / activeCrop.height).toFixed(1)}%`,
                    left: `${(-activeCrop.x * (100 / activeCrop.width)).toFixed(1)}%`,
                    top: `${(-activeCrop.y * (100 / activeCrop.height)).toFixed(1)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400">Table (32×32)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95"
          >
            <Check size={16} />
            <span>Save & Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
