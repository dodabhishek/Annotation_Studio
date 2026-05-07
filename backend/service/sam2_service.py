import numpy as np
import torch

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