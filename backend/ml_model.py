import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
import json

# Initialize the model once when the module loads
print("Loading MobileNetV2 model...")
model = MobileNetV2(weights='imagenet')
print("Model loaded successfully!")

# Define keywords for categorization
HUMAN_KEYWORDS = ['person', 'man', 'woman', 'doctor', 'nurse', 'boy', 'girl', 'child', 'human', 'face']
ANIMAL_KEYWORDS = ['dog', 'cat', 'lion', 'bird', 'fish', 'shark', 'horse', 'elephant', 'tiger', 'bear', 'mouse', 'rabbit', 'snake', 'frog', 'insect', 'spider', 'cow', 'pig', 'sheep', 'monkey']

def predict_image(image_bytes):
    try:
        # 1. Load image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Failed to decode image"}

        # Calculate Unique Colors
        # To make it faster, we reshape to 2D array of pixels and use np.unique
        pixels = img.reshape(-1, 3)
        unique_colors = len(np.unique(pixels, axis=0))

        # 2. Pre-processing for MobileNetV2
        # Resize to 224x224
        img_resized = cv2.resize(img, (224, 224))
        # Convert BGR (OpenCV default) to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        
        # Expand dimensions to create a batch of 1
        img_array = np.expand_dims(img_rgb, axis=0)
        # Preprocess input (scales pixels between -1 and 1)
        img_preprocessed = preprocess_input(img_array)

        # 3. Predict
        predictions = model.predict(img_preprocessed)
        
        # Get Top 10 predictions
        decoded_preds = decode_predictions(predictions, top=10)[0]
        
        raw_predictions = []
        category_scores = {
            "Manusia": 0.0,
            "Hewan": 0.0,
            "Objek Lainnya": 0.0
        }

        # 4. Logic Categorization
        for i, (class_id, class_name, score) in enumerate(decoded_preds):
            score_percent = float(score) * 100
            raw_predictions.append(f"{class_name} ({score_percent:.1f}%)")
            
            # Check keywords
            class_name_lower = class_name.lower().replace('_', ' ')
            
            is_human = any(kw in class_name_lower for kw in HUMAN_KEYWORDS)
            is_animal = any(kw in class_name_lower for kw in ANIMAL_KEYWORDS)
            
            if is_human:
                category_scores["Manusia"] += score_percent
            elif is_animal:
                category_scores["Hewan"] += score_percent
            else:
                category_scores["Objek Lainnya"] += score_percent

        return {
            "success": True,
            "raw_predictions": raw_predictions,
            "categories": category_scores,
            "unique_colors": unique_colors
        }

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}
