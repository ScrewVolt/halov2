from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
from pydub import AudioSegment
import torch

app = Flask(__name__)
CORS(app)

# Load Whisper model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("base", device=device)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files["audio"]
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
        audio_path = temp_wav.name
        audio_file.save(audio_path)

    try:
        result = model.transcribe(audio_path, fp16=False)
        text = result.get("text", "")
        return jsonify({"transcript": text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
