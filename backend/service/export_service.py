import os
import json
import shutil
import cv2
import zipfile
import io
import csv
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
import numpy as np

def generate_export_zip(assets_dir, format_type):
    """
    Generates an export zip file depending on the format_type.
    format_type can be: 'yolo', 'coco', 'voc', 'csv', 'png', 'default'
    """
    images_dir = os.path.join(assets_dir, 'images')
    annotations_dir = os.path.join(assets_dir, 'annotations')
    
    if format_type == 'yolo':
        return export_yolo(images_dir, annotations_dir)
    elif format_type == 'coco':
        return export_coco(images_dir, annotations_dir)
    elif format_type == 'voc':
        return export_voc(images_dir, annotations_dir)
    elif format_type == 'csv':
        return export_csv(images_dir, annotations_dir)
    elif format_type == 'png':
        return export_png_masks(images_dir, annotations_dir)
    else:
        # Default folder structure
        return export_default(images_dir, annotations_dir)

def get_image_dimensions(image_path):
    # Using cv2 to get image width and height
    img = cv2.imread(image_path)
    if img is not None:
        return img.shape[1], img.shape[0] # width, height
    return 0, 0

def collect_global_labels(annotations_dir):
    """
    Scans all annotations and returns a consistent mapping of label_name -> integer_id
    """
    labels_set = set()
    for root, _, files in os.walk(annotations_dir):
        for file in files:
            if file.endswith('.json'):
                with open(os.path.join(root, file), 'r') as f:
                    data = json.load(f)
                    for label in data.get('labels', []):
                        labels_set.add(label.get('name'))
    
    sorted_labels = sorted(list(labels_set))
    label_map = {name: idx for idx, name in enumerate(sorted_labels)}
    return sorted_labels, label_map

def export_yolo(images_dir, annotations_dir):
    """
    YOLO PyTorch format:
    A dataset with images/ and labels/ directories.
    Labels are .txt files with <class_id> <x_center> <y_center> <width> <height>
    Coordinates are normalized (0-1).
    Includes a classes.txt or data.yaml
    """
    sorted_labels, label_map = collect_global_labels(annotations_dir)
    
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Write classes.txt
        zf.writestr('classes.txt', '\n'.join(sorted_labels))
        
        # Write images and labels
        for root, _, files in os.walk(annotations_dir):
            for file in files:
                if file.endswith('.json'):
                    ann_path = os.path.join(root, file)
                    with open(ann_path, 'r') as f:
                        data = json.load(f)
                        
                    image_filename = data.get('image')
                    image_path = os.path.join(images_dir, image_filename)
                    
                    if not os.path.exists(image_path):
                        continue
                        
                    img_w, img_h = get_image_dimensions(image_path)
                    if img_w == 0 or img_h == 0:
                        continue
                    
                    # Add image to zip
                    zf.write(image_path, os.path.join('images', image_filename))
                    
                    # Create label .txt
                    txt_lines = []
                    local_labels = {l['id']: l['name'] for l in data.get('labels', [])}
                    
                    for ann in data.get('annotations', []):
                        label_name = local_labels.get(ann.get('labelId'))
                        if not label_name:
                            continue
                            
                        class_id = label_map[label_name]
                        points = ann.get('points', [])
                        
                        if ann.get('type') == 'bbox' and len(points) == 2:
                            x_min = min(p['x'] for p in points)
                            y_min = min(p['y'] for p in points)
                            x_max = max(p['x'] for p in points)
                            y_max = max(p['y'] for p in points)
                            
                            w = x_max - x_min
                            h = y_max - y_min
                            cx = x_min + w / 2
                            cy = y_min + h / 2
                            
                            # Normalize
                            cx /= img_w
                            cy /= img_h
                            w /= img_w
                            h /= img_h
                            
                            txt_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
                            
                        elif ann.get('type') == 'polygon' and len(points) > 2:
                            # For standard YOLOv8 OBB or polygon segmentation, format is class_id x1 y1 x2 y2...
                            # But standard YOLO bounding box is bounding box of polygon
                            x_min = min(p['x'] for p in points)
                            y_min = min(p['y'] for p in points)
                            x_max = max(p['x'] for p in points)
                            y_max = max(p['y'] for p in points)
                            
                            w = x_max - x_min
                            h = y_max - y_min
                            cx = x_min + w / 2
                            cy = y_min + h / 2
                            
                            # Normalize
                            cx /= img_w
                            cy /= img_h
                            w /= img_w
                            h /= img_h
                            
                            txt_lines.append(f"{class_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
                    
                    # Write label file
                    base_name = os.path.splitext(image_filename)[0]
                    zf.writestr(os.path.join('labels', f"{base_name}.txt"), '\n'.join(txt_lines))
                    
    memory_file.seek(0)
    return memory_file

def export_coco(images_dir, annotations_dir):
    """
    COCO JSON Format
    A single _annotations.coco.json with info, licenses, categories, images, annotations
    """
    sorted_labels, label_map = collect_global_labels(annotations_dir)
    
    coco_data = {
        "info": {
            "year": datetime.now().year,
            "version": "1.0",
            "description": "Exported from Annotation Studio",
            "date_created": datetime.now().isoformat()
        },
        "licenses": [],
        "categories": [{"id": idx, "name": name, "supercategory": "none"} for name, idx in label_map.items()],
        "images": [],
        "annotations": []
    }
    
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        
        image_id_counter = 0
        annotation_id_counter = 0
        
        for root, _, files in os.walk(annotations_dir):
            for file in files:
                if file.endswith('.json'):
                    ann_path = os.path.join(root, file)
                    with open(ann_path, 'r') as f:
                        data = json.load(f)
                        
                    image_filename = data.get('image')
                    image_path = os.path.join(images_dir, image_filename)
                    
                    if not os.path.exists(image_path):
                        continue
                        
                    img_w, img_h = get_image_dimensions(image_path)
                    if img_w == 0 or img_h == 0:
                        continue
                    
                    image_id = image_id_counter
                    image_id_counter += 1
                    
                    coco_data['images'].append({
                        "id": image_id,
                        "file_name": image_filename,
                        "width": img_w,
                        "height": img_h,
                        "date_captured": data.get('savedAt', '')
                    })
                    
                    # Add image to zip
                    zf.write(image_path, image_filename)
                    
                    local_labels = {l['id']: l['name'] for l in data.get('labels', [])}
                    
                    for ann in data.get('annotations', []):
                        label_name = local_labels.get(ann.get('labelId'))
                        if not label_name:
                            continue
                            
                        category_id = label_map[label_name]
                        points = ann.get('points', [])
                        
                        if len(points) < 2:
                            continue
                            
                        x_min = min(p['x'] for p in points)
                        y_min = min(p['y'] for p in points)
                        x_max = max(p['x'] for p in points)
                        y_max = max(p['y'] for p in points)
                        
                        w = x_max - x_min
                        h = y_max - y_min
                        area = w * h
                        
                        segmentation = []
                        if ann.get('type') == 'polygon':
                            segmentation = [[val for p in points for val in (p['x'], p['y'])]]
                        
                        coco_data['annotations'].append({
                            "id": annotation_id_counter,
                            "image_id": image_id,
                            "category_id": category_id,
                            "bbox": [x_min, y_min, w, h],
                            "area": area,
                            "segmentation": segmentation,
                            "iscrowd": 0
                        })
                        annotation_id_counter += 1
                        
        zf.writestr('_annotations.coco.json', json.dumps(coco_data, indent=2))
        
    memory_file.seek(0)
    return memory_file

def export_voc(images_dir, annotations_dir):
    """
    Pascal VOC XML format
    An annotations directory with an .xml file per image
    """
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        
        for root, _, files in os.walk(annotations_dir):
            for file in files:
                if file.endswith('.json'):
                    ann_path = os.path.join(root, file)
                    with open(ann_path, 'r') as f:
                        data = json.load(f)
                        
                    image_filename = data.get('image')
                    image_path = os.path.join(images_dir, image_filename)
                    
                    if not os.path.exists(image_path):
                        continue
                        
                    img_w, img_h = get_image_dimensions(image_path)
                    if img_w == 0 or img_h == 0:
                        continue
                    
                    # Add image to zip
                    zf.write(image_path, os.path.join('images', image_filename))
                    
                    # Create XML
                    annotation = ET.Element('annotation')
                    ET.SubElement(annotation, 'folder').text = 'images'
                    ET.SubElement(annotation, 'filename').text = image_filename
                    ET.SubElement(annotation, 'path').text = image_filename
                    
                    source = ET.SubElement(annotation, 'source')
                    ET.SubElement(source, 'database').text = 'Unknown'
                    
                    size = ET.SubElement(annotation, 'size')
                    ET.SubElement(size, 'width').text = str(img_w)
                    ET.SubElement(size, 'height').text = str(img_h)
                    ET.SubElement(size, 'depth').text = '3'
                    
                    ET.SubElement(annotation, 'segmented').text = '0'
                    
                    local_labels = {l['id']: l['name'] for l in data.get('labels', [])}
                    
                    for ann in data.get('annotations', []):
                        label_name = local_labels.get(ann.get('labelId'))
                        if not label_name:
                            continue
                            
                        points = ann.get('points', [])
                        if len(points) < 2:
                            continue
                            
                        x_min = int(min(p['x'] for p in points))
                        y_min = int(min(p['y'] for p in points))
                        x_max = int(max(p['x'] for p in points))
                        y_max = int(max(p['y'] for p in points))
                        
                        obj = ET.SubElement(annotation, 'object')
                        ET.SubElement(obj, 'name').text = label_name
                        ET.SubElement(obj, 'pose').text = 'Unspecified'
                        ET.SubElement(obj, 'truncated').text = '0'
                        ET.SubElement(obj, 'difficult').text = '0'
                        
                        bndbox = ET.SubElement(obj, 'bndbox')
                        ET.SubElement(bndbox, 'xmin').text = str(x_min)
                        ET.SubElement(bndbox, 'ymin').text = str(y_min)
                        ET.SubElement(bndbox, 'xmax').text = str(x_max)
                        ET.SubElement(bndbox, 'ymax').text = str(y_max)
                        
                    xml_str = minidom.parseString(ET.tostring(annotation)).toprettyxml(indent="  ")
                    base_name = os.path.splitext(image_filename)[0]
                    zf.writestr(os.path.join('annotations', f"{base_name}.xml"), xml_str)
                    
    memory_file.seek(0)
    return memory_file

def export_csv(images_dir, annotations_dir):
    """
    TensorFlow Object Detection CSV format
    filename,width,height,class,xmin,ymin,xmax,ymax
    """
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(['filename', 'width', 'height', 'class', 'xmin', 'ymin', 'xmax', 'ymax'])
        
        for root, _, files in os.walk(annotations_dir):
            for file in files:
                if file.endswith('.json'):
                    ann_path = os.path.join(root, file)
                    with open(ann_path, 'r') as f:
                        data = json.load(f)
                        
                    image_filename = data.get('image')
                    image_path = os.path.join(images_dir, image_filename)
                    
                    if not os.path.exists(image_path):
                        continue
                        
                    img_w, img_h = get_image_dimensions(image_path)
                    if img_w == 0 or img_h == 0:
                        continue
                    
                    # Add image
                    zf.write(image_path, os.path.join('images', image_filename))
                    
                    local_labels = {l['id']: l['name'] for l in data.get('labels', [])}
                    
                    for ann in data.get('annotations', []):
                        label_name = local_labels.get(ann.get('labelId'))
                        if not label_name:
                            continue
                            
                        points = ann.get('points', [])
                        if len(points) < 2:
                            continue
                            
                        x_min = int(min(p['x'] for p in points))
                        y_min = int(min(p['y'] for p in points))
                        x_max = int(max(p['x'] for p in points))
                        y_max = int(max(p['y'] for p in points))
                        
                        writer.writerow([image_filename, img_w, img_h, label_name, x_min, y_min, x_max, y_max])
                        
        zf.writestr('_annotations.csv', csv_buffer.getvalue())
        
    memory_file.seek(0)
    return memory_file

def export_png_masks(images_dir, annotations_dir):
    """
    PNG Masks for semantic segmentation
    Draws polygons onto an image array and saves as PNG.
    """
    sorted_labels, label_map = collect_global_labels(annotations_dir)
    
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Write classes list mapping color/idx to class
        class_map_str = "Index,Class\n"
        for label, idx in label_map.items():
            class_map_str += f"{idx + 1},{label}\n"
        zf.writestr('class_map.csv', class_map_str)
        
        for root, _, files in os.walk(annotations_dir):
            for file in files:
                if file.endswith('.json'):
                    ann_path = os.path.join(root, file)
                    with open(ann_path, 'r') as f:
                        data = json.load(f)
                        
                    image_filename = data.get('image')
                    image_path = os.path.join(images_dir, image_filename)
                    
                    if not os.path.exists(image_path):
                        continue
                        
                    img_w, img_h = get_image_dimensions(image_path)
                    if img_w == 0 or img_h == 0:
                        continue
                    
                    # Add original image
                    zf.write(image_path, os.path.join('images', image_filename))
                    
                    # Create empty mask image (single channel)
                    mask = np.zeros((img_h, img_w), dtype=np.uint8)
                    
                    local_labels = {l['id']: l['name'] for l in data.get('labels', [])}
                    
                    for ann in data.get('annotations', []):
                        label_name = local_labels.get(ann.get('labelId'))
                        if not label_name:
                            continue
                            
                        # Label idx shifted by 1 (0 is background)
                        class_idx = label_map[label_name] + 1
                        points = ann.get('points', [])
                        
                        if ann.get('type') == 'polygon' and len(points) > 2:
                            poly_pts = np.array([[int(p['x']), int(p['y'])] for p in points], dtype=np.int32)
                            cv2.fillPoly(mask, [poly_pts], class_idx)
                        elif ann.get('type') == 'bbox' and len(points) == 2:
                            x_min = int(min(p['x'] for p in points))
                            y_min = int(min(p['y'] for p in points))
                            x_max = int(max(p['x'] for p in points))
                            y_max = int(max(p['y'] for p in points))
                            cv2.rectangle(mask, (x_min, y_min), (x_max, y_max), class_idx, -1)
                            
                    # Encode mask as png
                    _, buffer = cv2.imencode('.png', mask)
                    base_name = os.path.splitext(image_filename)[0]
                    zf.writestr(os.path.join('masks', f"{base_name}.png"), buffer.tobytes())
                    
    memory_file.seek(0)
    return memory_file

def export_default(images_dir, annotations_dir):
    """
    Standard zip export that simply zips the directory structure (Custom JSON)
    """
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        if os.path.exists(images_dir):
            for root, _, files in os.walk(images_dir):
                for file in files:
                    if not file.startswith('.'):
                        file_path = os.path.join(root, file)
                        arcname = os.path.join('images', os.path.relpath(file_path, images_dir))
                        zf.write(file_path, arcname)
                        
        if os.path.exists(annotations_dir):
            for root, _, files in os.walk(annotations_dir):
                for file in files:
                    if not file.startswith('.'):
                        file_path = os.path.join(root, file)
                        arcname = os.path.join('annotations', os.path.relpath(file_path, annotations_dir))
                        zf.write(file_path, arcname)
                        
    memory_file.seek(0)
    return memory_file
