import {
  MousePointer2,
  Square,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { TOOLS, MIN_ZOOM, MAX_ZOOM } from '../lib/constants';

function ToolButton({ icon: Icon, label, shortcut, active, onClick }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150
              ${active
                ? 'bg-primary text-primary-foreground shadow-md tool-button-active'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ActionButton({ icon: Icon, label, shortcut, onClick, destructive }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150
              ${destructive
                ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
          >
            <Icon size={17} strokeWidth={1.8} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Toolbar({
  activeTool,
  setActiveTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onDeleteSelected,
  showConfidence,
  onToggleConfidence,
  hasSelection,
}) {
  return (
    <div className="flex flex-col items-center bg-card border-r border-border py-3 px-1.5 gap-1 w-[52px] shrink-0">
      <ToolButton
        icon={MousePointer2}
        label="Select"
        shortcut="V"
        active={activeTool === TOOLS.SELECT}
        onClick={() => setActiveTool(TOOLS.SELECT)}
      />
      <ToolButton
        icon={Square}
        label="Bounding Box"
        shortcut="B"
        active={activeTool === TOOLS.BBOX}
        onClick={() => setActiveTool(TOOLS.BBOX)}
      />
      <ToolButton
        icon={Hand}
        label="Pan"
        shortcut="H"
        active={activeTool === TOOLS.PAN}
        onClick={() => setActiveTool(TOOLS.PAN)}
      />

      <Separator className="my-2 w-7" />

      <ActionButton icon={ZoomIn} label="Zoom In" shortcut="+" onClick={onZoomIn} />
      <ActionButton icon={ZoomOut} label="Zoom Out" shortcut="-" onClick={onZoomOut} />
      <ActionButton icon={Maximize} label="Fit to View" shortcut="0" onClick={onFitView} />

      <Separator className="my-2 w-7" />

      <ActionButton icon={Undo2} label="Undo" shortcut="⌘Z" onClick={onUndo} />
      <ActionButton icon={Redo2} label="Redo" shortcut="⌘⇧Z" onClick={onRedo} />

      <Separator className="my-2 w-7" />

      <ActionButton
        icon={showConfidence ? Eye : EyeOff}
        label={showConfidence ? 'Hide Confidence' : 'Show Confidence'}
        onClick={onToggleConfidence}
      />

      <div className="flex-1" />

      <ActionButton
        icon={Trash2}
        label="Delete Selected"
        shortcut="Del"
        onClick={onDeleteSelected}
        destructive
      />
    </div>
  );
}
