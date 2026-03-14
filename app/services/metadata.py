import urllib.request
import json
import re
from app.core import config
from app.core.utils import ms_to_time, iso8601_to_hhmmss, bcolors

def fetch_metadata(url):
    """
    Fetches metadata for a given URL (SoundCloud or YouTube).
    Returns a dict with: platform, stream_id, stream_url, title, duration, release_date
    Or raises Exception/returns error info.
    """
    
    if "https://soundcloud" in url or "https://on.soundcloud" in url:
        try:
            platform = "soundcloud"
            # Download the page
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            html = response.read().decode('utf-8')
            
            # The original code logic:
            # <script>window.__sc_hydration = [{json data hare}];</script>
            if '<script>window.__sc_hydration = ' not in html:
                 return {"error": "Could not parse SoundCloud data", "code": 511}
                 
            json_data_str = html.split('<script>window.__sc_hydration = ')[1].split(';</script>')[0]
            json_data = json.loads(json_data_str)

            # Find 'hydratable': 'sound'
            index = 0
            found = False
            for i, element in enumerate(json_data):
                if element.get('hydratable') == 'sound':
                    index = i
                    found = True
                    break
            

            if not found:
                 return {"error": "SoundCloud track data not found", "code": 511}
            
            track_data = json_data[index].get('data')
            
            stream_id = str(track_data.get('id'))
            stream_url = track_data.get('permalink_url') # Original code used permalink_url as the URL to insert
            title = track_data.get('title')
            duration = ms_to_time(track_data.get('duration'))
            release_date = track_data.get('created_at')
            thumbnail_url = track_data.get('artwork_url')
            
            return {
                "platform": platform,
                "stream_id": stream_id,
                "stream_url": stream_url,
                "title": title,
                "duration": duration,
                "release_date": release_date,
                "thumbnail_url": thumbnail_url
            }
        except Exception as e:
            print(f"{bcolors.FAIL}Error fetching SoundCloud metadata: {e}{bcolors.ENDC}")
            return {"error": "Error fetching SoundCloud metadata", "code": 511}

    elif "https://www.youtube.com" in url or "https://youtu.be" in url or "https://music.youtube.com" in url:
        platform = "youtube"
        
        # Regex to extract ID
        match = re.search(r"(?:v=|\/)([a-zA-Z0-9_-]{11})", url)
        if match:
            stream_id = match.group(1)
        else:
            return {"error": "Video ID not valid", "code": 512}

        api_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id={stream_id}&key={config.Config.YOUTUBE_API_KEY}"
        try:
            response = urllib.request.urlopen(api_url)
            data = json.load(response)
            
            if "items" not in data or len(data["items"]) == 0:
                return {"error": "No video found for this ID", "code": 512}
            
            video_info = data["items"][0]
            stream_url = f"https://youtu.be/{stream_id}"
            title = video_info["snippet"]["title"]
            duration = iso8601_to_hhmmss(video_info["contentDetails"]["duration"])
            release_date = video_info["snippet"]["publishedAt"]
            
            thumbnails = video_info["snippet"].get("thumbnails", {})
            if "high" in thumbnails:
                thumbnail_url = thumbnails["high"]["url"]
            elif "medium" in thumbnails:
                thumbnail_url = thumbnails["medium"]["url"]
            elif "default" in thumbnails:
                thumbnail_url = thumbnails["default"]["url"]
            else:
                thumbnail_url = None

            return {
                "platform": platform,
                "stream_id": stream_id,
                "stream_url": stream_url,
                "title": title,
                "duration": duration,
                "release_date": release_date,
                "thumbnail_url": thumbnail_url
            }
        except Exception as e:
            print(f"{bcolors.FAIL}Error fetching YouTube metadata: {e}{bcolors.ENDC}")
            return {"error": "Error fetching YouTube API", "code": 511}
            
    else:
        return {"error": "URL not supported", "code": 511}
