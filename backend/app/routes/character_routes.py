from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename

character_bp = Blueprint('character', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    import pymysql
    return pymysql.connect(
        host=current_app.config['MYSQL_HOST'],
        user=current_app.config['MYSQL_USER'],
        password=current_app.config['MYSQL_PASSWORD'],
        database=current_app.config['MYSQL_DB'],
        charset='utf8mb4'
    )

@character_bp.route('/create_character', methods=['POST'])
def create_character():
    # Handle multipart/form-data for file uploads
    name = request.form.get('name')
    artist_id = request.form.get('artist_id')
    tags_str = request.form.get('tags', '')
    description = request.form.get('description')
    
    # Validate name length
    if not name or len(name) > 20:
        return jsonify({'error': 'Character name is required and must be 20 characters or less'}), 400
    
    # Validate description length
    if not description or len(description) > 1000:
        return jsonify({'error': 'Description is required and must be 1000 characters or less'}), 400
    
    # Parse tags
    tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()] if tags_str else []
    if len(tags) > 5:
        return jsonify({'error': 'Maximum 5 tags allowed'}), 400
    
    for tag in tags:
        if len(tag) > 20:
            return jsonify({'error': 'Each tag must be 20 characters or less'}), 400
    
    # Validate required fields
    if not all([name, artist_id, description]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Handle file uploads
    headshot = request.files.get('headshot')
    turnaround_files = request.files.getlist('turnaround')
    
    if not headshot:
        return jsonify({'error': 'Headshot image is required'}), 400
    
    if not allowed_file(headshot.filename):
        return jsonify({'error': 'Invalid headshot file type'}), 400
    
    if len(turnaround_files) > 8:
        return jsonify({'error': 'Maximum 8 turnaround images allowed'}), 400
    
    for file in turnaround_files:
        if file.filename and not allowed_file(file.filename):
            return jsonify({'error': 'Invalid turnaround file type'}), 400

    tags = [tag.lower() for tag in tags]  # Normalize tags

    db = get_db_connection()
    cursor = db.cursor()

    # Check if artist exists
    cursor.execute("SELECT id FROM Users WHERE id = %s", (artist_id,))
    if cursor.fetchone() is None:
        cursor.close()
        db.close()
        return jsonify({'error': 'Artist does not exist'}), 404

    # Insert character
    cursor.execute(
        "INSERT INTO Original_Characters (name, artist_id, description, turnaround_image, headshot_image) VALUES (%s, %s, %s, %s, %s)",
        (name, artist_id, description, '', '')  # We'll update these after getting the ID
    )
    oc_id = cursor.lastrowid

    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(current_app.root_path, '..', '..', UPLOAD_FOLDER)
    os.makedirs(upload_dir, exist_ok=True)

    # Save headshot
    headshot_filename = f"{oc_id}_profile.{headshot.filename.rsplit('.', 1)[1].lower()}"
    headshot_path = os.path.join(upload_dir, headshot_filename)
    headshot.save(headshot_path)

    # Save turnaround images
    turnaround_filenames = []
    for i, file in enumerate(turnaround_files, 1):
        if file.filename:
            filename = f"{oc_id}_image{i}.{file.filename.rsplit('.', 1)[1].lower()}"
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            turnaround_filenames.append(filename)

    # Update character with image paths
    cursor.execute(
        "UPDATE Original_Characters SET headshot_image = %s, turnaround_image = %s WHERE id = %s",
        (headshot_filename, ','.join(turnaround_filenames), oc_id)
    )

    # Insert tags and OC_Tags
    for tag in tags:
        # Insert tag if it doesn't exist
        cursor.execute("SELECT id FROM Tags WHERE tag = %s", (tag,))
        tag_row = cursor.fetchone()
        if tag_row:
            tag_id = tag_row[0]
        else:
            cursor.execute("INSERT INTO Tags (tag) VALUES (%s)", (tag,))
            tag_id = cursor.lastrowid
        # Link tag to character
        cursor.execute("INSERT INTO OC_Tags (oc_id, tag_id) VALUES (%s, %s)", (oc_id, tag_id))

    db.commit()
    cursor.close()
    db.close()

    return jsonify({'message': 'Character created successfully', 'character_id': oc_id}), 201

@character_bp.route('/characters', methods=['GET'])
def get_all_characters():
    search = request.args.get('search', '')
    search_type = request.args.get('type', 'name')  # 'name' or 'tags'
    
    db = get_db_connection()
    cursor = db.cursor()
    
    if search and search_type == 'name':
        cursor.execute("""
            SELECT oc.id, oc.name, oc.headshot_image, u.username 
            FROM Original_Characters oc 
            JOIN Users u ON oc.artist_id = u.id 
            WHERE oc.name LIKE %s
            ORDER BY oc.id DESC
        """, (f'%{search}%',))
    elif search and search_type == 'tags':
        cursor.execute("""
            SELECT DISTINCT oc.id, oc.name, oc.headshot_image, u.username 
            FROM Original_Characters oc 
            JOIN Users u ON oc.artist_id = u.id 
            JOIN OC_Tags ot ON oc.id = ot.oc_id 
            JOIN Tags t ON ot.tag_id = t.id 
            WHERE t.tag LIKE %s
            ORDER BY oc.id DESC
        """, (f'%{search.lower()}%',))
    else:
        cursor.execute("""
            SELECT oc.id, oc.name, oc.headshot_image, u.username 
            FROM Original_Characters oc 
            JOIN Users u ON oc.artist_id = u.id 
            ORDER BY oc.id DESC
        """)
    
    characters = cursor.fetchall()
    cursor.close()
    db.close()
    
    return jsonify([{
        'id': char[0],
        'name': char[1],
        'headshot_image': char[2],
        'artist': char[3]
    } for char in characters])

@character_bp.route('/character/<int:character_id>', methods=['GET'])
def get_character(character_id):
    db = get_db_connection()
    cursor = db.cursor()
    
    # Get character details
    cursor.execute("""
        SELECT oc.id, oc.name, oc.description, oc.headshot_image, oc.turnaround_image, u.username 
        FROM Original_Characters oc 
        JOIN Users u ON oc.artist_id = u.id 
        WHERE oc.id = %s
    """, (character_id,))
    
    character = cursor.fetchone()
    if not character:
        cursor.close()
        db.close()
        return jsonify({'error': 'Character not found'}), 404
    
    # Get tags
    cursor.execute("""
        SELECT t.tag 
        FROM Tags t 
        JOIN OC_Tags ot ON t.id = ot.tag_id 
        WHERE ot.oc_id = %s
    """, (character_id,))
    
    tags = [tag[0] for tag in cursor.fetchall()]
    
    cursor.close()
    db.close()
    
    turnaround_images = character[4].split(',') if character[4] else []
    
    return jsonify({
        'id': character[0],
        'name': character[1],
        'description': character[2],
        'headshot_image': character[3],
        'turnaround_images': turnaround_images,
        'tags': tags,
        'artist': character[5]
    })

@character_bp.route('/user/<int:user_id>/characters', methods=['GET'])
def get_user_characters(user_id):
    db = get_db_connection()
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT oc.id, oc.name, oc.headshot_image 
        FROM Original_Characters oc 
        WHERE oc.artist_id = %s
        ORDER BY oc.id DESC
    """, (user_id,))
    
    characters = cursor.fetchall()
    cursor.close()
    db.close()
    
    return jsonify([{
        'id': char[0],
        'name': char[1],
        'headshot_image': char[2]
    } for char in characters])