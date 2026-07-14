# Implementation Plan: Accident Detection Prototype

Run the Accident Detection model and build a modern, high-fidelity web-based prototype application that allows users to upload road traffic images, run the detection, and view the highlighted accidents in real-time.

## User Review Required

> [!IMPORTANT]
> The original model is built on TensorFlow 1.x. Since we are running on modern Python 3.12, we will use TensorFlow 2.x in compatibility mode to emulate TensorFlow 1.x behaviors. This has been tested and verified to work correctly.

## Proposed Changes

We will modify the Python Demo to run on TensorFlow 2.x and wrap it in a modern Flask web server. The project structure will look like this:

```
Python Demo/
├── app.py (New: Flask Web Server)
├── classifier.py (Modified: Compatibility patches + reusable run_classifier API)
├── templates/ (New: HTML templates)
│   └── index.html
└── static/ (New: CSS, JS and uploaded images)
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    └── uploads/ (Directory for temporary uploads)
```

---

### Component: Python Backend

#### [MODIFY] [classifier.py](file:///c:/Users/nagar/Downloads/Accident-Detection-on-Indian-Roads-master/Accident-Detection-on-Indian-Roads-master/Python%20Demo/classifier.py)
- Add TensorFlow 1.x compatibility shim at the very top of the file to redirect standard TensorFlow imports to `tensorflow.compat.v1` and disable V2 behaviors.
- Solve shadowing issues with Matplotlib on the local machine by dynamic filtering of `sys.path`.
- Refactor the classifier into an importable module with a reusable singleton `AccidentsClassifier` class.
- Expose a `run_classifier(input_image_path, output_image_path)` function.

#### [NEW] [app.py](file:///c:/Users/nagar/Downloads/Accident-Detection-on-Indian-Roads-master/Accident-Detection-on-Indian-Roads-master/Python%20Demo/app.py)
- Create a lightweight Flask application.
- Expose a homepage route (`/`) and a prediction endpoint (`/predict`).
- Handle file upload, verification, and invoke `run_classifier`.
- Return detection details (e.g. confidence scores, accident detected status).

---

### Component: Web Interface Frontend

We will design a premium, dark-themed UI that matches the style guide (smooth animations, tailored colors, glassmorphism, responsive).

#### [NEW] [index.html](file:///c:/Users/nagar/Downloads/Accident-Detection-on-Indian-Roads-master/Accident-Detection-on-Indian-Roads-master/Python%20Demo/templates/index.html)
- Main landing page with a drag-and-drop file upload zone.
- Visual status indicators and loading spinners.
- Side-by-side or slider-based split view of the original input vs. the processed output image showing bounding boxes.

#### [NEW] [style.css](file:///c:/Users/nagar/Downloads/Accident-Detection-on-Indian-Roads-master/Accident-Detection-on-Indian-Roads-master/Python%20Demo/static/css/style.css)
- Premium aesthetics using customized dark shades (`#0d0e15`, `#161925`), vibrant indigo/purple/crimson accents.
- Modern fonts (Outfit / Inter) imported from Google Fonts.
- Micro-animations for buttons, hover states, drag-and-drop feedback, and image reveal.

#### [NEW] [app.js](file:///c:/Users/nagar/Downloads/Accident-Detection-on-Indian-Roads-master/Accident-Detection-on-Indian-Roads-master/Python%20Demo/static/js/app.js)
- Handle drag-and-drop, file input triggers, AJAX uploads to `/predict`.
- Control CSS transitions and reveal output image once backend processing is done.

---

## Verification Plan

### Automated/Manual Execution
- Run `.v\Scripts\python -m pip install Flask` to install Flask.
- Run `python classifier.py input.jpg test_output.jpg` to verify CLI still works and outputs correct classification image.
- Start the Flask app via `.v\Scripts\python app.py` and test uploading `input.jpg` through the web browser.
- Verify the output image generated matches the expectations (bounding boxes around the accident location).
