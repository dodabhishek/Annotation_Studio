import { useState, useCallback, useRef } from 'react';
import { TOOLS, DEFAULT_CLASSES } from '../lib/constants';

let annotationIdCounter = 1;

export function useAnnotationStore() {
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOLS.SELECT);
  const [activeClassId, setActiveClassId] = useState(DEFAULT_CLASSES[0].id);
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [showConfidence, setShowConfidence] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const pushHistory = useCallback((newAnnotations) => {
    const idx = historyIndexRef.current;
    const next = historyRef.current.slice(0, idx + 1);
    next.push(JSON.parse(JSON.stringify(newAnnotations)));
    if (next.length > 50) next.shift();
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
  }, []);

  const addAnnotation = useCallback((rect) => {
    const id = `ann-${annotationIdCounter++}`;
    const newAnn = {
      id,
      classId: rect.classId,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      confidence: rect.confidence ?? null,
      visible: true,
    };
    setAnnotations((prev) => {
      const next = [...prev, newAnn];
      pushHistory(next);
      return next;
    });
    setSelectedId(id);
    return id;
  }, [pushHistory]);

  const updateAnnotation = useCallback((id, updates) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const deleteAnnotation = useCallback((id) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== id);
      pushHistory(next);
      return next;
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedId) deleteAnnotation(selectedId);
  }, [selectedId, deleteAnnotation]);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      historyIndexRef.current = idx - 1;
      setAnnotations(JSON.parse(JSON.stringify(historyRef.current[idx - 1])));
      setSelectedId(null);
    }
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) {
      historyIndexRef.current = idx + 1;
      setAnnotations(JSON.parse(JSON.stringify(historyRef.current[idx + 1])));
      setSelectedId(null);
    }
  }, []);

  const addClass = useCallback((name, color) => {
    const id = `cls-${Date.now()}`;
    setClasses((prev) => [...prev, { id, name, color }]);
    return id;
  }, []);

  const removeClass = useCallback((id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.classId !== id);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const getClassById = useCallback((id) => {
    return classes.find((c) => c.id === id);
  }, [classes]);

  const selectAnnotation = useCallback((id) => {
    setSelectedId(id);
    if (id && activeTool !== TOOLS.SELECT) {
      setActiveTool(TOOLS.SELECT);
    }
  }, [activeTool]);

  return {
    annotations,
    setAnnotations,
    selectedId,
    selectAnnotation,
    activeTool,
    setActiveTool,
    activeClassId,
    setActiveClassId,
    classes,
    setClasses,
    zoom,
    setZoom,
    stagePos,
    setStagePos,
    showConfidence,
    setShowConfidence,
    imageSize,
    setImageSize,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    deleteSelected,
    undo,
    redo,
    addClass,
    removeClass,
    getClassById,
  };
}
