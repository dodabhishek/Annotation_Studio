import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9',
    '#0284c7', '#1d4ed8', '#4f46e5', '#7c3aed',
    '#2563eb', '#4338ca', '#0891b2', '#0369a1',
];

export function LabelNamingDialog({
    isOpen,
    existingLabels,
    onConfirm,
    onCancel,
}) {
    const [labelName, setLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [useExisting, setUseExisting] = useState(false);
    const [selectedExistingLabelId, setSelectedExistingLabelId] = useState(null);

    const topLabels = [...existingLabels].sort((a, b) => b.count - a.count).slice(0, 6);

    useEffect(() => {
        if (!isOpen) {
            setLabelName('');
            setSelectedColor(COLORS[0]);
            setUseExisting(false);
            setSelectedExistingLabelId(null);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (useExisting && selectedExistingLabelId) {
            onConfirm(selectedExistingLabelId);
        } else if (labelName.trim()) {
            onConfirm({ name: labelName.trim(), color: selectedColor });
        }
    };

    const isValid = useExisting ? !!selectedExistingLabelId : !!labelName.trim();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-md">
                <DialogTitle>Assign Label to Annotation</DialogTitle>
                
                <div className="space-y-4">
                    {/* Use Existing Label */}
                    {existingLabels.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="use-existing"
                                    checked={useExisting}
                                    onChange={() => setUseExisting(true)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="use-existing" className="text-sm font-medium">
                                    Use Existing Label
                                </label>
                            </div>
                            {useExisting && (
                                <div className="grid grid-cols-2 gap-2 ml-6">
                                    {existingLabels.map((label) => (
                                        <button
                                            key={label.id}
                                            onClick={() => setSelectedExistingLabelId(label.id)}
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-2",
                                                selectedExistingLabelId === label.id
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:bg-secondary"
                                            )}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-md flex-shrink-0"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            <span className="truncate">{label.name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">×{label.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {existingLabels.length > 0 && (
                        <div className="h-px bg-border" />
                    )}

                    {/* Create New Label */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="radio"
                                id="create-new"
                                checked={!useExisting}
                                onChange={() => setUseExisting(false)}
                                className="w-4 h-4"
                            />
                            <label htmlFor="create-new" className="text-sm font-medium">
                                Create New Label
                            </label>
                        </div>
                        {!useExisting && (
                            <div className="space-y-3 ml-6">
                                <Input
                                    placeholder="Label name (e.g., person, car, dog)"
                                    value={labelName}
                                    onChange={(e) => setLabelName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                    }}
                                    autoFocus
                                    className="h-9"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "w-6 h-6 rounded-lg transition-all",
                                                selectedColor === color && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                                {topLabels.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-muted-foreground mb-2">Top labels (click to use):</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {topLabels.map(label => (
                                                <button 
                                                    key={label.id} 
                                                    onClick={() => onConfirm(label.id)}
                                                    className="text-[10px] px-2 py-1 rounded-full border bg-secondary/50 flex items-center gap-1.5 hover:bg-secondary hover:border-primary/50 transition-colors cursor-pointer"
                                                    style={{ borderColor: label.color + '40' }}
                                                >
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }}></span>
                                                    {label.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="h-9 rounded-lg"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className="h-9 rounded-lg"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
