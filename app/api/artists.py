from flask import Blueprint, request, jsonify
from app.core.database import get_dbname_from_token, get_db_connection
from app.core.config import Config

bp = Blueprint('artists', __name__, url_prefix='/api')

@bp.route('/get_artists', methods=['POST'])
def get_artists():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
    
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    search_query = request.json.get('api_data', {}).get('search')
    if search_query:
        cursor.execute("SELECT * FROM artists WHERE name LIKE ?", ('%' + search_query + '%',))
    else:
        cursor.execute("SELECT * FROM artists")
        
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@bp.route('/add_artist', methods=['POST'])
def add_artist():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    artist_name = request.json.get('api_data', {}).get('name')
    if not artist_name:
        conn.close()
        return "Missing artist name", 400

    cursor.execute("SELECT * FROM artists WHERE name = ?", (artist_name,))
    results = cursor.fetchall()
    if results:
        conn.close()
        return "KO", 400

    cursor.execute("INSERT INTO artists (name) VALUES (?)", (artist_name,))
    conn.commit()
    conn.close()
    return "OK", 200

@bp.route('/delete_artist', methods=['POST'])
def delete_artist():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    artist_id = request.json.get('api_data').get('id')
    
    #delete all relations with sets
    cursor.execute(f"DELETE FROM rel_sets_artists WHERE id_artist = {artist_id};")
    #delete the artist
    cursor.execute(f"DELETE FROM artists WHERE id = {artist_id};")
    conn.commit()
    conn.close()
    return "OK", 200
