import cv2
import numpy as np
import os

def apply_processing_memory(image_bytes, operation, params):
    try:
        # Load image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return False, "Failed to decode image"

        result = None

        # 1. Enhancement
        if operation == "brightness_contrast":
            alpha = params.get("contrast", 1.0) # 1.0 - 3.0
            beta = params.get("brightness", 0) # 0 - 100
            result = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
        
        elif operation == "histogram_equalization":
            # Convert to YUV to equalize only the Y channel
            img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
            img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
            result = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)

        elif operation == "sharpen":
            intensity = params.get("intensity", 1.0)
            kernel = np.array([[-1, -1, -1],
                               [-1, 9 + intensity, -1],
                               [-1, -1, -1]])
            result = cv2.filter2D(img, -1, kernel)

        elif operation == "blur":
            ksize = int(params.get("ksize", 5))
            if ksize % 2 == 0: ksize += 1
            result = cv2.blur(img, (ksize, ksize))

        # 2. Geometric Transformation
        elif operation == "rotate":
            angle = float(params.get("angle", 90))
            (h, w) = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            result = cv2.warpAffine(img, M, (w, h))

        elif operation == "flip":
            mode = params.get("mode", "horizontal")
            flipCode = 1 if mode == "horizontal" else 0
            result = cv2.flip(img, flipCode)
            
        elif operation == "crop":
            x = int(params.get("x", 0))
            y = int(params.get("y", 0))
            w = int(params.get("w", img.shape[1]))
            h = int(params.get("h", img.shape[0]))
            result = img[y:y+h, x:x+w]

        elif operation == "resize":
            width = int(params.get("width", img.shape[1]))
            height = int(params.get("height", img.shape[0]))
            interp_str = params.get("interpolation", "bilinear")
            
            interp_flag = cv2.INTER_LINEAR
            if interp_str == "nearest":
                interp_flag = cv2.INTER_NEAREST
            elif interp_str == "bilinear":
                interp_flag = cv2.INTER_LINEAR

            width = max(1, width)
            height = max(1, height)
            result = cv2.resize(img, (width, height), interpolation=interp_flag)

        elif operation == "translate":
            tx = float(params.get("tx", 0))
            ty = float(params.get("ty", 0))
            M = np.float32([[1, 0, tx], [0, 1, ty]])
            (h, w) = img.shape[:2]
            result = cv2.warpAffine(img, M, (w, h))

        # 3. Restoration
        elif operation == "gaussian_blur":
            ksize = int(params.get("ksize", 5))
            if ksize % 2 == 0: ksize += 1
            result = cv2.GaussianBlur(img, (ksize, ksize), 0)

        elif operation == "median_filter":
            ksize = int(params.get("ksize", 5))
            if ksize % 2 == 0: ksize += 1
            result = cv2.medianBlur(img, ksize)

        # 4. Binary & Edge Detection
        elif operation == "threshold":
            thresh = int(params.get("thresh", 127))
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, result = cv2.threshold(gray, thresh, 255, cv2.THRESH_BINARY)
            # Convert back to BGR for consistency
            result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)

        elif operation == "canny":
            t1 = int(params.get("t1", 100))
            t2 = int(params.get("t2", 200))
            edges = cv2.Canny(img, t1, t2)
            result = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
            
        elif operation == "sobel":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            abs_grad_x = cv2.convertScaleAbs(sobelx)
            abs_grad_y = cv2.convertScaleAbs(sobely)
            edges = cv2.addWeighted(abs_grad_x, 0.5, abs_grad_y, 0.5, 0)
            result = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        elif operation == "laplacian":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            abs_dst = cv2.convertScaleAbs(laplacian)
            result = cv2.cvtColor(abs_dst, cv2.COLOR_GRAY2BGR)

        elif operation == "prewitt":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            kernelx = np.array([[1,1,1],[0,0,0],[-1,-1,-1]])
            kernely = np.array([[-1,0,1],[-1,0,1],[-1,0,1]])
            img_prewittx = cv2.filter2D(gray, -1, kernelx)
            img_prewitty = cv2.filter2D(gray, -1, kernely)
            result = cv2.cvtColor(cv2.convertScaleAbs(img_prewittx) + cv2.convertScaleAbs(img_prewitty), cv2.COLOR_GRAY2BGR)

        elif operation == "robert":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            kernelx = np.array([[1, 0], [0, -1]], dtype=int)
            kernely = np.array([[0, 1], [-1, 0]], dtype=int)
            x = cv2.filter2D(gray, cv2.CV_16S, kernelx)
            y = cv2.filter2D(gray, cv2.CV_16S, kernely)
            absX = cv2.convertScaleAbs(x)
            absY = cv2.convertScaleAbs(y)
            robert = cv2.addWeighted(absX, 0.5, absY, 0.5, 0)
            result = cv2.cvtColor(robert, cv2.COLOR_GRAY2BGR)

        elif operation == "log":
            ksize = int(params.get("ksize", 5))
            if ksize % 2 == 0: ksize += 1
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (ksize, ksize), 0)
            laplacian = cv2.Laplacian(blur, cv2.CV_64F)
            abs_dst = cv2.convertScaleAbs(laplacian)
            result = cv2.cvtColor(abs_dst, cv2.COLOR_GRAY2BGR)

        elif operation == "morphology":
            mtype = params.get("type", "erosion")
            ksize = int(params.get("ksize", 5))
            iterations = int(params.get("iterations", 1))
            kernel = np.ones((ksize, ksize), np.uint8)
            
            if mtype == "erosion":
                result = cv2.erode(img, kernel, iterations=iterations)
            elif mtype == "dilation":
                result = cv2.dilate(img, kernel, iterations=iterations)
            else:
                result = img

        # 5. Color Processing
        elif operation == "grayscale":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            result = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        elif operation == "channel":
            channel = params.get("channel", "r") # r, g, b
            b, g, r = cv2.split(img)
            zeros = np.zeros_like(b)
            if channel == "r":
                result = cv2.merge([zeros, zeros, r])
            elif channel == "g":
                result = cv2.merge([zeros, g, zeros])
            else:
                result = cv2.merge([b, zeros, zeros])

        elif operation == "hsv_adjust":
            h_shift = int(params.get("hue", 0))
            s_scale = float(params.get("saturation", 1.0))
            v_scale = float(params.get("value", 1.0))
            
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[:,:,0] = (hsv[:,:,0] + h_shift) % 180
            hsv[:,:,1] = np.clip(hsv[:,:,1] * s_scale, 0, 255)
            hsv[:,:,2] = np.clip(hsv[:,:,2] * v_scale, 0, 255)
            
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

        # 6. Compress
        elif operation == "compress":
            quality = int(params.get("quality", 50))
            # For compression simulation, we encode it with quality and decode it back to show artifacts
            success, encoded_img = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
            if success:
                return True, encoded_img.tobytes()
            return False, "Failed to compress image"
            
        elif operation == "quantization":
            k = int(params.get("k", 16))
            pixel_vals = img.reshape((-1, 3))
            pixel_vals = np.float32(pixel_vals)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(pixel_vals, k, None, criteria, 3, cv2.KMEANS_RANDOM_CENTERS)
            centers = np.uint8(centers)
            res = centers[labels.flatten()]
            result = res.reshape((img.shape))

        # 7. Segmentation
        elif operation == "seg_threshold":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            result = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

        elif operation == "seg_edge":
            t1 = int(params.get("t1", 100))
            t2 = int(params.get("t2", 200))
            edges = cv2.Canny(img, t1, t2)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            result = img.copy()
            cv2.drawContours(result, contours, -1, (0, 255, 0), 2)

        elif operation == "seg_region":
            # K-Means clustering for segmentation
            k = int(params.get("k", 3))
            pixel_vals = img.reshape((-1, 3))
            pixel_vals = np.float32(pixel_vals)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.85)
            _, labels, centers = cv2.kmeans(pixel_vals, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
            centers = np.uint8(centers)
            segmented_data = centers[labels.flatten()]
            result = segmented_data.reshape((img.shape))

        else:
            return False, "Unknown operation"

        if result is not None:
            # Determine output format based on operation, usually png is better to preserve quality
            ext = '.jpg' if operation == "compress" else '.png'
            success, encoded_result = cv2.imencode(ext, result)
            if success:
                return True, encoded_result.tobytes()
            return False, "Failed to encode processed image"
            
        return False, "Processing resulted in None"
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return False, str(e)


def get_histogram_data_memory(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {}
        
    # Calculate grayscale histogram
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hist_gray = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().tolist()
    
    # Calculate RGB histograms
    color = ('b', 'g', 'r')
    hist_rgb = {}
    for i, col in enumerate(color):
        hist_rgb[col] = cv2.calcHist([img], [i], None, [256], [0, 256]).flatten().tolist()
        
    return {
        "gray": hist_gray,
        "r": hist_rgb['r'],
        "g": hist_rgb['g'],
        "b": hist_rgb['b']
    }
