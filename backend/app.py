from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.detect_route import detect_bp
from routes.assets_route import assets_bp

app = Flask(__name__)

CORS(app)

app.register_blueprint(detect_bp)
app.register_blueprint(assets_bp)


@app.route("/")
def home():
    return {"message": "AI Annotation Backend Running"}


@app.route("/output/<filename>")
def get_output_image(filename):
    return send_from_directory("output", filename)


if __name__ == "__main__":
    app.run(debug=True)