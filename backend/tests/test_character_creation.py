import os
import sys
import pytest

# Add the app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../app'))

from app.app import app
from app.routes.user_routes import get_db_connection

@pytest.fixture
def client():
    app.config['TESTING'] = True
    client = app.test_client()
    yield client

@pytest.fixture(autouse=True)
def clear_tables():
    with app.app_context():
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("DELETE FROM OC_Tags")
        cursor.execute("DELETE FROM Tags")
        cursor.execute("DELETE FROM Original_Characters")
        cursor.execute("DELETE FROM users")
        db.commit()
        cursor.close()
        db.close()

def create_test_user(client, username="testartist", password="testpass"):
    # Register a user and return their id
    client.post('/register', json={
        'username': username,
        'password': password
    })
    # Fetch user id inside app context
    import MySQLdb
    with app.app_context():
        db = MySQLdb.connect(
            host=os.getenv('MYSQL_HOST'),
            user=os.getenv('MYSQL_USER'),
            passwd=os.getenv('MYSQL_PASSWORD'),
            db=os.getenv('MYSQL_DB')
        )
        cursor = db.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_id = cursor.fetchone()[0]
        cursor.close()
        db.close()
    return user_id

def test_create_character_success(client, clear_tables):
    artist_id = create_test_user(client)
    data = {
        "name": "My OC",
        "artist_id": artist_id,
        "tags": ["fantasy", "elf"],
        "description": "A fantasy elf character.",
        "turnaround_image": "turnaround.png",
        "headshot_image": "headshot.png"
    }
    response = client.post('/create_character', json=data)
    assert response.status_code == 201
    assert b'Character created successfully' in response.data

def test_create_character_missing_fields(client, clear_tables):
    artist_id = create_test_user(client, username="artist2")
    data = {
        "name": "OC2",
        "artist_id": artist_id,
        # Missing description, turnaround_image, headshot_image
        "tags": ["tag1"]
    }
    response = client.post('/create_character', json=data)
    assert response.status_code == 400
    assert b'Missing required fields' in response.data

def test_create_character_too_many_tags(client, clear_tables):
    artist_id = create_test_user(client, username="artist3")
    data = {
        "name": "OC3",
        "artist_id": artist_id,
        "tags": ["a", "b", "c", "d", "e", "f"],
        "description": "Too many tags.",
        "turnaround_image": "turnaround.png",
        "headshot_image": "headshot.png"
    }
    response = client.post('/create_character', json=data)
    assert response.status_code == 400
    assert b'Tags must be a list of up to 5 items' in response.data

def test_create_character_nonexistent_artist(client, clear_tables):
    data = {
        "name": "OC4",
        "artist_id": 999999,  # unlikely to exist
        "tags": ["tag1"],
        "description": "No artist.",
        "turnaround_image": "turnaround.png",
        "headshot_image": "headshot.png"
    }
    response = client.post('/create_character', json=data)
    assert response.status_code == 404
    assert b'Artist does not exist' in response.data