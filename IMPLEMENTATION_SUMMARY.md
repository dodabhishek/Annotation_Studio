# Annotation Studio - Updated Features

## ✅ Features Implemented

### 1. **Bounding Box Only Shows on Drag**
- **Location**: `annotation-canvas.jsx`
- **How it works**: Added minimum drag distance check (3 pixels) before showing the bbox preview
- **Benefits**: Users can move their mouse around without accidentally creating boxes
- **Key changes**:
  - Added `dragDistanceRef` to track cursor movement
  - Added `MIN_DRAG_DISTANCE` constant
  - Only display `currentPoints` after minimum distance is reached

### 2. **Move Existing Annotations**
- **Location**: `annotation-canvas.jsx`
- **How it works**: 
  - Click on annotation to select it
  - Drag to move the entire annotation
  - Drag specific points/handles to move individual points
- **Key changes**:
  - Added `isMovingAnnotation` and `selectedAnnotationHandle` state
  - Updated `handleMouseDown()` to detect when clicking on annotation handles
  - Updated `handleMouseMove()` to translate points when dragging
  - Updated `handleMouseUp()` to finish the move operation

### 3. **Label Naming Dialog (Loboflow-style)**
- **Location**: `label-naming-dialog.jsx` (new file)
- **How it works**:
  - When user creates annotation, a dialog appears
  - User can either:
    - Select an existing label (with usage count shown)
    - Create a new label with custom name and color
  - Dialog shows label counts to help user identify existing labels
- **Features**:
  - Radio buttons to switch between "Use Existing" and "Create New"
  - Color picker for new labels
  - Shows usage count for existing labels
  - Auto-confirm on Enter key

### 4. **Label Usage Counts**
- **Location**: `label-manager.jsx` and `use-annotation-store.js`
- **How it works**:
  - Counts how many times each label is used across all annotations
  - Displays count next to label name in label manager
  - Counts visible in label naming dialog
- **Key changes**:
  - Added `getLabelCounts()` function to calculate counts
  - Added `labelCounts` prop to `LabelManager` component
  - Updated `labeling-app.jsx` to track and pass label counts

### 5. **Dynamic Label Creation During Annotation**
- **Location**: `use-annotation-store.js` and `labeling-app.jsx`
- **How it works**:
  - `getOrCreateLabel()` function creates new label if needed
  - Automatically assigns color from color palette
  - Assigns keyboard shortcut if less than 9 labels
- **Key changes**:
  - Added `getOrCreateLabel()` callback in store
  - Integrated with label naming dialog

## 🔧 Technical Implementation Details

### State Management
- **annotation-canvas.jsx**:
  - `isMovingAnnotation`: Boolean to track if dragging annotation
  - `selectedAnnotationHandle`: Index of the point being moved
  - `dragDistanceRef`: Tracks distance moved for minimum drag detection

- **labeling-app.jsx**:
  - `pendingAnnotation`: Stores annotation data before label selection
  - `showLabelNamingDialog`: Controls dialog visibility
  - `labelCounts`: Object with label IDs and their usage counts

### Flow Diagram
```
User creates annotation
    ↓
handleAnnotationCreated() called
    ↓
pendingAnnotation stored
    ↓
Label Naming Dialog shown
    ↓
User selects/creates label
    ↓
handleLabelSelected() called with labelId
    ↓
Annotation added to store with labelId
    ↓
Label counts updated
```

## 🎯 Usage Instructions

### Drawing Annotations
1. Select tool (Box, Polygon, etc.)
2. Click and **drag** to create annotation
   - Preview only shows after dragging 3+ pixels
3. When complete, dialog appears to name/select label
4. Choose existing label or create new one
5. Annotation is saved with selected label

### Moving Annotations
1. Select "Select" tool (V key)
2. Click on annotation to select it
3. Click and drag to move entire annotation
4. Or drag specific points to adjust shape

### Working with Labels
- Labels panel shows all labels with usage counts
- Click label to select it (for pre-selection before drawing)
- Hover to edit or delete labels

## 📝 File Changes

### New Files
- `/frontend/src/components/label-naming-dialog.jsx` - Label selection/creation dialog

### Modified Files
- `/frontend/src/components/annotation-canvas.jsx` - Added drag detection and move functionality
- `/frontend/src/components/labeling-app.jsx` - Added dialog integration and label count tracking
- `/frontend/src/components/label-manager.jsx` - Added label count display
- `/frontend/src/hooks/use-annotation-store.js` - Added label management utilities

## 🐛 Bug Fixes
- Fixed infinite update loop by removing `store` from useEffect dependencies
- Fixed label count calculation to properly aggregate counts across images

## ✨ Next Steps (Optional)
- Add ability to rename labels after creation
- Add keyboard shortcuts for label selection in dialog (1-9 keys)
- Add undo/redo for annotation operations
- Add export with label information in multiple formats
