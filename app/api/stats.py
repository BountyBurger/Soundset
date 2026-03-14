from flask import Blueprint, request, jsonify
from app.core.database import get_dbname_from_token, get_db_connection
from app.core.config import Config
from app.core.utils import bcolors

bp = Blueprint('stats', __name__, url_prefix='/api')

@bp.route('/get_stats', methods=['POST'])
def get_stats():
    print(f"{bcolors.HEADER}STATS REQUEST{bcolors.ENDC}")
    json_data = {}
    db_name = get_dbname_from_token(request.json)
    if db_name is None:
        return "Bad session token", 400
        
    conn = get_db_connection(f"{Config.DB_REPO_PATH}/{db_name}.db")
    cursor = conn.cursor()
    
    # Get global stats
    cursor.execute("SELECT (SELECT COUNT(*) FROM tags), \
                   (SELECT COUNT(*) FROM artists), \
                   (SELECT COUNT(*) FROM sets), \
                       COUNT(*) FROM sets WHERE rating != -1;")
    results = cursor.fetchall()
    json_data["sets"] = {"total": results[0][2], "rated": results[0][3], "unrated": results[0][2] - results[0][3]}
    json_data["artists"] = {"total": results[0][1]}
    json_data["genres"] = {"total": results[0][0]}
    
    # Get top 10 artists
    cursor.execute("SELECT a.id, a.name, COUNT(ra.id_set) \
                   FROM artists a \
                   LEFT JOIN rel_sets_artists ra ON a.id = ra.id_artist \
                   GROUP BY a.id \
                   ORDER BY COUNT(ra.id_set) DESC \
                   LIMIT 10;")
    results = cursor.fetchall()
    json_data["artists"]["top_10"] = []
    for i, result in enumerate(results):
        json_data["artists"]["top_10"].append({"rank": i+1, "name": result[1], "sets": result[2]})
        
    # Get top 10 genres
    cursor.execute("SELECT t.id, t.name, COUNT(rt.id_set) \
                   FROM tags t \
                   LEFT JOIN rel_sets_tags rt ON t.id = rt.id_tag \
                   GROUP BY t.id \
                   ORDER BY COUNT(rt.id_set) DESC \
                   LIMIT 10;")
    results = cursor.fetchall()
    json_data["genres"]["top_10"] = []
    for i, result in enumerate(results):
        json_data["genres"]["top_10"].append({"rank": i+1, "name": result[1], "sets": result[2]})
        
    # Get rating repartition
    cursor.execute("SELECT rating, COUNT(*) \
                   FROM sets \
                   WHERE rating != -1 \
                   GROUP BY rating \
                   ORDER BY rating;")
    results = cursor.fetchall()
    json_data["sets"]["rating_repartition"] = {}
    for result in results:
        json_data["sets"]["rating_repartition"][result[0]] = result[1]
        
    # Get platform repartition
    cursor.execute("SELECT platform, COUNT(*) \
                    FROM sets \
                    GROUP BY platform \
                    ORDER BY COUNT(*) DESC;")
    results = cursor.fetchall()
    json_data["sets"]["platform_repartition"] = {}
    for result in results:
        json_data["sets"]["platform_repartition"][result[0]] = result[1]
        

    # Timechart of the last 6 months of the number of sets added
    cursor.execute("SELECT strftime('%Y-%m', insert_date) AS month, COUNT(*) \
                   FROM sets \
                   WHERE insert_date >= date('now', '-12 months') \
                   GROUP BY month \
                   ORDER BY month;")
    results = cursor.fetchall()
    json_data["sets"]["time_inserted"] = []
    for result in results:
        json_data["sets"]["time_inserted"].append({"month": result[0], "count": result[1]})

    # Timechart of the last 12 months of release date
    cursor.execute("SELECT strftime('%Y-%m', release_date) AS month, COUNT(*) \
                   FROM sets \
                   WHERE release_date >= date('now', '-12 months') \
                   GROUP BY month \
                   ORDER BY month;")
    results = cursor.fetchall()
    json_data["sets"]["time_released"] = []
    for result in results:
        json_data["sets"]["time_released"].append({"month": result[0], "count": result[1]})

    # Crowd level repartition
    cursor.execute("SELECT crowd_level, COUNT(*) \
                   FROM sets \
                   GROUP BY crowd_level \
                   ORDER BY crowd_level;")
    results = cursor.fetchall()
    json_data["sets"]["crowd_level_repartition"] = {}
    for result in results:
        # crowd_level can be None or integer. Assuming 1-5 or similar.
        json_data["sets"]["crowd_level_repartition"][result[0]] = result[1]

    # Audio quality repartition
    cursor.execute("SELECT record_quality, COUNT(*) \
                   FROM sets \
                   GROUP BY record_quality \
                   ORDER BY record_quality;")
    results = cursor.fetchall()
    json_data["sets"]["audio_quality_repartition"] = {}
    for result in results:
        json_data["sets"]["audio_quality_repartition"][result[0]] = result[1]

    # Artist talking repartition
    cursor.execute("SELECT artist_talking, COUNT(*) \
                   FROM sets \
                   GROUP BY artist_talking \
                   ORDER BY artist_talking;")
    results = cursor.fetchall()
    json_data["sets"]["artist_talking_repartition"] = {}
    for result in results:
        json_data["sets"]["artist_talking_repartition"][result[0]] = result[1]

    # Top 5 most played sets
    cursor.execute("SELECT full_name, click_count, thumbnail_url \
                   FROM sets \
                     WHERE click_count > 0 \
                     ORDER BY click_count DESC \
                        LIMIT 5;")
    results = cursor.fetchall()
    json_data["sets"]["top_5_most_played"] = []
    for i, result in enumerate(results):
        json_data["sets"]["top_5_most_played"].append({"rank": i+1, "name": result[0], "click_count": result[1], "thumbnail_url": result[2]})
        
    conn.close()
    return jsonify(json_data), 200
