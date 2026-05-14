import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FolderOpen, X, ArrowRight, Sparkles, Box, Scan, ScanText, 
  Brain, Images, Video, Cpu, Check, ImageIcon, Lock, Database, Tags, 
  Zap, LogOut, Layers, MousePointer2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AssetsViewer } from '@/components/assets-viewer';

export const AI_MODELS = [
  {
    id: 'grounding-dino',
    name: 'Grounding DINO',
    category: 'Object Detection',
    icon: Box,
    color: '#22d3ee',
    description: 'Text-prompt based detection. Type what you want to find and get instant bounding boxes.',
    tags: ['Zero-shot', 'Open vocabulary', 'No retraining'],
    bestFor: 'Auto bounding boxes from text prompts',
    recommended: true,
  },
  {
    id: 'sam2',
    name: 'SAM 2',
    category: 'Segmentation',
    icon: Scan,
    color: '#a78bfa',
    description: 'Click any object to get an instant mask. Industry-standard interactive segmentation.',
    tags: ['Instance segmentation', 'Click-to-mask', 'Polygons'],
    bestFor: 'Interactive polygon & mask annotation',
    recommended: false,
  },
  {
    id: 'mobilesam',
    name: 'MobileSAM',
    category: 'Lightweight Segmentation',
    icon: Cpu,
    color: '#14b8a6',
    description: 'Faster, lighter version of SAM optimized for browser inference and real-time annotation.',
    tags: ['Browser-ready', 'Real-time', 'Low GPU'],
    bestFor: 'Fast segmentation when speed matters',
    comingSoon: true,
  },
  {
    id: 'paddleocr',
    name: 'PaddleOCR',
    category: 'OCR & Documents',
    icon: ScanText,
    color: '#fbbf24',
    description: 'Auto-extract text regions, OCR labels, and table structures from documents.',
    tags: ['Text extraction', 'Tables', 'Documents'],
    bestFor: 'Invoice, receipt & document annotation',
    comingSoon: true,
  },
  {
    id: 'florence2',
    name: 'Florence-2',
    category: 'Vision-Language',
    icon: Brain,
    color: '#f472b6',
    description: 'Multi-modal model for captioning, detection, OCR, and segmentation in one.',
    tags: ['Captioning', 'Multi-task', 'GenAI'],
    bestFor: 'Natural language annotation',
    comingSoon: true,
  },
  {
    id: 'clip',
    name: 'CLIP',
    category: 'Image Embedding',
    icon: Images,
    color: '#34d399',
    description: 'Group similar images, detect duplicates, and enable smart dataset clustering.',
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
    description: 'Annotate one frame, propagate labels across all frames. Multi-object tracking.',
    tags: ['Multi-object', 'Frame propagation', 'Video'],
    bestFor: 'Video annotation with label tracking',
    comingSoon: true,
  },
];

// Animated Image Thumbnail
function ImageThumbnail({ file, index, onRemove }) {
  return (
    <motion.div
      className="relative group aspect-square rounded-xl overflow-hidden bg-secondary border border-border"
      initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
      }}
      whileHover={{ 
        scale: 1.05, 
        y: -4,
        boxShadow: '0 12px 40px rgba(34, 211, 238, 0.2)',
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <img
        src={file.preview}
        alt={file.name}
        className="w-full h-full object-cover"
      />
      <motion.button
        onClick={() => onRemove(file.id)}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 border border-border text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="h-3 w-3" />
      </motion.button>
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// Model Card Component
function ModelCard({ model, isSelected, onSelect, disabled }) {
  const Icon = model.icon;
  
  return (
    <motion.button
      onClick={() => !disabled && onSelect(model.id)}
      disabled={disabled}
      className={cn('model-card relative', isSelected && !disabled && 'selected')}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={isSelected && !disabled ? { 
        borderColor: model.color, 
        boxShadow: `0 0 0 1px ${model.color}, 0 12px 40px ${model.color}25` 
      } : {}}
    >
      {/* Selected checkmark */}
      <AnimatePresence>
        {isSelected && !disabled && (
          <motion.div
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: model.color }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Check className="h-4 w-4 text-background" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coming soon badge */}
      {disabled && (
        <Badge
          variant="outline"
          className="absolute top-3 right-3 text-[10px] px-2 py-0.5 border-muted-foreground/30 text-muted-foreground bg-secondary/50"
        >
          <Lock className="h-2.5 w-2.5 mr-1" />
          Coming Soon
        </Badge>
      )}

      {/* Recommended badge */}
      {model.recommended && !disabled && !isSelected && (
        <motion.span
          className="absolute top-3 right-3 text-[10px] px-3 py-1 rounded-full font-semibold text-background"
          style={{ background: `linear-gradient(135deg, ${model.color} 0%, #14b8a6 100%)` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          Recommended
        </motion.span>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${model.color}15`,
            border: `1px solid ${model.color}30`,
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="h-6 w-6" style={{ color: model.color }} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-semibold text-sm', disabled ? 'text-muted-foreground' : 'text-foreground')}>
              {model.name}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">
              {model.category}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {model.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {model.tags.map((tag) => (
              <motion.span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${model.color}10`,
                  borderColor: `${model.color}30`,
                  color: disabled ? undefined : model.color,
                }}
                whileHover={{ scale: 1.05 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground/60 italic">
            Best for: {model.bestFor}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export function SetupPage({ onContinue, user, onLogout }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState('grounding-dino');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('annotate');
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
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sam-cyan/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sam-purple/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header 
        className="app-header h-16 flex items-center px-6 shrink-0 gap-8 z-20"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="brand-logo"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div>
            <span className="font-bold text-foreground text-lg tracking-tight">
              Annotation<span className="gradient-text"> Studio</span>
            </span>
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="nav-pill-group">
          {[
            { id: 'annotate', label: 'Setup Annotation', icon: Tags },
            { id: 'assets', label: 'Assets', icon: Database },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn('nav-pill-btn', activeTab === tab.id && 'active')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        <div className="flex-1" />

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-4 mr-4 border-r border-border pr-4">
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

        {/* CTA */}
        <AnimatePresence>
          {canContinue && (
            <motion.button
              onClick={handleContinue}
              className="gradient-btn flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="h-4 w-4" />
              Start Annotating
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assets' ? (
          <motion.div 
            key="assets"
            className="flex-1 overflow-hidden p-6 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="h-full border border-border rounded-2xl bg-card overflow-hidden shadow-lg">
              <AssetsViewer />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="annotate"
            className="flex-1 overflow-hidden z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ScrollArea className="h-full">
              <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Step 1: Upload */}
                <motion.section 
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="step-badge">1</div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Upload Images</h2>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or browse to add your dataset images
                      </p>
                    </div>
                  </div>

                  <motion.div
                    className={cn(
                      'upload-zone',
                      isDragging && 'dragging',
                      uploadedFiles.length === 0 ? 'py-16' : 'py-6',
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
                  >
                    {uploadedFiles.length === 0 ? (
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <motion.div 
                          className="w-20 h-20 rounded-2xl bg-sam-cyan/10 border border-sam-cyan/20 flex items-center justify-center mb-4"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          animate={{ 
                            y: [0, -8, 0],
                            boxShadow: [
                              '0 4px 20px rgba(34, 211, 238, 0.2)',
                              '0 8px 32px rgba(34, 211, 238, 0.3)',
                              '0 4px 20px rgba(34, 211, 238, 0.2)',
                            ]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Upload className="h-8 w-8 text-sam-cyan" />
                        </motion.div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          Drop images here
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          or click to browse files — JPG, PNG, WebP, GIF
                        </p>
                        <motion.button
                          onClick={() => fileInputRef.current?.click()}
                          className="gradient-btn flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FolderOpen className="h-4 w-4" />
                          Browse Files
                        </motion.button>
                      </motion.div>
                    ) : (
                      <div className="px-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {uploadedFiles.length} image{uploadedFiles.length !== 1 ? 's' : ''} selected
                            </span>
                          </div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="border-sam-cyan/30 hover:border-sam-cyan/50 hover:bg-sam-cyan/5"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add More
                            </Button>
                          </motion.div>
                        </div>

                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          <AnimatePresence>
                            {uploadedFiles.map((f, index) => (
                              <ImageThumbnail 
                                key={f.id} 
                                file={f} 
                                index={index}
                                onRemove={removeFile} 
                              />
                            ))}
                          </AnimatePresence>
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
                  </motion.div>
                </motion.section>

                {/* Step 2: Choose AI Model */}
                <motion.section 
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="step-badge">2</div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Choose AI Model</h2>
                      <p className="text-sm text-muted-foreground">
                        Select an AI-assisted annotation method for your workflow
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AI_MODELS.map((model, index) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <ModelCard
                          model={model}
                          isSelected={selectedModel === model.id}
                          onSelect={setSelectedModel}
                          disabled={!!model.comingSoon}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer 
        className="border-t border-border bg-card/80 backdrop-blur-xl px-6 py-4 shrink-0 z-20"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
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

          <motion.button
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              'gradient-btn flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all',
              !canContinue && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
            whileHover={canContinue ? { scale: 1.05 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
          >
            Continue to Annotate
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.footer>
    </div>
  );
}
