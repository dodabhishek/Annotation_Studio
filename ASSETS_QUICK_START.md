# Assets Management - Quick Start Guide

## What is the Assets System?

The Assets Management System lets you save annotated images to a persistent dataset. It's similar to Roboflow's dataset management interface, allowing you to:
- Save images with their annotations
- Browse saved images in a grid view
- Filter images by annotation status
- View and export annotation data
- Manage your dataset

## Quick Start

### 1. Annotate Images
- Upload images in the main Labeling App
- Use the drawing tools to create annotations (Boxes, Polygons, Points, Lines)
- Assign labels to each annotation

### 2. Save to Dataset
After annotating an image:
1. Go to the **Annotations** tab (right sidebar)
2. Click the **"Save to Dataset"** button
3. Wait for the confirmation (check mark appears when saved)
4. The image and all annotations are now saved

### 3. View Your Dataset
1. Click the **"Dataset"** tab in the right sidebar
2. See all your saved images in a grid view
3. Each image card shows:
   - Thumbnail
   - Filename
   - Number of annotations
   - Date saved
   - Label colors used

### 4. Manage Assets
In the Dataset tab, you can:

#### **Filter Images**
Use the filter dropdown to show:
- **All Images**: Every saved image
- **With Annotations**: Only images that have annotations
- **Without Annotations**: Only images saved without annotations (useful for finding incomplete work)

#### **View Details**
- Click any image card to see full details
- Modal shows:
  - Full-size image
  - All annotations with labels
  - Confidence scores (if available)
  - Export buttons

#### **Export Annotations**
In the details modal:
- Click "Export" to download annotation JSON
- Click "Download Full JSON" to get complete asset data

#### **Delete Images**
- Hover over an image card
- Click the trash icon
- Confirm deletion
- Image and annotations are permanently removed

## Dataset Statistics

At the top of the Dataset tab, you'll see:
- **Total Images**: Count of all saved images
- **Total Annotations**: Count of all annotations across all images

## File Storage

Saved assets are stored in:
```
backend/assets/
├── images/           # Image files
│   ├── 20240509_120530_photo.jpg
│   ├── 20240509_130045_screenshot.png
│   └── ...
└── annotations/      # Annotation JSON files
    ├── 20240509_120530_photo.json
    ├── 20240509_130045_screenshot.json
    └── ...
```

Each image gets a unique timestamped filename to prevent overwrites.

## JSON Format

Saved annotations are in this format:
```json
{
  "image": "20240509_120530_photo.jpg",
  "originalName": "photo.jpg",
  "savedAt": "2024-05-09T12:05:30.123Z",
  "annotations": [
    {
      "type": "bbox",
      "labelId": "label-123",
      "points": [
        {"x": 100, "y": 150},
        {"x": 200, "y": 250}
      ],
      "confidence": 0.95
    },
    {
      "type": "polygon",
      "labelId": "label-456",
      "points": [
        {"x": 50, "y": 50},
        {"x": 150, "y": 50},
        {"x": 175, "y": 150},
        {"x": 50, "y": 150}
      ]
    }
  ],
  "labels": [
    {
      "id": "label-123",
      "name": "Person",
      "color": "#3b82f6"
    },
    {
      "id": "label-456",
      "name": "Car",
      "color": "#ef4444"
    }
  ]
}
```

## Common Workflows

### Save Multiple Annotated Images
1. Annotate first image
2. Click "Save to Dataset"
3. Move to next image (keyboard: →)
4. Repeat until done
5. All images are saved as you go

### Review Your Saved Dataset
1. Click "Dataset" tab
2. Scroll through grid to see all images
3. Click any image for details
4. Use filter to find specific types

### Find Images Needing Work
1. Click "Dataset" tab
2. Filter: "Without Annotations"
3. Click on each image to add annotations
4. No need to re-save - just save when done

### Export Dataset
1. Click "Dataset" tab
2. Click image details (eye icon)
3. Click "Export" or "Download Full JSON"
4. File downloads with all annotation data

## Tips & Tricks

✅ **Save frequently** - Use the save button after important annotations
✅ **Use meaningful labels** - Consistent labels make better datasets
✅ **Check your work** - Use "Without Annotations" filter to find incomplete images
✅ **Export often** - Regular exports ensure you have backups
✅ **Use keyboard shortcuts** - Arrow keys to navigate, Delete to remove annotations

## Keyboard Shortcuts (in Labeling App)

| Key | Action |
|-----|--------|
| `B` | Box tool |
| `P` | Polygon tool |
| `L` | Line tool |
| `K` | Point tool |
| `V` | Select tool |
| `→` or `D` | Next image |
| `←` or `A` | Previous image |
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `Delete` | Remove selected annotation |
| `1-9` | Select label by number |

## Troubleshooting

### "Save to Dataset" button is disabled
- Make sure you've selected an image
- Check the image is loaded properly

### Images aren't appearing in Dataset tab
- Refresh the page
- Check backend is running
- Look for error messages in browser console

### Images appear but annotations don't show
- Verify annotations were created before saving
- Check annotation JSON in details modal

### Image won't delete
- Confirm deletion in the popup
- Refresh page if issue persists

## Need Help?

Check these files for more details:
- `ASSETS_IMPLEMENTATION.md` - Technical documentation
- `README.md` - General project info
- Backend logs for API errors

Happy annotating! 🎉
