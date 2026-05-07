import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CLASS_COLORS } from '../lib/constants';

export function LabelsSidebar({
  classes,
  activeClassId,
  onSelectClass,
  onAddClass,
  onRemoveClass,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CLASS_COLORS[0]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddClass(name, newColor);
    setNewName('');
    setNewColor(CLASS_COLORS[(classes.length + 1) % CLASS_COLORS.length]);
    setAdding(false);
  };

  return (
    <div className="w-[220px] shrink-0 bg-card border-l border-border flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Labels
        </span>
        <button
          onClick={() => setAdding(!adding)}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-secondary"
        >
          <Plus size={15} />
        </button>
      </div>

      {adding && (
        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Class name..."
            className="w-full bg-secondary text-sm px-2.5 py-1.5 rounded-md border border-border outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap gap-1.5">
            {CLASS_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: color,
                  borderColor: newColor === color ? '#ffffff' : 'transparent',
                  transform: newColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-primary text-primary-foreground rounded-md py-1.5 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={12} /> Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); }}
              className="flex items-center justify-center px-3 text-xs text-muted-foreground hover:text-foreground bg-secondary rounded-md py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all group
                ${activeClassId === cls.id
                  ? 'bg-secondary border border-border'
                  : 'hover:bg-secondary/60 border border-transparent'
                }
              `}
            >
              <div
                className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10"
                style={{ backgroundColor: cls.color }}
              />
              <span className="text-sm text-foreground truncate flex-1">{cls.name}</span>

              <span className="text-[10px] font-mono text-muted-foreground/60">
                {String(classes.indexOf(cls) + 1)}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveClass(cls.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
              >
                <X size={12} />
              </button>
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Press 1-9 to select class
        </p>
      </div>
    </div>
  );
}
