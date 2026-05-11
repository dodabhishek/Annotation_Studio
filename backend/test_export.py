import os
import sys
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from service.export_service import generate_export_zip

def test_export():
    assets_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
    
    # Check if assets exist
    if not os.path.exists(assets_dir) or not os.path.exists(os.path.join(assets_dir, 'images')):
        print("No assets to test.")
        return
        
    print("Testing YOLO...")
    generate_export_zip(assets_dir, 'yolo')
    print("YOLO Ok.")
    
    print("Testing COCO...")
    generate_export_zip(assets_dir, 'coco')
    print("COCO Ok.")
    
    print("Testing VOC...")
    generate_export_zip(assets_dir, 'voc')
    print("VOC Ok.")
    
    print("Testing CSV...")
    generate_export_zip(assets_dir, 'csv')
    print("CSV Ok.")
    
    print("Testing PNG...")
    generate_export_zip(assets_dir, 'png')
    print("PNG Ok.")
    
    print("Testing Default...")
    generate_export_zip(assets_dir, 'default')
    print("Default Ok.")
    
if __name__ == "__main__":
    test_export()
