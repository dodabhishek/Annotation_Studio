import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader } from '@/components/image-uploader';
import { LabelManager } from '@/components/label-manager';
import { AnnotationList } from '@/components/annotation-list';
import { AnnotationCanvas } from '@/components/annotation-canvas';
import { Toolbar } from '@/components/toolbar';
import { LabelNamingDialog } from '@/components/label-naming-dialog';
import { SaveAssetButton } from '@/components/save-asset-button';
import { AssetsViewer } from '@/components/assets-viewer';
import { useAnnotationStore } from '@/hooks/use-annotation-store';
import { Tags, Layers, ArrowLeft, Sparkles, Loader2, AlertCircle, ImageIcon, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { detectObjects } from '@/lib/api';
import { generateCOCODataset, downloadCOCODataset, getImageDimensions } from '@/lib/coco-export';

export function LabelingApp({ initialFiles, selectedModel, onBack }) {
    const store = useAnnotationStore();
    const initializedRef = useRef(false);

    const [detectPrompt, setDetectPrompt] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectError, setDetectError] = useState(null);
    const [detectResult, setDetectResult] = useState(null);
    const [outputImageUrl, setOutputImageUrl] = useState(null);
    const [showOutputDialog, setShowOutputDialog] = useState(false);
    
    const [pendingAnnotation, setPendingAnnotation] = useState(null);
    const [showLabelNamingDialog, setShowLabelNamingDialog] = useState(false);
    const [labelCounts, setLabelCounts] = useState({});

    useEffect(() => {
        if (initialFiles && initialFiles.length > 0 && !initializedRef.current) {
            initializedRef.current = true;
            store.addImages(initialFiles);
        }
    }, [initialFiles, store]);

    // Update label counts whenever labels or annotations change
    useEffect(() => {
        setLabelCounts(store.getLabelCounts());
    }, [store.labels, store.images]);

    const handleAutoDetect = useCallback(async () => {
        const img = store.currentImage;
        if (!img || !img.file) return;

        const prompt = detectPrompt.trim() || 'person .';
        setIsDetecting(true);
        setDetectError(null);
        setDetectResult(null);
        setOutputImageUrl(null);

        try {
            const data = await detectObjects(img.file, prompt);
            if (data.outputImageUrl) {
                setOutputImageUrl(data.outputImageUrl);
            }
            if (data.detections && data.detections.length > 0) {
                store.addDetections(img.id, data.detections);
                setDetectResult(`Found ${data.detections.length} object${data.detections.length !== 1 ? 's' : ''}`);
            } else {
                setDetectResult('No objects detected. Try a different prompt.');
            }
        } catch (err) {
            setDetectError(err.message || 'Detection failed');
        } finally {
            setIsDetecting(false);
        }
    }, [store, detectPrompt]);

    const handleAnnotationCreated = useCallback((annotation) => {
        setPendingAnnotation(annotation);
        setShowLabelNamingDialog(true);
    }, []);

    const handleLabelSelected = useCallback((labelIdOrObj) => {
        if (!pendingAnnotation) return;

        let finalLabelId = labelIdOrObj;
        
        // If it's an object (new label), create it
        if (typeof labelIdOrObj === 'object') {
            finalLabelId = store.getOrCreateLabel(labelIdOrObj);
        }

        // Create the annotation ID
        const annotationId = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add to store with the selected labelId
        setLabelCounts(prev => {
            const newCounts = { ...prev };
            if (!newCounts[finalLabelId]) newCounts[finalLabelId] = 0;
            newCounts[finalLabelId]++;
            return newCounts;
        });

        store.addAnnotation({
            ...pendingAnnotation,
            labelId: finalLabelId,
        });

        setPendingAnnotation(null);
        setShowLabelNamingDialog(false);
    }, [pendingAnnotation, store]);

    const handleLabelNamingCanceled = useCallback(() => {
        setPendingAnnotation(null);
        setShowLabelNamingDialog(false);
    }, []);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            const shortcuts = {
                'v': 'select',
                'b': 'bbox',
                'p': 'polygon',
                'l': 'polyline',
                'k': 'point',
                'h': 'pan',
            };
            const key = e.key.toLowerCase();
            if (shortcuts[key]) {
                e.preventDefault();
                store.setSelectedTool(shortcuts[key]);
            }
            // Label shortcuts (1-9)
            if (/^[1-9]$/.test(key)) {
                const label = store.labels.find(l => l.shortcut === key);
                if (label) {
                    e.preventDefault();
                    store.setSelectedLabelId(label.id);
                }
            }
            // Delete selected annotation
            if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedAnnotationId) {
                e.preventDefault();
                store.deleteAnnotation(store.selectedAnnotationId);
            }
            // Navigation
            if (e.key === 'ArrowRight' || e.key === 'd') {
                e.preventDefault();
                store.nextImage();
            }
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                e.preventDefault();
                store.prevImage();
            }
            // Zoom
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                store.setZoom(Math.min(store.zoom * 1.2, 5));
            }
            if (e.key === '-') {
                e.preventDefault();
                store.setZoom(Math.max(store.zoom / 1.2, 0.1));
            }
            if (e.key === '0') {
                e.preventDefault();
                store.resetZoom();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [store]);
    const handleExport = useCallback(() => {
        const data = store.exportAnnotations();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [store]);
    return (<div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-1 h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4"/>
            </Button>
          )}
          <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-sparkle-pulse">
            <Tags className="h-5 w-5 text-primary-foreground"/>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-particle"/>
            <span className="absolute -bottom-0.5 -left-1 w-1.5 h-1.5 bg-blue-accent rounded-full animate-particle-delay-1"/>
            <span className="absolute top-0 -left-0.5 w-1 h-1 bg-blue-glow rounded-full animate-particle-delay-2"/>
          </div>
          <div>
            <span className="font-semibold text-foreground text-lg">Annotation Studio</span>
            <p className="text-xs text-muted-foreground">Image Annotation Tool</p>
          </div>
          {selectedModel && (
            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
              {selectedModel.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        <div className="flex-1"/>
        <div className="flex items-center gap-3">
          {/* Progress badge with blue sprinkle indicator */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
            <div className="relative sprinkle-indicator">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-sprinkle"/>
            </div>
            <span className="text-sm font-medium text-foreground">
              {store.images.filter(i => i.labeled).length} / {store.images.length}
            </span>
            <span className="text-sm text-muted-foreground">labeled</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar 
          selectedTool={store.selectedTool} 
          onSelectTool={store.setSelectedTool} 
          zoom={store.zoom} 
          onZoomIn={() => store.setZoom(Math.min(store.zoom * 1.2, 5))} 
          onZoomOut={() => store.setZoom(Math.max(store.zoom / 1.2, 0.1))} 
          onResetView={store.resetZoom} 
          onDeleteSelected={() => {
            if (store.selectedAnnotationId) {
                store.deleteAnnotation(store.selectedAnnotationId);
            }
          }} 
          onExport={handleExport} 
          hasSelectedAnnotation={!!store.selectedAnnotationId} 
          canGoNext={store.currentImageIndex < store.images.length - 1} 
          canGoPrev={store.currentImageIndex > 0} 
          onNext={store.nextImage} 
          onPrev={store.prevImage} 
          currentIndex={store.currentImageIndex} 
          totalImages={store.images.length}
          saveButton={
            <SaveAssetButton 
                image={store.currentImage} 
                annotations={store.currentImage?.annotations || []} 
                labels={store.labels}
                iconOnly={true}
            />
          }
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Images */}
        <aside className="w-64 border-r border-border bg-card flex-shrink-0">
          <ImageUploader onUpload={store.addImages} images={store.images} onRemoveImage={store.removeImage} currentImageIndex={store.currentImageIndex} onSelectImage={store.goToImage}/>
        </aside>

        {/* Canvas */}
        <AnnotationCanvas image={store.currentImage} annotations={store.currentImage?.annotations || []} 
          labels={store.labels} selectedTool={store.selectedTool} selectedLabelId={store.selectedLabelId} 
              selectedAnnotationId={store.selectedAnnotationId} zoom={store.zoom} pan={store.pan} onAddAnnotation={handleAnnotationCreated} 
                onUpdateAnnotation={store.updateAnnotation} onSelectAnnotation={store.setSelectedAnnotationId} onZoomChange={store.setZoom} 
                  onPanChange={store.setPan}/>

        {/* Right sidebar - Labels & Annotations */}
        <aside className="w-72 border-l border-border bg-card flex-shrink-0 flex flex-col">
          {/* AI Auto-Detect Panel */}
          <div className="border-b border-border p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">AI Detect</span>
              {selectedModel && (
                <span className="ml-auto text-[9px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                  {selectedModel.replace(/-/g, ' ')}
                </span>
              )}
            </div>

            <input
              type="text"
              value={detectPrompt}
              onChange={(e) => setDetectPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isDetecting) handleAutoDetect(); }}
              placeholder="What to detect? e.g. person, car ."
              disabled={isDetecting}
              className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-secondary text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />

            <Button
              size="sm"
              className="w-full text-xs h-8"
              onClick={handleAutoDetect}
              disabled={isDetecting || !store.currentImage}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Detecting…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Auto Detect
                </>
              )}
            </Button>

            {detectError && (
              <div className="flex items-start gap-1.5 text-[11px] text-red-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{detectError}</span>
              </div>
            )}
            {detectResult && !detectError && (
              <p className="text-[11px] text-emerald-400">{detectResult}</p>
            )}

            {outputImageUrl && !detectError && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Backend Output</span>
                  </div>
                  <button
                    onClick={() => setShowOutputDialog(true)}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    View full size
                  </button>
                </div>
                <button
                  onClick={() => setShowOutputDialog(true)}
                  className="w-full rounded-md overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <img
                    src={outputImageUrl}
                    alt="Detection output"
                    className="w-full h-auto object-contain bg-black/50"
                  />
                </button>
              </div>
            )}
          </div>

          <Dialog open={showOutputDialog} onOpenChange={setShowOutputDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
              <DialogTitle className="sr-only">Detection Output</DialogTitle>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Detection Output</span>
                  {detectResult && (
                    <span className="text-xs text-emerald-400 ml-2">{detectResult}</span>
                  )}
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-4rem)] bg-black/80 flex items-center justify-center p-4">
                {outputImageUrl && (
                  <img
                    src={outputImageUrl}
                    alt="Detection output - full size"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue="labels" className="flex flex-col h-full">
            <TabsList className="grid grid-cols-3 m-2">
              <TabsTrigger value="labels" className="text-xs">
                <Tags className="h-3.5 w-3.5 mr-1.5"/>
                Labels
              </TabsTrigger>
              <TabsTrigger value="annotations" className="text-xs">
                <Layers className="h-3.5 w-3.5 mr-1.5"/>
                Annotations
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-xs">
                <Database className="h-3.5 w-3.5 mr-1.5"/>
                Dataset
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="labels" className="flex-1 m-0 overflow-hidden">
              <LabelManager labels={store.labels} selectedLabelId={store.selectedLabelId} labelCounts={labelCounts} onSelectLabel={store.setSelectedLabelId} onAddLabel={store.addLabel} onUpdateLabel={store.updateLabel} onDeleteLabel={store.deleteLabel}/>
            </TabsContent>
            
            <TabsContent value="annotations" className="flex-1 m-0 overflow-hidden flex flex-col gap-2 p-2">
              <div className="flex-1 overflow-hidden">
                <AnnotationList annotations={store.currentImage?.annotations || []} labels={store.labels} selectedAnnotationId={store.selectedAnnotationId} onSelectAnnotation={store.setSelectedAnnotationId} onDeleteAnnotation={store.deleteAnnotation}/>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="flex-1 m-0 overflow-hidden">
              <AssetsViewer />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-6 border-t border-border bg-card px-4 flex items-center text-xs text-muted-foreground">
        <span>
          Press <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">B</kbd> for Box,{' '}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">P</kbd> for Polygon,{' '}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">L</kbd> for Line,{' '}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">K</kbd> for Point,{' '}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">V</kbd> for Select
        </span>
        <div className="flex-1"/>
        <span>
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">←</kbd>{' '}
          <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">→</kbd> Navigate images
        </span>
      </footer>

      {/* Label Naming Dialog */}
      <LabelNamingDialog
        isOpen={showLabelNamingDialog}
        existingLabels={store.labels.map(l => ({
          id: l.id,
          name: l.name,
          color: l.color,
          count: labelCounts[l.id] || 0,
        }))}
        onConfirm={handleLabelSelected}
        onCancel={handleLabelNamingCanceled}
      />
    </div>);
}
