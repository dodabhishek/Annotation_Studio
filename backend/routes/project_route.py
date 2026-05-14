from flask import Blueprint, request, jsonify, current_app
from pathlib import Path
from datetime import datetime
import uuid

project_bp = Blueprint(
    "projects",
    __name__,
    url_prefix="/api/projects"
)

@project_bp.route("/create", methods=["POST"])
def create_project():

    try:

        data = request.json

        user_id = data.get("userId")
        name = data.get("name")
        model = data.get("model", "sam2")

        if not user_id or not name:

            return jsonify({
                "error": "Missing data"
            }), 400

        users = current_app.db.users
        projects = current_app.db.projects

        user = users.find_one({
            "googleId": user_id
        })

        if not user:

            return jsonify({
                "error": "User not found"
            }), 404

        existing = projects.find_one({
            "userId": user_id,
            "name": name
        })

        if existing:

            return jsonify({
                "error": "Project already exists"
            }), 400

        project_id = f"proj_{uuid.uuid4().hex[:10]}"

        project_path = (
            Path(user["workspacePath"])
            / "projects"
            / project_id
        )

        # Create directories

        (project_path / "images").mkdir(
            parents=True,
            exist_ok=True
        )

        (project_path / "annotations").mkdir(
            exist_ok=True
        )

        (project_path / "exports").mkdir(
            exist_ok=True
        )

        (project_path / "outputs").mkdir(
            exist_ok=True
        )

        project_doc = {
            "projectId": project_id,
            "userId": user_id,
            "name": name,
            "model": model,
            "projectPath": str(project_path),
            "createdAt": datetime.utcnow(),
            "imageCount": 0
        }

        projects.insert_one(project_doc)

        return jsonify({
            "success": True,
            "project": project_doc
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

@project_bp.route("/list", methods=["GET"])
def list_projects():

    try:

        user_id = request.args.get("userId")

        if not user_id:
            return jsonify({
                "error": "User ID required"
            }), 400

        projects = list(
            current_app.db.projects.find(
                {
                    "userId": user_id
                },
                {
                    "_id": 0
                }
            )
        )

        return jsonify({
            "success": True,
            "projects": projects
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500