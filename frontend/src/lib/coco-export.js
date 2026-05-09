/**
 * Convert annotations to COCO format
 */
export function generateCOCODataset(images, labels, annotationsByImageId) {
  const timestamp = new Date().toISOString();
  
  // Build categories from labels
  const categories = labels.map((label, idx) => ({
    id: idx,
    name: label.name,
    supercategory: 'none'
  }));

  // Create a map of label id to category id
  const labelToCategoryId = {};
  labels.forEach((label, idx) => {
    labelToCategoryId[label.id] = idx;
  });

  // Build images array with metadata
  const cocoImages = images.map((image, imgIdx) => ({
    id: imgIdx,
    license: 1,
    file_name: image.name,
    height: image.height || 0,
    width: image.width || 0,
    date_captured: timestamp,
    extra: {
      name: image.name
    }
  }));

  // Build annotations array
  const cocoAnnotations = [];
  let annotationId = 1;

  images.forEach((image, imgIdx) => {
    const imageAnnotations = annotationsByImageId[image.id] || [];
    
    imageAnnotations.forEach(annotation => {
      const categoryId = labelToCategoryId[annotation.labelId];
      
      if (annotation.type === 'bbox' && annotation.points.length === 2) {
        const [p1, p2] = annotation.points;
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);
        const area = width * height;

        cocoAnnotations.push({
          id: annotationId,
          image_id: imgIdx,
          category_id: categoryId,
          bbox: [x, y, width, height],
          area: area,
          segmentation: [],
          iscrowd: 0
        });
        annotationId++;
      } else if (annotation.type === 'polygon' && annotation.points.length > 2) {
        // Convert polygon to segmentation format
        const segmentation = annotation.points.flatMap(p => [p.x, p.y]);
        const xs = annotation.points.map(p => p.x);
        const ys = annotation.points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const width = maxX - minX;
        const height = maxY - minY;
        const area = width * height;

        cocoAnnotations.push({
          id: annotationId,
          image_id: imgIdx,
          category_id: categoryId,
          bbox: [minX, minY, width, height],
          area: area,
          segmentation: [segmentation],
          iscrowd: 0
        });
        annotationId++;
      }
    });
  });

  // Construct the full COCO dataset
  const cocoDataset = {
    info: {
      year: new Date().getFullYear().toString(),
      version: 'dataset',
      description: 'Exported from Annotation Studio',
      contributor: '',
      url: 'https://annotation-studio.local',
      date_created: timestamp
    },
    licenses: [
      {
        id: 1,
        url: '',
        name: 'Unknown'
      }
    ],
    categories: categories,
    images: cocoImages,
    annotations: cocoAnnotations
  };

  return cocoDataset;
}

/**
 * Export dataset as JSON
 */
export function downloadCOCODataset(dataset, filename = '_annotations.coco.json') {
  const jsonData = JSON.stringify(dataset, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get image dimensions by loading the image
 */
export async function getImageDimensions(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Export dataset with all image files and metadata
 */
export async function exportDatasetAsZip(images, labels, store) {
  // This would require a ZIP library like JSZip
  // For now, we'll just generate the COCO JSON
  const annotationsByImageId = {};
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    annotationsByImageId[image.id] = image.annotations || [];
  }

  // Get image dimensions
  const enrichedImages = [];
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    let dimensions = { width: 0, height: 0 };
    try {
      dimensions = await getImageDimensions(image.file);
    } catch (err) {
      console.error('Failed to get image dimensions:', err);
    }
    enrichedImages.push({
      ...image,
      width: dimensions.width,
      height: dimensions.height
    });
  }

  return generateCOCODataset(enrichedImages, labels, annotationsByImageId);
}
