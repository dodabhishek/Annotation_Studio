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
            <div
                className="toolbar-dark flex items-center justify-between h-12 px-3"
            >
                {/* ── Left: Image Navigation ── */}
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onPrev}
                                disabled={!canGoPrev}
                                className="h-8 w-8 p-0 hover:bg-secondary/80"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Previous Image</TooltipContent>
                    </Tooltip>

                    <span className="text-xs text-muted-foreground min-w-[72px] text-center font-mono tabular-nums">
                        {totalImages > 0 ? `${currentIndex + 1} / ${totalImages}` : 'No images'}
                    </span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onNext}
                                disabled={!canGoNext}
                                className="h-8 w-8 p-0 hover:bg-secondary/80"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Next Image</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-2 opacity-30" />

                {/* ── Center: Tool Buttons ── */}
                <div
                    className="flex items-center gap-0.5 rounded-xl p-1"
                    style={{
                        background: 'rgba(56,189,248,0.08)',
                        border: '1px solid rgba(56,189,248,0.2)',
                    }}
                >
                    {tools.map((tool) => {
                        const isActive = selectedTool === tool.type;
                        return (
                            <Tooltip key={tool.type}>
                                <TooltipTrigger asChild>
                                    <button
                                        id={`tool-${tool.type}`}
                                        onClick={() => onSelectTool(tool.type)}
                                        className={cn(
                                            'toolbar-tool-btn tool-button-sparkle',
                                            isActive && 'tool-button-active active',
                                        )}
                                        aria-label={tool.label}
                                    >
                                        <tool.icon className={cn('h-4 w-4', isActive && 'tool-icon-glow')} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="flex items-center gap-2">
                                    <span>{tool.label}</span>
                                    <Kbd>{tool.shortcut}</Kbd>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>

                <Separator orientation="vertical" className="h-6 mx-2 opacity-30" />

                {/* ── Right: Actions ── */}
                <div className="flex items-center gap-1">
                    {/* Save */}
                    {saveButton}

                    <Separator orientation="vertical" className="h-4 mx-1 opacity-30" />

                    {/* Zoom out */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={onZoomOut} className="h-8 w-8 p-0">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>

                    <span
                        className="text-[11px] text-muted-foreground w-10 text-center font-mono tabular-nums"
                        style={{ color: '#38bdf8' }}
                    >
                        {Math.round(zoom * 100)}%
                    </span>

                    {/* Zoom in */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={onZoomIn} className="h-8 w-8 p-0">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>

                    {/* Reset */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={onResetView} className="h-8 w-8 p-0">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset View</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-5 mx-1 opacity-30" />

                    {/* Delete */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDeleteSelected}
                                disabled={!hasSelectedAnnotation}
                                className="h-8 w-8 p-0 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-2">
                            <span>Delete Selected</span>
                            <Kbd>Del</Kbd>
                        </TooltipContent>
                    </Tooltip>

                    {/* Export JSON */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={onExport} className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export Annotations (JSON)</TooltipContent>
                    </Tooltip>

                    {/* Export COCO */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={onExportCOCO} className="h-8 w-8 p-0">
                                <Package className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export as COCO Dataset</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
