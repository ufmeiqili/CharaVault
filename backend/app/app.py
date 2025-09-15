import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Initialize Flask app and load environment variables
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
load_dotenv()

# Configure your MySQL connection
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

# Register blueprints
from app.routes.user_routes import user_bp
from app.routes.character_routes import character_bp
app.register_blueprint(user_bp)
app.register_blueprint(character_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5001)