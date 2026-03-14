from flask import Blueprint, request, jsonify
import time
from app.core.database import get_dbname_from_token, get_db_connection
from app.core.config import Config
from app.core.utils import bcolors, cleanup_string, ms_to_time
from app.services.metadata import fetch_metadata

bp = Blueprint('sets', __name__, url_prefix='/api')

@bp.route('/add_set', methods=['POST'])
def add_set():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 500
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    fields = request.json.get("api_data")
    print(f"{bcolors.OKCYAN}ADD SET DATA : {fields}{bcolors.ENDC}")
    
    # Check if url is provided
    if fields.get("url") is None:
        conn.close()
        return "Missing URL", 400

    # Fetch metadata
    metadata = fetch_metadata(fields.get("url"))
    if "error" in metadata:
        conn.close()
        return metadata["error"], metadata["code"]
        
    platform = metadata["platform"]
    stream_id = metadata["stream_id"]
    stream_url = metadata["stream_url"]
    title = metadata["title"]
    duration = metadata["duration"]
    release_date = metadata["release_date"]

    # Check duplicate id
    cursor.execute("SELECT * FROM sets WHERE pf_id = ?", (stream_id,))
    results = cursor.fetchall()
    if len(results) > 0:
        print(f"{bcolors.FAIL}Duplicate ID detected{bcolors.ENDC}")
        conn.close()
        return "This set is already in the database", 510

    # Clean up strings
    title = cleanup_string(title)
    if release_date:
        release_date = release_date.replace('T', ' ').replace('Z', '')
    
    insert_timestamp = time.strftime('%Y-%m-%d %H:%M:%S')

    
    # Building the query
    columns = ["url", "full_name", "platform", "length", "pf_id", "release_date", "insert_date", "click_count", "thumbnail_url"]
    placeholders = ["?", "?", "?", "?", "?", "?", "?", "0", "?"]
    values = [stream_url, title, platform, duration, stream_id, release_date, insert_timestamp, metadata.get("thumbnail_url")]

    if fields.get("record_quality") is not None:
        columns.append("record_quality")
        placeholders.append("?")
        values.append(fields.get("record_quality"))
        
    if fields.get("rating") is not None:
        columns.append("rating")
        placeholders.append("?")
        values.append(fields.get("rating"))
        
    if fields.get("artist_talking") is not None:
        columns.append("artist_talking")
        placeholders.append("?")
        values.append(fields.get("artist_talking"))
        
    if fields.get("crowd_level") is not None:
        columns.append("crowd_level")
        placeholders.append("?")
        values.append(fields.get("crowd_level"))

    query = f"INSERT INTO sets ({', '.join(columns)}) VALUES ({', '.join(placeholders)});"
    
    print(f"{bcolors.HEADER}INSERT QUERY : {query}{bcolors.ENDC} with val {values}")
    
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return "OK", 200

@bp.route('/update_set', methods=['POST'])
def update_set():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400

    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    fields = request.json.get("api_data", {})
    print(f"{bcolors.OKCYAN}UPDATE DATA : {fields}{bcolors.ENDC}")

    set_id = fields.get("id")
    if set_id is None:
        conn.close()
        return "Bad request", 400

    update_fields = []
    update_values = []

    if "title" in fields:
        update_fields.append("full_name = ?")
        update_values.append(fields["title"])

    if "record_quality" in fields:
        update_fields.append("record_quality = ?")
        update_values.append(fields["record_quality"])

    if "rating" in fields:
        update_fields.append("rating = ?")
        update_values.append(fields["rating"])

    if "artist_talking" in fields:
        update_fields.append("artist_talking = ?")
        update_values.append(fields["artist_talking"])

    if "crowd_level" in fields:
        update_fields.append("crowd_level = ?")
        update_values.append(fields["crowd_level"])

    if update_fields:
        query = f"UPDATE sets SET {', '.join(update_fields)} WHERE id = ?"
        update_values.append(set_id)
        print(f"{bcolors.HEADER}UPDATE QUERY : {query}{bcolors.ENDC}")
        cursor.execute(query, update_values)

    if "tags" in fields:
        cursor.execute("DELETE FROM rel_sets_tags WHERE id_set = ?", (set_id,))
        tags = fields["tags"].split(",")
        for tag in tags:
            if not tag: continue # Handle empty split if any
            if tag.startswith("##NEW##"):
                tag_name = tag[7:]
                cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                result = cursor.fetchone()
                if result is None:
                    cursor.execute("INSERT INTO tags (name) VALUES (?)", (tag_name,))
                    cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
                    tag_id = cursor.fetchone()[0]
                else:
                    tag_id = result[0]
                cursor.execute("INSERT INTO rel_sets_tags (id_set, id_tag) VALUES (?, ?)", (set_id, tag_id))
            else:
                cursor.execute("INSERT INTO rel_sets_tags (id_set, id_tag) VALUES (?, ?)", (set_id, tag))

    if "artists" in fields:
        cursor.execute("DELETE FROM rel_sets_artists WHERE id_set = ?", (set_id,))
        artists = fields["artists"].split(",")
        for artist in artists:
            if not artist: continue
            if artist.startswith("##NEW##"):
                artist_name = artist[7:]
                cursor.execute("SELECT id FROM artists WHERE name = ?", (artist_name,))
                result = cursor.fetchone()
                if result is None:
                    cursor.execute("INSERT INTO artists (name) VALUES (?)", (artist_name,))
                    cursor.execute("SELECT id FROM artists WHERE name = ?", (artist_name,))
                    artist_id = cursor.fetchone()[0]
                else:
                    artist_id = result[0]
                cursor.execute("INSERT INTO rel_sets_artists (id_set, id_artist) VALUES (?, ?)", (set_id, artist_id))
            else:
                cursor.execute("INSERT INTO rel_sets_artists (id_set, id_artist) VALUES (?, ?)", (set_id, artist))

    conn.commit()
    conn.close()
    return "OK", 200

@bp.route('/delete_set', methods=['POST'])
def delete_set():
    db_name = get_dbname_from_token(request.json)
    set_id = request.json.get("api_data").get("id")
    if db_name is None:
        return "Bad session token", 400
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM rel_sets_tags WHERE id_set = {set_id};")
    cursor.execute(f"DELETE FROM rel_sets_artists WHERE id_set = {set_id};")
    cursor.execute(f"DELETE FROM sets WHERE id = {set_id};")
    conn.commit()
    conn.close()
    return "OK", 200

@bp.route('/update_click_count', methods=['POST'])
def update_click_count():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    cursor.execute(f"UPDATE sets SET click_count = click_count + 1 WHERE id = {request.json.get('api_data').get('set_id')};")
    conn.commit()
    conn.close()
    return "OK", 200
