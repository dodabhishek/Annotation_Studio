import { useEffect, useCallback } from 'react';
import { useAnnotationStore } from '../hooks/use-annotation-store';
import { AnnotationCanvas } from './annotation-canvas';
import { Toolbar } from './toolbar';
import { LabelsSidebar } from './labels-sidebar';
import { AnnotationList } from './annotation-list';
import { TOOLS, MIN_ZOOM, MAX_ZOOM } from '../lib/constants';

export function LabelingApp() {
  const store = useAnnotationStore();

  const handleZoomIn = useCallback(() => {
    store.setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
  }, [store]);

  const handleZoomOut = useCallback(() => {
    store.setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
  }, [store]);

  const handleFitView = useCallback(() => {
    store.setZoom(1);
    store.setStagePos({ x: 0, y: 0 });
  }, [store]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isMeta = e.metaKey || e.ctrlKey;

      switch (e.key.toLowerCase()) {
        case 'v':
          if (!isMeta) store.setActiveTool(TOOLS.SELECT);
          break;
        case 'b':
          if (!isMeta) store.setActiveTool(TOOLS.BBOX);
          break;
        case 'h':
          if (!isMeta) store.setActiveTool(TOOLS.PAN);
          break;
        case 'delete':
        case 'backspace':
          if (!isMeta) {
            e.preventDefault();
            store.deleteSelected();
          }
          break;
        case 'z':
          if (isMeta && e.shiftKey) {
            e.preventDefault();
            store.redo();
          } else if (isMeta) {
            e.preventDefault();
            store.undo();
          }
          break;
        case 'escape':
          store.selectAnnotation(null);
          break;
        case '=':
        case '+':
          if (isMeta) { e.preventDefault(); handleZoomIn(); }
          break;
        case '-':
          if (isMeta) { e.preventDefault(); handleZoomOut(); }
          break;
        case '0':
          if (isMeta) { e.preventDefault(); handleFitView(); }
          break;
        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9': {
          if (!isMeta) {
            const idx = parseInt(e.key) - 1;
            if (idx < store.classes.length) {
              store.setActiveClassId(store.classes[idx].id);
            }
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, handleZoomIn, handleZoomOut, handleFitView]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <header className="h-11 flex items-center px-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">LabelStudio</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Ready
          </span>
          <span className="font-mono text-[10px] bg-secondary px-2 py-1 rounded">
            {store.annotations.length} annotations
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <Toolbar
          activeTool={store.activeTool}
          setActiveTool={store.setActiveTool}
          zoom={store.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onUndo={store.undo}
          onRedo={store.redo}
          onDeleteSelected={store.deleteSelected}
          showConfidence={store.showConfidence}
          onToggleConfidence={() => store.setShowConfidence((v) => !v)}
          hasSelection={!!store.selectedId}
        />

        <AnnotationCanvas
          annotations={store.annotations}
          selectedId={store.selectedId}
          activeTool={store.activeTool}
          activeClassId={store.activeClassId}
          zoom={store.zoom}
          stagePos={store.stagePos}
          showConfidence={store.showConfidence}
          imageSize={store.imageSize}
          getClassById={store.getClassById}
          onSelect={store.selectAnnotation}
          onAdd={store.addAnnotation}
          onUpdate={store.updateAnnotation}
          onZoomChange={store.setZoom}
          onStagePosChange={store.setStagePos}
          onImageLoad={store.setImageSize}
        />

        <div className="flex shrink-0">
          <LabelsSidebar
            classes={store.classes}
            activeClassId={store.activeClassId}
            onSelectClass={store.setActiveClassId}
            onAddClass={store.addClass}
            onRemoveClass={store.removeClass}
          />

          <AnnotationList
            annotations={store.annotations}
            selectedId={store.selectedId}
            getClassById={store.getClassById}
            showConfidence={store.showConfidence}
            onSelect={store.selectAnnotation}
            onDelete={store.deleteAnnotation}
            onUpdate={store.updateAnnotation}
          />
        </div>
      </div>
    </div>
  );
}
