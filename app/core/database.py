import sqlite3
import hashlib
import time
from flask import current_app, request
from app.core import config

def get_db_connection(db_path):
    conn = sqlite3.connect(db_path)
    # Enable accessing columns by name if desired, though existing code uses indices mostly
    # conn.row_factory = sqlite3.Row 
    return conn

def check_password(database_name, password):
    # hash the password (sha256)
    password = hashlib.sha256(password.encode()).hexdigest()
    # check if the password is correct
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT pwd_hash FROM databases WHERE name = ?", (database_name,))
    results = cursor.fetchall()
    conn.close()
    
    if len(results) == 0:
        current_app.logger.warning(f"Database load failed: Database '{database_name}' not found. IP: {request.remote_addr}")
        return False
    else:
        if results[0][0] == password:
            return True
        else:
            current_app.logger.warning(f"Database load failed: Incorrect password for '{database_name}'. IP: {request.remote_addr}")
            return False

def get_dbname_from_token(raw_json):
    session_token = raw_json.get("session_token")
    if not session_token:
        return None
        
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM session_tokens WHERE token = ?", (session_token,))
    
    results = cursor.fetchall()
    
    db_name = None
    
    if len(results) == 0:
        conn.close()
        return None
    else:
        # Check if token is expired
        # Assuming results[0][2] is expiration
        if time.strftime('%Y-%m-%d %H:%M:%S') > results[0][2]:
            conn.close()
            return None
        else:
            # extend the token expiration
            expiration = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() + config.Config.TOKEN_LIFESPAN))
            cursor.execute("UPDATE session_tokens SET expiration = ? WHERE token = ?", (expiration, session_token))
            conn.commit()
            
            # If token is valid get the db name from 'database' table
            id_db = results[0][0]
            cursor.execute(f"SELECT name FROM databases WHERE id = {id_db};")
            db_results = cursor.fetchall()
            
            # Check if the database still exists
            if len(db_results) == 0:
                conn.close()
                return None
            else:
                # Update the last access timestamp
                cursor.execute(f"UPDATE databases SET last_access = '{time.strftime('%Y-%m-%d %H:%M:%S')}' WHERE id = {id_db};")
                conn.commit()
                db_name = db_results[0][0]
                

    conn.close()
    return db_name

def clean_expired_tokens():
    conn = get_db_connection(config.Config.DBMS_PATH)
    cursor = conn.cursor()
    current_time = time.strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("DELETE FROM session_tokens WHERE expiration < ?", (current_time,))
    conn.commit()
    conn.close()
