import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { TOOLS, MIN_ZOOM, MAX_ZOOM, SAMPLE_IMAGE } from '../lib/constants';

function BBoxAnnotation({
  annotation,
  classInfo,
  isSelected,
  showConfidence,
  onSelect,
  onChange,
  activeTool,
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  if (!annotation.visible) return null;

  const color = classInfo?.color || '#ffffff';
  const label = classInfo?.name || 'Unknown';
  const conf = annotation.confidence;

  return (
    <>
      <Rect
        ref={shapeRef}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        stroke={color}
        strokeWidth={2}
        fill={`${color}18`}
        draggable={activeTool === TOOLS.SELECT}
        onClick={() => onSelect(annotation.id)}
        onTap={() => onSelect(annotation.id)}
        onDragEnd={(e) => {
          onChange(annotation.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange(annotation.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
        hitStrokeWidth={10}
      />
      <Group x={annotation.x} y={annotation.y - 20} listening={false}>
        <Rect
          width={label.length * 8 + (showConfidence && conf != null ? 50 : 12)}
          height={18}
          fill={color}
          cornerRadius={2}
        />
        <Text
          text={`${label}${showConfidence && conf != null ? ` ${(conf * 100).toFixed(0)}%` : ''}`}
          fontSize={11}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#ffffff"
          padding={3}
          listening={false}
        />
      </Group>
      {isSelected && activeTool === TOOLS.SELECT && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          anchorSize={8}
          anchorCornerRadius={2}
          anchorStroke={color}
          anchorFill="#ffffff"
          borderStroke={color}
          borderStrokeWidth={1.5}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-right', 'middle-left',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
        />
      )}
    </>
  );
}

function Crosshair({ stageRef, zoom }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleMove = () => {
      const pointer = stage.getPointerPosition();
      if (pointer) setPos(pointer);
    };
    const handleLeave = () => setPos(null);

    const container = stage.container();
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, [stageRef]);

  if (!pos) return null;

  return (
    <>
      <Rect x={pos.x - 10} y={pos.y} width={20} height={1} fill="#ffffff80" listening={false} />
      <Rect x={pos.x} y={pos.y - 10} width={1} height={20} fill="#ffffff80" listening={false} />
    </>
  );
}

export function AnnotationCanvas({
  annotations,
  selectedId,
  activeTool,
  activeClassId,
  zoom,
  stagePos,
  showConfidence,
  imageSize,
  getClassById,
  onSelect,
  onAdd,
  onUpdate,
  onZoomChange,
  onStagePosChange,
  onImageLoad,
}) {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [drawing, setDrawing] = useState(null);
  const [image] = useImage(SAMPLE_IMAGE, 'anonymous');
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (image) {
      onImageLoad({ width: image.width, height: image.height });
    }
  }, [image, onImageLoad]);

  const getPointerOnImage = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    };
  }, [zoom, stagePos]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const oldZoom = zoom;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + direction * 0.15 * oldZoom));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldZoom,
      y: (pointer.y - stagePos.y) / oldZoom,
    };

    onZoomChange(newZoom);
    onStagePosChange({
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    });
  }, [zoom, stagePos, onZoomChange, onStagePosChange]);

  const handleMouseDown = useCallback((e) => {
    if (e.evt.button === 1 || activeTool === TOOLS.PAN) {
      isPanningRef.current = true;
      lastPointerRef.current = stageRef.current.getPointerPosition();
      return;
    }

    if (activeTool === TOOLS.BBOX) {
      const pos = getPointerOnImage();
      if (!pos) return;
      if (e.target === e.target.getStage() || e.target.className === 'Image') {
        setDrawing({ x: pos.x, y: pos.y, width: 0, height: 0, classId: activeClassId });
      }
    }

    if (activeTool === TOOLS.SELECT) {
      if (e.target === e.target.getStage() || e.target.className === 'Image') {
        onSelect(null);
      }
    }
  }, [activeTool, activeClassId, getPointerOnImage, onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (isPanningRef.current) {
      const pointer = stageRef.current.getPointerPosition();
      const last = lastPointerRef.current;
      if (pointer && last) {
        onStagePosChange({
          x: stagePos.x + (pointer.x - last.x),
          y: stagePos.y + (pointer.y - last.y),
        });
        lastPointerRef.current = pointer;
      }
      return;
    }

    if (drawing && activeTool === TOOLS.BBOX) {
      const pos = getPointerOnImage();
      if (!pos) return;
      setDrawing((prev) => ({
        ...prev,
        width: pos.x - prev.x,
        height: pos.y - prev.y,
      }));
    }
  }, [drawing, activeTool, stagePos, getPointerOnImage, onStagePosChange]);

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastPointerRef.current = null;
      return;
    }

    if (drawing && activeTool === TOOLS.BBOX) {
      let { x, y, width, height, classId } = drawing;
      if (width < 0) { x += width; width = -width; }
      if (height < 0) { y += height; height = -height; }

      if (width > 3 && height > 3) {
        onAdd({ x, y, width, height, classId });
      }
      setDrawing(null);
    }
  }, [drawing, activeTool, onAdd]);

  const cursorStyle = activeTool === TOOLS.PAN
    ? 'grab'
    : activeTool === TOOLS.BBOX
      ? 'crosshair'
      : 'default';

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-neutral-900 overflow-hidden relative"
      style={{ cursor: cursorStyle }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={0}
              y={0}
              width={image.width}
              height={image.height}
            />
          )}

          {annotations.map((ann) => (
            <BBoxAnnotation
              key={ann.id}
              annotation={ann}
              classInfo={getClassById(ann.classId)}
              isSelected={selectedId === ann.id}
              showConfidence={showConfidence}
              onSelect={onSelect}
              onChange={onUpdate}
              activeTool={activeTool}
            />
          ))}

          {drawing && (
            <Rect
              x={drawing.x}
              y={drawing.y}
              width={drawing.width}
              height={drawing.height}
              stroke={getClassById(activeClassId)?.color || '#ffffff'}
              strokeWidth={2}
              dash={[6, 3]}
              fill={`${getClassById(activeClassId)?.color || '#ffffff'}15`}
              listening={false}
            />
          )}
        </Layer>

        {activeTool === TOOLS.BBOX && (
          <Layer>
            <Crosshair stageRef={stageRef} zoom={zoom} />
          </Layer>
        )}
      </Stage>

      <div className="absolute bottom-3 left-3 bg-card/80 backdrop-blur-sm text-xs text-muted-foreground px-2.5 py-1.5 rounded-md border border-border/50 font-mono">
        {Math.round(zoom * 100)}%
        {imageSize.width > 0 && (
          <span className="ml-2 text-muted-foreground/60">
            {imageSize.width} x {imageSize.height}
          </span>
        )}
      </div>
    </div>
  );
}
