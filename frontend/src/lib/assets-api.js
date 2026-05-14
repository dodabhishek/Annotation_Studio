const API_BASE = 'http://127.0.0.1:5001';


/**
 * Save Asset
 */
export async function saveAssetToBackend(
    imageFile,
    annotations,
    labels,
    imageName,
    projectId
) {

    const formData = new FormData();

    formData.append('image', imageFile);

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

    if (!response.ok) {

        throw new Error(
            `Failed to save asset: ${response.statusText}`
        );
    }

    return response.json();
}


/**
 * List Assets
 */
export async function listAssets(projectId) {

    const response = await fetch(
        `${API_BASE}/api/assets/list?projectId=${projectId}`
    );

    if (!response.ok) {

        throw new Error(
            `Failed to list assets: ${response.statusText}`
        );
    }

    return response.json();
}


/**
 * Get Asset Details
 */
export async function getAssetDetails(
    assetId,
    projectId
) {

    const response = await fetch(
        `${API_BASE}/api/assets/${assetId}?projectId=${projectId}`
    );

    if (!response.ok) {

        throw new Error(
            `Failed to get asset details: ${response.statusText}`
        );
    }

    return response.json();
}


/**
 * Delete Asset
 */
export async function deleteAsset(
    assetId,
    projectId
) {

    const response = await fetch(
        `${API_BASE}/api/assets/${assetId}?projectId=${projectId}`,
        {
            method: 'DELETE',
        }
    );

    if (!response.ok) {

        throw new Error(
            `Failed to delete asset: ${response.statusText}`
        );
    }

    return response.json();
}


/**
 * Project Stats
 */
export async function getAssetsStats(projectId) {

    const response = await fetch(
        `${API_BASE}/api/assets/stats?projectId=${projectId}`
    );

    if (!response.ok) {

        throw new Error(
            `Failed to get stats: ${response.statusText}`
        );
    }

    return response.json();
}


/**
 * Asset Image URL
 */
export function getAssetImageUrl(
    filename,
    projectId
) {

    return (
        `${API_BASE}/api/assets/image/${filename}?projectId=${projectId}`
    );
}