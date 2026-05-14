from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory,
    send_file,
    current_app
)

import os
import json
from datetime import datetime

from service.export_service import generate_export_zip

assets_bp = Blueprint(
    'assets',
    __name__,
    url_prefix='/api/assets'
)


# =========================================================
# Helper
# =========================================================

def get_project(project_id):

    if not project_id:
        return None

    return current_app.db.projects.find_one({
        "projectId": project_id
    })


def get_project_dirs(project):

    project_path = project["projectPath"]

    images_dir = os.path.join(project_path, "images")

    annotations_dir = os.path.join(
        project_path,
        "annotations"
    )

    exports_dir = os.path.join(
        project_path,
        "exports"
    )

    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(annotations_dir, exist_ok=True)
    os.makedirs(exports_dir, exist_ok=True)

    return images_dir, annotations_dir, exports_dir


# =========================================================
# SAVE ASSET
# =========================================================

@assets_bp.route('/save', methods=['POST'])
def save_asset():

    try:

        # -------------------------------------------------
        # Validate image
        # -------------------------------------------------

        if 'image' not in request.files:
            return jsonify({
                'error': 'Image file required'
            }), 400

        image_file = request.files['image']

        if image_file.filename == '':
            return jsonify({
                'error': 'No image selected'
            }), 400

        # -------------------------------------------------
        # Get form data
        # -------------------------------------------------

        project_id = request.form.get("projectId")

        annotations_data = request.form.get(
            'annotations'
        )

        image_name = request.form.get(
            'imageName',
            image_file.filename
        )

        labels = request.form.get(
            'labels',
            '[]'
        )

        # -------------------------------------------------
        # Get project
        # -------------------------------------------------

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        # -------------------------------------------------
        # Directories
        # -------------------------------------------------

        images_dir, annotations_dir, _ = get_project_dirs(project)

        # -------------------------------------------------
        # Unique filename
        # -------------------------------------------------

        timestamp = datetime.now().strftime(
            '%Y%m%d_%H%M%S_'
        )

        base_name = os.path.splitext(
            image_file.filename
        )[0]

        ext = os.path.splitext(
            image_file.filename
        )[1]

        unique_filename = f"{timestamp}{base_name}{ext}"

        # -------------------------------------------------
        # Save image
        # -------------------------------------------------

        image_path = os.path.join(
            images_dir,
            unique_filename
        )

        image_file.save(image_path)

        # -------------------------------------------------
        # Save annotation
        # -------------------------------------------------

        annotations_filename = (
            f"{os.path.splitext(unique_filename)[0]}.json"
        )

        annotations_path = os.path.join(
            annotations_dir,
            annotations_filename
        )

        annotation_data = {
            'image': unique_filename,
            'originalName': image_name,
            'savedAt': datetime.now().isoformat(),
            'annotations': json.loads(annotations_data)
            if annotations_data else [],
            'labels': json.loads(labels)
            if labels else [],
        }

        with open(annotations_path, 'w') as f:
            json.dump(annotation_data, f, indent=2)

        # -------------------------------------------------
        # Update project stats
        # -------------------------------------------------

        current_app.db.projects.update_one(
            {
                "projectId": project_id
            },
            {
                "$inc": {
                    "imageCount": 1
                }
            }
        )

        return jsonify({
            'success': True,
            'assetId': os.path.splitext(unique_filename)[0],
            'image': unique_filename,
            'annotationsFile': annotations_filename,
            'savedAt': annotation_data['savedAt']
        }), 200

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


# =========================================================
# LIST ASSETS
# =========================================================

@assets_bp.route('/list', methods=['GET'])
def list_assets():

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        images_dir, annotations_dir, _ = get_project_dirs(project)

        assets = []

        # -------------------------------------------------
        # Loop images
        # -------------------------------------------------

        if os.path.exists(images_dir):

            for image_file in os.listdir(images_dir):

                if image_file.startswith('.'):
                    continue

                base_name = os.path.splitext(
                    image_file
                )[0]

                annotations_file = os.path.join(
                    annotations_dir,
                    f"{base_name}.json"
                )

                annotation_data = None

                if os.path.exists(annotations_file):

                    with open(annotations_file, 'r') as f:
                        annotation_data = json.load(f)

                asset = {
    'id': base_name,

    'image': image_file,

    'imageUrl':
        f'/api/assets/image/{image_file}?projectId={project_id}',

    'originalName':
        annotation_data.get(
            'originalName',
            image_file
        )
        if annotation_data
        else image_file,

    'savedAt':
        annotation_data.get(
            'savedAt'
        )
        if annotation_data
        else None,

    'annotationCount':
        len(
            annotation_data.get(
                'annotations',
                []
            )
        )
        if annotation_data
        else 0,

    'labels':
        annotation_data.get(
            'labels',
            []
        )
        if annotation_data
        else [],

    'annotations':
        annotation_data.get(
            'annotations',
            []
        )
        if annotation_data
        else [],
}
                   

                assets.append(asset)

        # -------------------------------------------------
        # Sort latest first
        # -------------------------------------------------

        assets.sort(
            key=lambda x: x['savedAt'] or '',
            reverse=True
        )

        return jsonify({
            'success': True,
            'assets': assets,
            'totalAssets': len(assets)
        }), 200

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


# =========================================================
# GET ASSET DETAILS
# =========================================================

@assets_bp.route('/<asset_id>', methods=['GET'])
def get_asset_details(asset_id):

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        _, annotations_dir, _ = get_project_dirs(project)

        annotations_file = os.path.join(
            annotations_dir,
            f"{asset_id}.json"
        )

        if not os.path.exists(annotations_file):

            return jsonify({
                'error': 'Asset not found'
            }), 404

        with open(annotations_file, 'r') as f:
            asset_data = json.load(f)

        return jsonify({
            'success': True,
            'asset': asset_data
        }), 200

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


# =========================================================
# GET IMAGE
# =========================================================

@assets_bp.route('/image/<filename>', methods=['GET'])
def get_asset_image(filename):

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        images_dir, _, _ = get_project_dirs(project)

        return send_from_directory(
            images_dir,
            filename
        )

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 404


# =========================================================
# DELETE ASSET
# =========================================================

@assets_bp.route('/<asset_id>', methods=['DELETE'])
def delete_asset(asset_id):

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        images_dir, annotations_dir, _ = get_project_dirs(project)

        # -------------------------------------------------
        # Delete image
        # -------------------------------------------------

        image_deleted = False

        if os.path.exists(images_dir):

            for image_file in os.listdir(images_dir):

                if image_file.startswith(asset_id):

                    os.remove(
                        os.path.join(
                            images_dir,
                            image_file
                        )
                    )

                    image_deleted = True
                    break

        # -------------------------------------------------
        # Delete annotation
        # -------------------------------------------------

        annotations_file = os.path.join(
            annotations_dir,
            f"{asset_id}.json"
        )

        annotations_deleted = False

        if os.path.exists(annotations_file):

            os.remove(annotations_file)

            annotations_deleted = True

        # -------------------------------------------------
        # Not found
        # -------------------------------------------------

        if not image_deleted and not annotations_deleted:

            return jsonify({
                'error': 'Asset not found'
            }), 404

        # -------------------------------------------------
        # Update stats
        # -------------------------------------------------

        current_app.db.projects.update_one(
            {
                "projectId": project_id
            },
            {
                "$inc": {
                    "imageCount": -1
                }
            }
        )

        return jsonify({
            'success': True,
            'message': 'Asset deleted successfully'
        }), 200

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


# =========================================================
# EXPORT ZIP
# =========================================================

@assets_bp.route('/export/zip', methods=['GET'])
def export_assets_zip():

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        format_type = request.args.get(
            'format',
            'default'
        ).lower()

        # -------------------------------------------------
        # Format mapping
        # -------------------------------------------------

        if (
            format_type.startswith('yolo')
            and format_type != 'yolo darknet'
        ):
            format_type = 'yolo'

        elif format_type == 'yolo darknet':
            format_type = 'yolo'

        elif format_type == 'pascal voc':
            format_type = 'voc'

        elif format_type == 'tensorflow object detection':
            format_type = 'csv'

        elif format_type == 'png mask':
            format_type = 'png'

        # -------------------------------------------------
        # Generate zip
        # -------------------------------------------------

        memory_file = generate_export_zip(
            project["projectPath"],
            format_type
        )

        timestamp = datetime.now().strftime(
            '%Y%m%d_%H%M%S'
        )

        format_suffix = (
            f"_{format_type}"
            if format_type != 'default'
            else ""
        )

        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=(
                f'dataset'
                f'{format_suffix}_{timestamp}.zip'
            )
        )

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500


# =========================================================
# PROJECT STATS
# =========================================================

@assets_bp.route('/stats', methods=['GET'])
def get_assets_stats():

    try:

        project_id = request.args.get("projectId")

        project = get_project(project_id)

        if not project:
            return jsonify({
                "error": "Project not found"
            }), 404

        _, annotations_dir, _ = get_project_dirs(project)

        total_images = 0
        total_annotations = 0
        label_counts = {}

        # -------------------------------------------------
        # Read annotations
        # -------------------------------------------------

        if os.path.exists(annotations_dir):

            for ann_file in os.listdir(annotations_dir):

                if ann_file.endswith('.json'):

                    with open(
                        os.path.join(
                            annotations_dir,
                            ann_file
                        ),
                        'r'
                    ) as f:

                        data = json.load(f)

                        total_images += 1

                        total_annotations += len(
                            data.get(
                                'annotations',
                                []
                            )
                        )

                        for label in data.get(
                            'labels',
                            []
                        ):

                            label_name = label.get(
                                'name',
                                'Unknown'
                            )

                            label_counts[label_name] = (
                                label_counts.get(
                                    label_name,
                                    0
                                ) + 1
                            )

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

        return jsonify({
            'error': str(e)
        }), 500