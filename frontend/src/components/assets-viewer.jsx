import { useState, useEffect } from 'react';
import { useAssetsManager } from '@/hooks/use-assets-manager';
import { Trash2, Eye, Filter, BarChart3, Download, AlertCircle, Loader2, Image, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import './assets-viewer.css';

export function AssetsViewer() {
    const assetsManager = useAssetsManager();
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [assetDetails, setAssetDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [imageDimensions, setImageDimensions] = useState(null);

    useEffect(() => {
        assetsManager.loadAssets();
    }, []);

    const handleViewAsset = async (asset) => {
        setSelectedAsset(asset);
        setLoadingDetails(true);
        const details = await assetsManager.getAssetDetails(asset.id);
        setAssetDetails(details);
        setLoadingDetails(false);
        setShowDetails(true);
    };

    const handleDeleteAsset = async (assetId, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this asset?')) {
            await assetsManager.deleteAsset(assetId);
        }
    };

    const assets = assetsManager.assets;

    return (
        <div className="assets-viewer-container">
            {/* Header */}
            <div className="assets-header">
                <div>
                    <h2 className="assets-title">Dataset Assets</h2>
                    <p className="assets-subtitle">Your saved annotated images</p>
                </div>
                <div className="assets-stats-badge">
                    <BarChart3 className="h-4 w-4" />
                    <span>{assetsManager.stats?.totalImages || 0} Images</span>
                    <span className="text-xs text-muted-foreground">
                        {assetsManager.stats?.totalAnnotations || 0} Annotations
                    </span>
                </div>
            </div>

            {/* Filter Controls & Actions */}
            <div className="assets-filters flex items-center justify-between">
                <div className="filter-group">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <label>View Mode:</label>
                    <select
                        value={assetsManager.showAnnotations ? 'show' : 'hide'}
                        onChange={(e) => assetsManager.setShowAnnotations(e.target.value === 'show')}
                        className="filter-select"
                    >
                        <option value="show">Show Annotations</option>
                        <option value="hide">Hide Annotations</option>
                    </select>
                </div>
                
                <Button 
                    onClick={() => window.location.href = '/api/assets/export/zip'}
                    className="gap-2 shrink-0"
                >
                    <Download className="h-4 w-4" />
                    Download Dataset
                </Button>
            </div>

            {/* Error Message */}
            {assetsManager.error && (
                <div className="error-message">
                    <AlertCircle className="h-4 w-4" />
                    <span>{assetsManager.error}</span>
                </div>
            )}

            {/* Assets Grid */}
            <div className="assets-grid-container">
                {assetsManager.loading ? (
                    <div className="loading-state">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Loading assets...</p>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="empty-state">
                        <Image className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No assets saved yet</p>
                        <p className="text-xs text-muted-foreground/70">
                            Click the save button while annotating to save images to your dataset
                        </p>
                    </div>
                ) : (
                    <div className="assets-grid">
                        {assets.map((asset) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                showAnnotations={assetsManager.showAnnotations}
                                onView={() => handleViewAsset(asset)}
                                onDelete={(e) => handleDeleteAsset(asset.id, e)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-[100vw] sm:max-w-[100vw] w-screen h-screen max-h-screen border-0 rounded-none overflow-hidden flex flex-col bg-background/95 backdrop-blur-md">
                    <DialogTitle>Asset Details</DialogTitle>
                    {loadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : assetDetails ? (
                        <div className="overflow-auto flex-1">
                            <div className="grid lg:grid-cols-[2.5fr_1fr] md:grid-cols-2 gap-8 p-4 h-full">
                                {/* Image */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-3 text-foreground">Image</h3>
                                    <div className="relative h-full flex items-center justify-center bg-black/5 rounded-lg border border-border">
                                        <img
                                            src={`/api/assets/image/${assetDetails.image}`}
                                            alt={assetDetails.originalName}
                                            className="w-full h-full object-contain max-h-[85vh]"
                                            onLoad={(e) => setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
                                        />
                                        {imageDimensions && assetDetails.annotations && (
                                            <svg
                                                className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
                                                viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                                                preserveAspectRatio="xMidYMid meet"
                                            >
                                                {assetDetails.annotations.map((ann, idx) => {
                                                    const label = assetDetails.labels?.find(l => l.id === ann.labelId);
                                                    const color = label?.color || '#3b82f6';
                                                    const strokeWidth = Math.max(2, imageDimensions.width / 500);
                                                    
                                                    if (ann.type === 'bbox' && ann.points.length === 2) {
                                                        const [p1, p2] = ann.points;
                                                        const x = Math.min(p1.x, p2.x);
                                                        const y = Math.min(p1.y, p2.y);
                                                        const w = Math.abs(p2.x - p1.x);
                                                        const h = Math.abs(p2.y - p1.y);
                                                        const fontSize = Math.max(12, imageDimensions.width / 40);
                                                        
                                                        return (
                                                            <g key={idx}>
                                                                <rect
                                                                    x={x}
                                                                    y={y}
                                                                    width={w}
                                                                    height={h}
                                                                    fill={`${color}30`}
                                                                    stroke={color}
                                                                    strokeWidth={strokeWidth}
                                                                />
                                                                <rect
                                                                    x={x}
                                                                    y={y - fontSize - 4}
                                                                    width={w}
                                                                    height={fontSize + 4}
                                                                    fill={color}
                                                                />
                                                                <text
                                                                    x={x + 4}
                                                                    y={y - 4}
                                                                    fill="#ffffff"
                                                                    fontSize={fontSize}
                                                                    fontFamily="sans-serif"
                                                                >
                                                                    {label?.name || ann.labelId}
                                                                </text>
                                                            </g>
                                                        );
                                                    } else if (ann.type === 'polygon' && ann.points.length > 2) {
                                                        const pointsStr = ann.points.map(p => `${p.x},${p.y}`).join(' ');
                                                        return (
                                                            <polygon
                                                                key={idx}
                                                                points={pointsStr}
                                                                fill={`${color}30`}
                                                                stroke={color}
                                                                strokeWidth={strokeWidth}
                                                            />
                                                        );
                                                    } else if (ann.type === 'point') {
                                                        return (
                                                            <g key={idx}>
                                                                {ann.points.map((p, i) => (
                                                                    <circle
                                                                        key={i}
                                                                        cx={p.x}
                                                                        cy={p.y}
                                                                        r={Math.max(4, imageDimensions.width / 200)}
                                                                        fill={color}
                                                                        stroke="#ffffff"
                                                                        strokeWidth={Math.max(1, strokeWidth / 2)}
                                                                    />
                                                                ))}
                                                            </g>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {assetDetails.originalName}
                                    </p>
                                </div>

                                {/* Annotations */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Annotations ({assetDetails.annotations?.length || 0})
                                        </h3>
                                        <button
                                            onClick={() => {
                                                const dataStr = JSON.stringify(assetDetails.annotations, null, 2);
                                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                                const url = URL.createObjectURL(dataBlob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${assetDetails.image}.json`;
                                                link.click();
                                            }}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                            title="Download annotations"
                                        >
                                            <Download className="h-3 w-3" />
                                            Export
                                        </button>
                                    </div>

                                    {assetDetails.labels && assetDetails.labels.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Labels</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {assetDetails.labels.map((label, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs rounded-full text-white"
                                                        style={{ backgroundColor: label.color || '#999' }}
                                                    >
                                                        {label.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 max-h-64 overflow-auto">
                                        {assetDetails.annotations && assetDetails.annotations.length > 0 ? (
                                            assetDetails.annotations.map((ann, idx) => (
                                                <div key={idx} className="p-2 rounded-md bg-secondary/50 border border-border/50">
                                                    <div className="text-xs font-medium text-foreground">
                                                        {ann.type?.toUpperCase()} - {assetDetails.labels?.find(l => l.id === ann.labelId)?.name || ann.labelId}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                        {ann.points?.length || 0} point{ann.points?.length !== 1 ? 's' : ''}
                                                        {ann.confidence && ` • Confidence: ${(ann.confidence * 100).toFixed(1)}%`}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No annotations</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            const dataStr = JSON.stringify(assetDetails, null, 2);
                                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                            const url = URL.createObjectURL(dataBlob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `${assetDetails.image}.full.json`;
                                            link.click();
                                        }}
                                        className="w-full mt-4 text-xs px-2 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors flex items-center justify-center gap-1 text-foreground"
                                    >
                                        <FileJson className="h-3 w-3" />
                                        Download Full JSON
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AssetCard({ asset, showAnnotations, onView, onDelete }) {
    const [dim, setDim] = useState(null);

    return (
        <div className="asset-card" onClick={onView}>
            <div className="asset-image-wrapper relative">
                <img
                    src={`/api/assets/image/${asset.image}`}
                    alt={asset.originalName}
                    className="asset-image"
                    onLoad={(e) => setDim({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E';
                    }}
                />
                
                {showAnnotations && dim && asset.annotations && asset.annotations.length > 0 && (
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${dim.w} ${dim.h}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {asset.annotations.map((ann, idx) => {
                            const label = asset.labels?.find(l => l.id === ann.labelId);
                            const color = label?.color || '#3b82f6';
                            const strokeWidth = Math.max(2, dim.w / 300);
                            
                            if (ann.type === 'bbox' && ann.points.length === 2) {
                                const [p1, p2] = ann.points;
                                const x = Math.min(p1.x, p2.x);
                                const y = Math.min(p1.y, p2.y);
                                const w = Math.abs(p2.x - p1.x);
                                const h = Math.abs(p2.y - p1.y);
                                
                                return (
                                    <rect
                                        key={idx}
                                        x={x}
                                        y={y}
                                        width={w}
                                        height={h}
                                        fill={`${color}30`}
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                    />
                                );
                            } else if (ann.type === 'polygon' && ann.points.length > 2) {
                                const pointsStr = ann.points.map(p => `${p.x},${p.y}`).join(' ');
                                return (
                                    <polygon
                                        key={idx}
                                        points={pointsStr}
                                        fill={`${color}30`}
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                    />
                                );
                            } else if (ann.type === 'point') {
                                return (
                                    <g key={idx}>
                                        {ann.points.map((p, i) => (
                                            <circle
                                                key={i}
                                                cx={p.x}
                                                cy={p.y}
                                                r={Math.max(4, dim.w / 150)}
                                                fill={color}
                                                stroke="#ffffff"
                                                strokeWidth={Math.max(1, strokeWidth / 2)}
                                            />
                                        ))}
                                    </g>
                                );
                            }
                            return null;
                        })}
                    </svg>
                )}

                <div className="asset-overlay z-10">
                    <button
                        className="asset-action-btn view-btn"
                        title="View details"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        className="asset-action-btn delete-btn"
                        onClick={onDelete}
                        title="Delete asset"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="asset-info">
                <h3 className="asset-name" title={asset.originalName}>
                    {asset.originalName}
                </h3>
                <div className="asset-meta">
                    <span className="asset-annotation-count">
                        {asset.annotationCount} annotation{asset.annotationCount !== 1 ? 's' : ''}
                    </span>
                    <span className="asset-date">
                        {asset.savedAt ? new Date(asset.savedAt).toLocaleDateString() : ''}
                    </span>
                </div>
                {asset.labels && asset.labels.length > 0 && (
                    <div className="asset-labels">
                        {asset.labels.slice(0, 3).map((label, idx) => (
                            <span
                                key={idx}
                                className="asset-label"
                                style={{ backgroundColor: label.color || '#999' }}
                                title={label.name}
                            >
                                {label.name}
                            </span>
                        ))}
                        {asset.labels.length > 3 && (
                            <span className="asset-label-more">
                                +{asset.labels.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
