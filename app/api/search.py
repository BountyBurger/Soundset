from flask import Blueprint, request, jsonify
from app.core.database import get_dbname_from_token, get_db_connection
from app.core.config import Config
from app.core.utils import bcolors, extract_data_request, minutes_to_time

bp = Blueprint('search', __name__, url_prefix='/api')

@bp.route('/search', methods=['POST'])
def search():
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
    
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    filters = extract_data_request(request.json)
    print(f"{bcolors.OKCYAN}SEARCH DATA : {filters}{bcolors.ENDC}")
    
    query = "SELECT m.*, GROUP_CONCAT(DISTINCT t.id) AS tags, GROUP_CONCAT(DISTINCT a.id) AS artists \
            FROM sets m  \
            LEFT JOIN rel_sets_artists ra ON m.id = ra.id_set \
            LEFT JOIN artists a ON ra.id_artist = a.id \
            LEFT JOIN rel_sets_tags rt ON m.id = rt.id_set \
            LEFT JOIN tags t ON rt.id_tag = t.id "

    conditions = []

    # Title search
    if filters.get("title_search"):
         conditions.append(f"full_name LIKE '%{filters.get('title_search')}%'")
        
    # Platforms filter
    platforms = filters.get("platforms")
    if platforms and len(platforms) > 0:
        platform_clauses = [f"platform = '{p}'" for p in platforms]
        conditions.append("(" + " OR ".join(platform_clauses) + ")")
    
    # Length filter
    length_min = int(filters.get("length_min", 0))
    if length_min != 0:
        conditions.append(f'length >= "{minutes_to_time(length_min)}"')
        
    length_max = int(filters.get("length_max", 240))
    if length_max != 240:
        conditions.append(f'length <= "{minutes_to_time(length_max)}"')
        
    # Record quality filter
    record_quality = filters.get("record_quality")
    if record_quality is not None and record_quality != 7:
        if record_quality == 0:
            conditions.append('record_quality = -1')
        elif record_quality == 1:
            conditions.append('record_quality = 0')
        elif record_quality == 2:
            conditions.append('record_quality = 1')
        elif record_quality == 3:
            conditions.append('(record_quality = 0 OR record_quality = 1)')
        elif record_quality == 4:
            conditions.append('record_quality = 2')
        elif record_quality == 5:
            conditions.append('(record_quality = 0 OR record_quality = 2)')
        elif record_quality == 6:
            conditions.append('(record_quality = 1 OR record_quality = 2)')
            
    # Crowd level filter
    crowd_level = filters.get("crowd_level")
    if crowd_level is not None and crowd_level != 7:
        if crowd_level == 0:
            conditions.append('crowd_level = -1')
        elif crowd_level == 1:
            conditions.append('crowd_level = 0')
        elif crowd_level == 2:
            conditions.append('crowd_level = 1')
        elif crowd_level == 3:
            conditions.append('(crowd_level = 0 OR crowd_level = 1)')
        elif crowd_level == 4:
            conditions.append('crowd_level = 2')
        elif crowd_level == 5:
            conditions.append('(crowd_level = 0 OR crowd_level = 2)')
        elif crowd_level == 6:
            conditions.append('(crowd_level = 1 OR crowd_level = 2)')

    # Artist_talking filter
    artist_talking = filters.get("artist_talking")
    if artist_talking is not None and artist_talking != 3:
        if artist_talking == 0:
            conditions.append('artist_talking = -1')
        elif artist_talking == 1:
            conditions.append('artist_talking = 0')
        elif artist_talking == 2:
            conditions.append('artist_talking = 1')
            
    # Rating filter
    rating_min = filters.get("rating_min")
    if rating_min is not None:
        rating_min = float(rating_min)
        if rating_min > 0:
            conditions.append(f'rating >= {rating_min}')
        elif rating_min == -1:
            conditions.append('rating = -1')
        
    # Tags filter
    if filters.get("tags") and len(filters.get("tags")) > 0:
        tag_conditions = []
        for tag in filters.get("tags"):
            tag_conditions.append(f"EXISTS (SELECT 1 FROM rel_sets_tags rst WHERE rst.id_set = m.id AND rst.id_tag = {tag})")
        conditions.append("(" + " OR ".join(tag_conditions) + ")")
        
    # Artists filter
    if filters.get("artists") and len(filters.get("artists")) > 0:
        artist_conditions = []
        for artist in filters.get("artists"):
            artist_conditions.append(f"EXISTS (SELECT 1 FROM rel_sets_artists rsa WHERE rsa.id_set = m.id AND rsa.id_artist = {artist})")
        conditions.append("(" + " OR ".join(artist_conditions) + ")")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    order_by = "RANDOM()"
    if filters.get("order_by"):
        if filters.get("order_by") == "rating":
            order_by = "rating DESC"
        elif filters.get("order_by") == "play_count":
            order_by = "click_count DESC"
        elif filters.get("order_by") == "date":
            order_by = "insert_date DESC"
            
    query += ' GROUP BY m.id, m.full_name ORDER BY ' + order_by + ' LIMIT 100;'
    
    print(f"{bcolors.HEADER}SEARCH QUERY : {query}{bcolors.ENDC}")
    
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    
    return jsonify(results)
