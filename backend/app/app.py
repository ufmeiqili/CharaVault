import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask, request, jsonify
from flask_cors import CORS
import MySQLdb
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os

# Initialize Flask app and load environment variables
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Load environment variables from a .env file
load_dotenv()

# Configure your MySQL connection
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

def get_db_connection():
    """
    Establish and return a new database connection.
    """
    return MySQLdb.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        passwd=app.config['MYSQL_PASSWORD'],
        db=app.config['MYSQL_DB']
    )

# User Registration Endpoint
@app.route('/register', methods=['POST'])
def register():
    """
    Register a new user with a unique username and hashed password.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    db = get_db_connection()
    cursor = db.cursor()

    # Check if username exists
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({'error': 'Username already exists'}), 409

    # Hash the password
    hashed_password = generate_password_hash(password)

    # Insert new user into the database
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
    db.commit()
    cursor.close()
    db.close()

    # Successful registration
    return jsonify({'message': 'User created successfully'}), 201

# User Login Endpoint
@app.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user by verifying the username and password.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    db = get_db_connection()
    cursor = db.cursor()

    # Retrieve the hashed password from db for the given username
    cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
    result = cursor.fetchone()
    cursor.close()
    db.close()

    # If user not found, return error
    if result is None:
        return jsonify({'error': 'Invalid username or password'}), 401

    # If password does not match, return error
    stored_password = result[0]
    if not check_password_hash(stored_password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    # Successful authentication
    return jsonify({'message': 'Login successful'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5001)
