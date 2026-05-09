# Assets Management System - Implementation Guide

## Overview

The Assets Management System allows users to save annotated images to a persistent dataset with their annotations and labels. This creates a Roboflow-style interface where users can browse, filter, and manage their saved datasets.

## Features Implemented

### 1. **Backend API Endpoints** (`backend/routes/assets_route.py`)

#### Save Asset
- **Endpoint**: `POST /api/assets/save`
- **Description**: Save an image with its annotations to the assets folder
- **Request Data**:
  - `image` (file): Image file to save
  - `annotations` (JSON string): Array of annotation objects
  - `labels` (JSON string): Array of label objects
  - `imageName` (string): Original image name
- **Response**: Asset ID, saved filename, and timestamp
- **Storage**: Images saved to `backend/assets/images/`, annotations to `backend/assets/annotations/`

#### List Assets
- **Endpoint**: `GET /api/assets/list`
- **Description**: Get all saved assets with metadata
- **Response**: Array of assets with:
  - `id`: Unique asset identifier
  - `image`: Filename
  - `originalName`: Original image name
  - `savedAt`: ISO timestamp
  - `annotationCount`: Number of annotations
  - `labels`: Array of labels used

#### Get Asset Details
- **Endpoint**: `GET /api/assets/<asset_id>`
- **Description**: Get complete asset data including annotations
- **Response**: Full asset object with all annotations and metadata

#### Serve Asset Images
- **Endpoint**: `GET /api/assets/image/<filename>`
- **Description**: Serve saved asset images
- **Response**: Image file

#### Delete Asset
- **Endpoint**: `DELETE /api/assets/<asset_id>`
- **Description**: Delete asset and its annotations
- **Response**: Success confirmation

#### Get Statistics
- **Endpoint**: `GET /api/assets/stats`
- **Description**: Get dataset statistics
- **Response**:
  - `totalImages`: Total saved images
  - `totalAnnotations`: Total annotations across all images
  - `uniqueLabels`: Number of unique labels
  - `labelCounts`: Count for each label

### 2. **Frontend Components**

#### `SaveAssetButton` (`frontend/src/components/save-asset-button.jsx`)
- One-click button to save current image with annotations to dataset
- States:
  - **Default**: Ready to save
  - **Saving**: Shows loading spinner while uploading
  - **Saved**: Confirms successful save with checkmark
- Shows success toast notification on save
- Displays error messages if save fails

#### `AssetsViewer` (`frontend/src/components/assets-viewer.jsx`)
- Roboflow-style dataset browser
- **Features**:
  - Grid display of all saved assets
  - Filter options:
    - All Images
    - With Annotations (has annotations)
    - Without Annotations (no annotations)
  - Asset cards show:
    - Thumbnail image
    - Original filename
    - Annotation count
    - Save date
    - Label badges (up to 3 + count)
  - Click to view full details:
    - Full-size image
    - Complete annotation list
    - All labels
    - Export options
  - Delete asset button with confirmation
  - Statistics badge showing total images and annotations

#### `useAssetsManager` Hook (`frontend/src/hooks/use-assets-manager.js`)
- React hook for managing assets state
- Functions:
  - `loadAssets()`: Load all assets from backend
  - `loadStats()`: Load dataset statistics
  - `saveAsset()`: Save new asset
  - `deleteAsset()`: Delete asset
  - `getAssetDetails()`: Get full asset data
  - `getFilteredAssets()`: Get filtered assets based on annotation presence
- State management:
  - `assets`: All saved assets
  - `filteredAssets`: Filtered assets based on filter
  - `loading`: Loading state
  - `error`: Error messages
  - `stats`: Dataset statistics
  - `filterAnnotation`: Current filter ('all', 'with', 'without')

#### API Helpers (`frontend/src/lib/assets-api.js`)
- Helper functions for backend API calls
- `saveAssetToBackend()`: Save asset
- `listAssets()`: List all assets
- `getAssetDetails()`: Get asset details
- `deleteAsset()`: Delete asset
- `getAssetsStats()`: Get statistics
- `getAssetImageUrl()`: Generate image URL

### 3. **Integration in Labeling App**

The main labeling interface now includes:
- **Three Tabs in Right Sidebar**:
  1. **Labels**: Label management (existing)
  2. **Annotations**: Shows current image annotations + SaveAssetButton
  3. **Dataset**: New tab showing the AssetsViewer

- **SaveAssetButton**: Positioned above the annotations list in the Annotations tab
  - Allows users to save the current image with its annotations
  - Provides instant feedback on save status

## File Structure

```
backend/
├── routes/
│   └── assets_route.py (NEW - all API endpoints)
├── assets/ (AUTO-CREATED)
│   ├── images/ (stores image files)
│   └── annotations/ (stores JSON annotation files)
└── app.py (updated with assets blueprint)

frontend/
├── src/
│   ├── components/
│   │   ├── save-asset-button.jsx (NEW)
│   │   ├── save-asset-button.css (NEW)
│   │   ├── assets-viewer.jsx (NEW)
│   │   ├── assets-viewer.css (NEW)
│   │   └── labeling-app.jsx (UPDATED - added Assets tab)
│   ├── hooks/
│   │   ├── use-assets-manager.js (NEW)
│   │   └── use-annotation-store.js (existing)
│   └── lib/
│       └── assets-api.js (NEW - API helpers)
```

## Workflow

### Saving an Image to Dataset

1. User annotates an image in the Labeling App
2. User clicks the "Save to Dataset" button in the Annotations tab
3. Button shows "Saving..." state with spinner
4. Image and annotations are sent to backend `/api/assets/save`
5. Backend:
   - Creates unique filename with timestamp
   - Saves image to `assets/images/`
   - Saves annotations JSON to `assets/annotations/`
6. Success notification shown to user
7. Button state changes to "Saved to Dataset" ✓

### Viewing Dataset

1. User clicks the "Dataset" tab in right sidebar
2. AssetsViewer loads all saved assets from backend
3. Assets displayed in grid view with:
   - Thumbnail images
   - Metadata (name, annotation count, date)
   - Label badges
4. User can:
   - **Click asset card**: View full details in modal
   - **Click eye icon**: Quick view
   - **Click trash icon**: Delete asset (with confirmation)
   - **Filter**: Show all, with annotations, without annotations
   - **Export**: Download annotation JSON

### Filtering Assets

The filter dropdown provides three options:
- **All Images**: Shows all saved assets
- **With Annotations**: Shows only images that have at least one annotation
- **Without Annotations**: Shows only images saved without any annotations

This is similar to Roboflow's dataset browser filtering.

## API Request/Response Examples

### Save Asset
```bash
POST /api/assets/save

Request:
{
  image: <File>,
  annotations: '[{"type":"bbox","labelId":"label-123","points":[...]}]',
  labels: '[{"id":"label-123","name":"Person","color":"#3b82f6"}]',
  imageName: 'photo.jpg'
}

Response:
{
  "success": true,
  "assetId": "20240509_120530_photo",
  "image": "20240509_120530_photo.jpg",
  "annotationsFile": "20240509_120530_photo.json",
  "savedAt": "2024-05-09T12:05:30.123Z"
}
```

### List Assets
```bash
GET /api/assets/list

Response:
{
  "success": true,
  "assets": [
    {
      "id": "20240509_120530_photo",
      "image": "20240509_120530_photo.jpg",
      "originalName": "photo.jpg",
      "savedAt": "2024-05-09T12:05:30.123Z",
      "annotationCount": 3,
      "labels": [
        {"id": "label-123", "name": "Person", "color": "#3b82f6"},
        {"id": "label-456", "name": "Car", "color": "#ef4444"}
      ]
    },
    ...
  ],
  "totalAssets": 5
}
```

### Get Asset Details
```bash
GET /api/assets/20240509_120530_photo

Response:
{
  "success": true,
  "asset": {
    "image": "20240509_120530_photo.jpg",
    "originalName": "photo.jpg",
    "savedAt": "2024-05-09T12:05:30.123Z",
    "annotations": [
      {
        "type": "bbox",
        "labelId": "label-123",
        "points": [{"x": 100, "y": 150}, {"x": 200, "y": 250}],
        "confidence": 0.95
      },
      ...
    ],
    "labels": [...]
  }
}
```

### Get Statistics
```bash
GET /api/assets/stats

Response:
{
  "success": true,
  "stats": {
    "totalImages": 42,
    "totalAnnotations": 156,
    "uniqueLabels": 8,
    "labelCounts": {
      "Person": 45,
      "Car": 38,
      "Dog": 32,
      ...
    }
  }
}
```

## Future Enhancements

1. **Export Formats**: Support for COCO JSON, YOLO format, Pascal VOC, etc.
2. **Batch Operations**: Select multiple assets for bulk delete/export
3. **Search**: Search assets by filename or label
4. **Advanced Filters**: Filter by date range, label, annotation count
5. **Dataset Splitting**: Split dataset into train/val/test
6. **Version Control**: Track changes to annotations
7. **Collaborative Features**: Share datasets with team members
8. **Analytics Dashboard**: Visualizations for dataset statistics

## Testing the Implementation

### Backend Testing

1. Start Flask server: `python app.py`
2. Test save endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/assets/save \
     -F "image=@image.jpg" \
     -F 'annotations=[...]' \
     -F 'labels=[...]'
   ```
3. Check assets folder created in `backend/assets/`
4. Test list endpoint: `curl http://localhost:5000/api/assets/list`

### Frontend Testing

1. Run React dev server: `npm run dev`
2. Go to Labeling App
3. Upload images and create annotations
4. Click "Save to Dataset" button
5. Click "Dataset" tab to view saved assets
6. Test filters and delete functionality

## Troubleshooting

### Assets Not Saving
- Check backend server is running
- Verify CORS is enabled
- Check browser console for errors
- Ensure `backend/assets/` directory exists

### Images Not Loading
- Check image files in `backend/assets/images/`
- Verify image URLs are correct
- Check backend serves images from correct path

### Stats Not Updating
- Refresh the page
- Check all annotation files have valid JSON
- Verify stats endpoint returns data

## Notes

- All saved assets are stored on the server filesystem
- Annotation data is stored as JSON for easy export
- Unique filenames prevent overwrites using timestamps
- Filter state is client-side (resets on page reload)
- Images are served directly from backend at `/api/assets/image/`
