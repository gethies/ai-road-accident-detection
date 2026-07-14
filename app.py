import os
import sys
import time
import random
import requests
from datetime import datetime, timezone, timedelta
import cv2
import numpy as np

# Resolve protobuf descriptor issue
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# Resolve matplotlib shadowing issue on local machines
sys.path = [p for p in sys.path if p.lower() != r'c:\users\nagar\appdata\local\programs\python\python312']

from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from twilio.rest import Client

# Add Python Demo path to sys.path so we can import classifier
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
demo_path = os.path.join(WORKSPACE_DIR, 'Accident-Detection-on-Indian-Roads-master', 'Python Demo')
if demo_path not in sys.path:
    sys.path.insert(0, demo_path)

from classifier import run_classifier, init_classifier

print("[BACKEND LOG] Preloading AI Model...")
init_classifier()
print("[BACKEND LOG] AI Model loaded successfully.")
app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Ensure upload directory exists inside assets for static file serving
UPLOAD_FOLDER = os.path.join(WORKSPACE_DIR, 'assets', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

CHENNAI_LOCATIONS = [
    "Kathipara Junction, Chennai",
    "Mount Road (Anna Salai), Chennai",
    "OMR Highway, Karapakkam",
    "Koyambedu Flyover, Chennai",
    "Poonamallee High Road, Chennai",
    "GST Road, Tambaram",
    "ECR Scenic Highway, Akkarai",
    "Maduravoyal Bypass, Chennai"
]

# Twilio Credentials
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', 'your_auth_token_here')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '+1234567890')
EMERGENCY_PHONE_NUMBER = os.environ.get('EMERGENCY_PHONE_NUMBER', '+919876543210')

def reverse_geocode(lat, lon):
    """
    Reverse geocodes GPS coordinates using Nominatim API.
    Uses custom user-agent and handles timeouts/exceptions gracefully.
    """
    if lat is None or lon is None:
        return None
    try:
        headers = {
            'User-Agent': 'SURE-Accident-Detection-System/1.0 (contact: support@sure.in)'
        }
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        res = requests.get(url, headers=headers, timeout=1.5)
        if res.status_code == 200:
            data = res.json()
            display_name = data.get('display_name')
            if display_name:
                return display_name
    except Exception as e:
        print(f"Error in reverse geocoding via Nominatim: {e}")
    return None

def get_ist_timestamp():
    """
    Returns exact current timestamp in IST (DD-MM-YYYY HH:MM:SS IST) format.
    """
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_tz).strftime('%d-%m-%Y %H:%M:%S IST')

def make_emergency_call(address, time_str):
    """
    Places voice call via Twilio to emergency number with accident details.
    """
    if TWILIO_ACCOUNT_SID.startswith('ACXXXX') or 'your_auth' in TWILIO_AUTH_TOKEN:
        print(f"[MOCK TWILIO CALL] Outbound emergency call triggered for recipient: {EMERGENCY_PHONE_NUMBER}")
        print(f"[MOCK TWILIO CALL] Voice Message: 'Emergency! Accident detected at {address} on {time_str}. Please dispatch services immediately.'")
        return True
        
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        say_text = f"Emergency! Road accident detected. Location: {address}. Time: {time_str}. Please dispatch emergency response immediately."
        twiml_str = f'<Response><Say voice="alice">{say_text}</Say></Response>'
        
        call = client.calls.create(
            to=EMERGENCY_PHONE_NUMBER,
            from_=TWILIO_PHONE_NUMBER,
            twiml=twiml_str
        )
        print(f"[TWILIO CALL SUCCESS] Call SID: {call.sid}")
        return True
    except Exception as e:
        print(f"[TWILIO CALL ERROR] Failed to place Twilio call: {e}")
        return False

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def app_js():
    return send_from_directory('.', 'app.js')

@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'status': 'online',
        'timestamp': get_ist_timestamp()
    })

@app.route('/api/get_classifier_code')
def get_classifier_code():
    try:
        path = os.path.join(WORKSPACE_DIR, 'Accident-Detection-on-Indian-Roads-master', 'Python Demo', 'classifier.py')
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return str(e), 404

@app.route('/api/get_run_log')
def get_run_log():
    try:
        path = os.path.join(WORKSPACE_DIR, 'Accident-Detection-on-Indian-Roads-master', 'Python Demo', 'run.log')
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return str(e), 404

@app.route('/api/run_cli_script', methods=['POST'])
def run_cli_script():
    try:
        input_path = os.path.join(demo_path, 'input.jpg')
        output_path = os.path.join(demo_path, 'output.jpg')
        
        # Run detection
        detections = run_classifier(input_path, output_path, threshold=0.5)
        
        # Copy to assets so it can be served
        import shutil
        dest_output_path = os.path.join(WORKSPACE_DIR, 'assets', 'cli_output.jpg')
        shutil.copy2(output_path, dest_output_path)
        
        accident_detected = len(detections) > 0
        max_confidence = int(max(d['score'] for d in detections) * 100) if accident_detected else 0
        severity = "High" if max_confidence > 85 else "Medium" if max_confidence > 70 else "Low"

        return jsonify({
            'success': True,
            'detections_count': len(detections),
            'confidence': max_confidence,
            'severity': severity,
            'output_image_url': f"/assets/cli_output.jpg?t={int(time.time())}"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files and 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No image file uploaded'}), 400
        
    file = request.files.get('image') or request.files.get('file')
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Empty filename'}), 400

    # Save incoming upload
    timestamp = int(time.time() * 1000)
    ext = os.path.splitext(file.filename)[1] or '.jpg'
    input_filename = f"input_{timestamp}{ext}"
    output_filename = f"output_{timestamp}{ext}"
    
    input_path = os.path.join(UPLOAD_FOLDER, input_filename)
    output_path = os.path.join(UPLOAD_FOLDER, output_filename)
    
    file.save(input_path)
    
    try:
        req_json = request.get_json(silent=True) if request.is_json else None
        
        # Get threshold
        threshold_val = request.form.get('threshold') or (req_json.get('threshold') if req_json else None)
        threshold = 0.5
        if threshold_val:
            try:
                threshold = float(threshold_val)
            except ValueError:
                pass
                
        # Run detection model (classification threshold set by frontend)
        detections = run_classifier(input_path, output_path, threshold=threshold)
        
        accident_detected = len(detections) > 0
        max_confidence = 0
        severity = "Low"
        
        # Geo geocoding coords
        lat_val = request.form.get('latitude') or (req_json.get('latitude') if req_json else None)
        lon_val = request.form.get('longitude') or (req_json.get('longitude') if req_json else None)
        
        if lat_val and lon_val:
            lat, lon = float(lat_val), float(lon_val)
        else:
            lat = 13.0132 + random.uniform(-0.01, 0.01)
            lon = 80.2014 + random.uniform(-0.01, 0.01)
            
        location = reverse_geocode(lat, lon) or random.choice(CHENNAI_LOCATIONS)
        ist_time = get_ist_timestamp()
        
        alert_triggered = False
        
        if accident_detected:
            # Get max score
            max_score = max(d['score'] for d in detections)
            max_confidence = int(max_score * 100)
            
            # Determine severity
            if max_confidence > 85:
                severity = "High"
            elif max_confidence > 70:
                severity = "Medium"
            else:
                severity = "Low"
                
            # Twilio voice call notification
            alert_triggered = make_emergency_call(location, ist_time)
            
            # Broadcast WebSocket alert
            event_data = {
                'accident_detected': True,
                'confidence': max_confidence,
                'severity': severity,
                'location': location,
                'latitude': lat,
                'longitude': lon,
                'timestamp': ist_time,
                'input_image_url': f"/assets/uploads/{input_filename}",
                'output_image_url': f"/assets/uploads/{output_filename}"
            }
            socketio.emit('accident_alert', event_data)
        
        print(f"[BACKEND LOG] Inference complete. Incident: {accident_detected}, Confidence: {max_confidence}")
        
        accident_class = detections[0]['label'] if accident_detected and len(detections) > 0 else "None"
        
        return jsonify({
            'success': True,
            'incident_detected': accident_detected,
            'accident_class': accident_class,
            'confidence': max_confidence,
            'severity': severity,
            'location': location,
            'latitude': lat,
            'longitude': lon,
            'timestamp': ist_time,
            'bounding_boxes': detections,
            'alert_triggered': alert_triggered,
            'input_image_url': f"/assets/uploads/{input_filename}",
            'output_image_url': f"/assets/uploads/{output_filename}"
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/video_feed')
def video_feed():
    stream_url = request.args.get('url', '0')
    if stream_url.isdigit():
        capture_src = int(stream_url)
    else:
        capture_src = stream_url
        
    def generate():
        cap = cv2.VideoCapture(capture_src)
        
        if not cap.isOpened():
            print(f"[RTSP STREAM ERROR] Failed to connect to stream: {stream_url}")
            # Yield error image frame
            img = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(img, "RTSP CONNECTION FAILED", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(img, f"URL: {stream_url}", (50, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(img, "Retrying stream connection...", (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
            _, jpeg = cv2.imencode('.jpg', img)
            frame_bytes = jpeg.tobytes()
            while True:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                time.sleep(1.0)
            return
            
        print(f"[RTSP STREAM SUCCESS] Connected to: {stream_url}")
        frame_idx = 0
        try:
            while cap.isOpened():
                success, frame = cap.read()
                if not success:
                    break
                    
                # Downsample inference calls to keep stream fluid
                if frame_idx % 15 == 0:
                    temp_in = os.path.join(UPLOAD_FOLDER, "temp_stream_in.jpg")
                    temp_out = os.path.join(UPLOAD_FOLDER, "temp_stream_out.jpg")
                    cv2.imwrite(temp_in, frame)
                    try:
                        detections = run_classifier(temp_in, temp_out, threshold=0.5)
                        if len(detections) > 0:
                            classified_frame = cv2.imread(temp_out)
                            if classified_frame is not None:
                                frame = classified_frame
                                
                            ist_now = get_ist_timestamp()
                            lat = 13.0132 + random.uniform(-0.01, 0.01)
                            lon = 80.2014 + random.uniform(-0.01, 0.01)
                            address = random.choice(CHENNAI_LOCATIONS)
                            
                            max_score = max(d['score'] for d in detections)
                            max_conf = int(max_score * 100)
                            severity = "High" if max_conf > 85 else "Medium" if max_conf > 70 else "Low"
                            
                            event_data = {
                                'accident_detected': True,
                                'confidence': max_conf,
                                'severity': severity,
                                'location': address,
                                'latitude': lat,
                                'longitude': lon,
                                'timestamp': ist_now
                            }
                            socketio.emit('accident_alert', event_data)
                            make_emergency_call(address, ist_now)
                    except Exception as ex:
                        print(f"Streaming model prediction failed: {ex}")
                        
                _, jpeg = cv2.imencode('.jpg', frame)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
                frame_idx += 1
                time.sleep(0.03)
        finally:
            cap.release()
            
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@socketio.on('connect')
def handle_connect():
    print("WebSocket client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("WebSocket client disconnected")

@socketio.on('accident_alert')
def handle_incoming_alert(data):
    """
    Alert events received from external websocket emitters (e.g. Android client).
    """
    print(f"[WEBSOCKET ALERT RECEIVED]: {data}")
    confidence = data.get('confidence', 60)
    lat = data.get('latitude')
    lon = data.get('longitude')
    ist_time = get_ist_timestamp()
    
    if lat and lon:
        location = reverse_geocode(lat, lon) or f"Coordinates: {lat:.4f}, {lon:.4f}"
    else:
        lat = 13.0827
        lon = 80.2707
        location = "Unknown GPS Location"
        
    severity = "High" if confidence > 85 else "Medium" if confidence > 70 else "Low"
    
    broadcast_data = {
        'accident_detected': True,
        'confidence': confidence,
        'severity': severity,
        'location': location,
        'latitude': lat,
        'longitude': lon,
        'timestamp': ist_time
    }
    # Re-emit to everyone (specifically the web console)
    socketio.emit('accident_alert', broadcast_data)
    make_emergency_call(location, ist_time)

if __name__ == '__main__':
    print("Starting Accident Detection Web Server with SocketIO on http://0.0.0.0:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

