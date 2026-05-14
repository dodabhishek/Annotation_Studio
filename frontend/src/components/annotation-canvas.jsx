import { useRef, useState, useCallback, useEffect } from 'react';
import { detectSamPoint } from '@/lib/api';

export function AnnotationCanvas({
  image,
  annotations,
  labels,
  selectedTool,
  selectedLabelId,
  selectedAnnotationId,
  zoom,
  pan,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onZoomChange,
  onPanChange,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const imgUrlRef = useRef(null);
  const rafRef = useRef(null);
  const displaySizeRef = useRef({ w: 0, h: 0 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [isMovingAnnotation, setIsMovingAnnotation] = useState(false);
  const [selectedAnnotationHandle, setSelectedAnnotationHandle] = useState(null);
  const [isSamComputing, setIsSamComputing] = useState(false);

  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const drawStartRef = useRef(null);
  const dragDistanceRef = useRef(0);
  const MIN_DRAG_DISTANCE = 3;

  const getLabelColor = useCallback(
    (labelId) => labels.find((l) => l.id === labelId)?.color || '#ffffff',
    [labels]
  );

  const fitImageToCanvas = useCallback((img) => {
    const container = containerRef.current;
    if (!container) return;
    const { width: cw, height: ch } = container.getBoundingClientRect();
    if (cw <= 0 || ch <= 0 || img.width <= 0 || img.height <= 0) return;

    const pad = 40;
    const scaleX = (cw - pad) / img.width;
    const scaleY = (ch - pad) / img.height;
    const fitZoom = Math.min(scaleX, scaleY, 5);
    onZoomChange(fitZoom);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  // Load image and auto-fit whenever the image changes
  useEffect(() => {
    if (!image) {
      imgRef.current = null;
      imgUrlRef.current = null;
      setImageSize(null);
      return;
    }

    // Already loaded this exact URL — just re-fit
    if (imgUrlRef.current === image.url && imgRef.current) {
      setImageSize({ width: imgRef.current.width, height: imgRef.current.height });
      fitImageToCanvas(imgRef.current);
      return;
    }

    const img = new Image();
    // Do NOT set crossOrigin for blob: URLs — they are same-origin and
    // setting crossOrigin would cause the browser to reject the load.
    img.onload = () => {
      imgRef.current = img;
      imgUrlRef.current = image.url;
      setImageSize({ width: img.width, height: img.height });
      fitImageToCanvas(img);
    };
    img.onerror = (e) => {
      console.error('[AnnotationCanvas] Failed to load image:', image.url, e);
    };
    img.src = image.url;
  }, [image, fitImageToCanvas]);

  // Resize canvas to fill container, re-fit image on resize.
  // Depends on `image` so the observer is (re-)created when the canvas
  // first appears in the DOM (transition from "no image" placeholder).
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncSize = () => {
      const { width, height } = container.getBoundingClientRect();
      const w = Math.floor(width);
      const h = Math.floor(height);
      if (w <= 0 || h <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const bufW = Math.floor(w * dpr);
      const bufH = Math.floor(h * dpr);
      if (canvas.width !== bufW || canvas.height !== bufH) {
        canvas.width = bufW;
        canvas.height = bufH;
        displaySizeRef.current = { w, h };
        if (imgRef.current) {
          fitImageToCanvas(imgRef.current);
        }
      }
    };

    syncSize();

    const observer = new ResizeObserver(() => syncSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [image, fitImageToCanvas]);

  // Main draw loop: redraw whenever any visual state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawCanvas(ctx, img);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    imageSize,
    zoom,
    pan,
    annotations,
    selectedAnnotationId,
    currentPoints,
    cursorPosition,
    selectedTool,
    selectedLabelId,
    getLabelColor,
  ]);

  function drawCanvas(ctx, img) {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const { w: dw, h: dh } = displaySizeRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, dw, dh);

    ctx.fillStyle = '#03061a';
    ctx.fillRect(0, 0, dw, dh);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(pan.x + dw / 2, pan.y + dh / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-img.width / 2, -img.height / 2);

    ctx.fillStyle = '#060d2e';
    ctx.fillRect(0, 0, img.width, img.height);

    ctx.drawImage(img, 0, 0);

    // Draw saved annotations
    annotations.forEach((ann) => {
      const color = getLabelColor(ann.labelId);
      const isSelected = ann.id === selectedAnnotationId;
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '30';
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
      ctx.setLineDash([]);

      if (ann.type === 'bbox' && ann.points.length === 2) {
        const [p1, p2] = ann.points;
        const w = p2.x - p1.x;
        const h = p2.y - p1.y;
        ctx.fillRect(p1.x, p1.y, w, h);
        ctx.strokeRect(p1.x, p1.y, w, h);

        // Label tag
        const label = labels.find((l) => l.id === ann.labelId);
        if (label) {
          const tagText = label.name;
          ctx.font = `${12 / zoom}px Inter, system-ui, sans-serif`;
          const textW = ctx.measureText(tagText).width;
          const tagH = 18 / zoom;
          const tagY = p1.y - tagH;
          ctx.fillStyle = color;
          ctx.fillRect(p1.x, tagY, textW + 8 / zoom, tagH);
          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, p1.x + 4 / zoom, tagY + tagH / 2);
        }
      } else if (ann.type === 'polygon' && ann.points.length > 2) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (ann.type === 'polyline' && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
        ctx.stroke();
      } else if (ann.type === 'point') {
        ann.points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      // Handles on selected annotation
      if (isSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ann.points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    });

    // Draw in-progress annotation
    if (currentPoints.length > 0) {
      const color = getLabelColor(selectedLabelId);
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '30';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      if (selectedTool === 'bbox' && currentPoints.length === 2) {
        const [p1, p2] = currentPoints;
        const w = p2.x - p1.x;
        const h = p2.y - p1.y;
        ctx.fillRect(p1.x, p1.y, w, h);
        ctx.strokeRect(p1.x, p1.y, w, h);

        // Size indicator
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = `${11 / zoom}px Inter, system-ui, monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(
          `${Math.abs(Math.round(w))} × ${Math.abs(Math.round(h))}`,
          Math.min(p1.x, p2.x),
          Math.max(p1.y, p2.y) + 4 / zoom
        );
      } else if (
        (selectedTool === 'polygon' || selectedTool === 'polyline') &&
        currentPoints.length > 0
      ) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
        if (cursorPosition) ctx.lineTo(cursorPosition.x, cursorPosition.y);
        if (selectedTool === 'polygon' && currentPoints.length > 1) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        currentPoints.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
      ctx.setLineDash([]);
    }

    // Crosshair when using drawing tools
    if (
      cursorPosition &&
      (selectedTool === 'bbox' || selectedTool === 'polygon' || selectedTool === 'polyline' || selectedTool === 'point')
    ) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.beginPath();
      ctx.moveTo(cursorPosition.x, 0);
      ctx.lineTo(cursorPosition.x, img.height);
      ctx.moveTo(0, cursorPosition.y);
      ctx.lineTo(img.width, cursorPosition.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  const getImageCoordinates = useCallback(
    (e) => {
      if (!canvasRef.current || !imageSize) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const { w: dw, h: dh } = displaySizeRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const imgX = (x - pan.x - dw / 2) / zoom + imageSize.width / 2;
      const imgY = (y - pan.y - dh / 2) / zoom + imageSize.height / 2;
      return { x: imgX, y: imgY };
    },
    [pan, zoom, imageSize]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (!image) return;
      const point = getImageCoordinates(e);
      if (!point) return;

      if (selectedTool === 'pan' || e.button === 1) {
        setIsPanning(true);
        isPanningRef.current = true;
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (selectedTool === 'select') {
        // Check if clicking on an annotation point to move it
        const clickedAnnotation = annotations.find((ann) => ann.id === selectedAnnotationId);
        if (clickedAnnotation) {
          for (let i = 0; i < clickedAnnotation.points.length; i++) {
            const p = clickedAnnotation.points[i];
            if (Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) < 10 / zoom) {
              setIsMovingAnnotation(true);
              setSelectedAnnotationHandle(i);
              drawStartRef.current = point;
              return;
            }
          }
        }

        // Check if clicking anywhere on an annotation to select it and prepare to move
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (isPointInAnnotation(point, annotations[i])) {
            onSelectAnnotation(annotations[i].id);
            setIsMovingAnnotation(true);
            drawStartRef.current = point;
            return;
          }
        }
        onSelectAnnotation(null);
        return;
      }

      if (selectedTool === 'bbox') {
        setIsDrawing(true);
        isDrawingRef.current = true;
        drawStartRef.current = point;
        dragDistanceRef.current = 0;
        // Don't set currentPoints yet - wait for minimum drag distance
      } else if (selectedTool === 'point') {
        onAddAnnotation({
          type: 'point',
          labelId: selectedLabelId,
          points: [point],
          imageId: image.id,
        });
      } else if (selectedTool === 'sam-point') {
        if (isSamComputing) return;
        setIsSamComputing(true);
        // Create an async function inside to handle the API call
        (async () => {
          try {
            // we pass image.file which is a File object, point.x and point.y
            const points = await detectSamPoint(image.file, point.x, point.y);
            if (points && points.length > 2) {
              onAddAnnotation({
                type: 'polygon',
                labelId: selectedLabelId,
                points: points,
                imageId: image.id,
              });
            }
          } catch (error) {
            console.error('SAM detection failed:', error);
          } finally {
            setIsSamComputing(false);
          }
        })();
      } else if (selectedTool === 'polygon' || selectedTool === 'polyline') {
        if (e.detail === 2 && currentPoints.length > 1) {
          onAddAnnotation({
            type: selectedTool,
            labelId: selectedLabelId,
            points: currentPoints,
            imageId: image.id,
          });
          setCurrentPoints([]);
          return;
        }
        setCurrentPoints((prev) => [...prev, point]);
      }
    },
    [image, selectedTool, selectedLabelId, annotations, currentPoints, getImageCoordinates, onAddAnnotation, onSelectAnnotation, zoom, selectedAnnotationId]
  );

  const handleMouseMove = useCallback(
    (e) => {
      const point = getImageCoordinates(e);
      if (point) setCursorPosition(point);

      if (isPanningRef.current) {
        const last = lastPanPointRef.current;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        onPanChange({ x: pan.x + dx, y: pan.y + dy });
        const next = { x: e.clientX, y: e.clientY };
        setLastPanPoint(next);
        lastPanPointRef.current = next;
        return;
      }

      // Handle moving annotation
      if (isMovingAnnotation && selectedAnnotationId && drawStartRef.current && point) {
        const annotation = annotations.find((ann) => ann.id === selectedAnnotationId);
        if (annotation) {
          const dx = point.x - drawStartRef.current.x;
          const dy = point.y - drawStartRef.current.y;

          if (selectedAnnotationHandle !== null && selectedAnnotationHandle !== undefined) {
            // Moving a specific handle/point
            const newPoints = annotation.points.map((p, idx) =>
              idx === selectedAnnotationHandle ? { x: p.x + dx, y: p.y + dy } : p
            );
            onUpdateAnnotation(selectedAnnotationId, { points: newPoints });
          } else {
            // Moving entire annotation
            const newPoints = annotation.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
            onUpdateAnnotation(selectedAnnotationId, { points: newPoints });
          }
          drawStartRef.current = point;
        }
        return;
      }

      // Handle bbox drawing with minimum drag distance
      if (isDrawingRef.current && selectedTool === 'bbox' && drawStartRef.current && point) {
        const distance = Math.sqrt(
          Math.pow(point.x - drawStartRef.current.x, 2) +
          Math.pow(point.y - drawStartRef.current.y, 2)
        );
        dragDistanceRef.current = distance;

        // Only show bbox preview after minimum drag distance
        if (distance >= MIN_DRAG_DISTANCE) {
          setCurrentPoints([drawStartRef.current, point]);
        }
      }
    },
    [selectedTool, getImageCoordinates, onPanChange, pan, isMovingAnnotation, selectedAnnotationId, annotations, selectedAnnotationHandle, onUpdateAnnotation, zoom]
  );

  const handleMouseUp = useCallback(
    () => {
      if (isPanningRef.current) {
        setIsPanning(false);
        isPanningRef.current = false;
        return;
      }

      if (isMovingAnnotation) {
        setIsMovingAnnotation(false);
        setSelectedAnnotationHandle(null);
        drawStartRef.current = null;
        return;
      }

      if (isDrawingRef.current && selectedTool === 'bbox' && currentPoints.length === 2 && image) {
        const [p1, p2] = currentPoints;
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        if (w > 2 && h > 2) {
          onAddAnnotation({
            type: 'bbox',
            labelId: selectedLabelId,
            points: [
              { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) },
              { x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y) },
            ],
            imageId: image.id,
          });
        }
        setCurrentPoints([]);
        setIsDrawing(false);
        isDrawingRef.current = false;
        drawStartRef.current = null;
        dragDistanceRef.current = 0;
      }
    },
    [selectedTool, currentPoints, image, selectedLabelId, onAddAnnotation, isMovingAnnotation]
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const oldZoom = zoom;

      // Gentle zoom: scale factor based on scroll delta magnitude
      // Trackpads send small deltas frequently; mice send large deltas infrequently
      const rawDelta = Math.abs(e.deltaY);
      const sensitivity = 0.001;
      const factor = 1 - Math.sign(e.deltaY) * Math.min(rawDelta * sensitivity, 0.08);
      const newZoom = Math.min(Math.max(oldZoom * factor, 0.05), 10);

      const { w: dw, h: dh } = displaySizeRef.current;
      const cx = pointer.x - dw / 2;
      const cy = pointer.y - dh / 2;
      const newPanX = pan.x - cx * (newZoom / oldZoom - 1);
      const newPanY = pan.y - cy * (newZoom / oldZoom - 1);

      onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    },
    [zoom, pan, onZoomChange, onPanChange]
  );

  const isPointInAnnotation = (point, annotation) => {
    if (annotation.type === 'bbox' && annotation.points.length === 2) {
      const [p1, p2] = annotation.points;
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }
    if (annotation.type === 'point') {
      return annotation.points.some(
        (p) => Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) < 10 / zoom
      );
    }
    if (annotation.points.length > 0) {
      const xs = annotation.points.map((p) => p.x);
      const ys = annotation.points.map((p) => p.y);
      return (
        point.x >= Math.min(...xs) && point.x <= Math.max(...xs) &&
        point.y >= Math.min(...ys) && point.y <= Math.max(...ys)
      );
    }
    return false;
  };

  // Keyboard shortcuts for finishing polygon/polyline
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCurrentPoints([]);
        setIsDrawing(false);
        isDrawingRef.current = false;
        drawStartRef.current = null;
      }
      if (
        e.key === 'Enter' &&
        (selectedTool === 'polygon' || selectedTool === 'polyline') &&
        currentPoints.length > 1 &&
        image
      ) {
        onAddAnnotation({
          type: selectedTool,
          labelId: selectedLabelId,
          points: currentPoints,
          imageId: image.id,
        });
        setCurrentPoints([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTool, currentPoints, image, selectedLabelId, onAddAnnotation]);

  if (!image) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sam-cyan/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-sam-purple/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-sam-cyan/10 border border-sam-cyan/20 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-sam-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-foreground font-semibold text-lg mb-2">No image selected</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Upload images from the left panel to start labeling with AI-powered segmentation
          </p>
        </div>
      </div>
    );
  }

  const getCursor = () => {
    if (isSamComputing) return 'wait';
    if (selectedTool === 'pan' || isPanning) return 'grab';
    if (selectedTool === 'select') return 'default';
    if (selectedTool === 'sam-point') return 'crosshair'; // maybe wand? standard css doesn't have wand, crosshair is fine
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden bg-[#0a0a0f]"
      style={{ cursor: getCursor() }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          isPanningRef.current = false;
          setCursorPosition(null);
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Coordinates + zoom indicator */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-xl rounded-xl px-4 py-2 text-xs text-muted-foreground shadow-lg border border-sam-cyan/20 flex items-center gap-4">
        <span className="font-mono text-sam-cyan font-semibold">{Math.round(zoom * 100)}%</span>
        {cursorPosition && (
          <span className="font-mono text-foreground/80">
            x: {Math.round(cursorPosition.x)} y: {Math.round(cursorPosition.y)}
          </span>
        )}
        {(selectedTool === 'polygon' || selectedTool === 'polyline') &&
          currentPoints.length > 0 && (
            <span className="text-sam-cyan font-medium">
              {currentPoints.length} pts — dbl-click or Enter to finish
            </span>
          )}
      </div>
      
      {/* SAM Computing indicator */}
      {isSamComputing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border border-sam-cyan/30 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sam-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-foreground">Computing segmentation...</span>
        </div>
      )}
    </div>
  );
}
