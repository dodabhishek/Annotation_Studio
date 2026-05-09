import { useState, useCallback } from 'react';
const DETECTION_COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981',
    '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#14b8a6',
];
export function useAnnotationStore() {
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [labels, setLabels] = useState([]);
    const [selectedLabelId, setSelectedLabelId] = useState(null);
    const [selectedTool, setSelectedTool] = useState('bbox');
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const currentImage = images[currentImageIndex] || null;
    const addImages = useCallback((files) => {
        const newImages = files.map((file, index) => ({
            id: `img-${Date.now()}-${index}`,
            name: file.name,
            file,
            url: URL.createObjectURL(file),
            annotations: [],
            labeled: false,
        }));
        setImages(prev => [...prev, ...newImages]);
        if (images.length === 0) {
            setCurrentImageIndex(0);
        }
    }, [images.length]);
    const removeImage = useCallback((imageId) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
        setCurrentImageIndex(prev => Math.max(0, prev - 1));
    }, []);
    const goToImage = useCallback((index) => {
        if (index >= 0 && index < images.length) {
            setCurrentImageIndex(index);
            setSelectedAnnotationId(null);
        }
    }, [images.length]);
    const nextImage = useCallback(() => {
        goToImage(currentImageIndex + 1);
    }, [currentImageIndex, goToImage]);
    const prevImage = useCallback(() => {
        goToImage(currentImageIndex - 1);
    }, [currentImageIndex, goToImage]);
    const addAnnotation = useCallback((annotation) => {
        const newAnnotation = {
            ...annotation,
            id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setImages(prev => prev.map(img => img.id === annotation.imageId
            ? { ...img, annotations: [...img.annotations, newAnnotation], labeled: true }
            : img));
        return newAnnotation.id;
    }, []);
    const updateAnnotation = useCallback((annotationId, updates) => {
        console.log(updates)
        setImages(prev => prev.map(img => ({
            ...img,
            annotations: img.annotations.map(ann => ann.id === annotationId ? { ...ann, ...updates } : ann),
        })));
    }, []);
    const deleteAnnotation = useCallback((annotationId) => {
        setImages(prev => prev.map(img => ({
            ...img,
            annotations: img.annotations.filter(ann => ann.id !== annotationId),
            labeled: img.annotations.filter(ann => ann.id !== annotationId).length > 0,
        })));
        if (selectedAnnotationId === annotationId) {
            setSelectedAnnotationId(null);
        }
    }, [selectedAnnotationId]);
    const addLabel = useCallback((label) => {
        const newLabel = {
            ...label,
            id: `label-${Date.now()}`,
        };
        setLabels(prev => [...prev, newLabel]);
        return newLabel.id;
    }, []);
    const updateLabel = useCallback((labelId, updates) => {
        setLabels(prev => prev.map(label => label.id === labelId ? { ...label, ...updates } : label));
    }, []);
    const deleteLabel = useCallback((labelId) => {
        setLabels(prev => prev.filter(label => label.id !== labelId));
        // Remove annotations with this label
        setImages(prev => prev.map(img => ({
            ...img,
            annotations: img.annotations.filter(ann => ann.labelId !== labelId),
        })));
    }, []);
    const markImageAsLabeled = useCallback((imageId, labeled) => {
        setImages(prev => prev.map(img => img.id === imageId ? { ...img, labeled } : img));
    }, []);

    const addDetections = useCallback((imageId, detections) => {
        setLabels(prev => {
            let updated = [...prev];
            for (const det of detections) {
                const name = det.label.trim();
                if (!updated.find(l => l.name.toLowerCase() === name.toLowerCase())) {
                    updated.push({
                        id: `label-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        color: DETECTION_COLORS[updated.length % DETECTION_COLORS.length],
                        shortcut: updated.length < 9 ? String(updated.length + 1) : '',
                    });
                }
            }
            return updated;
        });

        setLabels(currentLabels => {
            const newAnnotations = detections.map(det => {
                const name = det.label.trim();
                const label = currentLabels.find(l => l.name.toLowerCase() === name.toLowerCase());
                const labelId = label?.id || currentLabels[0]?.id || '1';

                if (det.polygon && det.polygon.length > 2) {
                    return {
                        id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                        type: 'polygon',
                        labelId,
                        points: det.polygon,
                        imageId,
                        confidence: det.confidence,
                    };
                }

                const [x1, y1, x2, y2] = det.box;
                return {
                    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    type: 'bbox',
                    labelId,
                    points: [{ x: x1, y: y1 }, { x: x2, y: y2 }],
                    imageId,
                    confidence: det.confidence,
                };
            });

            setImages(prev => prev.map(img =>
                img.id === imageId
                    ? { ...img, annotations: [...img.annotations, ...newAnnotations], labeled: true }
                    : img
            ));

            return currentLabels;
        });
    }, []);
    const resetZoom = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);
    const exportAnnotations = useCallback(() => {
        const data = images.map(img => ({
            image: img.name,
            annotations: img.annotations.map(ann => ({
                type: ann.type,
                label: labels.find(l => l.id === ann.labelId)?.name || 'Unknown',
                points: ann.points,
            })),
        }));
        return JSON.stringify(data, null, 2);
    }, [images, labels]);

    const getOrCreateLabel = useCallback((labelNameOrObj) => {
        // If it's a string, find or create label with that name
        if (typeof labelNameOrObj === 'string') {
            const existingLabel = labels.find(l => l.name.toLowerCase() === labelNameOrObj.toLowerCase());
            if (existingLabel) return existingLabel.id;
            
            const newLabel = {
                id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: labelNameOrObj.charAt(0).toUpperCase() + labelNameOrObj.slice(1),
                color: DETECTION_COLORS[labels.length % DETECTION_COLORS.length],
                shortcut: labels.length < 9 ? String(labels.length + 1) : '',
            };
            setLabels(prev => [...prev, newLabel]);
            return newLabel.id;
        } 
        // If it's an object with name and color
        else {
            const newLabel = {
                id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: labelNameOrObj.name,
                color: labelNameOrObj.color,
                shortcut: labels.length < 9 ? String(labels.length + 1) : '',
            };
            setLabels(prev => [...prev, newLabel]);
            return newLabel.id;
        }
    }, [labels]);

    const getLabelCounts = useCallback(() => {
        const counts = {};
        labels.forEach(label => {
            const count = images.reduce((acc, img) => {
                return acc + img.annotations.filter(ann => ann.labelId === label.id).length;
            }, 0);
            counts[label.id] = count;
        });
        return counts;
    }, [labels, images]);

    const getLabelsWithCounts = useCallback(() => {
        const counts = getLabelCounts();
        return labels.map(label => ({
            ...label,
            count: counts[label.id] || 0,
        }));
    }, [labels, getLabelCounts]);
    return {
        // State
        images,
        currentImage,
        currentImageIndex,
        labels,
        selectedLabelId,
        selectedTool,
        selectedAnnotationId,
        zoom,
        pan,
        // Image actions
        addImages,
        removeImage,
        goToImage,
        nextImage,
        prevImage,
        markImageAsLabeled,
        addDetections,
        // Annotation actions
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        setSelectedAnnotationId,
        // Label actions
        addLabel,
        updateLabel,
        deleteLabel,
        setSelectedLabelId,
        getOrCreateLabel,
        getLabelCounts,
        getLabelsWithCounts,
        // Tool actions
        setSelectedTool,
        // View actions
        setZoom,
        setPan,
        resetZoom,
        // Export
        exportAnnotations,
    };
}
