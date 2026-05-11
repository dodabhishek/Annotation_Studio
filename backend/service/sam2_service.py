import numpy as np
import torch
import cv2

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

CHECKPOINT = "checkpoints/sam2_hiera_large.pt"
MODEL_CFG = "configs/sam2/sam2_hiera_l.yaml"

print("Loading SAM2 model...")

sam2_model = build_sam2(MODEL_CFG, CHECKPOINT, device=DEVICE)

predictor = SAM2ImagePredictor(sam2_model)

print("SAM2 loaded")


def generate_masks(image, boxes):

    predictor.set_image(image)

    input_boxes = np.array(boxes)

    masks, scores, logits = predictor.predict(
        box=input_boxes,
        multimask_output=False
    )

    return masks

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

def predict_point(image_source, x, y):
    """Predict a single polygon mask from an x, y coordinate."""
    predictor.set_image(image_source)
    
    point_coords = np.array([[x, y]])
    point_labels = np.array([1]) # 1 indicates a foreground point
    
    masks, scores, logits = predictor.predict(
        point_coords=point_coords,
        point_labels=point_labels,
        multimask_output=False
    )
    
    if len(masks) == 0:
        return []
        
    return _mask_to_polygon(masks[0])