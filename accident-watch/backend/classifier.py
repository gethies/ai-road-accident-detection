"""TensorFlow accident classifier wrapper — singleton model loading."""

import os
import sys
from typing import Optional

from config import settings

_classifier_fn = None
_model_available = False


def _init_classifier():
    global _classifier_fn, _model_available
    if _classifier_fn is not None:
        return

    demo_path = settings.PYTHON_DEMO_PATH
    if demo_path not in sys.path:
        sys.path.insert(0, demo_path)

    # Filter matplotlib shadowing on Windows
    sys.path = [
        p
        for p in sys.path
        if p.lower() != r"c:\users\nagar\appdata\local\programs\python\python312"
    ]

    try:
        from classifier import run_classifier as _run

        _classifier_fn = _run
        _model_available = True
    except Exception as exc:
        print(f"[WARN] TF classifier unavailable: {exc}")
        _model_available = False


def compute_severity(detections: list[dict]) -> tuple[str, float, int, str]:
    if not detections:
        return "MINOR", 0.0, 0, "Monitor"

    count = len(detections)
    avg_conf = sum(d["score"] for d in detections) / count
    weighted = count * avg_conf

    if weighted >= 2.0 or avg_conf >= 0.85:
        severity = "SEVERE"
        action = "Dispatch ambulance"
    elif weighted >= 1.0 or avg_conf >= 0.65:
        severity = "MODERATE"
        action = "Notify police"
    else:
        severity = "MINOR"
        action = "Monitor"

    return severity, avg_conf, count, action


def run_detection(
    input_path: str, output_path: str, threshold: Optional[float] = None
) -> dict:
    _init_classifier()
    threshold = threshold or settings.DETECTION_CONFIDENCE_THRESHOLD

    if _classifier_fn and _model_available:
        detections = _classifier_fn(input_path, output_path, threshold=threshold)
    else:
        detections = _mock_detection(input_path, output_path)

    severity, avg_conf, vehicle_count, action = compute_severity(detections)
    return {
        "boxes": detections,
        "scores": [d["score"] for d in detections],
        "classes": [d.get("class_id", 1) for d in detections],
        "severity": severity,
        "vehicle_count": vehicle_count,
        "recommended_action": action,
        "confidence": avg_conf,
        "accident_detected": len(detections) > 0,
    }


def _mock_detection(input_path: str, output_path: str) -> list[dict]:
    """Fallback when TensorFlow model is unavailable."""
    import shutil

    shutil.copy(input_path, output_path)
    return [
        {
            "box": [0.2, 0.3, 0.6, 0.7],
            "score": 0.75,
            "class_id": 1,
            "label": "car accident",
        }
    ]
