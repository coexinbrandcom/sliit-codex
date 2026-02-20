## Section 1: Initial generated code

```python
"""
Simple Flask-based user authentication module.
This is the intentionally imperfect first version.
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
    def __init__(self) -> None:
        self._users: Dict[str, User] = {}

    def register(self, username: str, password: str) -> Tuple[dict, int]:
        valid, error = validate_credentials(username, password)
        if not valid:
            return {"error": error}, 400

        normalized_username = normalize_username(username)
        if normalized_username in self._users:
            return {"error": "Username already exists."}, 409

        self._users[normalized_username] = User(
            username=normalized_username,
            password_hash=generate_password_hash(password),
        )
        return {"message": "Registration successful."}, 201

    def login(self, username: str, password: str) -> Tuple[dict, int]:
        valid, error = validate_credentials(username, password)
        if not valid:
            return {"error": error}, 400

        # BUG: username is not normalized during login lookup
        user = self._users.get(username)
        if user is None:
            return {"error": "Invalid username or password."}, 401

        if not check_password_hash(user.password_hash, password):
            return {"error": "Invalid username or password."}, 401

        return {"message": "Login successful."}, 200


def normalize_username(username: str) -> str:
    return username.strip().lower()


def validate_credentials(username: str, password: str) -> Tuple[bool, str]:
    if not isinstance(username, str) or not isinstance(password, str):
        return False, "Username and password must be strings."

    if len(username.strip()) < 3:
        return False, "Username must be at least 3 characters."

    if len(password) < 6:
        return False, "Password must be at least 6 characters."

    return True, ""


app = Flask(__name__)
auth_service = AuthService()


@app.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    response, status = auth_service.register(
        payload.get("username", ""), payload.get("password", "")
    )
    return jsonify(response), status


@app.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    response, status = auth_service.login(
        payload.get("username", ""), payload.get("password", "")
    )
    return jsonify(response), status


if __name__ == "__main__":
    app.run(debug=True)
```

## Section 2: Bug explanation

**Bug identified:** In `login`, the code uses `self._users.get(username)` directly instead of normalizing the username first.

**Why this is a problem:** During registration, usernames are normalized with `strip().lower()`, so `" Alice "` becomes `"alice"`. During login, if the user enters `"Alice"` or `" alice "`, lookup fails even with the correct password because the raw input does not match the normalized key.

**Impact:** Valid users may be rejected with `401 Invalid username or password` due to case/whitespace differences.

## Section 3: Fixed code

The corrected version is the runnable `app.py` below.

```python
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
```

## Section 4: Documentation

### Module overview

This module is a small Flask authentication service with three HTTP endpoints:
- `POST /register` to create a user
- `POST /login` to authenticate a user
- `GET /health` for a basic health check

It uses:
- In-memory Python dictionary for storage (`AuthService._users`)
- Password hashing via Werkzeug (`generate_password_hash` / `check_password_hash`)
- Validation for username/password presence and minimum lengths

Design separation:
- **Route layer**: Parses HTTP requests and returns JSON responses.
- **Service layer** (`AuthService`): Handles register/login business logic.
- **Utility functions**: Normalization, hashing, verification, and validation.

### API endpoints

#### `POST /register`
Registers a new user.

Request body:
```json
{
  "username": "alice",
  "password": "secret123"
}
```

Success response:
- `201 Created`
```json
{"message": "Registration successful."}
```

Error responses:
- `400 Bad Request` for invalid input
- `409 Conflict` if username already exists

#### `POST /login`
Logs in an existing user.

Request body:
```json
{
  "username": "alice",
  "password": "secret123"
}
```

Success response:
- `200 OK`
```json
{"message": "Login successful."}
```

Error responses:
- `400 Bad Request` for invalid input
- `401 Unauthorized` for invalid credentials

#### `GET /health`
Health check endpoint.

Success response:
- `200 OK`
```json
{"status": "ok"}
```

### How to run the code

1. Install dependencies:
   ```bash
   pip install flask werkzeug
   ```
2. Run the app:
   ```bash
   python app.py
   ```
3. Test endpoints (examples):
   ```bash
   curl -X POST http://127.0.0.1:5000/register \
     -H "Content-Type: application/json" \
     -d '{"username":"Alice","password":"secret123"}'

   curl -X POST http://127.0.0.1:5000/login \
     -H "Content-Type: application/json" \
     -d '{"username":" alice ","password":"secret123"}'
   ```

### Limitations

- In-memory storage means all users are lost when the process restarts.
- No persistent database or session/token management.
- No advanced security controls (rate limiting, MFA, account lockout).
- Debug mode is enabled by default for teaching/demo purposes.
