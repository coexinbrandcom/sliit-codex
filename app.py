"""
Simple Flask-based user authentication module.
Features:
- Register endpoint
- Login endpoint
- In-memory user storage
- Password hashing (Werkzeug)
- Basic input validation
"""

from dataclasses import dataclass
from typing import Dict, Tuple

from flask import Flask, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash


@dataclass
class User:
    username: str
    password_hash: str


class AuthService:
    """Business logic for user registration and login."""

    def __init__(self) -> None:
        self._users: Dict[str, User] = {}

    def register(self, username: str, password: str) -> Tuple[dict, int]:
        valid, error = validate_credentials(username, password)
        if not valid:
            return {"error": error}, 400

        normalized_username = normalize_username(username)
        if normalized_username in self._users:
            return {"error": "Username already exists."}, 409

        password_hash = hash_password(password)
        self._users[normalized_username] = User(
            username=normalized_username,
            password_hash=password_hash,
        )
        return {"message": "Registration successful."}, 201

    def login(self, username: str, password: str) -> Tuple[dict, int]:
        valid, error = validate_credentials(username, password)
        if not valid:
            return {"error": error}, 400

        normalized_username = normalize_username(username)
        user = self._users.get(normalized_username)
        if user is None:
            return {"error": "Invalid username or password."}, 401

        if not verify_password(password, user.password_hash):
            return {"error": "Invalid username or password."}, 401

        return {"message": "Login successful."}, 200


def normalize_username(username: str) -> str:
    return username.strip().lower()


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def validate_credentials(username: str, password: str) -> Tuple[bool, str]:
    if not isinstance(username, str) or not isinstance(password, str):
        return False, "Username and password must be strings."

    stripped_username = username.strip()
    if not stripped_username:
        return False, "Username cannot be empty."

    if len(stripped_username) < 3:
        return False, "Username must be at least 3 characters."

    if len(password) < 6:
        return False, "Password must be at least 6 characters."

    return True, ""


app = Flask(__name__)
auth_service = AuthService()


@app.post("/register")
def register() -> tuple:
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "")
    password = payload.get("password", "")

    response, status = auth_service.register(username, password)
    return jsonify(response), status


@app.post("/login")
def login() -> tuple:
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "")
    password = payload.get("password", "")

    response, status = auth_service.login(username, password)
    return jsonify(response), status


@app.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True)
