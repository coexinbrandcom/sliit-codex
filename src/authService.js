const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

const normalizeUsername = (username) => username.trim().toLowerCase();

const validateCredentials = (username, password) => {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { valid: false, error: 'Username and password must be strings.' };
  }

  const strippedUsername = username.trim();
  if (!strippedUsername) {
    return { valid: false, error: 'Username cannot be empty.' };
  }

  if (strippedUsername.length < MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    };
  }

  return { valid: true, error: '' };
};

export class AuthService {
  constructor() {
    this.users = new Map();
  }

  register(username, password) {
    const { valid, error } = validateCredentials(username, password);
    if (!valid) {
      return { status: 400, body: { error } };
    }

    const normalizedUsername = normalizeUsername(username);
    if (this.users.has(normalizedUsername)) {
      return { status: 409, body: { error: 'Username already exists.' } };
    }

    this.users.set(normalizedUsername, { username: normalizedUsername, password });
    return { status: 201, body: { message: 'Registration successful.' } };
  }

  login(username, password) {
    const { valid, error } = validateCredentials(username, password);
    if (!valid) {
      return { status: 400, body: { error } };
    }

    const normalizedUsername = normalizeUsername(username);
    const user = this.users.get(normalizedUsername);

    if (!user || user.password !== password) {
      return { status: 401, body: { error: 'Invalid username or password.' } };
    }

    return { status: 200, body: { message: 'Login successful.' } };
  }
}
