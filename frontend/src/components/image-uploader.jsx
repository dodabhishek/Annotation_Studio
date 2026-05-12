import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FolderOpen, ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ImageUploader({ onUpload, images, onRemoveImage, currentImageIndex, onSelectImage }) {
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onUpload]);

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <motion.div 
                    className={cn(
                        "w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center",
                        isDragging
                            ? "border-sam-cyan bg-sam-cyan/5"
                            : "border-border hover:border-sam-cyan/50"
                    )} 
                    onDragOver={handleDragOver} 
                    onDragLeave={handleDragLeave} 
                    onDrop={handleDrop}
                    animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                >
                    <motion.div 
                        className="w-16 h-16 rounded-2xl bg-sam-cyan/10 border border-sam-cyan/20 flex items-center justify-center mb-4"
                        animate={{ 
                            y: [0, -6, 0],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Upload className="h-7 w-7 text-sam-cyan"/>
                    </motion.div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        Upload Images
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                        Drag and drop images here, or click to browse
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                        <Button onClick={openFileDialog} className="gradient-btn rounded-xl">
                            <FolderOpen className="mr-2 h-4 w-4"/>
                            Browse Files
                        </Button>
                    </motion.div>
                    <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileSelect} 
                        className="hidden"
                    />
                </motion.div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Supports JPG, PNG, WebP, and GIF formats
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-sam-cyan" />
                    <span className="text-sm font-medium text-foreground">
                        Images ({images.length})
                    </span>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button size="sm" variant="ghost" onClick={openFileDialog} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                        <Upload className="h-4 w-4"/>
                    </Button>
                </motion.div>
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileSelect} 
                    className="hidden"
                />
            </div>
            
            <div 
                className="flex-1 overflow-y-auto p-2 space-y-1" 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop}
            >
                <AnimatePresence>
                    {isDragging && (
                        <motion.div 
                            className="border-2 border-dashed border-sam-cyan rounded-xl p-4 text-center text-sm text-sam-cyan bg-sam-cyan/5"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            Drop images here
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <AnimatePresence>
                    {images.map((image, index) => (
                        <motion.div 
                            key={image.id} 
                            className={cn(
                                "group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all",
                                index === currentImageIndex
                                    ? "bg-sam-cyan/10 border border-sam-cyan/30"
                                    : "hover:bg-secondary/50 border border-transparent"
                            )} 
                            onClick={() => onSelectImage(index)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            layout
                        >
                            <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                <img 
                                    src={image.url} 
                                    alt={image.name} 
                                    className="h-full w-full object-cover"
                                />
                                <AnimatePresence>
                                    {image.labeled && (
                                        <motion.div 
                                            className="absolute inset-0 bg-sam-cyan/20 flex items-center justify-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <motion.div 
                                                className="w-5 h-5 rounded-full bg-sam-cyan flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check className="w-3 h-3 text-background" />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {index === currentImageIndex && (
                                    <motion.div 
                                        className="absolute inset-0 border-2 border-sam-cyan rounded-lg"
                                        layoutId="currentImageBorder"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                    {image.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {image.annotations.length} annotation{image.annotations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveImage(image.id);
                                    }}
                                >
                                    <X className="h-3 w-3"/>
                                </Button>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
