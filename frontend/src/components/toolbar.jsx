import { MousePointer2, Square, Pentagon, Spline, Circle, Hand, ZoomIn, ZoomOut, RotateCcw, Download, Trash2, ChevronLeft, ChevronRight, Package, CheckLine, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';
const tools = [
    { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { type: 'bbox', icon: Square, label: 'Bounding Box', shortcut: 'B' },
    { type: 'polygon', icon: Pentagon, label: 'Polygon', shortcut: 'P' },
    { type: 'polyline', icon: Spline, label: 'Polyline', shortcut: 'L' },
    { type: 'point', icon: Circle, label: 'Point', shortcut: 'K' },
    { type: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' }
];
export function Toolbar({ selectedTool, onSelectTool, zoom, onZoomIn, onZoomOut, onResetView, onDeleteSelected, onExport, onExportCOCO, hasSelectedAnnotation, canGoNext, canGoPrev, onNext, onPrev, currentIndex, totalImages, saveButton }) {
    return (<TooltipProvider delayDuration={100}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-card">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onPrev} disabled={!canGoPrev}>
            <ChevronLeft className="h-4 w-4"/>
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {totalImages > 0 ? `${currentIndex + 1} / ${totalImages}` : 'No images'}
          </span>
          
          <Button size="sm" variant="ghost" onClick={onNext} disabled={!canGoNext}>
            <ChevronRight className="h-4 w-4"/>
          </Button>
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {tools.map((tool) => (<Tooltip key={tool.type}>
              <TooltipTrigger asChild>
                <Button size="sm" variant={selectedTool === tool.type ? 'default' : 'ghost'} className={cn("h-8 w-8 p-0 tool-button-sparkle", selectedTool === tool.type && "tool-button-active")} onClick={() => onSelectTool(tool.type)}>
                  <tool.icon className={cn("h-4 w-4", selectedTool === tool.type && "tool-icon-glow")}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="flex items-center gap-2">
                <span>{tool.label}</span>
                <Kbd>{tool.shortcut}</Kbd>
              </TooltipContent>
            </Tooltip>))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 mr-2">
            {saveButton}
            
            <Separator orientation="vertical" className="h-4 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onZoomOut}>
                  <ZoomOut className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onZoomIn}>
                  <ZoomIn className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onResetView}>
                  <RotateCcw className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 ml-2 mr-1"/>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onDeleteSelected} disabled={!hasSelectedAnnotation}>
                <Trash2 className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>Delete Selected</span>
              <Kbd>Del</Kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onExport}>
                <Download className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Annotations (JSON)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onExportCOCO}>
                <Package className="h-4 w-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as COCO Dataset</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>);
}
