import { useState, useCallback } from 'react';

export function useAssetsManager() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [showAnnotations, setShowAnnotations] = useState(true);

    // Load all assets from backend
    const loadAssets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/assets/list');
            const data = await response.json();
            if (data.success) {
                setAssets(data.assets);
                // Load stats
                loadStats();
            } else {
                setError(data.error || 'Failed to load assets');
            }
        } catch (err) {
            setError(err.message || 'Error loading assets');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load statistics
    const loadStats = useCallback(async () => {
        try {
            const response = await fetch('/api/assets/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, []);

    // Save a new asset
    const saveAsset = useCallback(async (imageFile, annotations, labels, imageName) => {
        try {
            setError(null);
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('annotations', JSON.stringify(annotations));
            formData.append('labels', JSON.stringify(labels));
            formData.append('imageName', imageName || imageFile.name);

            const response = await fetch('/api/assets/save', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                // Add to local list
                setAssets(prev => [{
                    id: data.assetId,
                    image: data.image,
                    originalName: imageName || imageFile.name,
                    savedAt: data.savedAt,
                    annotationCount: annotations.length,
                    labels: labels,
                    annotations: annotations,
                }, ...prev]);
                loadStats();
                return data.assetId;
            } else {
                setError(data.error || 'Failed to save asset');
                return null;
            }
        } catch (err) {
            setError(err.message || 'Error saving asset');
            return null;
        }
    }, []);

    // Delete an asset
    const deleteAsset = useCallback(async (assetId) => {
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setAssets(prev => prev.filter(a => a.id !== assetId));
                loadStats();
                return true;
            } else {
                setError(data.error || 'Failed to delete asset');
                return false;
            }
        } catch (err) {
            setError(err.message || 'Error deleting asset');
            return false;
        }
    }, []);

    // Get asset details
    const getAssetDetails = useCallback(async (assetId) => {
        try {
            const response = await fetch(`/api/assets/${assetId}`);
            const data = await response.json();
            if (data.success) {
                return data.asset;
            } else {
                setError(data.error || 'Failed to load asset details');
                return null;
            }
        } catch (err) {
            setError(err.message || 'Error loading asset details');
            return null;
        }
    }, []);

    return {
        assets,
        loading,
        error,
        stats,
        showAnnotations,
        setShowAnnotations,
        loadAssets,
        loadStats,
        saveAsset,
        deleteAsset,
        getAssetDetails,
    };
}
