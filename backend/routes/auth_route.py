import os
from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import datetime
from pathlib import Path

auth_bp = Blueprint("auth_bp", __name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt-key")

BASE_STORAGE = (
    Path(__file__).resolve().parent.parent
    / "storage"
    / "users"
)
BASE_STORAGE.mkdir(parents=True, exist_ok=True)

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    data = request.json
    token = data.get("token")

    if not token:
        return jsonify({"error": "No token provided"}), 400

    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Extract user info
        user_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")
        
        user_folder = BASE_STORAGE / user_id

        (user_folder / "projects").mkdir(
            parents=True,
            exist_ok=True
        )
        (user_folder / "folders").mkdir(
        exist_ok=True
    )
        
        (user_folder / "temp").mkdir(
            exist_ok=True
        )
        # Store/Update in MongoDB if available
        if current_app.db is not None:
            users_collection = current_app.db.users
            users_collection.update_one(
                {"googleId": user_id},
                {"$set": {
                    "googleId": user_id,
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "workspacePath": str(user_folder),
                    "lastLogin": datetime.datetime.utcnow()
                }},
                upsert=True
            )

        # Generate a custom JWT
        jwt_payload = {
            "sub": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        
        session_token = jwt.encode(jwt_payload, JWT_SECRET, algorithm="HS256")

        return jsonify({
            "success": True,
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "picture": picture
            },
            "token": session_token
        })

    except ValueError as e:
        # Invalid token
        print(f"Token validation failed: {e}")
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        print(f"Auth error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
