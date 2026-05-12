import { motion } from 'framer-motion';
import { MousePointer2, Square, Pentagon, Spline, Circle, Hand, ZoomIn, ZoomOut, RotateCcw, Download, Trash2, ChevronLeft, ChevronRight, Package, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';

const tools = [
    { type: 'select',    icon: MousePointer2, label: 'Select',        shortcut: 'V' },
    { type: 'sam-point', icon: Wand2,         label: 'SAM Point',     shortcut: 'S' },
    { type: 'bbox',      icon: Square,         label: 'Bounding Box',  shortcut: 'B' },
    { type: 'polygon',   icon: Pentagon,       label: 'Polygon',       shortcut: 'P' },
    { type: 'polyline',  icon: Spline,         label: 'Polyline',      shortcut: 'L' },
    { type: 'point',     icon: Circle,         label: 'Point',         shortcut: 'K' },
    { type: 'pan',       icon: Hand,           label: 'Pan',           shortcut: 'H' },
];

export function Toolbar({
    selectedTool, onSelectTool,
    zoom, onZoomIn, onZoomOut, onResetView,
    onDeleteSelected, onExport, onExportCOCO,
    hasSelectedAnnotation,
    canGoNext, canGoPrev, onNext, onPrev,
    currentIndex, totalImages,
    saveButton,
}) {
    return (
        <TooltipProvider delayDuration={100}>
            <div className="toolbar-dark flex items-center justify-between h-12 px-3">
                {/* Left: Image Navigation */}
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onPrev}
                                    disabled={!canGoPrev}
                                    className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Previous Image</TooltipContent>
                    </Tooltip>

                    <span className="text-xs text-muted-foreground min-w-[72px] text-center font-mono tabular-nums">
                        {totalImages > 0 ? `${currentIndex + 1} / ${totalImages}` : 'No images'}
                    </span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onNext}
                                    disabled={!canGoNext}
                                    className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Next Image</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2 opacity-30" />

                {/* Center: Tool Buttons */}
                <motion.div
                    className="flex items-center gap-0.5 rounded-xl p-1 bg-sam-cyan/5 border border-sam-cyan/15"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {tools.map((tool, index) => {
                        const isActive = selectedTool === tool.type;
                        return (
                            <Tooltip key={tool.type}>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        id={`tool-${tool.type}`}
                                        onClick={() => onSelectTool(tool.type)}
                                        className={cn(
                                            'toolbar-tool-btn relative',
                                            isActive && 'active',
                                        )}
                                        aria-label={tool.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ 
                                            scale: 1.15, 
                                            transition: { duration: 0.15 } 
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div
                                            animate={isActive ? {
                                                rotate: [0, 5, -5, 0],
                                            } : {}}
                                            transition={{
                                                duration: 0.5,
                                                repeat: isActive ? Infinity : 0,
                                                repeatDelay: 2,
                                            }}
                                        >
                                            <tool.icon className="h-4 w-4" />
                                        </motion.div>
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 rounded-lg"
                                                layoutId="activeToolHighlight"
                                                style={{
                                                    background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
                                                    zIndex: -1,
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="flex items-center gap-2 bg-card border-border">
                                    <span>{tool.label}</span>
                                    <Kbd>{tool.shortcut}</Kbd>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </motion.div>

                <Separator orientation="vertical" className="h-6 mx-2 opacity-30" />

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    {/* Save */}
                    {saveButton}

                    <Separator orientation="vertical" className="h-4 mx-1 opacity-30" />

                    {/* Zoom out */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="sm" variant="ghost" onClick={onZoomOut} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>

                    <motion.span
                        className="text-[11px] w-10 text-center font-mono tabular-nums text-sam-cyan"
                        key={zoom}
                        initial={{ scale: 1.2, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {Math.round(zoom * 100)}%
                    </motion.span>

                    {/* Zoom in */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="sm" variant="ghost" onClick={onZoomIn} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>

                    {/* Reset */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1, rotate: -180 }} whileTap={{ scale: 0.9 }}>
                                <Button size="sm" variant="ghost" onClick={onResetView} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Reset View</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-5 mx-1 opacity-30" />

                    {/* Delete */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div 
                                whileHover={{ scale: 1.1 }} 
                                whileTap={{ scale: 0.9 }}
                            >
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onDeleteSelected}
                                    disabled={!hasSelectedAnnotation}
                                    className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2">
                            <span>Delete Selected</span>
                            <Kbd>Del</Kbd>
                        </TooltipContent>
                    </Tooltip>

                    {/* Export JSON */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="sm" variant="ghost" onClick={onExport} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Export Annotations (JSON)</TooltipContent>
                    </Tooltip>

                    {/* Export COCO */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button size="sm" variant="ghost" onClick={onExportCOCO} className="h-8 w-8 p-0 hover:bg-sam-cyan/10 rounded-lg">
                                    <Package className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>Export as COCO Dataset</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
