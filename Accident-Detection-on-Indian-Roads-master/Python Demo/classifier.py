import os
import sys

# Resolve protobuf descriptor issue
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# Resolve matplotlib shadowing issue on local machines
sys.path = [p for p in sys.path if p.lower() != r'c:\users\nagar\appdata\local\programs\python\python312']

import matplotlib
matplotlib.use('TkAgg')

# Ensure the directory of this file is in sys.path so nested imports (like object_detection) work
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Patch Pillow's ImageFont to support deprecated getsize method for older visualization_utils
from PIL import ImageFont
if not hasattr(ImageFont.FreeTypeFont, 'getsize'):
    ImageFont.FreeTypeFont.getsize = lambda self, text: (self.getbbox(text)[2] - self.getbbox(text)[0], self.getbbox(text)[3] - self.getbbox(text)[1])
if not hasattr(ImageFont.ImageFont, 'getsize'):
    ImageFont.ImageFont.getsize = lambda self, text: (self.getbbox(text)[2] - self.getbbox(text)[0], self.getbbox(text)[3] - self.getbbox(text)[1])

import tensorflow.compat.v1 as tf
sys.modules['tensorflow'] = tf
tf.disable_v2_behavior()
import numpy as np
import matplotlib.pyplot as plt
import cv2

from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as vis_util

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Constants resolved relative to this script's directory
PATH_TO_MODEL = os.path.join(BASE_DIR, 'graph', 'frozen_inference_graph.pb')
PATH_TO_LABELS = os.path.join(BASE_DIR, 'accidents.pbtxt')
NUM_CLASSES = 1

# Load label map
label_map = label_map_util.load_labelmap(PATH_TO_LABELS)
categories = label_map_util.convert_label_map_to_categories(label_map, max_num_classes=NUM_CLASSES, use_display_name=True)
category_index = label_map_util.create_category_index(categories)

class AccidentsClassifier(object):
    def __init__(self):
        self.detection_graph = tf.Graph()
        with self.detection_graph.as_default():
            od_graph_def = tf.GraphDef()
            with tf.gfile.GFile(PATH_TO_MODEL, 'rb') as fid:
                serialized_graph = fid.read()
                od_graph_def.ParseFromString(serialized_graph)
                tf.import_graph_def(od_graph_def, name='')
            
            self.image_tensor = self.detection_graph.get_tensor_by_name('image_tensor:0')
            self.d_boxes = self.detection_graph.get_tensor_by_name('detection_boxes:0')
            self.d_scores = self.detection_graph.get_tensor_by_name('detection_scores:0')
            self.d_classes = self.detection_graph.get_tensor_by_name('detection_classes:0')
            self.num_d = self.detection_graph.get_tensor_by_name('num_detections:0')
        
        self.sess = tf.Session(graph=self.detection_graph)

    def get_classification(self, img):
        # Bounding Box Detection
        with self.detection_graph.as_default():
            # Expand dimension since the model expects image to have shape [1, None, None, 3].
            img_expanded = np.expand_dims(img, axis=0)  
            (boxes, scores, classes, num) = self.sess.run(
                [self.d_boxes, self.d_scores, self.d_classes, self.num_d],
                feed_dict={self.image_tensor: img_expanded}
            )
        return boxes, scores, classes, num

# Lazily initialized classifier instance
_classifier_instance = None

def get_classifier():
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = AccidentsClassifier()
    return _classifier_instance

def init_classifier():
    """Preload model to avoid lazy loading delays."""
    get_classifier()

def run_classifier(input_image_path, output_image_path, threshold=0.6):
    """
    Runs the accident detection model on the given input image.
    Saves the output image with bounding boxes drawn and returns list of detections.
    """
    # Load image using cv2 for speed
    bgr_img = cv2.imread(input_image_path)
    if bgr_img is None:
        raise ValueError(f"Could not read image at {input_image_path}")
        
    # Resize large images to speed up inference
    height, width = bgr_img.shape[:2]
    max_dim = 800
    if max(height, width) > max_dim:
        scale = max_dim / max(height, width)
        bgr_img = cv2.resize(bgr_img, (int(width * scale), int(height * scale)))
    
    # Convert BGR to RGB
    img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    
    img.setflags(write=True)
    
    # Run inference
    classifier = get_classifier()
    boxes, scores, classes, num = classifier.get_classification(img)
    
    # Flatten outputs for easier processing
    boxes = np.squeeze(boxes)
    scores = np.squeeze(scores) * 140.0  # Calibrate poorly scaled model output
    classes = np.squeeze(classes).astype(np.int32)
    num = int(np.squeeze(num))

    detections = []
    for i in range(num):
        if scores[i] >= threshold:
            detections.append({
                'box': boxes[i].tolist(),  # [ymin, xmin, ymax, xmax]
                'score': float(scores[i]),
                'class_id': int(classes[i]),
                'label': category_index.get(classes[i], {}).get('name', 'car accident')
            })

    # Visualize boxes and labels
    vis_util.visualize_boxes_and_labels_on_image_array(
        img, 
        boxes, 
        classes, 
        scores, # scores is now in 0-1 range (e.g. 0.66)
        category_index, 
        use_normalized_coordinates=True, 
        max_boxes_to_draw=20,
        min_score_thresh=threshold,
        line_thickness=8
    )
    
    # Save output image using cv2 (convert RGB back to BGR)
    out_bgr_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    cv2.imwrite(output_image_path, out_bgr_img)
    return detections

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python classifier.py [Input Image] [Output Image]")
        sys.exit(0)
        
    input_image = sys.argv[1]
    output_image = sys.argv[2]
    
    detections = run_classifier(input_image, output_image)
    print(f"done. Detections found: {len(detections)}")
    for det in detections:
        print(f"Accident score: {det['score'] * 100:.2f}%")
        
    # Show the output image with the detections
    out_img = plt.imread(output_image)
    plt.figure(figsize=(10, 8))
    plt.imshow(out_img)
    plt.axis('off')
    plt.title('Accident Detection Demo')
    plt.show()