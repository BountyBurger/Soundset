from flask import Blueprint, request, jsonify
from app.core.database import get_dbname_from_token, get_db_connection
from app.core.config import Config

bp = Blueprint('tags', __name__, url_prefix='/api')

@bp.route('/get_tags', methods=['POST'])
def get_tags():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
    
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()

    search_query = request.json.get('api_data', {}).get('search')
    if search_query:
        cursor.execute("SELECT * FROM tags WHERE name LIKE ?", ('%' + search_query + '%',))
    else:
        cursor.execute("SELECT * FROM tags")

    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@bp.route('/add_tag', methods=['POST'])
def add_tag():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    tag_name = request.json.get('api_data').get('name')
    
    #detect if tag already exists
    cursor.execute("SELECT * FROM tags WHERE name = ?", (tag_name,))
    results = cursor.fetchall()
    if len(results) > 0:
        conn.close()
        return "KO", 400
        
    cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
    conn.commit()
    conn.close()
    return "OK", 200

@bp.route('/delete_tag', methods=['POST'])
def delete_tag():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    tag_id = request.json.get('api_data').get('id')
    
    #delete all relations with sets
    cursor.execute(f"DELETE FROM rel_sets_tags WHERE id_tag = {tag_id};")
    #delete the tag
    cursor.execute(f"DELETE FROM tags WHERE id = {tag_id};")
    conn.commit()
    conn.close()
    return "OK", 200
