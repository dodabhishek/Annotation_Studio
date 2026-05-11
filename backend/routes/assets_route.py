from flask import Blueprint, request, jsonify, send_from_directory, send_file
import os
import json
from pathlib import Path
from datetime import datetime
import shutil
import io
import zipfile

assets_bp = Blueprint('assets', __name__, url_prefix='/api/assets')

# Create assets directory if it doesn't exist
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(os.path.join(ASSETS_DIR, 'images'), exist_ok=True)
os.makedirs(os.path.join(ASSETS_DIR, 'annotations'), exist_ok=True)


@assets_bp.route('/save', methods=['POST'])
def save_asset():
    """
    Save image with annotations to assets folder
    Expected: image file + annotations JSON
    """
    try:
        # Check for required files
        if 'image' not in request.files:
            return jsonify({'error': 'Image file required'}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        # Get annotations from form data
        annotations_data = request.form.get('annotations')
        image_name = request.form.get('imageName', image_file.filename)
        labels = request.form.get('labels', '[]')  # JSON string of labels

        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        base_name = os.path.splitext(image_file.filename)[0]
        ext = os.path.splitext(image_file.filename)[1]
        unique_filename = f"{timestamp}{base_name}{ext}"

        # Save image
        images_dir = os.path.join(ASSETS_DIR, 'images')
        image_path = os.path.join(images_dir, unique_filename)
        image_file.save(image_path)

        # Save annotations
        annotations_dir = os.path.join(ASSETS_DIR, 'annotations')
        annotations_filename = f"{os.path.splitext(unique_filename)[0]}.json"
        annotations_path = os.path.join(annotations_dir, annotations_filename)

        annotation_data = {
            'image': unique_filename,
            'originalName': image_name,
            'savedAt': datetime.now().isoformat(),
            'annotations': json.loads(annotations_data) if annotations_data else [],
            'labels': json.loads(labels) if labels else [],
        }

        with open(annotations_path, 'w') as f:
            json.dump(annotation_data, f, indent=2)

        return jsonify({
            'success': True,
            'assetId': os.path.splitext(unique_filename)[0],
            'image': unique_filename,
            'annotationsFile': annotations_filename,
            'savedAt': annotation_data['savedAt']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/list', methods=['GET'])
def list_assets():
    """
    List all saved assets with their metadata
    """
    try:
        images_dir = os.path.join(ASSETS_DIR, 'images')
        annotations_dir = os.path.join(ASSETS_DIR, 'annotations')
        
        assets = []
        
        # Get all image files
        if os.path.exists(images_dir):
            for image_file in os.listdir(images_dir):
                if image_file.startswith('.'):
                    continue
                    
                base_name = os.path.splitext(image_file)[0]
                annotations_file = os.path.join(annotations_dir, f"{base_name}.json")
                
                annotation_data = None
                if os.path.exists(annotations_file):
                    with open(annotations_file, 'r') as f:
                        annotation_data = json.load(f)
                
                image_path = os.path.join(images_dir, image_file)
                asset = {
                    'id': base_name,
                    'image': image_file,
                    'originalName': annotation_data.get('originalName', image_file) if annotation_data else image_file,
                    'savedAt': annotation_data.get('savedAt') if annotation_data else None,
                    'annotationCount': len(annotation_data.get('annotations', [])) if annotation_data else 0,
                    'labels': annotation_data.get('labels', []) if annotation_data else [],
                    'annotations': annotation_data.get('annotations', []) if annotation_data else [],
                }
                assets.append(asset)
        
        # Sort by saved date (newest first)
        assets.sort(key=lambda x: x['savedAt'] or '', reverse=True)
        
        return jsonify({
            'success': True,
            'assets': assets,
            'totalAssets': len(assets)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/<asset_id>', methods=['GET'])
def get_asset_details(asset_id):
    """
    Get detailed information about an asset including image and annotations
    """
    try:
        annotations_dir = os.path.join(ASSETS_DIR, 'annotations')
        annotations_file = os.path.join(annotations_dir, f"{asset_id}.json")
        
        if not os.path.exists(annotations_file):
            return jsonify({'error': 'Asset not found'}), 404
        
        with open(annotations_file, 'r') as f:
            asset_data = json.load(f)
        
        return jsonify({
            'success': True,
            'asset': asset_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/image/<filename>', methods=['GET'])
def get_asset_image(filename):
    """
    Serve asset images
    """
    try:
        images_dir = os.path.join(ASSETS_DIR, 'images')
        return send_from_directory(images_dir, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@assets_bp.route('/<asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    """
    Delete an asset and its annotations
    """
    try:
        images_dir = os.path.join(ASSETS_DIR, 'images')
        annotations_dir = os.path.join(ASSETS_DIR, 'annotations')
        
        # Find and delete the image file
        image_deleted = False
        if os.path.exists(images_dir):
            for image_file in os.listdir(images_dir):
                if image_file.startswith(asset_id):
                    os.remove(os.path.join(images_dir, image_file))
                    image_deleted = True
                    break
        
        # Delete annotation file
        annotations_file = os.path.join(annotations_dir, f"{asset_id}.json")
        annotations_deleted = False
        if os.path.exists(annotations_file):
            os.remove(annotations_file)
            annotations_deleted = True
        
        if not image_deleted and not annotations_deleted:
            return jsonify({'error': 'Asset not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Asset deleted successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


from service.export_service import generate_export_zip

@assets_bp.route('/export/zip', methods=['GET'])
def export_assets_zip():
    """
    Export all assets as a single ZIP archive in the requested format.
    Accepts 'format' query parameter.
    """
    try:
        format_type = request.args.get('format', 'default').lower()
        
        # Map common YOLO variants to generic 'yolo'
        if format_type.startswith('yolo') and format_type != 'yolo darknet':
            format_type = 'yolo'
        elif format_type == 'yolo darknet':
            format_type = 'yolo'
        elif format_type == 'pascal voc':
            format_type = 'voc'
        elif format_type == 'tensorflow object detection':
            format_type = 'csv'
        elif format_type == 'png mask':
            format_type = 'png'
            
        memory_file = generate_export_zip(ASSETS_DIR, format_type)
                            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        format_suffix = f"_{format_type}" if format_type != 'default' else ""
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'dataset{format_suffix}_{timestamp}.zip'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@assets_bp.route('/stats', methods=['GET'])
def get_assets_stats():
    """
    Get statistics about saved assets
    """
    try:
        annotations_dir = os.path.join(ASSETS_DIR, 'annotations')
        
        total_images = 0
        total_annotations = 0
        label_counts = {}
        
        if os.path.exists(annotations_dir):
            for ann_file in os.listdir(annotations_dir):
                if ann_file.endswith('.json'):
                    with open(os.path.join(annotations_dir, ann_file), 'r') as f:
                        data = json.load(f)
                        total_images += 1
                        total_annotations += len(data.get('annotations', []))
                        
                        # Count labels
                        for label in data.get('labels', []):
                            label_name = label.get('name', 'Unknown')
                            label_counts[label_name] = label_counts.get(label_name, 0) + 1
        
        return jsonify({
            'success': True,
            'stats': {
                'totalImages': total_images,
                'totalAnnotations': total_annotations,
                'uniqueLabels': len(label_counts),
                'labelCounts': label_counts
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
