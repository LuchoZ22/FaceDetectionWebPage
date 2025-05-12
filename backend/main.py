from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from pydantic import BaseModel
import numpy as np
import cv2





app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic model for request body options
# It's good practice to define default values.
class AnalysisOptions(BaseModel):
    age: bool = True
    gender: bool = True
    emotion: bool = True
    race: bool = True

# Asynchronous function to detect faces
async def convert_image(file: UploadFile):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="No image data received.")

        nparr = np.frombuffer(data, np.uint8)
        cv2_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        
        if cv2_img is None:
            raise HTTPException(status_code=400, detail="Could not decode image. Invalid image format or corrupted file.")

        return cv2_img
        
    except HTTPException as http_exc: 
        raise http_exc
    
    except Exception as e:
        # Log the detailed error for debugging on the server
        print(f"Error in detect_faces: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image internally: {str(e)}")


@app.post("/analyze/photo")
async def analyze_photo(
    options: str = Form(...),  # Expecting a JSON string for options
    file: UploadFile = File(...)
):
    """
    Analyzes an uploaded photo to detect faces and extract attributes
    based on the provided options.
    """
    try:
        options_dict =  AnalysisOptions.model_validate_json(options)
        print(f"Received analysis options: {options_dict}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid options format. Ensure it's a valid JSON string. {str(e)}")
   

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")

    try:

        converted_img = await convert_image(file)

        #if not detected_faces_data:
        #    return {"message": "No faces detected in the image.", "faces": []}

        options_dict = options_dict.model_dump()
        detected_face_options = [key for key, value in options_dict.items() if value is True]

        analysis_result = DeepFace.analyze(converted_img, actions=detected_face_options, enforce_detection=True, silent=True, expand_percentage=10)
        if (len(analysis_result) < 1):
            return {
                'message': 'No faces were found',
                'faces': []
            }

        print(f"Analysis result length: {len(analysis_result)}")
        faces_results = []  

        for face_obj in analysis_result:
            x = int(face_obj['region']['x'])
            y = int(face_obj['region']['y'])
            w = int(face_obj['region']['w'])
            h = int(face_obj['region']['h'])
            
            subject_result_options = {}
            for opt in detected_face_options:
                if opt == 'age':
                    subject_result_options['age'] = face_obj['age']
                else:
                    aux_dominat =  f"dominant_{opt}"
                    dominant_opt = face_obj[aux_dominat]
                    subject_result_options[opt] = {'dominant': dominant_opt, 'percentage': float(face_obj[opt][dominant_opt])}

            faces_results.append({
                'x': x,
                'y': y,
                'w': w,
                'h': h,
                'results': subject_result_options
            })
        
        
        return {
            "message": "Analysis completed successfully.",
            "faces": faces_results
        }
               
    
       
    except Exception as e:
        # Log the detailed error for debugging on the server
        print(f"Error in analyze_photo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image internally: {str(e)}")
        



