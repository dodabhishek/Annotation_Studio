#!/usr/bin/env venv/bin/python
from groundingdino.util.inference import load_model

CONFIG_PATH = "GroundingDINO/groundingdino/config/GroundingDINO_SwinT_OGC.py"
WEIGHTS_PATH = "weights/groundingdino_swint_ogc.pth"

print("Loading model...")

model = load_model(CONFIG_PATH, WEIGHTS_PATH)

print("GroundingDINO loaded successfully")