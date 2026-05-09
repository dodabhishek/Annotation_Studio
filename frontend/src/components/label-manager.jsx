import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
const COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9',
    '#0284c7', '#1d4ed8', '#4f46e5', '#7c3aed',
    '#2563eb', '#4338ca', '#0891b2', '#0369a1',
];
export function LabelManager({ labels, selectedLabelId, onSelectLabel, onAddLabel, onUpdateLabel, onDeleteLabel, labelCounts = {} }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(COLORS[0]);
    const [editName, setEditName] = useState('');
    const handleAddLabel = () => {
        if (newLabelName.trim()) {
            const shortcut = labels.length < 9 ? String(labels.length + 1) : undefined;
            onAddLabel({ name: newLabelName.trim(), color: newLabelColor, shortcut });
            setNewLabelName('');
            setNewLabelColor(COLORS[(labels.length + 1) % COLORS.length]);
            setIsAdding(false);
        }
    };
    const handleStartEdit = (label) => {
        setEditingId(label.id);
        setEditName(label.name);
    };
    const handleSaveEdit = (id) => {
        if (editName.trim()) {
            onUpdateLabel(id, { name: editName.trim() });
        }
        setEditingId(null);
    };
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };
    return (<div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground"/>
          <span className="text-sm font-semibold text-foreground">Labels</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} disabled={isAdding} className="h-8 rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1.5"/>
          New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isAdding && (<div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
              <Input placeholder="Label name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} onKeyDown={(e) => {
                if (e.key === 'Enter')
                    handleAddLabel();
                if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewLabelName('');
                }
            }} className="h-9 text-sm rounded-lg" autoFocus/>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((color) => (<button key={color} className={cn("w-6 h-6 rounded-lg transition-all", newLabelColor === color && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110")} style={{ backgroundColor: color }} onClick={() => setNewLabelColor(color)}/>))}
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => {
                setIsAdding(false);
                setNewLabelName('');
            }}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 rounded-lg" onClick={handleAddLabel} disabled={!newLabelName.trim()}>
                  <Check className="h-3.5 w-3.5 mr-1.5"/>
                  Add Label
                </Button>
              </div>
            </div>)}

          {labels.map((label) => (<div key={label.id} className={cn("group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all", selectedLabelId === label.id
                ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                : "hover:bg-secondary border-2 border-transparent")} onClick={() => onSelectLabel(label.id)}>
              <div className="w-5 h-5 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: label.color }}/>
              
              {editingId === label.id ? (<div className="flex-1 flex items-center gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => {
                    if (e.key === 'Enter')
                        handleSaveEdit(label.id);
                    if (e.key === 'Escape')
                        handleCancelEdit();
                }} className="h-8 text-sm rounded-lg" autoFocus onClick={(e) => e.stopPropagation()}/>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                }}>
                    <X className="h-3.5 w-3.5"/>
                  </Button>
                  <Button size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit(label.id);
                }}>
                    <Check className="h-3.5 w-3.5"/>
                  </Button>
                </div>) : (<>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {label.name}
                  </span>                  {labelCounts[label.id] !== undefined && (
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {labelCounts[label.id]}
                    </span>
                  )}                  {label.shortcut && (<Kbd className="h-6 min-w-6 text-xs bg-secondary">{label.shortcut}</Kbd>)}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground" onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(label);
                }}>
                      <Pencil className="h-3.5 w-3.5"/>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLabel(label.id);
                }}>
                      <Trash2 className="h-3.5 w-3.5"/>
                    </Button>
                  </div>
                </>)}
            </div>))}

          {labels.length === 0 && !isAdding && (<div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
                <Tag className="h-6 w-6 text-muted-foreground"/>
              </div>
              <p className="text-sm text-muted-foreground">
                No labels yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add labels to categorize your annotations
              </p>
            </div>)}
        </div>
      </ScrollArea>
    </div>);
}
