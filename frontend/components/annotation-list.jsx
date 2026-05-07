import { Square, Pentagon, Spline, Circle, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
const typeIcons = {
    bbox: Square,
    polygon: Pentagon,
    polyline: Spline,
    point: Circle,
};
const typeLabels = {
    bbox: 'Box',
    polygon: 'Polygon',
    polyline: 'Line',
    point: 'Point',
};
export function AnnotationList({ annotations, labels, selectedAnnotationId, onSelectAnnotation, onDeleteAnnotation, }) {
    const getLabelById = (id) => labels.find(l => l.id === id);
    return (<div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground"/>
          <span className="text-sm font-semibold text-foreground">
            Annotations
          </span>
          {annotations.length > 0 && (<span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {annotations.length}
            </span>)}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {annotations.length === 0 ? (<div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
                <Layers className="h-6 w-6 text-muted-foreground"/>
              </div>
              <p className="text-sm text-muted-foreground">
                No annotations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select a tool and draw on the image
              </p>
            </div>) : (annotations.map((annotation) => {
            const Icon = typeIcons[annotation.type];
            const label = getLabelById(annotation.labelId);
            return (<div key={annotation.id} className={cn("group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all", selectedAnnotationId === annotation.id
                    ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                    : "hover:bg-secondary border-2 border-transparent")} onClick={() => onSelectAnnotation(selectedAnnotationId === annotation.id ? null : annotation.id)}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: label?.color + '20' }}>
                    <Icon className="h-4 w-4" style={{ color: label?.color }}/>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {label?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[annotation.type]} - {annotation.points.length} point{annotation.points.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                }}>
                    <Trash2 className="h-3.5 w-3.5"/>
                  </Button>
                </div>);
        }))}
        </div>
      </ScrollArea>
    </div>);
}
