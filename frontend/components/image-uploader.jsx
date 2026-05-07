import { useCallback, useRef, useState } from 'react';
import { Upload, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export function ImageUploader({ onUpload, images, onRemoveImage, currentImageIndex, onSelectImage, }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            onUpload(files);
        }
    }, [onUpload]);
    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            onUpload(files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onUpload]);
    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    if (images.length === 0) {
        return (<div className="flex flex-col items-center justify-center h-full p-4">
        <div className={cn("w-full border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center", isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-7 w-7 text-primary"/>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Upload Images
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            Drag and drop images here, or click to browse
          </p>
          <Button onClick={openFileDialog} variant="default" className="w-full max-w-[180px]">
            <FolderOpen className="mr-2 h-4 w-4"/>
            Browse Files
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden"/>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Supports JPG, PNG, WebP, and GIF formats
        </p>
      </div>);
    }
    return (<div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          Images ({images.length})
        </span>
        <Button size="sm" variant="ghost" onClick={openFileDialog}>
          <Upload className="h-4 w-4"/>
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden"/>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {isDragging && (<div className="border-2 border-dashed border-primary rounded-lg p-4 text-center text-sm text-primary">
            Drop images here
          </div>)}
        
        {images.map((image, index) => (<div key={image.id} className={cn("group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors", index === currentImageIndex
                ? "bg-primary/10 border border-primary/30"
                : "hover:bg-secondary")} onClick={() => onSelectImage(index)}>
            <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
              <img src={image.url} alt={image.name} className="h-full w-full object-cover"/>
              {image.labeled && (<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"/>
                </div>)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {image.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {image.annotations.length} annotation{image.annotations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(image.id);
            }}>
              <X className="h-3 w-3"/>
            </Button>
          </div>))}
      </div>
    </div>);
}
