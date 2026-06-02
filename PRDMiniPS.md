# Product Requirements Document (PRD)
**Project Name:** Mini Photoshop
**Dosen Pengampu:** Rizki Elisa Nalawati, S.T., M.T.
**Mata Kuliah:** Pengolahan Citra Digital

## 1. Deskripsi Sistem
Mini Photoshop merupakan aplikasi pengolahan citra digital berbasis Web (Frontend React/Vite dan Backend Python/FastAPI) yang dirancang untuk mengimplementasikan konsep-konsep utama dalam mata kuliah Pengolahan Citra Digital, seperti enhancement, transformasi, filtering, segmentasi, dan manipulasi warna. Aplikasi ini memungkinkan pengguna melakukan pengolahan citra secara interaktif melalui antarmuka antarmuka interaktif dan modern.

## 2. Tujuan Produk (Objective)
Membantu mahasiswa/pengguna memahami secara visual dan praktis berbagai teknik operasi pengolahan citra (mulai dari level spasial hingga deteksi AI tingkat lanjut) dengan melihat perubahan Before-After secara *real-time*.

## 3. Spesifikasi Fitur Utama (Requirements)

### 3.1. Image Management
*   **Fungsi utama:** Load image (JPG, PNG, BMP), Save image (custom filename & format), dan Reset ke gambar awal.
*   **Spesifikasi teknis:** Input dari file lokal, output berupa file hasil edit, dan memiliki panel preview *before–after* yang jelas.

### 3.2. Image Enhancement
*   Brightness & Contrast Adjustment (menggunakan kontrol Slider).
*   Histogram Equalization (peningkatan kontras otomatis).
*   Sharpening (penajaman tepi/detail gambar).
*   Smoothing (Gaussian blur / efek buram).

### 3.3. Geometric Transformation
*   Rotate (0°–360°).
*   Flip (horizontal & vertical).
*   Crop (Pemotongan gambar dengan menyeleksi / *drag area*).
*   Resize (Scaling/pengubahan resolusi).
*   Translation (Pergeseran posisi x dan y).
*   *Teknis:* Menggunakan transformasi matriks affine dan Interpolasi (nearest / bilinear).

### 3.4. Image Restoration (Noise Reduction)
*   Gaussian Blur.
*   Median Filter.
*   Noise removal simulasi (salt & pepper).
*   *Teknis:* Melibatkan proses Spatial filtering dan Kernel convolution.

### 3.5. Binary & Edge Processing
*   Thresholding (Pembuatan binary image hitam-putih).
*   **Edge Detection (Deteksi Tepi):** Canny, Sobel, Prewitt, Robert, Laplacian, Laplacian of Gaussian (LoG).
*   **Morphology:** Erosion (pengikisan) & Dilation (penebalan).
*   *Teknis:* Operasi piksel biner dan penggunaan Kernel structuring element.

### 3.6. Color Processing
*   Konversi warna RGB ke Grayscale.
*   Channel splitting (R, G, B) tunggal.
*   Color adjustment (Pergeseran Hue, kontrol Saturation dan Value/Brightness).
*   *Teknis:* Transformasi ruang warna dari BGR ke HSV.

### 3.7. Image Segmentation
*   Threshold-based segmentation (masking).
*   Edge-based segmentation.
*   Region-based sederhana.
*   *Teknis:* Mengimplementasikan clustering sederhana, algoritma watershed, atau region extraction.

### 3.8. Image Compression
*   Menyimpan gambar dengan kualitas yang dapat diatur berbeda (low–high).
*   Mampu mensimulasikan kompresi JPEG/artefak kompresi.
*   *Teknis:* Memanfaatkan algoritma kompresi spesifik seperti Huffman, Aritmik, LZW, RLE, atau Metode Kuantisasi.

### 3.9. Histogram Analysis
*   Menampilkan grafik histogram persebaran nilai Grayscale dan RGB secara akurat.
*   Memberikan perbandingan distribusi histogram *before–after* secara bersebelahan.
*   *Teknis:* Perhitungan distribusi intensitas piksel dan divisualisasikan dengan library Chart.js / Matplotlib.

### 3.10. User Interface (GUI)
*   Menu navigasi (toolbar) interaktif dengan kategori fitur (File, Edit, Filter, Transform).
*   Panel perbandingan preview ganda.
*   Slider untuk pengaturan intensitas parameter secara leluasa.
*   Tombol-tombol aksi cepat (*Upload, Save, Apply, Reset*).

### 3.11. Pengenalan Objek dengan Machine Learning (CNN)
*   Menggunakan model AI *Pre-Trained* **MobileNetV2** (berbasis TensorFlow/Keras) yang ringan.
*   Otomatis me-resize gambar input menjadi 224x224 piksel untuk proses inferensi.
*   Terdapat klasifikasi filter kustom (*Keyword Mapping*): **Manusia, Hewan, dan Objek Lainnya**.
*   Menampilkan **Progress Bar Confidence Level** untuk ketiga kategori tersebut.
*   Menampilkan data ekstra berupa jumlah **Warna Unik** yang ada pada gambar.

## 4. Teknologi & Arsitektur
*   **Frontend:** React, Vite, Chart.js (Untuk GUI interaktif).
*   **Backend:** Python 3, FastAPI, Uvicorn.
*   **Pengolahan Citra:** OpenCV (`cv2`), NumPy.
*   **Kecerdasan Buatan:** TensorFlow, Keras (MobileNetV2).
*   **Metode Menjalankan (Runner):** Menggunakan *script* paralel (`run_all.py` / `run.bat`) agar dapat dijalankan secara sinkron dalam satu jendela terminal (Single-Terminal).
