import random
import string
import re

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def ms_to_time(ms):
    seconds = ms // 1000
    minutes = seconds // 60
    seconds = seconds % 60
    hours = minutes // 60
    minutes = minutes % 60
    time_str = f"{hours:02}:{minutes:02}:{seconds:02}"
    return time_str

def minutes_to_time(minutes):
    hours = minutes // 60
    remaining_minutes = minutes % 60
    time_str = f"{hours:02}:{remaining_minutes:02}:00"
    return time_str

def iso8601_to_hhmmss(iso_duration):
    """
    Converts an ISO 8601 duration (like 'PT1H24M6S') to HH:MM:SS format.
    Example: 'PT1H24M6S' -> '01:24:06'
             'PT56M52S' -> '00:56:52'
    """
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, iso_duration)
    
    if not match:
        raise ValueError("Invalid ISO 8601 duration")

    hours = int(match.group(1)) if match.group(1) else 0
    minutes = int(match.group(2)) if match.group(2) else 0
    seconds = int(match.group(3)) if match.group(3) else 0

    return f"{hours:02}:{minutes:02}:{seconds:02}"

def cleanup_string(string_val):
    if not string_val:
        return ""
    string_val = string_val.replace("'", "")
    string_val = string_val.replace('"', '')
    string_val = string_val.replace(';', '')
    string_val = string_val.replace('`', '')
    return string_val

def generate_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=64))

def extract_data_request(raw_json):
    return raw_json.get("data_request")
