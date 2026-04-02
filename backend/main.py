from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid
import os

app = FastAPI(title="AI Batch Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs = {}

def process_batch_job(job_id: str, file_name: str, model_name: str, batch_size: int):
    """
    Diese Funktion läuft im Hintergrund. 
    Hier binden wir später die echte ComfyUI/Flux API an.
    """
    jobs[job_id] = {"status": "processing", "progress": 0}
    

    for i in range(batch_size):
        time.sleep(2) 
        jobs[job_id]["progress"] = f"{(i + 1)}/{batch_size} Bilder generiert"
        
    jobs[job_id]["status"] = "completed"
    jobs[job_id]["download_url"] = f"/download/{job_id}.zip"

@app.post("/api/generate")
async def start_generation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    model_name: str = Form(...),
    batch_size: int = Form(...)
):
    job_id = str(uuid.uuid4())
    
    os.makedirs("uploads", exist_ok=True)
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await file.read())

    background_tasks.add_task(process_batch_job, job_id, file.filename, model_name, batch_size)
    
    return {"message": "Batch job started", "job_id": job_id}

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return {"error": "Job not found"}
    return job

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
