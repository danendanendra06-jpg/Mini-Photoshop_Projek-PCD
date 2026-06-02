# Mini Photoshop

**Mini Photoshop** adalah aplikasi pengolahan citra digital berbasis Web yang dirancang sebagai implementasi dari konsep-konsep utama mata kuliah Pengolahan Citra Digital (Dosen Pengampu: Rizki Elisa Nalawati, S.T., M.T.).

Aplikasi ini menggunakan perpaduan **Frontend React/Vite** untuk antarmuka pengguna yang modern dan interaktif, serta **Backend Python/FastAPI** yang ditenagai oleh pustaka OpenCV dan TensorFlow untuk memproses gambar dan algoritma Machine Learning.

---

## 📂 Penjelasan Struktur File & Direktori

Proyek ini dibagi menjadi dua bagian utama: `frontend` dan `backend`, beserta beberapa skrip *runner* untuk mempermudah eksekusi.

### 1. Root Directory (Direktori Utama)
*   **`PRDMiniPS.md`** : *Product Requirements Document* (PRD). Berisi rancangan, spesifikasi fitur lengkap, dan arsitektur yang dikerjakan pada aplikasi ini.
*   **`README.md`** : File dokumentasi utama proyek (yang sedang Anda baca saat ini).
*   **`run.bat`** : *Executable Batch File* khusus pengguna Windows untuk menjalankan frontend dan backend secara bersamaan hanya dengan satu kali klik ganda (single-terminal runner).
*   **`scripts/run_all.py`** : Skrip Python yang digunakan oleh `run.bat` untuk menjalankan server Uvicorn (FastAPI) dan Vite (React) secara paralel menggunakan teknik *Multithreading*.

### 2. Backend (Python / FastAPI)
Folder `backend/` memuat seluruh logika pengolahan citra dan kecerdasan buatan.
*   **`backend/main.py`** : *Entry point* dari API server (FastAPI). File ini bertugas untuk mendefinisikan URL/Endpoint (seperti `/histogram`, `/recognize`, `/process`, dll) dan menjembatani data dari frontend ke fungsi pengolahan yang ada.
*   **`backend/processing.py`** : Modul inti pengolahan citra digital. Semua implementasi algoritma manipulasi gambar (seperti Brightness, Contrast, Filter, Grayscale, Canny Edge, Histogram) berbasis **OpenCV** & **NumPy** berada di sini.
*   **`backend/ml_model.py`** : Modul Kecerdasan Buatan (AI) berbasis **TensorFlow/Keras**. File ini menggunakan model CNN *Pre-trained* **MobileNetV2** untuk mengklasifikasikan objek (Manusia, Hewan, Objek Lainnya) di dalam gambar dan menghitung warna unik.
*   **`backend/requirements.txt`** : Daftar *library* Python yang dibutuhkan (FastAPI, OpenCV, TensorFlow, Uvicorn, dll).

### 3. Frontend (React / Vite)
Folder `frontend/` memuat antarmuka pengguna interaktif (GUI).
*   **`frontend/src/App.jsx`** : Komponen UI utama (*Main Component*). Di sinilah seluruh antarmuka aplikasi dirancang, termasuk menu *sidebar*, panel perbandingan gambar (Before-After), *slider* intensitas, dan visualisasi *Progress Bar* untuk Machine Learning.
*   **`frontend/src/main.jsx`** : Titik masuk utama aplikasi React yang me-render `App.jsx` ke dalam DOM HTML.
*   **`frontend/src/index.css`** : File styling CSS utama yang mengatur desain visual (tema warna, responsivitas, bentuk tombol, layout grid, dan estetika umum).
*   **`frontend/package.json`** : Konfigurasi *dependencies* Node.js, seperti `axios` (untuk HTTP request), `chart.js` (grafik histogram), dan `lucide-react` (kumpulan ikon).

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini sudah dirancang untuk berjalan berdampingan tanpa perlu membuka banyak terminal.

**Prasyarat:**
1. Pastikan Anda sudah menginstal **Node.js** dan **Python 3**.
2. Pastikan sudah menginstal dependencies Python (`pip install -r backend/requirements.txt`).
3. Pastikan sudah menginstal dependencies Node (`npm install` di dalam folder `frontend`).

**Cara Cepat (Windows):**
Cukup klik dua kali (atau jalankan di terminal) file `run.bat` yang ada di direktori utama.
```cmd
.\run.bat
```
Server Backend (port 8000) dan Frontend (port 5173) akan otomatis berjalan bersamaan. Buka browser dan arahkan ke alamat `http://localhost:5173`.
