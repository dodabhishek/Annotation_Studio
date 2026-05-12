import { useState, useCallback, useRef } from 'react';
import { Upload, FolderOpen, X, ArrowRight, Sparkles, Box, Scan, ScanText, Brain, Images, Video, Cpu, Check, ImageIcon, Lock, Database, Tags, Zap } from 'lucide-react';
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

import { LogOut } from 'lucide-react';

export function SetupPage({ onContinue, user, onLogout }) {
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
    <div className="h-screen flex flex-col bg-background hero-glow">

      {/* ── Header Navigation ── */}
      <header className="app-header h-16 flex items-center px-6 shrink-0 gap-8 z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="brand-logo animate-sparkle-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              Annotation<span className="gradient-text"> Studio</span>
            </span>
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="nav-pill-group">
          <button
            id="tab-setup"
            onClick={() => setActiveTab('annotate')}
            className={cn('nav-pill-btn', activeTab === 'annotate' && 'active')}
          >
            <Tags className="h-3.5 w-3.5" />
            Setup Annotation
          </button>
          <button
            id="tab-assets"
            onClick={() => setActiveTab('assets')}
            className={cn('nav-pill-btn', activeTab === 'assets' && 'active')}
          >
            <Database className="h-3.5 w-3.5" />
            Assets
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile / Logout */}
        {user && (
          <div className="flex items-center gap-4 mr-4 border-r border-border pr-4">
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-blue-100">{user.name || user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* CTA */}
        {canContinue && (
          <button
            id="header-continue-btn"
            onClick={handleContinue}
            className="gradient-btn flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
          >
            <Zap className="h-4 w-4" />
            Start Annotating
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </header>

      {/* ── Tab Content ── */}
      {activeTab === 'assets' ? (
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full border border-border rounded-2xl bg-card overflow-hidden shadow-lg">
            <AssetsViewer />
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 relative z-0">
            <div className="max-w-5xl mx-auto px-6 py-10">

              {/* ── Step 1: Upload ── */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="step-badge">1</div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Upload Images</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or browse to add your dataset images
                    </p>
                  </div>
                </div>

                <div
                  id="upload-zone"
                  className={cn(
                    'upload-zone',
                    isDragging && 'dragging',
                    uploadedFiles.length === 0 ? 'py-16' : 'py-6',
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                >
                  {uploadedFiles.length === 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                        <Upload className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        Drop images here
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        or click to browse files — JPG, PNG, WebP, GIF
                      </p>
                      <button
                        id="browse-files-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="gradient-btn flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Browse Files
                      </button>
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
                          className="border-border/50 hover:border-primary/50"
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

              {/* ── Step 2: Choose AI Model ── */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="step-badge">2</div>
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
                        id={`model-card-${model.id}`}
                        onClick={() => !disabled && setSelectedModel(model.id)}
                        disabled={disabled}
                        className={cn('model-card', isSelected && !disabled && 'selected')}
                        style={isSelected && !disabled ? { borderColor: model.color, boxShadow: `0 0 0 1px ${model.color}, 0 8px 32px ${model.color}28` } : {}}
                      >
                        {/* Selected checkmark */}
                        {isSelected && !disabled && (
                          <div
                            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: model.color }}
                          >
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}

                        {/* Coming soon badge */}
                        {disabled && (
                          <Badge
                            variant="outline"
                            className="absolute top-3 right-3 text-[10px] px-2 py-0.5 border-muted-foreground/30 text-muted-foreground"
                          >
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Coming Soon
                          </Badge>
                        )}

                        {/* Recommended badge */}
                        {model.recommended && !disabled && !isSelected && (
                          <span
                            className="absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}
                          >
                            Recommended
                          </span>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200"
                            style={{
                              backgroundColor: model.color + '18',
                              border: `1px solid ${model.color}30`,
                              transform: isSelected ? 'scale(1.1)' : undefined,
                            }}
                          >
                            <Icon className="h-5 w-5" style={{ color: model.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn('font-semibold text-sm', disabled ? 'text-muted-foreground' : 'text-foreground')}>
                                {model.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">
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
                                  className="text-[10px] px-2 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: model.color + '12',
                                    borderColor: model.color + '30',
                                    color: disabled ? undefined : model.color,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <p className="mt-2 text-[11px] text-muted-foreground/60 italic">
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

          {/* ── Sticky Footer ── */}
          <footer className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-4 shrink-0">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {uploadedFiles.length > 0 ? (
                  <span>
                    <strong className="text-foreground">{uploadedFiles.length}</strong> image{uploadedFiles.length !== 1 ? 's' : ''} ready
                    {selectedModel && (
                      <>
                        {' '}·{' '}
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

              <button
                id="footer-continue-btn"
                onClick={handleContinue}
                disabled={!canContinue}
                className={cn(
                  'gradient-btn flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold transition-all',
                  !canContinue && 'opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                Continue to Annotate
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
