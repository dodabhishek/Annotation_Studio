import { motion } from 'framer-motion';
import { MousePointer2, Square, Pentagon, Spline, Circle, Hand, ZoomIn, ZoomOut, RotateCcw, Download, Trash2, ChevronLeft, ChevronRight, Package, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';

const tools = [
    {
        type: 'select',
        icon: MousePointer2,
        label: 'Select',
        shortLabel: 'Select',
        shortcut: 'V',
        suggestions: ['Click an annotation to select it.', 'Drag handles to adjust boxes and shapes.'],
    },
    {
        type: 'sam-point',
        icon: Wand2,
        label: 'SAM Point',
        shortLabel: 'SAM',
        shortcut: 'S',
        suggestions: ['Click on an object to run segment-anything.', 'Best on clear object boundaries.'],
    },
    {
        type: 'bbox',
        icon: Square,
        label: 'Bounding Box',
        shortLabel: 'Box',
        shortcut: 'B',
        suggestions: ['Click and drag to draw a rectangle.', 'Release to finish the box.'],
    },
    {
        type: 'polygon',
        icon: Pentagon,
        label: 'Polygon',
        shortLabel: 'Polygon',
        shortcut: 'P',
        suggestions: ['Click vertices around the object.', 'Double-click or Enter to close; Esc to cancel.'],
    },
    {
        type: 'polyline',
        icon: Spline,
        label: 'Polyline',
        shortLabel: 'Line',
        shortcut: 'L',
        suggestions: ['Click points along a line or curve.', 'Double-click or Enter to finish.'],
    },
    {
        type: 'point',
        icon: Circle,
        label: 'Point',
        shortLabel: 'Point',
        shortcut: 'K',
        suggestions: ['Single click places a keypoint marker.', 'Use for landmarks or sparse labels.'],
    },
    {
        type: 'pan',
        icon: Hand,
        label: 'Pan',
        shortLabel: 'Pan',
        shortcut: 'H',
        suggestions: ['Drag the canvas to move when zoomed in.', 'Or hold the middle mouse button.'],
    },
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
        <TooltipProvider delayDuration={200}>
            <div className="toolbar-dark flex items-center justify-between min-h-[52px] h-auto py-1.5 px-3 gap-2">
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
                        <TooltipContent className="flex items-center gap-2 bg-card border-border">
                            <span>Previous image</span>
                            <Kbd>←</Kbd>
                            <span className="text-muted-foreground text-[10px]">or</span>
                            <Kbd>A</Kbd>
                        </TooltipContent>
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
                        <TooltipContent className="flex items-center gap-2 bg-card border-border">
                            <span>Next image</span>
                            <Kbd>→</Kbd>
                            <span className="text-muted-foreground text-[10px]">or</span>
                            <Kbd>D</Kbd>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2 opacity-30" />

                {/* Center: Tool Buttons */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-1 rounded-xl p-1 bg-sam-cyan/5 border border-sam-cyan/15 max-w-full"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {tools.map((tool, index) => {
                        const isActive = selectedTool === tool.type;
                        const Icon = tool.icon;
                        return (
                            <Tooltip key={tool.type} delayDuration={150}>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        id={`tool-${tool.type}`}
                                        type="button"
                                        onClick={() => onSelectTool(tool.type)}
                                        className={cn(
                                            'toolbar-tool-btn relative z-0 flex flex-col items-center justify-center gap-0.5',
                                            'min-w-[3.25rem] min-h-[2.875rem] px-1 py-1 rounded-[10px]',
                                            isActive && 'active',
                                        )}
                                        aria-label={`${tool.label}, keyboard ${tool.shortcut}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{
                                            scale: 1.06,
                                            transition: { duration: 0.15 },
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 rounded-[10px]"
                                                layoutId="activeToolHighlight"
                                                style={{
                                                    background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
                                                    zIndex: 0,
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <motion.span
                                            className="relative z-[1] flex items-center justify-center"
                                            animate={
                                                isActive
                                                    ? {
                                                          rotate: [0, 5, -5, 0],
                                                      }
                                                    : {}
                                            }
                                            transition={{
                                                duration: 0.5,
                                                repeat: isActive ? Infinity : 0,
                                                repeatDelay: 2,
                                            }}
                                        >
                                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                                        </motion.span>
                                        <span
                                            className={cn(
                                                'relative z-[1] text-[8px] font-semibold leading-tight text-center uppercase tracking-wide max-w-[3.5rem] line-clamp-2',
                                                isActive ? 'text-white' : 'text-white/75',
                                            )}
                                        >
                                            {tool.shortLabel}
                                        </span>
                                        <Kbd
                                            className={cn(
                                                'relative z-[1] !h-3.5 !min-w-[1.125rem] !px-1 !text-[9px] !leading-none border',
                                                isActive
                                                    ? '!bg-white/20 !text-white !border-white/35'
                                                    : '!bg-black/20 !text-white/80 !border-white/10',
                                            )}
                                        >
                                            {tool.shortcut}
                                        </Kbd>
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    sideOffset={6}
                                    className="max-w-[260px] flex-col gap-2 border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-md"
                                >
                                    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
                                        <span className="font-semibold text-sm">{tool.label}</span>
                                        <Kbd className="text-[10px]">{tool.shortcut}</Kbd>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Press <Kbd className="mx-0.5">{tool.shortcut}</Kbd> to activate this tool.
                                    </p>
                                    <div>
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Suggestions
                                        </p>
                                        <ul className="list-disc space-y-1 pl-3.5 text-[11px] leading-snug text-muted-foreground">
                                            {tool.suggestions.map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>
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
                        <TooltipContent className="flex flex-wrap items-center gap-1.5 bg-card border-border">
                            <span>Zoom out</span>
                            <Kbd>-</Kbd>
                        </TooltipContent>
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
                        <TooltipContent className="flex flex-wrap items-center gap-1.5 bg-card border-border">
                            <span>Zoom in</span>
                            <Kbd>+</Kbd>
                            <span className="text-muted-foreground text-[10px]">or</span>
                            <Kbd>=</Kbd>
                        </TooltipContent>
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
                        <TooltipContent className="flex items-center gap-2 bg-card border-border">
                            <span>Reset view</span>
                            <Kbd>0</Kbd>
                        </TooltipContent>
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
