# Annotation Studio

AI-powered image annotation and object detection tool using Grounding DINO and SAM2 for automated object detection, segmentation, and precise annotation.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Image Upload Flow](#image-upload-flow)
4. [Frontend Flow](#frontend-flow)
5. [Backend Flow](#backend-flow)
6. [API Endpoints](#api-endpoints)
7. [Data Processing Pipeline](#data-processing-pipeline)
8. [Installation & Setup](#installation--setup)

---

## Overview

**Annotation Studio** is a full-stack application that enables users to upload images and automatically detect objects using AI models. The system combines:

- **Grounding DINO**: For text-based object detection with natural language prompts
- **SAM2 (Segment Anything Model 2)**: For precise instance segmentation and mask generation
- **React Frontend**: Interactive canvas-based annotation interface
- **Flask Backend**: API server handling detection and processing

The application provides a seamless workflow where users can:
1. Upload images through the web interface
2. Specify detection prompts (e.g., "person", "car", "dog")
3. Automatically detect and segment objects
4. Manually refine annotations
5. **Save annotated images to a persistent dataset** (NEW)
6. Browse and manage saved datasets with Roboflow-style interface (NEW)
7. Export annotated data in multiple formats

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE (React)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  App.jsx (Main Entry Point)                                │ │
│  │    ↓                                                         │ │
│  │  Setup Page (Model Selection) → Labeling App              │ │
│  │    ↓                                                         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │              Labeling App Component                  │ │ │
│  │  │  ┌────────────┬────────────┬────────────────────┐   │ │ │
│  │  │  │  Image     │  Label     │  Annotation        │   │ │ │
│  │  │  │  Uploader  │  Manager   │  Canvas & List     │   │ │ │
│  │  │  └────────────┴────────────┴────────────────────┘   │ │ │
│  │  │    ↓ (onUpload event)                                │ │ │
│  │  │  Auto Detect (detectObjects API call)               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                       HTTP/FormData                              │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER SIDE (Flask)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  app.py (Flask Application)                                │ │
│  │    ├── /detect (POST) → detect_route.py                   │ │
│  │    └── /output/<filename> (GET) → serve output images     │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  detect_route.py (Route Handler)                           │ │
│  │    1. Validate request (image file present)               │ │
│  │    2. Extract prompt from form data                        │ │
│  │    3. Save uploaded image to ./upload folder              │ │
│  │    4. Call detection_service.detect_objects()             │ │
│  │    5. Return JSON response with detections & output image │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  detection_service.py (Core AI Processing)               │ │
│  │    ├── Load image using Grounding DINO                   │ │
│  │    ├── Predict bounding boxes from text prompt           │ │
│  │    ├── Convert normalized boxes to pixel coordinates     │ │
│  │    ├── Generate masks using SAM2 (sam2_service)          │ │
│  │    ├── Convert masks to polygons                          │ │
│  │    ├── Create annotated output image                      │ │
│  │    └── Save output to ./output folder                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ↓                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  sam2_service.py (Segmentation)                            │ │
│  │    1. Load SAM2 model (sam2_hiera_large)                  │ │
│  │    2. Receive bounding boxes from detection               │ │
│  │    3. Generate precise masks for each box                 │ │
│  │    4. Return masks to detection_service                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Image Upload Flow

### Complete User Journey

```
1. USER UPLOADS IMAGE
   └─→ Drag & drop OR click "Browse Files"
       └─→ Select image file (JPG, PNG, WebP, GIF)

2. FRONTEND PROCESSES
   └─→ Image stored in browser state (use-annotation-store.js)
       └─→ Image converted to URL for preview
       └─→ Image file object kept for later API calls

3. USER TRIGGERS DETECTION
   └─→ Enter detection prompt (e.g., "person .cat .dog .")
       └─→ Click "Auto Detect" button

4. FRONTEND API CALL
   └─→ POST /detect
       ├─ FormData with:
       │  ├─ image: File object
       │  └─ prompt: string
       └─ Send via fetch()

5. BACKEND RECEIVES REQUEST
   └─→ Validate image file exists
       └─→ Extract prompt (default: "person .")
           └─→ Generate secure filename

6. IMAGE PROCESSING
   └─→ Save to ./upload folder
       └─→ Load with Grounding DINO
           └─→ Predict objects from text prompt
               └─→ Generate SAM2 masks
                   └─→ Create output image with annotations
                       └─→ Save to ./output folder

7. RESPONSE TO FRONTEND
   └─→ Return JSON with:
       ├─ success: boolean
       ├─ detections: array of {label, confidence, box, polygon}
       └─ output_image: filename

8. FRONTEND UPDATES UI
   └─→ Add detections to annotation store
       └─→ Display output image preview
           └─→ Show detection results & count
```

---

## Frontend Flow

### Component Hierarchy & Data Flow

```
App.jsx
├─ SetupPage (initial model selection)
│  └─ onContinue → setSetupData
│
└─ LabelingApp (main annotation interface)
   ├─ ImageUploader
   │  ├─ Drag & drop zone
   │  ├─ File input dialog
   │  ├─ handleDrop → onUpload(files)
   │  └─ handleFileSelect → onUpload(files)
   │     └─ Filtered to image/* MIME types
   │
   ├─ LabelManager
   │  └─ Manage detection labels & shortcuts
   │
   ├─ Toolbar
   │  ├─ Tool selection (select, bbox, polygon, etc.)
   │  ├─ "Auto Detect" button
   │  │  └─ handleAutoDetect() → detectObjects(img.file, prompt)
   │  └─ Detection prompt input field
   │
   ├─ AnnotationCanvas
   │  ├─ Display current image
   │  ├─ Render detected objects (bounding boxes & polygons)
   │  └─ Handle manual annotation editing
   │
   └─ AnnotationList
      └─ List all annotations for current image
```

### Image Upload Sequence

```
User Action: Upload Image File(s)
    ↓
ImageUploader.onUpload(files)
    ↓
Filter image files & validate MIME type
    ↓
useAnnotationStore.addImages(files)
    ↓
Store updates:
├─ Generate unique ID for each image
├─ Create blob URL for preview
├─ Store original File object
└─ Initialize empty annotations array
    ↓
ImageUploader renders image thumbnails
    ↓
User selects image & enters detection prompt
    ↓
Toolbar: handleAutoDetect()
    ↓
API Call: detectObjects(img.file, prompt)
    └─ FormData.append('image', img.file)
    └─ FormData.append('prompt', prompt)
    └─ fetch(POST /detect)
```

### Key Hooks & State Management

- **use-annotation-store.js**: Zustand store for global state
  - `images`: Array of uploaded images with annotations
  - `currentImage`: Currently selected image
  - `selectedAnnotationId`: Active annotation for editing
  - `selectedTool`: Active drawing tool (bbox, polygon, etc.)
  - `labels`: Detection labels with shortcuts

---

## Backend Flow

### Request Handling Process

```
Flask Application (app.py)
    ↓
CORS enabled for cross-origin requests
    ↓
Blueprint: detect_bp.route("/detect", methods=["POST"])
    ↓
detect_route.py → detect() function
    │
    ├─ STEP 1: Validate Request
    │  └─ Check: "image" in request.files
    │     └─ If missing → Return 400: "No image uploaded"
    │
    ├─ STEP 2: Extract Data
    │  ├─ image = request.files["image"]
    │  ├─ prompt = request.form.get("prompt", "person .")
    │  └─ filename = secure_filename(image.filename)
    │
    ├─ STEP 3: Save Image
    │  └─ image_path = os.path.join("upload/", filename)
    │  └─ image.save(image_path)
    │
    ├─ STEP 4: Process Detection
    │  └─ detection_service.detect_objects(image_path, prompt)
    │     │
    │     ├─ Load Models
    │     │  ├─ Grounding DINO (CONFIG: GroundingDINO_SwinT_OGC.py)
    │     │  ├─ Weights: groundingdino_swint_ogc.pth
    │     │  └─ Device: CPU
    │     │
    │     ├─ Image Preparation
    │     │  ├─ load_image(image_path)
    │     │  │  ├─ Read with cv2 (BGR format)
    │     │  │  └─ Convert for model input (RGB)
    │     │  └─ Extract dimensions (h, w)
    │     │
    │     ├─ Object Detection (Grounding DINO)
    │     │  ├─ predict(model, image, caption, box_threshold, text_threshold)
    │     │  │  ├─ caption = user prompt (e.g., "person .cat .dog .")
    │     │  │  ├─ box_threshold = 0.35 (confidence threshold)
    │     │  │  ├─ text_threshold = 0.25 (text matching threshold)
    │     │  │  └─ Returns: boxes (normalized), logits (confidence), phrases
    │     │  │     └─ boxes format: [center_x, center_y, width, height] (0-1)
    │     │  │
    │     │  └─ Convert Normalized → Pixel Coordinates
    │     │     └─ For each box:
    │     │        └─ Convert [cx, cy, w, h] → [x1, y1, x2, y2] (pixels)
    │     │
    │     ├─ Segmentation (SAM2)
    │     │  ├─ sam2_service.generate_masks(image_source, pixel_boxes)
    │     │  │  ├─ Set image: predictor.set_image(image)
    │     │  │  ├─ Predict masks: predictor.predict(box=input_boxes, multimask_output=False)
    │     │  │  └─ Returns: masks array (one per detection)
    │     │  │
    │     │  └─ Convert Mask → Polygon
    │     │     └─ _mask_to_polygon(mask)
    │     │        ├─ Extract contours using cv2.findContours()
    │     │        ├─ Find largest contour
    │     │        ├─ Approximate with cv2.approxPolyDP() (reduce points)
    │     │        └─ Return: [{x, y}, {x, y}, ...] points
    │     │
    │     ├─ Build Detections Array
    │     │  └─ For each detected object:
    │     │     ├─ label: phrase (e.g., "person")
    │     │     ├─ confidence: logit (0-1)
    │     │     ├─ box: [x1, y1, x2, y2] pixels
    │     │     └─ polygon: [{x, y}, ...] points
    │     │
    │     ├─ Generate Annotated Image
    │     │  ├─ annotate(image_source, boxes, logits, phrases)
    │     │  │  └─ Draws bounding boxes with labels on original image
    │     │  │
    │     │  └─ Save Output
    │     │     ├─ output_filename = f"detected_{original_filename}"
    │     │     └─ cv2.imwrite(output_path, annotated_frame)
    │     │
    │     └─ Return: {detections: [...], output_image: filename}
    │
    └─ STEP 5: Return Response
       └─ return jsonify({
            "success": True,
            "detections": [...],
            "output_image": "detected_image.avif"
          })

Client receives JSON response
    ↓
Frontend updates annotation store with detections
```

---

## API Endpoints

### 1. **POST /detect** - Upload Image & Detect Objects

**Request:**
```
POST /detect HTTP/1.1
Content-Type: multipart/form-data

FormData:
├─ image: File (binary)
└─ prompt: string (optional, default: "person .")
```

**Example Request (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('prompt', 'person .cat .dog .');

const response = await fetch('/detect', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Response (200 OK):**
```json
{
  "success": true,
  "detections": [
    {
      "label": "person",
      "confidence": 0.89,
      "box": [100, 150, 300, 450],
      "polygon": [
        {"x": 105, "y": 152},
        {"x": 298, "y": 165},
        {"x": 295, "y": 448},
        {"x": 102, "y": 440}
      ]
    },
    {
      "label": "cat",
      "confidence": 0.76,
      "box": [350, 200, 450, 320],
      "polygon": [...]
    }
  ],
  "output_image": "detected_myimage.avif"
}
```

**Response Fields:**
- `success`: Boolean indicating successful detection
- `detections`: Array of detected objects
  - `label`: Detected object class name (from prompt)
  - `confidence`: Detection confidence (0-1)
  - `box`: Bounding box [x1, y1, x2, y2] in pixels
  - `polygon`: Segmentation mask as polygon points
- `output_image`: Filename of annotated image in `/output` folder

**Error Response (400):**
```json
{
  "error": "No image uploaded"
}
```

**Parameters:**
| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| image | File | Image file (JPG, PNG, WebP, GIF) | Yes | - |
| prompt | string | Detection prompt (e.g., "person .cat .") | No | "person ." |

**Model Configuration:**
- **Detection Model**: Grounding DINO (SwinT backbone)
- **Segmentation Model**: SAM2 (Hierarchical Large)
- **Box Threshold**: 0.35 (confidence threshold for boxes)
- **Text Threshold**: 0.25 (confidence threshold for text matching)

---

### 2. **GET /output/<filename>** - Retrieve Output Image

**Request:**
```
GET /output/detected_myimage.avif HTTP/1.1
```

**Response:**
- Returns image file (AVIF, JPG, PNG, etc.)
- Served from `./output/` directory

**Usage in Frontend:**
```javascript
// After receiving response from /detect endpoint
const imageUrl = `/output/${data.output_image}`;
// Use in <img src={imageUrl} />
```

---

### 3. **GET /** - Health Check

**Request:**
```
GET / HTTP/1.1
```

**Response (200 OK):**
```json
{
  "message": "AI Annotation Backend Running"
}
```

---

## Data Processing Pipeline

### Detailed Step-by-Step Processing

```
INPUT: Image File + Text Prompt
  └─ Example: cat.jpg + "cat .dog ."

STEP 1: IMAGE LOADING
  Input: cat.jpg (e.g., 1920×1080 pixels)
  Process:
    ├─ Read with cv2.imread() → BGR format
    └─ Convert to RGB for model compatibility
  Output: image_source (numpy array), dimensions (1080, 1920)

STEP 2: GROUNDING DINO INFERENCE
  Input: RGB image, prompt="cat .dog ."
  Process:
    ├─ Tokenize prompt using BERT encoder
    ├─ Extract visual features using Swin Transformer backbone
    ├─ Match text embeddings with visual embeddings
    ├─ Generate bounding box predictions (normalized: 0-1 range)
    └─ Apply box_threshold=0.35 to filter low-confidence boxes
  Output:
    ├─ boxes: [[0.1, 0.2, 0.35, 0.55], [0.6, 0.3, 0.85, 0.7], ...]
    ├─ logits: [0.89, 0.76, 0.65, ...]
    └─ phrases: ["cat", "dog", "background", ...]

STEP 3: NORMALIZE → PIXEL CONVERSION
  Input: Normalized boxes (0-1), image dimensions (1080, 1920)
  Process:
    └─ For box [cx=0.1, cy=0.2, w=0.25, h=0.35]:
       ├─ x1 = (0.1 - 0.25/2) × 1920 = 96 pixels
       ├─ y1 = (0.2 - 0.35/2) × 1080 = 27 pixels
       ├─ x2 = (0.1 + 0.25/2) × 1920 = 288 pixels
       └─ y2 = (0.2 + 0.35/2) × 1080 = 405 pixels
       Output: [96, 27, 288, 405]
  Output: pixel_boxes: [[96, 27, 288, 405], [1152, 324, 1632, 756], ...]

STEP 4: SAM2 SEGMENTATION
  Input: Original image, pixel_boxes
  Process:
    ├─ Set image in SAM2 predictor: predictor.set_image(image_source)
    ├─ Predict masks for each box: predictor.predict(box=pixel_boxes)
    ├─ Generate per-object masks (binary format)
    └─ Return multimask_output=False (single mask per box)
  Output: masks array (one mask per detection, each is 2D binary array)

STEP 5: MASK → POLYGON CONVERSION
  Input: Binary mask (1920×1080 with 0s and 1s)
  Process:
    ├─ Extract contours: cv2.findContours()
    ├─ Find largest contour (main object boundary)
    ├─ Simplify with cv2.approxPolyDP() (epsilon=0.5% of perimeter)
    └─ Convert to point coordinates
  Output: [{x: 96, y: 27}, {x: 145, y: 18}, {x: 200, y: 25}, ...]

STEP 6: BUILD DETECTION OBJECTS
  Input: boxes, phrases, logits, polygons
  Process:
    └─ For each detection:
       ├─ label: phrase from detection
       ├─ confidence: logit value
       ├─ box: pixel coordinates [x1, y1, x2, y2]
       └─ polygon: simplified contour points
  Output: detections array
    [
      {
        "label": "cat",
        "confidence": 0.89,
        "box": [96, 27, 288, 405],
        "polygon": [{x: 96, y: 27}, ...]
      },
      ...
    ]

STEP 7: CREATE ANNOTATED IMAGE
  Input: Original image, boxes, phrases, logits
  Process:
    ├─ Call annotate() function from GroundingDINO
    ├─ Draw bounding boxes in bright colors
    ├─ Add labels with confidence scores
    └─ Create visual representation of detections
  Output: annotated_frame (image with boxes overlayed)

STEP 8: SAVE OUTPUTS
  Input: detections array, annotated image
  Process:
    ├─ output_filename = "detected_cat.jpg"
    ├─ cv2.imwrite("output/detected_cat.jpg", annotated_frame)
    └─ Store detections in memory for response
  Output Files:
    ├─ ./output/detected_cat.jpg (annotated image)
    └─ Response: {detections: [...], output_image: "detected_cat.jpg"}

OUTPUT: JSON Response
  {
    "success": true,
    "detections": [
      {
        "label": "cat",
        "confidence": 0.89,
        "box": [96, 27, 288, 405],
        "polygon": [...]
      }
    ],
    "output_image": "detected_cat.jpg"
  }
```

---

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- CUDA (optional, for GPU acceleration)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download model weights
# Place weights in: backend/weights/groundingdino_swint_ogc.pth
# Place SAM2 checkpoint: backend/checkpoints/sam2_hiera_large.pt

# Run Flask server
python app.py
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default port).

---

## File Structure Reference

```
Backend:
├─ app.py                          # Flask application entry point
├─ requirements.txt                # Python dependencies
├─ routes/
│  └─ detect_route.py              # /detect endpoint handler
├─ service/
│  ├─ detection_service.py         # Main AI processing logic
│  └─ sam2_service.py              # Segmentation service
├─ GroundingDINO/                  # Grounding DINO model code
├─ sam2_repo/                      # SAM2 model code
├─ weights/
│  └─ groundingdino_swint_ogc.pth  # Model weights
├─ checkpoints/
│  └─ sam2_hiera_large.pt          # SAM2 checkpoint
├─ upload/                         # Temporary upload folder
└─ output/                         # Annotated output images

Frontend:
├─ src/App.jsx                     # Main React component
├─ components/
│  ├─ image-uploader.jsx           # File upload component
│  ├─ labeling-app.jsx             # Main app interface
│  ├─ annotation-canvas.jsx        # Drawing canvas
│  └─ ...
├─ hooks/
│  └─ use-annotation-store.js      # Zustand store
├─ lib/
│  └─ api.js                       # API client (detectObjects)
└─ vite.config.js                  # Build config
```

---

## Key Technologies

### Frontend
- **React 18**: UI framework
- **Zustand**: State management
- **Vite**: Build tool
- **Tailwind CSS**: Styling

### Backend
- **Flask**: Web framework
- **PyTorch**: ML framework
- **Grounding DINO**: Object detection
- **SAM2**: Segmentation model
- **OpenCV**: Image processing

---
