from flask import Blueprint, request, jsonify, current_app

character_bp = Blueprint('character', __name__)

def get_db_connection():
    import MySQLdb
    import os
    return MySQLdb.connect(
        host=current_app.config['MYSQL_HOST'],
        user=current_app.config['MYSQL_USER'],
        passwd=current_app.config['MYSQL_PASSWORD'],
        db=current_app.config['MYSQL_DB']
    )

@character_bp.route('/create_character', methods=['POST'])
def create_character():
    data = request.get_json()
    name = data.get('name')
    artist_id = data.get('artist_id')
    tags = data.get('tags', [])
    description = data.get('description')
    turnaround_image = data.get('turnaround_image')
    headshot_image = data.get('headshot_image')

    # Validate required fields
    if not all([name, artist_id, description, turnaround_image, headshot_image]):
        return jsonify({'error': 'Missing required fields'}), 400

    if not isinstance(tags, list) or len(tags) > 5:
        return jsonify({'error': 'Tags must be a list of up to 5 items'}), 400

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
        (name, artist_id, description, turnaround_image, headshot_image)
    )
    oc_id = cursor.lastrowid

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