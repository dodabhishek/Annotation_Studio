import { useState, useCallback } from 'react';

const API_BASE = 'http://127.0.0.1:5001';

export function useAssetsManager() {

    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [showAnnotations, setShowAnnotations] = useState(true);

    // -------------------------------------------------
    // Load project assets
    // -------------------------------------------------

    const loadAssets = useCallback(
        async (projectId) => {

            if (!projectId) return;

            setLoading(true);
            setError(null);

            try {

                const response = await fetch(
                    `${API_BASE}/api/assets/list?projectId=${projectId}`
                );

                const data = await response.json();

                if (data.success) {

                    setAssets(data.assets || []);

                    await loadStats(projectId);

                } else {

                    setError(
                        data.error || 'Failed to load assets'
                    );
                }

            } catch (err) {

                setError(
                    err.message || 'Error loading assets'
                );

            } finally {

                setLoading(false);
            }
        },
        []
    );

    // -------------------------------------------------
    // Load project stats
    // -------------------------------------------------

    const loadStats = useCallback(
        async (projectId) => {

            if (!projectId) return;

            try {

                const response = await fetch(
                    `${API_BASE}/api/assets/stats?projectId=${projectId}`
                );

                const data = await response.json();

                if (data.success) {

                    setStats(data.stats);
                }

            } catch (err) {

                console.error(
                    'Error loading stats:',
                    err
                );
            }
        },
        []
    );

    // -------------------------------------------------
    // Save asset
    // -------------------------------------------------

    const saveAsset = useCallback(
        async (
            imageFile,
            annotations,
            labels,
            imageName,
            projectId
        ) => {

            try {

                setError(null);

                const formData = new FormData();

                formData.append(
                    'image',
                    imageFile
                );

                formData.append(
                    'annotations',
                    JSON.stringify(annotations)
                );

                formData.append(
                    'labels',
                    JSON.stringify(labels)
                );

                formData.append(
                    'imageName',
                    imageName || imageFile.name
                );

                formData.append(
                    'projectId',
                    projectId
                );

                const response = await fetch(
                    `${API_BASE}/api/assets/save`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                const data = await response.json();

                if (data.success) {

                    setAssets((prev) => [
                        {
                            id: data.assetId,

                            image: data.image,

                            imageUrl:
                                `${API_BASE}/api/assets/image/${data.image}?projectId=${projectId}`,

                            originalName:
                                imageName || imageFile.name,

                            savedAt: data.savedAt,

                            annotationCount:
                                annotations.length,

                            labels,

                            annotations,
                        },

                        ...prev
                    ]);

                    await loadStats(projectId);

                    return data.assetId;

                } else {

                    setError(
                        data.error || 'Failed to save asset'
                    );

                    return null;
                }

            } catch (err) {

                setError(
                    err.message || 'Error saving asset'
                );

                return null;
            }
        },
        []
    );

    // -------------------------------------------------
    // Delete asset
    // -------------------------------------------------

    const deleteAsset = useCallback(
        async (
            assetId,
            projectId
        ) => {

            try {

                const response = await fetch(
                    `${API_BASE}/api/assets/${assetId}?projectId=${projectId}`,
                    {
                        method: 'DELETE',
                    }
                );

                const data = await response.json();

                if (data.success) {

                    setAssets((prev) =>
                        prev.filter(
                            (a) => a.id !== assetId
                        )
                    );

                    await loadStats(projectId);

                    return true;

                } else {

                    setError(
                        data.error || 'Failed to delete asset'
                    );

                    return false;
                }

            } catch (err) {

                setError(
                    err.message || 'Error deleting asset'
                );

                return false;
            }
        },
        []
    );

    // -------------------------------------------------
    // Asset details
    // -------------------------------------------------

    const getAssetDetails = useCallback(
        async (
            assetId,
            projectId
        ) => {

            try {

                const response = await fetch(
                    `${API_BASE}/api/assets/${assetId}?projectId=${projectId}`
                );

                const data = await response.json();

                if (data.success) {

                    return data.asset;

                } else {

                    setError(
                        data.error ||
                        'Failed to load asset details'
                    );

                    return null;
                }

            } catch (err) {

                setError(
                    err.message ||
                    'Error loading asset details'
                );

                return null;
            }
        },
        []
    );

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