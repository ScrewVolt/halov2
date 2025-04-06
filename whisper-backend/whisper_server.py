from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import openai
import os
from pydub import AudioSegment
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("VITE_OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Load Whisper model once on startup
model = whisper.load_model("base")

@app.route("/")
def home():
    return "Whisper backend is running!"

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    audio = AudioSegment.from_file(audio_file)

    with NamedTemporaryFile(suffix=".wav", delete=True) as temp_file:
        audio.export(temp_file.name, format="wav")
        result = model.transcribe(temp_file.name)

    return jsonify({"transcript": result["text"]})

@app.route("/summary", methods=["POST"])
def summarize():
    data = request.get_json()

    # Expecting { messages: "entire chat text here" }
    messages = data.get("messages")
    if not messages or not isinstance(messages, str) or not messages.strip():
        print("❌ Invalid or missing 'messages' field in request")
        return jsonify({"error": "Missing or invalid messages"}), 400

    print("📨 Received chat for summarization:\n", messages[:200])

    prompt = f"""
You are a clinical assistant summarizing a medical interaction between a nurse and a patient.

Conversation:
---
{messages}
---

Instructions:
1. Identify symptoms, medications, actions taken, and any responses or concerns.
2. Focus on key medical terms like "pain", "medication", "blood pressure", "vomiting", "history", "follow-up", etc.
3. Provide a concise and clinically useful **Summary**.
4. Create a structured **Nursing Chart** using this format:

- Assessment:
- Diagnosis:
- Plan:
- Interventions:
- Evaluation:

Ensure accuracy and clarity in professional tone.
"""

    try:
        response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{ "role": "user", "content": prompt }],
        temperature=0.3,
    )
        result = response.choices[0].message.content.strip()

        print("✅ Summary successfully generated")
        return jsonify({ "summary": result })

    except Exception as e:
        print("🔥 OpenAI API error:", str(e))
        return jsonify({ "error": str(e) }), 500

if __name__ == "__main__":
    app.run(debug=True)
