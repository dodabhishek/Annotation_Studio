/**
 * Assets API helpers
 */

export async function saveAssetToBackend(imageFile, annotations, labels, imageName) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('annotations', JSON.stringify(annotations));
    formData.append('labels', JSON.stringify(labels));
    formData.append('imageName', imageName || imageFile.name);

    const response = await fetch('/api/assets/save', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to save asset: ${response.statusText}`);
    }

    return response.json();
}

export async function listAssets() {
    const response = await fetch('/api/assets/list');
    if (!response.ok) {
        throw new Error(`Failed to list assets: ${response.statusText}`);
    }
    return response.json();
}

export async function getAssetDetails(assetId) {
    const response = await fetch(`/api/assets/${assetId}`);
    if (!response.ok) {
        throw new Error(`Failed to get asset details: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteAsset(assetId) {
    const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete asset: ${response.statusText}`);
    }
    return response.json();
}

export async function getAssetsStats() {
    const response = await fetch('/api/assets/stats');
    if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.statusText}`);
    }
    return response.json();
}

export function getAssetImageUrl(filename) {
    return `/api/assets/image/${filename}`;
}
