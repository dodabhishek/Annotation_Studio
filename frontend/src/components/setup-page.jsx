import { useState, useCallback, useRef } from 'react';
import { Upload, FolderOpen, X, ArrowRight, Sparkles, Box, Scan, ScanText, Brain, Images, Video, Cpu, Check, ImageIcon, Lock, Database, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AssetsViewer } from '@/components/assets-viewer';

const AI_MODELS = [
  {
    id: 'grounding-dino',
    name: 'Grounding DINO',
    category: 'Object Detection',
    icon: Box,
    color: '#3b82f6',
    description: 'Text-prompt based detection. Type what you want to find — "person", "helmet", "truck" — and get instant bounding boxes.',
    tags: ['Zero-shot', 'Open vocabulary', 'No retraining'],
    bestFor: 'Auto bounding boxes from text prompts',
    recommended: true,
  },
  {
    id: 'sam2',
    name: 'SAM 2',
    category: 'Segmentation',
    icon: Scan,
    color: '#8b5cf6',
    description: 'Click any object to get an instant mask. Industry-standard interactive segmentation with polygon generation.',
    tags: ['Instance segmentation', 'Click-to-mask', 'Polygons'],
    bestFor: 'Interactive polygon & mask annotation',
    recommended: false,
  },
  {
    id: 'mobilesam',
    name: 'MobileSAM',
    category: 'Lightweight Segmentation',
    icon: Cpu,
    color: '#06b6d4',
    description: 'Faster, lighter version of SAM optimized for browser inference and real-time annotation with lower GPU cost.',
    tags: ['Browser-ready', 'Real-time', 'Low GPU'],
    bestFor: 'Fast segmentation when speed matters',
    comingSoon: true,
  },
  {
    id: 'paddleocr',
    name: 'PaddleOCR',
    category: 'OCR & Documents',
    icon: ScanText,
    color: '#f59e0b',
    description: 'Auto-extract text regions, OCR labels, and table structures from invoices, KYC documents, and receipts.',
    tags: ['Text extraction', 'Tables', 'Documents'],
    bestFor: 'Invoice, receipt & document annotation',
    comingSoon: true,
  },
  {
    id: 'florence2',
    name: 'Florence-2',
    category: 'Vision-Language',
    icon: Brain,
    color: '#ec4899',
    description: 'Multi-modal model for captioning, dense region description, detection, OCR, and segmentation in one.',
    tags: ['Captioning', 'Multi-task', 'GenAI'],
    bestFor: 'Natural language annotation — "label everything"',
    comingSoon: true,
  },
  {
    id: 'clip',
    name: 'CLIP',
    category: 'Image Embedding',
    icon: Images,
    color: '#10b981',
    description: 'Group similar images, detect duplicates, and enable smart dataset clustering for active learning workflows.',
    tags: ['Similarity', 'Clustering', 'Active learning'],
    bestFor: 'Dataset organization & workflow optimization',
    comingSoon: true,
  },
  {
    id: 'bytetrack',
    name: 'ByteTrack / DeepSORT',
    category: 'Video Tracking',
    icon: Video,
    color: '#f97316',
    description: 'Annotate one frame, propagate labels across all frames. Multi-object tracking for massive productivity gains.',
    tags: ['Multi-object', 'Frame propagation', 'Video'],
    bestFor: 'Video annotation with label tracking',
    comingSoon: true,
  },
];

export function SetupPage({ onContinue }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState('grounding-dino');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('annotate'); // 'annotate' | 'assets'
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const withPreviews = imageFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setUploadedFiles((prev) => [...prev, ...withPreviews]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileSelect = useCallback((e) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((id) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleContinue = () => {
    if (uploadedFiles.length === 0) return;
    onContinue({
      files: uploadedFiles.map((f) => f.file),
      model: selectedModel,
    });
  };

  const canContinue = uploadedFiles.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Navigation */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-card shrink-0 gap-10">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-sparkle-pulse">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-particle" />
            <span className="absolute -bottom-0.5 -left-1 w-1.5 h-1.5 bg-blue-accent rounded-full animate-particle-delay-1" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-lg tracking-tight">Annotation Studio</span>
          </div>
        </div>

        <div className="flex p-1 bg-secondary/80 rounded-lg">
          <button
            onClick={() => setActiveTab('annotate')}
            className={cn(
              "px-5 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all", 
              activeTab === 'annotate' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Tags className="h-4 w-4" /> Setup Annotation
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={cn(
              "px-5 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all", 
              activeTab === 'assets' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Database className="h-4 w-4" /> Assets
          </button>
        </div>
      </header>

      {activeTab === 'assets' ? (
        <div className="flex-1 overflow-hidden p-6 bg-muted/10">
          <div className="h-full border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <AssetsViewer />
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Step 1: Upload */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Upload Images</h2>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or browse to add your dataset images
                </p>
              </div>
            </div>

            <div
              className={cn(
                'relative border-2 border-dashed rounded-2xl transition-all duration-200',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/40 hover:bg-secondary/30',
                uploadedFiles.length === 0 ? 'py-16' : 'py-6',
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
            >
              {uploadedFiles.length === 0 ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Drop images here
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    or click to browse files — JPG, PNG, WebP, GIF
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="default" size="lg">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="px-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {uploadedFiles.length} image{uploadedFiles.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Add More
                    </Button>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted border border-border"
                      >
                        <img
                          src={f.preview}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(f.id)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </section>

          {/* Step 2: Choose AI Model */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choose AI Model</h2>
                <p className="text-sm text-muted-foreground">
                  Select an AI-assisted annotation method for your workflow
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_MODELS.map((model) => {
                const Icon = model.icon;
                const isSelected = selectedModel === model.id;
                const disabled = !!model.comingSoon;

                return (
                  <button
                    key={model.id}
                    onClick={() => !disabled && setSelectedModel(model.id)}
                    disabled={disabled}
                    className={cn(
                      'relative text-left p-5 rounded-xl border-2 transition-all duration-200 group',
                      disabled
                        ? 'border-border opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                          : 'border-border hover:border-primary/30 hover:bg-secondary/30',
                    )}
                  >
                    {isSelected && !disabled && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}

                    {disabled && (
                      <Badge
                        variant="outline"
                        className="absolute top-3 right-3 text-[10px] px-2 py-0.5 border-muted-foreground/30 text-muted-foreground"
                      >
                        <Lock className="h-2.5 w-2.5 mr-1" />
                        Coming Soon
                      </Badge>
                    )}

                    {model.recommended && !disabled && (
                      <Badge
                        variant="default"
                        className="absolute top-3 right-3 text-[10px] px-2 py-0.5"
                        style={{ display: isSelected ? 'none' : undefined }}
                      >
                        Recommended
                      </Badge>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200',
                          disabled
                            ? 'grayscale'
                            : isSelected ? 'scale-110' : 'group-hover:scale-105',
                        )}
                        style={{ backgroundColor: model.color + '20' }}
                      >
                        <Icon className="h-5 w-5" style={{ color: model.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("font-semibold text-sm", disabled ? "text-muted-foreground" : "text-foreground")}>
                            {model.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">
                            {model.category}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                          {model.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {model.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="mt-2 text-[11px] text-muted-foreground/70 italic">
                          Best for: {model.bestFor}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </ScrollArea>

      {/* Sticky footer */}
      <footer className="border-t border-border bg-card px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {uploadedFiles.length > 0 ? (
              <span>
                <strong className="text-foreground">{uploadedFiles.length}</strong> image{uploadedFiles.length !== 1 ? 's' : ''} ready
                {selectedModel && (
                  <>
                    {' '}&middot;{' '}
                    <strong className="text-foreground">
                      {AI_MODELS.find((m) => m.id === selectedModel)?.name}
                    </strong>
                  </>
                )}
              </span>
            ) : (
              <span>Upload at least one image to continue</span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
            className="px-8"
          >
            Continue to Annotate
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
      </>
      )}
    </div>
  );
}
