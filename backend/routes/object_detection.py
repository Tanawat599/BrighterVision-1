import os
from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import subprocess
import requests
from ultralytics import YOLO
import cv2
import numpy as np
import torch
import json

from .text_detection import TextReader

# ปิดข้อความแจ้งเตือนต่างๆ เพื่อให้ Console สะอาดขึ้น
os.environ["YOLO_VERBOSE"] = "False"

router = APIRouter()

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"🖥️ Object Detection using device: {device.upper()}")

class ObjectDetection:
    def __init__(self):
        self.model = YOLO("yolo26n.pt") 

    def detect(self, image):
        results = self.model(image, conf=0.5, device=device, verbose=False) 
        return results

detector = ObjectDetection()

@router.post("/play")
async def object_detection_endpoint(image_url: str = "http://192.168.215.71/capture"):
    print('we got url : ' , image_url)
    
    try:
        # กำหนด timeout 5 วินาที ป้องกันเซิร์ฟเวอร์ค้าง
        response = requests.get(image_url, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from ESP32: {e}")
        raise HTTPException(status_code=504, detail="ไม่สามารถเชื่อมต่อกับ ESP32 Camera ได้ กรุณาตรวจสอบ IP Address และการเชื่อมต่อ WiFi")

    print(f"we got response : {len(response.content)} bytes")
    contents = response.content
    
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = detector.detect(image)
    
    
    # Initialize OCR reader
    ocr_reader = TextReader()
    detected_texts = ocr_reader.read_text(image)
    full_sentence = " ".join(detected_texts)
    
    highest_conf = 0.0
    top_object = None
    all_detected = []

    for result in results:
        for box in result.boxes:
            conf = float(box.conf[0]) 
            cls_id = int(box.cls[0])  
            name = result.names[cls_id] 
            
            all_detected.append({
                "object": name,
                "confidence": round(conf, 2)
            })

            if conf > highest_conf:
                highest_conf = conf
                top_object = name
                
    # Save the annotated image
    annotated_image = results[0].plot()
    os.makedirs("tmp", exist_ok=True)
    cv2.imwrite("tmp/last_capture.jpg", annotated_image)
    
    # Save results to json
    result_data = {
        "object": top_object,
        "confidence": round(highest_conf, 2) if top_object else 0,
        "text": full_sentence
    }
    with open("tmp/latest_result.json", "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False)
                
    if top_object:
        text_to_speak = f"Detected {top_object}"
    else:
        text_to_speak = "No object detected"
        
    if full_sentence:
        text_to_speak += f". Text found: {full_sentence}"
        
    print('we got object ' , top_object)
    print('we got text ', full_sentence)
    
    audio_path = "tmp/audio/audio_object.wav"
    os.makedirs("tmp/audio", exist_ok=True)
    subprocess.run([
        "say", 
        "--file-format=WAVE", 
        "--data-format=LEI16@16000", 
        "-o", audio_path, 
        text_to_speak
    ])
    
    return FileResponse(audio_path, media_type="audio/wav")

@router.get("/latest-image")
async def get_latest_image():
    image_path = "tmp/last_capture.jpg"
    if os.path.exists(image_path):
        return FileResponse(image_path, media_type="image/jpeg", headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})
    return {"error": "No image available yet"}
