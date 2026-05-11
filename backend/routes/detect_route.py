import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from service.detection_service import detect_objects
from service.sam2_service import predict_point
import cv2

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
    print("Dtections" , result["detections"])
    return jsonify({
        "success": True,
        "detections": result["detections"],
        "output_image": result["output_image"]
    })

@detect_bp.route("/sam/point", methods=["POST"])
def sam_point():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    x = request.form.get("x", type=float)
    y = request.form.get("y", type=float)

    if x is None or y is None:
        return jsonify({"error": "Missing coordinates"}), 400

    filename = secure_filename(image.filename)
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)

    image_source = cv2.imread(image_path)
    if image_source is None:
        return jsonify({"error": "Invalid image"}), 400
        
    image_source = cv2.cvtColor(image_source, cv2.COLOR_BGR2RGB)
    
    polygon = predict_point(image_source, x, y)
    
    return jsonify({
        "success": True,
        "points": polygon
    })