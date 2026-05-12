import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Download, Sparkles, AlertCircle, ArrowLeft, Tags, LayoutDashboard, Database, LogOut, Layers, Zap, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { detectObjects } from '@/lib/api';
import { generateCOCODataset, downloadCOCODataset, getImageDimensions } from '@/lib/coco-export';

export function LabelingApp({ initialFiles, selectedModel, onBack, user, onLogout }) {
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
                's': 'sam-point',
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

    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Background gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sam-cyan/3 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sam-purple/3 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <motion.header 
          className="app-header h-16 flex items-center px-6 shrink-0 gap-4 z-20"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" onClick={onBack} className="mr-1 h-9 w-9 p-0 hover:bg-sam-cyan/10 rounded-xl">
                  <ArrowLeft className="h-4 w-4"/>
                </Button>
              </motion.div>
            )}
            {/* Brand logo */}
            <motion.div 
              className="brand-logo"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Tags className="h-5 w-5 text-primary-foreground"/>
            </motion.div>
            <div>
              <span className="font-bold text-foreground text-lg tracking-tight">
                Annotation<span className="gradient-text"> Studio</span>
              </span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Image Annotation Tool</p>
            </div>
            {selectedModel && (
              <motion.span
                className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {selectedModel.replace(/-/g, ' ')}
              </motion.span>
            )}
          </div>
          <div className="flex-1"/>
          <div className="flex items-center gap-3">
            {/* Progress badge */}
            <motion.div 
              className="status-badge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <span className="flex h-2.5 w-2.5 rounded-full bg-sam-cyan animate-pulse"/>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {store.images.filter(i => i.labeled).length} / {store.images.length}
              </span>
              <span className="text-xs text-muted-foreground">labeled</span>
            </motion.div>

            {/* User Profile / Logout */}
            {user && (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
                <motion.div 
                  className="flex items-center gap-2 bg-sam-cyan/10 border border-sam-cyan/20 px-3 py-1.5 rounded-full"
                  whileHover={{ scale: 1.02 }}
                >
                  {user.picture ? (
                    <img src={user.picture} alt="Profile" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-sam-cyan flex items-center justify-center text-[10px] text-background font-bold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground">{user.name || user.email}</span>
                </motion.div>
                <motion.button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
                  title="Logout"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.header>

        {/* Toolbar */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
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
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden z-10">
          {/* Left sidebar - Images */}
          <motion.aside 
            className="w-64 border-r border-border bg-card/80 backdrop-blur-xl flex-shrink-0"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <ImageUploader 
              onUpload={store.addImages} 
              images={store.images} 
              onRemoveImage={store.removeImage} 
              currentImageIndex={store.currentImageIndex} 
              onSelectImage={store.goToImage}
            />
          </motion.aside>

          {/* Canvas */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnnotationCanvas 
              image={store.currentImage} 
              annotations={store.currentImage?.annotations || []} 
              labels={store.labels} 
              selectedTool={store.selectedTool} 
              selectedLabelId={store.selectedLabelId} 
              selectedAnnotationId={store.selectedAnnotationId} 
              zoom={store.zoom} 
              pan={store.pan} 
              onAddAnnotation={handleAnnotationCreated} 
              onUpdateAnnotation={store.updateAnnotation} 
              onSelectAnnotation={store.setSelectedAnnotationId} 
              onZoomChange={store.setZoom} 
              onPanChange={store.setPan}
            />
          </motion.div>

          {/* Right sidebar - Labels & Annotations */}
          <motion.aside 
            className="w-72 border-l border-border bg-card/80 backdrop-blur-xl flex-shrink-0 flex flex-col"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* AI Auto-Detect Panel */}
            <div className="ai-detect-panel space-y-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    rotate: isDetecting ? 360 : 0,
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: isDetecting ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="h-4 w-4 text-sam-cyan" />
                </motion.div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">AI Detect</span>
                {selectedModel && (
                  <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">
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
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sam-cyan/50 focus:border-sam-cyan/50 disabled:opacity-50 transition-all"
              />

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  className="w-full text-xs h-9 gradient-btn"
                  onClick={handleAutoDetect}
                  disabled={isDetecting || !store.currentImage}
                >
                  {isDetecting ? (
                    <>
                      <Spinner className="w-3.5 h-3.5 mr-1.5" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Auto Detect
                    </>
                  )}
                </Button>
              </motion.div>

              <AnimatePresence>
                {detectError && (
                  <motion.div 
                    className="flex items-start gap-1.5 text-[11px] text-destructive"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{detectError}</span>
                  </motion.div>
                )}
                {detectResult && !detectError && (
                  <motion.p 
                    className="text-[11px] text-accent"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {detectResult}
                  </motion.p>
                )}
              </AnimatePresence>

              {outputImageUrl && !detectError && (
                <motion.div 
                  className="space-y-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Backend Output</span>
                    </div>
                    <button
                      onClick={() => setShowOutputDialog(true)}
                      className="text-[10px] text-sam-cyan hover:underline cursor-pointer"
                    >
                      View full size
                    </button>
                  </div>
                  <motion.button
                    onClick={() => setShowOutputDialog(true)}
                    className="w-full rounded-xl overflow-hidden border border-border hover:border-sam-cyan/50 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={outputImageUrl}
                      alt="Detection output"
                      className="w-full h-auto object-contain bg-background/50"
                    />
                  </motion.button>
                </motion.div>
              )}
            </div>

            <Dialog open={showOutputDialog} onOpenChange={setShowOutputDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-card border-border">
                <DialogTitle className="sr-only">Detection Output</DialogTitle>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sam-cyan" />
                    <span className="text-sm font-semibold text-foreground">Detection Output</span>
                    {detectResult && (
                      <span className="text-xs text-accent ml-2">{detectResult}</span>
                    )}
                  </div>
                </div>
                <div className="overflow-auto max-h-[calc(90vh-4rem)] bg-background/80 flex items-center justify-center p-4">
                  {outputImageUrl && (
                    <img
                      src={outputImageUrl}
                      alt="Detection output - full size"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Tabs defaultValue="labels" className="flex flex-col h-full">
              <TabsList className="grid grid-cols-3 m-2 bg-secondary/50">
                <TabsTrigger value="labels" className="text-xs data-[state=active]:bg-sam-cyan/20 data-[state=active]:text-sam-cyan">
                  <Tags className="h-3.5 w-3.5 mr-1.5"/>
                  Labels
                </TabsTrigger>
                <TabsTrigger value="annotations" className="text-xs data-[state=active]:bg-sam-cyan/20 data-[state=active]:text-sam-cyan">
                  <Layers className="h-3.5 w-3.5 mr-1.5"/>
                  Annotations
                </TabsTrigger>
                <TabsTrigger value="assets" className="text-xs data-[state=active]:bg-sam-cyan/20 data-[state=active]:text-sam-cyan">
                  <Database className="h-3.5 w-3.5 mr-1.5"/>
                  Dataset
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="labels" className="flex-1 m-0 overflow-hidden">
                <LabelManager 
                  labels={store.labels} 
                  selectedLabelId={store.selectedLabelId} 
                  labelCounts={labelCounts} 
                  onSelectLabel={store.setSelectedLabelId} 
                  onAddLabel={store.addLabel} 
                  onUpdateLabel={store.updateLabel} 
                  onDeleteLabel={store.deleteLabel}
                />
              </TabsContent>
              
              <TabsContent value="annotations" className="flex-1 m-0 overflow-hidden flex flex-col gap-2 p-2">
                <div className="flex-1 overflow-hidden">
                  <AnnotationList 
                    annotations={store.currentImage?.annotations || []} 
                    labels={store.labels} 
                    selectedAnnotationId={store.selectedAnnotationId} 
                    onSelectAnnotation={store.setSelectedAnnotationId} 
                    onDeleteAnnotation={store.deleteAnnotation}
                  />
                </div>
              </TabsContent>

              <TabsContent value="assets" className="flex-1 m-0 overflow-hidden">
                <AssetsViewer />
              </TabsContent>
            </Tabs>
          </motion.aside>
        </div>

        {/* Status bar */}
        <motion.footer 
          className="h-8 border-t border-border px-4 flex items-center text-xs text-muted-foreground bg-card/80 backdrop-blur-xl z-20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <span className="flex items-center gap-1.5 flex-wrap">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">S</kbd> SAM{' '}
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">B</kbd> Box{' '}
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">P</kbd> Polygon{' '}
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">V</kbd> Select
          </span>
          <div className="flex-1"/>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sam-cyan/10 border border-sam-cyan/30 text-sam-cyan">→</kbd>
            Navigate images
          </span>
        </motion.footer>

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
      </div>
    );
}
