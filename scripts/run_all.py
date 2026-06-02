import subprocess
import threading
import sys
import os

def run_backend():
    print(">>> Starting Backend (Uvicorn)...")
    # Change to backend dir
    backend_cmd = "uvicorn main:app --reload --port 8000"
    if sys.platform == 'win32':
        # if venv exists in backend
        if os.path.exists("backend/venv"):
            backend_cmd = ".\\venv\\Scripts\\activate && uvicorn main:app --reload --port 8000"
    
    process = subprocess.Popen(backend_cmd, cwd="backend", shell=True)
    process.wait()

def run_frontend():
    print(">>> Starting Frontend (Vite)...")
    frontend_cmd = "npm run dev"
    process = subprocess.Popen(frontend_cmd, cwd="frontend", shell=True)
    process.wait()

if __name__ == "__main__":
    t1 = threading.Thread(target=run_backend)
    t2 = threading.Thread(target=run_frontend)

    t1.start()
    t2.start()

    try:
        t1.join()
        t2.join()
    except KeyboardInterrupt:
        print("\nShutting down both servers...")
