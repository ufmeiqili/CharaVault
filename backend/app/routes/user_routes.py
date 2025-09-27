from flask import Blueprint, request, jsonify, current_app, session
from werkzeug.security import generate_password_hash, check_password_hash

user_bp = Blueprint('user', __name__)

def get_db_connection():
    import pymysql
    return pymysql.connect(
        host=current_app.config['MYSQL_HOST'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config['MYSQL_PASSWORD'],
        database=current_app.config['MYSQL_DB'],
        charset='utf8mb4'
    )

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    username = username.lower()
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({'error': 'Username already exists'}), 409
    hashed_password = generate_password_hash(password)
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
    user_id = cursor.lastrowid
    db.commit()
    cursor.close()
    db.close()
    
    # Set session
    session['user_id'] = user_id
    session['username'] = username
    
    return jsonify({'message': 'User created successfully', 'user_id': user_id, 'username': username}), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    username = username.lower()
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT id, password FROM users WHERE username = %s", (username,))
    result = cursor.fetchone()
    cursor.close()
    db.close()
    if result is None:
        return jsonify({'error': 'Invalid username or password'}), 401
    user_id, stored_password = result
    if not check_password_hash(stored_password, password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Set session
    session['user_id'] = user_id
    session['username'] = username
    
    return jsonify({'message': 'Login successful', 'user_id': user_id, 'username': username}), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@user_bp.route('/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    return jsonify({
        'user_id': session['user_id'],
        'username': session['username']
    }), 200

@user_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    db.close()
    
    if not result:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': result[0],
        'username': result[1]
    }), 200