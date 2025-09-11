import os
import sys
import tempfile
import pytest

# Add the app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../app'))

from app import app, get_db_connection

@pytest.fixture
def client():
    db_fd, db_path = tempfile.mkstemp()
    app.config['TESTING'] = True
    app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'CharaVault')
    client = app.test_client()

    yield client

def clear_users_table():
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM users")
    db.commit()
    cursor.close()
    db.close()

def test_register_success(client):
    clear_users_table()
    response = client.post('/register', json={
        'username': 'testuser',
        'password': 'testpass'
    })
    assert response.status_code == 201
    assert b'User created successfully' in response.data

def test_register_missing_fields(client):
    response = client.post('/register', json={
        'username': 'testuser2'
    })
    assert response.status_code == 400
    assert b'Username and password required' in response.data

def test_register_duplicate_username(client):
    clear_users_table()
    # Register first user
    client.post('/register', json={
        'username': 'duplicateuser',
        'password': 'pass1'
    })
    # Try registering with the same username
    response = client.post('/register', json={
        'username': 'duplicateuser',
        'password': 'pass2'
    })
    assert response.status_code == 409
    assert b'Username already exists' in response.data