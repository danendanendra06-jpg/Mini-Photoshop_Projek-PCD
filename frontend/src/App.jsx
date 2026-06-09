import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Image as ImageIcon, 
  Sun, 
  Crop, 
  Wand2, 
  Activity, 
  Droplet, 
  Layers, 
  Minimize, 
  BarChart2, 
  Upload, 
  Download,
  Moon,
  RotateCcw,
  Scan,
  Save
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:8000';

// Categories Configuration
const CATEGORIES = [
  { id: 'enhancement', label: 'Enhancement', icon: Sun },
  { id: 'transformation', label: 'Transformation', icon: Crop },
  { id: 'restoration', label: 'Restoration', icon: Droplet },
  { id: 'edge', label: 'Edge & Binary', icon: Activity },
  { id: 'segmentation', label: 'Image Segmentation', icon: Layers },
  { id: 'color', label: 'Color Processing', icon: Layers },
  { id: 'compression', label: 'Compression', icon: Minimize },
  { id: 'histogram', label: 'Histogram Analysis', icon: BarChart2 },
  { id: 'ml', label: 'Object Recognition', icon: Scan },
];

function App() {
  const [theme, setTheme] = useState('dark');
  const [originalImage, setOriginalImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('enhancement');
  const [dragActive, setDragActive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilename, setExportFilename] = useState('processed_image');
  const [exportFormat, setExportFormat] = useState('png');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  
  // States for operations
  const [operation, setOperation] = useState('');
  const [params, setParams] = useState({});
  const [histogramData, setHistogramData] = useState(null);
  const [originalHistogramData, setOriginalHistogramData] = useState(null);
  const [mlResult, setMlResult] = useState(null);
  
  // Interactive Rotate States
  const [uiAngle, setUiAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const rotateStart = useRef({ angle: 0, initialUiAngle: 0 });

  const fileInputRef = useRef(null);

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Debounced API call for parameters
  const processImage = async (op, parameters) => {
    if (!originalImage || !originalImage.file) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', originalImage.file);
      formData.append('operation', op);
      formData.append('params', JSON.stringify(parameters));

      const response = await axios.post(`${API_URL}/process`, formData, {
        responseType: 'blob' // Expecting binary image data
      });
      
      const url = URL.createObjectURL(response.data);
      setCurrentImage({
        file: response.data,
        url: url
      });
      
      if (activeCategory === 'histogram') {
        fetchHistogram(originalImage.file, response.data);
      }
    } catch (error) {
      console.error("Processing failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to run process when params change
  useEffect(() => {
    if (originalImage && activeCategory !== 'histogram') {
      const timer = setTimeout(() => {
        if (operation) processImage(operation, params);
      }, 300); // 300ms debounce
      return () => clearTimeout(timer);
    }
  }, [operation, params, activeCategory]);

  useEffect(() => {
    if (completedCrop && imgRef.current && operation === 'crop' && activeCategory === 'transformation') {
       const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
       const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
       
       const px = {
         x: Math.round(completedCrop.x * scaleX),
         y: Math.round(completedCrop.y * scaleY),
         w: Math.round(completedCrop.width * scaleX),
         h: Math.round(completedCrop.height * scaleY)
       };
       
       if (px.w > 0 && px.h > 0) {
         setParams(prev => {
           if (prev.x === px.x && prev.y === px.y && prev.w === px.w && prev.h === px.h) return prev;
           return { ...prev, ...px };
         });
       }
    }
  }, [completedCrop, operation, activeCategory]);

  const fetchHistogram = async (origBlob, currBlob) => {
    try {
      if (origBlob) {
        const origData = new FormData();
        origData.append('file', origBlob);
        const resOrig = await axios.post(`${API_URL}/histogram`, origData);
        setOriginalHistogramData(resOrig.data);
      }
      if (currBlob) {
        const currData = new FormData();
        currData.append('file', currBlob);
        const resCurr = await axios.post(`${API_URL}/histogram`, currData);
        setHistogramData(resCurr.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const recognizeImage = async (fileBlob) => {
    setIsProcessing(true);
    setMlResult(null);
    try {
      const formData = new FormData();
      formData.append('file', fileBlob);
      const res = await axios.post(`${API_URL}/recognize`, formData);
      setMlResult(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (file) => {
    const url = URL.createObjectURL(file);
    const newImg = { file, url };
    setOriginalImage(newImg);
    setCurrentImage(newImg);
    setOperation('');
    setParams({});
    
    if (activeCategory === 'histogram') {
      fetchHistogram(file, file);
    } else if (activeCategory === 'ml') {
      recognizeImage(file);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRotateStart = (e) => {
    if (operation !== 'rotate' || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
    rotateStart.current = { angle, initialUiAngle: uiAngle };
    setIsRotating(true);
  };

  const handleRotateMove = (e) => {
    if (!isRotating || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
    let diff = angle - rotateStart.current.angle;
    let newAngle = Math.round(rotateStart.current.initialUiAngle + diff);
    setUiAngle(newAngle);
  };

  const handleRotateEnd = () => {
    if (isRotating) {
      setIsRotating(false);
      setParams({...params, angle: uiAngle});
    }
  };

  const handleApply = () => {
    if (currentImage) {
      setOriginalImage(currentImage);
      setOperation('');
    }
  };

  const handleReset = () => {
    setCurrentImage(originalImage);
    setOperation('');
  };

  const renderControls = () => {
    if (!originalImage) return <div className="empty-state">Upload an image to start</div>;

    switch (activeCategory) {
      case 'enhancement':
        return (
          <>
            <div className="control-group">
              <label>Operation</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'brightness_contrast') setParams({ brightness: 0, contrast: 1.0 });
                if (e.target.value === 'sharpen') setParams({ intensity: 1.0 });
                if (e.target.value === 'blur') setParams({ ksize: 5 });
                if (e.target.value === 'histogram_equalization') setParams({});
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="brightness_contrast">Brightness & Contrast</option>
                <option value="histogram_equalization">Histogram Equalization</option>
                <option value="sharpen">Sharpen</option>
                <option value="blur">Blur</option>
              </select>
            </div>

            {operation === 'brightness_contrast' && (
              <>
                <div className="control-group">
                  <label>Brightness <span className="value-badge">{params.brightness || 0}</span></label>
                  <input type="range" min="-100" max="100" value={params.brightness || 0} onChange={e => setParams({...params, brightness: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Contrast <span className="value-badge">{params.contrast || 1.0}</span></label>
                  <input type="range" min="0.1" max="3.0" step="0.1" value={params.contrast || 1.0} onChange={e => setParams({...params, contrast: parseFloat(e.target.value)})} />
                </div>
              </>
            )}
            {operation === 'sharpen' && (
               <div className="control-group">
                 <label>Intensity <span className="value-badge">{params.intensity || 1.0}</span></label>
                 <input type="range" min="0.1" max="5.0" step="0.1" value={params.intensity || 1.0} onChange={e => setParams({...params, intensity: parseFloat(e.target.value)})} />
               </div>
            )}
            {operation === 'blur' && (
               <div className="control-group">
                 <label>Kernel Size <span className="value-badge">{params.ksize || 5}</span></label>
                 <input type="range" min="1" max="31" step="2" value={params.ksize || 5} onChange={e => setParams({...params, ksize: parseInt(e.target.value)})} />
               </div>
            )}
          </>
        );
      case 'transformation':
        return (
          <>
            <div className="control-group">
              <label>Operation</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'rotate') { setParams({ angle: 0 }); setUiAngle(0); }
                if (e.target.value === 'flip') setParams({ mode: 'horizontal' });
                if (e.target.value === 'crop') setParams({ x: 0, y: 0, w: 100, h: 100 });
                if (e.target.value === 'resize') setParams({ width: 256, height: 256, interpolation: 'bilinear' });
                if (e.target.value === 'translate') setParams({ tx: 50, ty: 50 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="rotate">Rotate</option>
                <option value="flip">Flip</option>
                <option value="crop">Crop</option>
                <option value="resize">Resize</option>
                <option value="translate">Translate</option>
              </select>
            </div>
            {operation === 'rotate' && (
              <>
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Drag the Original image to rotate, use slider, or click buttons.</p>
                <div className="control-group" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { const a = uiAngle - 90; setUiAngle(a); setParams({...params, angle: a}); }}>↺ -90°</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { const a = uiAngle + 90; setUiAngle(a); setParams({...params, angle: a}); }}>↻ +90°</button>
                </div>
                <div className="control-group">
                  <label>Angle <span className="value-badge">{uiAngle}°</span></label>
                  <input type="range" min="-180" max="180" value={uiAngle} 
                    onChange={e => setUiAngle(parseInt(e.target.value))} 
                    onMouseUp={() => setParams({...params, angle: uiAngle})}
                    onTouchEnd={() => setParams({...params, angle: uiAngle})}
                  />
                </div>
              </>
            )}
            {operation === 'flip' && (
              <div className="control-group">
                <label>Mode</label>
                <select value={params.mode || 'horizontal'} onChange={e => setParams({...params, mode: e.target.value})}>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            )}
            {operation === 'crop' && (
              <>
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Drag on the Original image to crop, or fine-tune values below.</p>
                <div className="control-group" style={{display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}><label>X</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.x || 0} onChange={e => setParams({...params, x: parseInt(e.target.value)})} /></div>
                  <div style={{flex:1}}><label>Y</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.y || 0} onChange={e => setParams({...params, y: parseInt(e.target.value)})} /></div>
                </div>
                <div className="control-group" style={{display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}><label>Width</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.w || 100} onChange={e => setParams({...params, w: parseInt(e.target.value)})} /></div>
                  <div style={{flex:1}}><label>Height</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.h || 100} onChange={e => setParams({...params, h: parseInt(e.target.value)})} /></div>
                </div>
              </>
            )}
            {operation === 'resize' && (
              <>
                <div className="control-group" style={{display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}><label>Width</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.width || 256} onChange={e => setParams({...params, width: parseInt(e.target.value)})} /></div>
                  <div style={{flex:1}}><label>Height</label><input type="number" style={{width:'100%', background:'var(--bg-primary)', color:'var(--text-color)', border:'1px solid var(--border-color)', padding:'5px'}} value={params.height || 256} onChange={e => setParams({...params, height: parseInt(e.target.value)})} /></div>
                </div>
                <div className="control-group">
                  <label>Interpolation</label>
                  <select value={params.interpolation || 'bilinear'} onChange={e => setParams({...params, interpolation: e.target.value})}>
                    <option value="bilinear">Bilinear</option>
                    <option value="nearest">Nearest Neighbor</option>
                  </select>
                </div>
              </>
            )}
            {operation === 'translate' && (
              <>
                <div className="control-group">
                  <label>Translate X <span className="value-badge">{params.tx || 0}</span></label>
                  <input type="range" min="-500" max="500" value={params.tx || 0} onChange={e => setParams({...params, tx: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Translate Y <span className="value-badge">{params.ty || 0}</span></label>
                  <input type="range" min="-500" max="500" value={params.ty || 0} onChange={e => setParams({...params, ty: parseInt(e.target.value)})} />
                </div>
              </>
            )}
          </>
        );
      case 'restoration':
         return (
          <>
            <div className="control-group">
              <label>Filter</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                setParams({ ksize: 5 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="gaussian_blur">Gaussian Blur</option>
                <option value="median_filter">Median Filter (Noise Removal)</option>
              </select>
            </div>
            <div className="control-group">
              <label>Kernel Size <span className="value-badge">{params.ksize || 5}</span></label>
              <input type="range" min="1" max="31" step="2" value={params.ksize || 5} onChange={e => setParams({...params, ksize: parseInt(e.target.value)})} />
            </div>
          </>
         );
      case 'edge':
        return (
          <>
             <div className="control-group">
              <label>Detection Method</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'threshold') setParams({ thresh: 127 });
                if (e.target.value === 'canny') setParams({ t1: 100, t2: 200 });
                if (e.target.value === 'sobel' || e.target.value === 'laplacian' || e.target.value === 'prewitt' || e.target.value === 'robert') setParams({});
                if (e.target.value === 'log') setParams({ ksize: 5 });
                if (e.target.value === 'morphology') setParams({ type: 'erosion', ksize: 5, iterations: 1 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="threshold">Binary Threshold</option>
                <option value="canny">Canny Edge</option>
                <option value="sobel">Sobel</option>
                <option value="laplacian">Laplacian</option>
                <option value="prewitt">Prewitt</option>
                <option value="robert">Robert Cross</option>
                <option value="log">Laplacian of Gaussian (LoG)</option>
                <option value="morphology">Morphology</option>
              </select>
            </div>
            {operation === 'threshold' && (
              <div className="control-group">
                <label>Threshold <span className="value-badge">{params.thresh || 127}</span></label>
                <input type="range" min="0" max="255" value={params.thresh || 127} onChange={e => setParams({...params, thresh: parseInt(e.target.value)})} />
              </div>
            )}
            {operation === 'canny' && (
              <>
                <div className="control-group">
                  <label>Min Threshold <span className="value-badge">{params.t1 || 100}</span></label>
                  <input type="range" min="0" max="255" value={params.t1 || 100} onChange={e => setParams({...params, t1: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Max Threshold <span className="value-badge">{params.t2 || 200}</span></label>
                  <input type="range" min="0" max="255" value={params.t2 || 200} onChange={e => setParams({...params, t2: parseInt(e.target.value)})} />
                </div>
              </>
            )}
            {operation === 'log' && (
               <div className="control-group">
                 <label>Kernel Size <span className="value-badge">{params.ksize || 5}</span></label>
                 <input type="range" min="1" max="15" step="2" value={params.ksize || 5} onChange={e => setParams({...params, ksize: parseInt(e.target.value)})} />
               </div>
            )}
            {operation === 'morphology' && (
              <>
                <div className="control-group">
                  <label>Type</label>
                  <select value={params.type || 'erosion'} onChange={e => setParams({...params, type: e.target.value})}>
                    <option value="erosion">Erosion</option>
                    <option value="dilation">Dilation</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Kernel Size <span className="value-badge">{params.ksize || 5}</span></label>
                  <input type="range" min="1" max="21" step="2" value={params.ksize || 5} onChange={e => setParams({...params, ksize: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Iterations <span className="value-badge">{params.iterations || 1}</span></label>
                  <input type="range" min="1" max="10" value={params.iterations || 1} onChange={e => setParams({...params, iterations: parseInt(e.target.value)})} />
                </div>
              </>
            )}
          </>
        );
      case 'segmentation':
        return (
          <>
            <div className="control-group">
              <label>Method</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'seg_threshold') setParams({});
                if (e.target.value === 'seg_edge') setParams({ t1: 100, t2: 200 });
                if (e.target.value === 'seg_region') setParams({ k: 3 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="seg_threshold">Threshold-based (Otsu)</option>
                <option value="seg_edge">Edge-based (Canny Contours)</option>
                <option value="seg_region">Region-based (K-Means)</option>
              </select>
            </div>
            {operation === 'seg_edge' && (
              <>
                <div className="control-group">
                  <label>Min Threshold <span className="value-badge">{params.t1 || 100}</span></label>
                  <input type="range" min="0" max="255" value={params.t1 || 100} onChange={e => setParams({...params, t1: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Max Threshold <span className="value-badge">{params.t2 || 200}</span></label>
                  <input type="range" min="0" max="255" value={params.t2 || 200} onChange={e => setParams({...params, t2: parseInt(e.target.value)})} />
                </div>
              </>
            )}
            {operation === 'seg_region' && (
              <div className="control-group">
                <label>Regions (K) <span className="value-badge">{params.k || 3}</span></label>
                <input type="range" min="2" max="10" value={params.k || 3} onChange={e => setParams({...params, k: parseInt(e.target.value)})} />
              </div>
            )}
          </>
        );
      case 'color':
        return (
          <>
            <div className="control-group">
              <label>Mode</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'grayscale') setParams({});
                if (e.target.value === 'channel') setParams({ channel: 'r' });
                if (e.target.value === 'hsv_adjust') setParams({ hue: 0, saturation: 1.0, value: 1.0 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="grayscale">Grayscale</option>
                <option value="channel">Split Channel</option>
                <option value="hsv_adjust">HSV Adjustment</option>
              </select>
            </div>
            {operation === 'channel' && (
              <div className="control-group">
                <label>Channel</label>
                <select value={params.channel || 'r'} onChange={e => setParams({...params, channel: e.target.value})}>
                  <option value="r">Red</option>
                  <option value="g">Green</option>
                  <option value="b">Blue</option>
                </select>
              </div>
            )}
            {operation === 'hsv_adjust' && (
              <>
                <div className="control-group">
                  <label>Hue Shift <span className="value-badge">{params.hue || 0}</span></label>
                  <input type="range" min="-180" max="180" value={params.hue || 0} onChange={e => setParams({...params, hue: parseInt(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Saturation <span className="value-badge">{params.saturation || 1.0}</span></label>
                  <input type="range" min="0" max="3" step="0.1" value={params.saturation || 1.0} onChange={e => setParams({...params, saturation: parseFloat(e.target.value)})} />
                </div>
                <div className="control-group">
                  <label>Value (Brightness) <span className="value-badge">{params.value || 1.0}</span></label>
                  <input type="range" min="0" max="3" step="0.1" value={params.value || 1.0} onChange={e => setParams({...params, value: parseFloat(e.target.value)})} />
                </div>
              </>
            )}
          </>
        );
      case 'compression':
        return (
           <>
            <div className="control-group">
              <label>Compression Method</label>
              <select value={operation} onChange={e => {
                setOperation(e.target.value);
                if (e.target.value === 'compress') setParams({ quality: 50 });
                if (e.target.value === 'quantization') setParams({ k: 16 });
              }}>
                <option value="" disabled>-- Pilih Operasi --</option>
                <option value="compress">JPEG Quality Simulator</option>
                <option value="quantization">Color Quantization (K-Means)</option>
              </select>
            </div>
            
            {operation === 'compress' && (
              <div className="control-group">
                <label>Quality <span className="value-badge">{params.quality || 50}%</span></label>
                <input type="range" min="1" max="100" value={params.quality || 50} onChange={e => setParams({...params, quality: parseInt(e.target.value)})} />
              </div>
            )}
            {operation === 'quantization' && (
              <div className="control-group">
                <label>Number of Colors (K) <span className="value-badge">{params.k || 16}</span></label>
                <input type="range" min="2" max="64" value={params.k || 16} onChange={e => setParams({...params, k: parseInt(e.target.value)})} />
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>Quantizes the image to K colors, effectively compressing the visual data.</p>
              </div>
            )}
          </>
        );
      case 'histogram':
        return (
          <div className="empty-state">
            <BarChart2 size={32} />
            <p>Histogram analysis loads automatically.</p>
            <button className="btn btn-primary" onClick={() => {
              if (currentImage && originalImage) fetchHistogram(originalImage.file, currentImage.file);
            }}>Refresh Data</button>
          </div>
        );
      case 'ml':
        return (
          <div className="ml-controls" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {mlResult ? (
              <>
                 <div style={{ marginBottom: '5px' }}>
                   <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.9rem' }}>Total Unique Colors:</p>
                   <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{mlResult.unique_colors}</h3>
                 </div>
                 
                 <h4 style={{ margin: '5px 0', fontSize: '1rem' }}>Category Match</h4>
                 
                 <div style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                       <span>Manusia</span>
                       <span>{mlResult.categories['Manusia'].toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${Math.min(mlResult.categories['Manusia'], 100)}%`, background: '#60a5fa', height: '100%', transition: 'width 0.5s ease' }}></div>
                    </div>
                 </div>
                 
                 <div style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                       <span>Hewan</span>
                       <span>{mlResult.categories['Hewan'].toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${Math.min(mlResult.categories['Hewan'], 100)}%`, background: '#34d399', height: '100%', transition: 'width 0.5s ease' }}></div>
                    </div>
                 </div>

                 <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                       <span>Lainnya</span>
                       <span>{mlResult.categories['Objek Lainnya'].toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${Math.min(mlResult.categories['Objek Lainnya'], 100)}%`, background: '#f59e0b', height: '100%', transition: 'width 0.5s ease' }}></div>
                    </div>
                 </div>
                 
                 <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                    <h5 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Top predictions:</h5>
                    <ul style={{ paddingLeft: '15px', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                       {mlResult.raw_predictions.map((pred, i) => (
                         <li key={i} style={{ marginBottom: '3px' }}>{pred}</li>
                       ))}
                    </ul>
                 </div>
                 
                 <button className="btn btn-secondary" style={{ marginTop: '5px' }} onClick={() => {
                   if (currentImage) recognizeImage(currentImage.file);
                 }}>
                   Rescan Image
                 </button>
              </>
            ) : (
              <div className="empty-state">
                <Scan size={32} />
                <p style={{ marginTop: '10px' }}>{isProcessing ? 'Scanning image...' : 'Click scan to analyze the image.'}</p>
                {!isProcessing && (
                  <button className="btn btn-primary" style={{ marginTop: '15px' }} onClick={() => {
                    if (currentImage) recognizeImage(currentImage.file);
                  }}>Scan Now</button>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getChartData = (label, dataArrayOriginal, dataArrayProcessed, color) => {
    const datasets = [];
    if (dataArrayOriginal) {
      datasets.push({
        label: `${label} (Original)`,
        data: dataArrayOriginal,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        borderColor: 'rgba(200, 200, 200, 0.8)',
        borderWidth: 1,
        pointRadius: 0,
        fill: true
      });
    }
    if (dataArrayProcessed) {
      datasets.push({
        label: `${label} (Processed)`,
        data: dataArrayProcessed,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        pointRadius: 0,
        fill: true
      });
    }
    return {
      labels: Array.from({ length: 256 }, (_, i) => i),
      datasets: datasets
    };
  };

  return (
    <div className="app-container" onDragEnter={handleDrag}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Wand2 className="logo-icon" size={28} />
          <h1>Mini PS</h1>
        </div>
        <div className="menu-items">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              className={`menu-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setOperation('');
                setParams({});
                setUiAngle(0);
                if (cat.id === 'ml' && originalImage && !mlResult) {
                    recognizeImage(originalImage.file);
                }
              }}
            >
              <cat.icon size={20} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
              <Upload size={16} /> Upload
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            {currentImage && (
              <>
                <button className="btn btn-secondary" onClick={handleApply}>
                  <Save size={16} /> Save
                </button>
                <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
                  <Download size={16} /> Export
                </button>
              </>
            )}
          </div>
          
          <button className="btn btn-secondary" style={{padding: '10px'}} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="workspace" 
             onMouseMove={handleRotateMove} 
             onMouseUp={handleRotateEnd} 
             onTouchMove={handleRotateMove} 
             onTouchEnd={handleRotateEnd}>
          <div className="image-area">
            {activeCategory === 'histogram' && histogramData ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', padding: '20px' }}>
                  <h3 style={{marginBottom: '0'}}>Histogram Comparison</h3>
                  <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0'}}>Comparing original vs processed image.</p>
                  
                  <div className="chart-container" style={{ minHeight: '200px' }}>
                    <Line 
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, title: { display: true, text: 'Grayscale' }}}} 
                      data={getChartData('Gray', originalHistogramData?.gray, histogramData.gray, 'gray')} 
                    />
                  </div>
                  <div className="chart-container" style={{ minHeight: '200px' }}>
                    <Line 
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, title: { display: true, text: 'Red Channel' }}}} 
                      data={getChartData('Red', originalHistogramData?.r, histogramData.r, 'red')} 
                    />
                  </div>
                  <div className="chart-container" style={{ minHeight: '200px' }}>
                    <Line 
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, title: { display: true, text: 'Green Channel' }}}} 
                      data={getChartData('Green', originalHistogramData?.g, histogramData.g, 'green')} 
                    />
                  </div>
                  <div className="chart-container" style={{ minHeight: '200px' }}>
                    <Line 
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, title: { display: true, text: 'Blue Channel' }}}} 
                      data={getChartData('Blue', originalHistogramData?.b, histogramData.b, 'blue')} 
                    />
                  </div>
               </div>
            ) : (
              <div className="image-panels">
                <div className="image-panel">
                  <div className="panel-header">Original</div>
                  <div className="image-container">
                    {originalImage ? (
                      activeCategory === 'transformation' && operation === 'crop' ? (
                        <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                          <img src={originalImage.url} alt="Original" ref={imgRef} />
                        </ReactCrop>
                      ) : (
                        <img 
                          src={originalImage.url} 
                          alt="Original" 
                          ref={imgRef}
                          style={{ 
                            transform: activeCategory === 'transformation' && operation === 'rotate' ? `rotate(${uiAngle}deg)` : 'none',
                            cursor: activeCategory === 'transformation' && operation === 'rotate' ? 'grab' : 'default',
                            transition: isRotating ? 'none' : 'transform 0.2s ease-out'
                          }} 
                          onMouseDown={handleRotateStart}
                          onTouchStart={handleRotateStart}
                        />
                      )
                    ) : <div className="empty-state"><ImageIcon size={48} />No Image</div>}
                  </div>
                </div>
                <div className="image-panel">
                  <div className="panel-header">Processed</div>
                  <div className="image-container">
                    {currentImage ? <img src={currentImage.url} alt="Processed" /> : <div className="empty-state"><ImageIcon size={48} />No Image</div>}
                    {isProcessing && (
                      <div className="processing-overlay">
                        <div className="spinner"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="controls-area">
            <div className="controls-header">
              {CATEGORIES.find(c => c.id === activeCategory)?.label || 'Controls'}
            </div>
            <div className="controls-body">
              {renderControls()}
              
              {originalImage && activeCategory !== 'histogram' && (
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="action-row">
                    <button className="btn btn-secondary" onClick={handleReset}>
                      <RotateCcw size={16} /> Reset
                    </button>
                    <button className="btn btn-primary" onClick={handleApply}>
                       Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Drag Overlay */}
        {dragActive && (
          <div className="upload-overlay drag-active" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <Upload size={64} />
            <h2 style={{marginTop: '20px'}}>Drop image here to upload</h2>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && currentImage && (
          <div className="upload-overlay drag-active" style={{backgroundColor: 'rgba(0,0,0,0.8)'}}>
            <div style={{background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px'}} onClick={e => e.stopPropagation()}>
              <h3 style={{margin: 0}}>Export Image</h3>
              <div className="control-group">
                <label>Filename</label>
                <input type="text" value={exportFilename} onChange={e => setExportFilename(e.target.value)} style={{width: '100%', padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px'}} />
              </div>
              <div className="control-group">
                <label>Format</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{width: '100%', padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px'}}>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="bmp">BMP</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px'}}>
                <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => {
                   const link = document.createElement('a');
                   link.href = currentImage.url;
                   link.download = `${exportFilename}.${exportFormat}`;
                   document.body.appendChild(link);
                   link.click();
                   document.body.removeChild(link);
                   setShowExportModal(false);
                }}>Download</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
