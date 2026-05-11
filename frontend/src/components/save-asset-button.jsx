import { useState, useEffect } from 'react';
import { Check, CheckLine, Download, AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import './save-asset-button.css';

export function SaveAssetButton({ image, annotations, labels, onSaved, iconOnly = false }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setIsSaved(false);
        setError(null);
        setShowToast(false);
    }, [image?.id]);

    const handleSaveAsset = async () => {
        if (!image || !image.file) {
            setError('No image selected');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', image.file);
            formData.append('annotations', JSON.stringify(annotations));
            formData.append('labels', JSON.stringify(labels));
            formData.append('imageName', image.name);

            const response = await fetch('/api/assets/save', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setIsSaved(true);
                setShowToast(true);
                if (onSaved) {
                    onSaved(data);
                }
                // Reset after 3 seconds
                setTimeout(() => {
                    setShowToast(false);
                }, 3000);
            } else {
                setError(data.error || 'Failed to save asset');
            }
        } catch (err) {
            setError(err.message || 'Error saving asset');
        } finally {
            setIsSaving(false);
        }
    };

    if (iconOnly) {
        return (
            <div className="relative inline-block">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleSaveAsset}
                                disabled={isSaving || !image}
                                className={`h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isSaved ? 'text-green-500' : ''}`}
                            >
                                {isSaving ? <Spinner className="h-4 w-4" /> : <CheckLine className="h-4 w-4" />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>Save to dataset</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                {showToast && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-green-500 text-white text-[10px] rounded whitespace-nowrap z-50">
                        Saved!
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="save-asset-button-wrapper">
            <button
                onClick={handleSaveAsset}
                disabled={isSaving || !image}
                className={`save-asset-button ${isSaved ? 'saved' : ''} ${isSaving ? 'saving' : ''}`}
                title={isSaved ? 'Asset saved to dataset' : 'Save this image and annotations to your dataset'}
            >
                {isSaving ? (
                    <>
                        <Spinner className="h-4 w-4" />
                        <span>Saving...</span>
                    </>
                ) : isSaved ? (
                    <>
                        <Check className="h-4 w-4" />
                        <span>Saved to Dataset</span>
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        <span>Save to Dataset</span>
                    </>
                )}
            </button>

            {error && (
                <div className="save-error-message">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{error}</span>
                </div>
            )}

            {showToast && (
                <div className="save-success-toast">
                    <Check className="h-4 w-4" />
                    <span>Image saved to dataset!</span>
                </div>
            )}
        </div>
    );
}
