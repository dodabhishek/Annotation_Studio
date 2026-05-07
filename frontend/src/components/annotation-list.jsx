import { Eye, EyeOff, Trash2, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AnnotationList({
  annotations,
  selectedId,
  getClassById,
  showConfidence,
  onSelect,
  onDelete,
  onUpdate,
}) {
  if (annotations.length === 0) {
    return (
      <div className="w-[240px] shrink-0 bg-card border-l border-border flex flex-col">
        <div className="px-3 py-2.5 border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Annotations
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-muted-foreground/40 text-3xl mb-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" strokeDasharray="3 3" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground/50">
              No annotations yet.
              <br />
              Select the bbox tool and draw on the image.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[240px] shrink-0 bg-card border-l border-border flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Annotations
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
          {annotations.length}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {annotations.map((ann) => {
            const cls = getClassById(ann.classId);
            const isSelected = selectedId === ann.id;

            return (
              <div
                key={ann.id}
                onClick={() => onSelect(ann.id)}
                className={`
                  flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all group
                  ${isSelected
                    ? 'bg-secondary border border-border shadow-sm'
                    : 'hover:bg-secondary/60 border border-transparent'
                  }
                `}
              >
                {isSelected && (
                  <ChevronRight size={12} className="text-primary shrink-0 -ml-1" />
                )}

                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: cls?.color || '#888' }}
                />

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">
                    {cls?.name || 'Unknown'}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 font-mono">
                    {Math.round(ann.width)}x{Math.round(ann.height)}
                    {showConfidence && ann.confidence != null && (
                      <span className="ml-1.5 text-primary/70">
                        {(ann.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(ann.id, { visible: !ann.visible });
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-0.5"
                >
                  {ann.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(ann.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
