import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()

from routes.detect_route import detect_bp
from routes.assets_route import assets_bp
from routes.auth_route import auth_bp
from routes.project_route import project_bp


app = Flask(__name__)

CORS(app)

# MongoDB Setup
MONGO_DB_URL = os.getenv("MONGO_DB_URL")
if MONGO_DB_URL:
    try:
        app.mongo_client = MongoClient(
            MONGO_DB_URL,
            serverSelectionTimeoutMS=5000,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        app.db = app.mongo_client.get_database("annotation_studio")
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        app.db = None
else:
    print("MONGO_DB_URL not found in .env. MongoDB will not be available.")
    app.db = None

app.register_blueprint(detect_bp)
app.register_blueprint(assets_bp)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(project_bp)

@app.route("/")
def home():
    return {"message": "AI Annotation Backend Running"}


@app.route("/output/<filename>")
def get_output_image(filename):
    return send_from_directory("output", filename)


if __name__ == "__main__":
    app.run(debug=True, port=5001)