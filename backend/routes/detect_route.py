import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from service.detection_service import detect_objects

detect_bp = Blueprint("detect", __name__)

UPLOAD_FOLDER = "upload"


@detect_bp.route("/detect", methods=["POST"])
def detect():

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    prompt = request.form.get("prompt", "person .")

    filename = secure_filename(image.filename)

    image_path = os.path.join(UPLOAD_FOLDER, filename)

    image.save(image_path)

    result = detect_objects(image_path, prompt)

    return jsonify({
        "success": True,
        "detections": result["detections"],
        "output_image": result["output_image"]
    })