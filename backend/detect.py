import cv2
import supervision as sv

from groundingdino.util.inference import load_model, load_image, predict, annotate

CONFIG_PATH = "GroundingDINO/groundingdino/config/GroundingDINO_SwinT_OGC.py"
WEIGHTS_PATH = "weights/groundingdino_swint_ogc.pth"

IMAGE_PATH = "input/image.png"

TEXT_PROMPT = "cloud . car . horse ."
BOX_THRESHOLD = 0.35
TEXT_THRESHOLD = 0.25

print("Loading model...")

model = load_model(CONFIG_PATH, WEIGHTS_PATH)

print("Loading image...")

image_source, image = load_image(IMAGE_PATH)

print("Running detection...")

boxes, logits, phrases = predict(
    model=model,
    image=image,
    caption=TEXT_PROMPT,
    box_threshold=BOX_THRESHOLD,
    text_threshold=TEXT_THRESHOLD,
    device="cpu"
)

print("Detected Objects:")
print(phrases)

annotated_frame = annotate(
    image_source=image_source,
    boxes=boxes,
    logits=logits,
    phrases=phrases
)

output_path = "output/result.jpg"

cv2.imwrite(output_path, annotated_frame)

print(f"Saved output to {output_path}")