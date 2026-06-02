from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import json
from processing import apply_processing_memory, get_histogram_data_memory
from ml_model import predict_image

app = FastAPI(title="Mini Photoshop API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_image(file: UploadFile = File(...), operation: str = Form(...), params: str = Form("{}")):
    try:
        parameters = json.loads(params)
    except:
        parameters = {}
        
    image_bytes = await file.read()
    
    success, result_or_error = apply_processing_memory(image_bytes, operation, parameters)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Processing failed: {result_or_error}")
        
    media_type = "image/jpeg" if operation == "compress" else "image/png"
    return Response(content=result_or_error, media_type=media_type)

@app.post("/histogram")
async def get_histogram(file: UploadFile = File(...)):
    image_bytes = await file.read()
    data = get_histogram_data_memory(image_bytes)
    return data

@app.post("/recognize")
async def recognize_objects(file: UploadFile = File(...)):
    image_bytes = await file.read()
    data = predict_image(image_bytes)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
