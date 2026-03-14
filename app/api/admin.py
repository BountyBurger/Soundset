from flask import Blueprint, request
import sqlite3
import hashlib
import time
import os
from app.core import config
from app.core.database import check_password, get_db_connection, clean_expired_tokens, get_dbname_from_token
from app.core.utils import generate_token
import json

bp = Blueprint('admin', __name__, url_prefix='/api/database')

def init_dbms():
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS databases (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, creation_date TEXT, last_access TEXT, pwd_hash TEXT, title TEXT, description TEXT);")
    cursor.execute("CREATE TABLE IF NOT EXISTS session_tokens (id_db INTEGER, token TEXT, expiration TEXT, FOREIGN KEY(id_db) REFERENCES databases(id));")
    conn.commit()
    conn.close()

def migrate_dbms():
    init_dbms()
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    # check if title and description exist
    cursor.execute("PRAGMA table_info(databases)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'title' not in columns:
        cursor.execute("ALTER TABLE databases ADD COLUMN title TEXT;")
    if 'description' not in columns:
        cursor.execute("ALTER TABLE databases ADD COLUMN description TEXT;")
    conn.commit()
    conn.close()

migrate_dbms()

@bp.route('/create', methods=['POST'])
def create_database():
    db_name = request.json.get("name")
    
    # Check if database already exists in DBMS
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM databases WHERE name = ?", (db_name,))
    results = cursor.fetchall()
    
    if len(results) > 0:
        conn.close()
        return "KO", 400
    
    db_password = request.json.get("password")
    hashed_db_password = hashlib.sha256(db_password.encode()).hexdigest()
    creation_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    token = generate_token()
    
    # Create the database file
    db_file_path = f"{config.Config.DB_REPO_PATH}/{db_name}.db"
    new_db_conn = sqlite3.connect(db_file_path)
    new_db_cursor = new_db_conn.cursor()
    new_db_cursor.execute("CREATE TABLE IF NOT EXISTS artists (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(50) NOT NULL DEFAULT '');")
    new_db_cursor.execute("CREATE TABLE IF NOT EXISTS rel_sets_artists (id INTEGER PRIMARY KEY AUTOINCREMENT, id_set INTEGER NOT NULL, id_artist INTEGER NOT NULL);")
    new_db_cursor.execute("CREATE TABLE IF NOT EXISTS rel_sets_tags (id INTEGER PRIMARY KEY AUTOINCREMENT, id_set INTEGER NOT NULL, id_tag INTEGER NOT NULL);")
    new_db_cursor.execute("CREATE TABLE IF NOT EXISTS sets (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, full_name VARCHAR(50) NULL DEFAULT NULL, platform VARCHAR(50) NULL DEFAULT NULL, click_count INTEGER NULL, length TIME NULL, record_quality TINYINT NULL, artist_talking TINYINT NULL, crowd_level TINYINT NULL, rating TINYINT NULL, insert_date DATETIME NULL, release_date DATETIME NULL, pf_id VARCHAR(50), thumbnail_url TEXT NULL);")
    new_db_cursor.execute("CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(50) NULL);")
    new_db_conn.commit()
    new_db_conn.close()
    
    # Insert database info into DBMS
    cursor.execute("INSERT INTO databases (name, creation_date, last_access, pwd_hash) VALUES (?, ?, ?, ?)", 
                   (db_name, creation_timestamp, creation_timestamp, hashed_db_password))
    conn.commit()
    
    # Get ID of the new database
    cursor.execute("SELECT id FROM databases WHERE name = ?", (db_name,))
    id_db = cursor.fetchone()[0]
    
    # Create session token
    clean_expired_tokens()
    expiration = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() + config.Config.TOKEN_LIFESPAN))
    cursor.execute("INSERT INTO session_tokens (id_db, token, expiration) VALUES (?, ?, ?)", (id_db, token, expiration))
    conn.commit()
    conn.close()
    
    return token, 200

@bp.route('/delete', methods=['POST'])
def delete_database():
    db_name = request.json.get("name")
    db_password = request.json.get("password")
    
    if check_password(db_name, db_password) == False:
        return "KO", 400
    
    # Delete the database file
    try:
        os.remove(f"{config.Config.DB_REPO_PATH}/{db_name}.db")
    except OSError:
        pass # File might be already gone
        
    # Delete from DBMS
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM databases WHERE name = ?", (db_name,))
    conn.commit()
    conn.close()
    
    return "OK", 200

@bp.route('/load', methods=['POST'])
def load_database():
    db_name = request.json.get("name")
    db_password = request.json.get("password")
    
    if check_password(db_name, db_password) == False:
        return "KO", 400
    
    token = generate_token()
    
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM databases WHERE name = ?", (db_name,))
    result = cursor.fetchone()
    if not result:
        conn.close()
        return "Database not found", 404
        
    id_db = result[0]
    clean_expired_tokens()
    expiration = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() + config.Config.TOKEN_LIFESPAN))
    
    cursor.execute("INSERT INTO session_tokens (id_db, token, expiration) VALUES (?, ?, ?)", (id_db, token, expiration))
    conn.commit()
    conn.close()
    
    return token, 200

@bp.route('/info', methods=['GET'])
def get_info():
    db_name = get_dbname_from_token(request.args)
    if not db_name:
        return "Unauthorized", 401
        
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT title, description FROM databases WHERE name = ?", (db_name,))
    result = cursor.fetchone()
    conn.close()
    
    return {"title": result[0] or "", "description": result[1] or ""}, 200

@bp.route('/info', methods=['POST'])
def update_info():
    db_name = get_dbname_from_token(request.json)
    if not db_name:
        return "Unauthorized", 401
    
    title = request.json.get("title")
    description = request.json.get("description")
    
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE databases SET title = ?, description = ? WHERE name = ?", (title, description, db_name))
    conn.commit()
    conn.close()
    
    return "OK", 200

@bp.route('/export', methods=['GET'])
def export_database():
    db_name = get_dbname_from_token(request.args)
    if not db_name:
        return "Unauthorized", 401
        
    db_file_path = f"{config.Config.DB_REPO_PATH}/{db_name}.db"
    if not os.path.exists(db_file_path):
        return "Database file not found", 404
        
    conn = sqlite3.connect(db_file_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    data = {}
    
    # Export all tables except passwords if any (none in individual db)
    tables = ['artists', 'tags', 'sets', 'rel_sets_artists', 'rel_sets_tags']
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        data[table] = [dict(row) for row in cursor.fetchall()]
        
    conn.close()
    
    # Get metadata from dbms
    conn_dbms = get_db_connection(config.Config.DBMS_PATH)
    cursor_dbms = conn_dbms.cursor()
    cursor_dbms.execute("SELECT title, description FROM databases WHERE name = ?", (db_name,))
    meta = cursor_dbms.fetchone()
    conn_dbms.close()
    
    data['metadata'] = {"title": meta[0], "description": meta[1]}
    
    return data, 200

@bp.route('/import', methods=['POST'])
def import_database():
    db_name = get_dbname_from_token(request.json)
    if not db_name:
        return "Unauthorized", 401
        
    data = request.json.get("data")
    if not data:
        return "No data provided", 400
        
    # Security: Validate structure
    required_tables = ['artists', 'tags', 'sets', 'rel_sets_artists', 'rel_sets_tags']
    for table in required_tables:
        if table not in data:
            return f"Missing table {table} in import data", 400

    db_file_path = f"{config.Config.DB_REPO_PATH}/{db_name}.db"
    
    # Clear and overwrite
    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()
    
    try:
        # Disable foreign keys temporarily if needed
        cursor.execute("PRAGMA foreign_keys = OFF;")
        
        for table in required_tables:
            cursor.execute(f"DELETE FROM {table}")
            if not data[table]:
                continue
                
            # Use placeholders for security
            columns = data[table][0].keys()
            placeholders = ", ".join(["?" for _ in columns])
            cursor.executemany(f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})", 
                              [tuple(row.values()) for row in data[table]])
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        return f"Import failed: {str(e)}", 500
    finally:
        conn.close()
        
    # Update metadata
    if 'metadata' in data:
        meta = data['metadata']
        conn_dbms = get_db_connection(config.Config.DBMS_PATH)
        cursor_dbms = conn_dbms.cursor()
        cursor_dbms.execute("UPDATE databases SET title = ?, description = ? WHERE name = ?", 
                           (meta.get("title"), meta.get("description"), db_name))
        conn_dbms.commit()
        conn_dbms.close()

    return "OK", 200
