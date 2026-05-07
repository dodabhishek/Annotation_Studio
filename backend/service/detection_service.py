import os
import cv2
import torch
import supervision as sv
import numpy as np

from service.sam2_service import generate_masks

from groundingdino.util.inference import (
    load_model,
    load_image,
    predict,
    annotate
)

CONFIG_PATH = "GroundingDINO/groundingdino/config/GroundingDINO_SwinT_OGC.py"
WEIGHTS_PATH = "weights/groundingdino_swint_ogc.pth"

BOX_THRESHOLD = 0.35
TEXT_THRESHOLD = 0.25

model = load_model(CONFIG_PATH, WEIGHTS_PATH)


def _mask_to_polygon(mask):
    """Extract the largest contour from a binary mask as a list of {x, y} points."""
    mask_2d = np.squeeze(mask)
    if mask_2d.ndim != 2:
        return []
    mask_uint8 = (mask_2d.astype(np.uint8)) * 255
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []
    largest = max(contours, key=cv2.contourArea)
    epsilon = 0.005 * cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, epsilon, True)
    return [{"x": int(pt[0][0]), "y": int(pt[0][1])} for pt in approx]


def detect_objects(image_path, prompt):

    image_source, image = load_image(image_path)
    h, w, _ = image_source.shape

    boxes, logits, phrases = predict(
        model=model,
        image=image,
        caption=prompt,
        box_threshold=BOX_THRESHOLD,
        text_threshold=TEXT_THRESHOLD,
        device="cpu"
    )

    pixel_boxes = []
    for box in boxes:
        cx, cy, bw, bh = box.tolist()
        x1 = int((cx - bw / 2) * w)
        y1 = int((cy - bh / 2) * h)
        x2 = int((cx + bw / 2) * w)
        y2 = int((cy + bh / 2) * h)
        pixel_boxes.append([x1, y1, x2, y2])

    masks = generate_masks(image_source, pixel_boxes)

    detections = []
    for box, phrase, logit, mask in zip(pixel_boxes, phrases, logits, masks):
        polygon = _mask_to_polygon(mask)
        detections.append({
            "label": phrase,
            "confidence": float(logit),
            "box": box,
            "polygon": polygon,
        })

    annotated_frame = annotate(
        image_source=image_source,
        boxes=boxes,
        logits=logits,
        phrases=phrases
    )

    output_filename = f"detected_{os.path.basename(image_path)}"
    output_path = os.path.join("output", output_filename)
    cv2.imwrite(output_path, annotated_frame)

    return {
        "detections": detections,
        "output_image": output_filename
    }
