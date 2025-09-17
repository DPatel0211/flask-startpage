#!/usr/bin/env python3
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import datetime
import logging
import os
import json
import time
import re
import requests
from functools import wraps

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('startpage-api')

# Configure cache directory
CACHE_DIR = os.path.expanduser('/home/user/.config/startpage/cache')
os.makedirs(CACHE_DIR, exist_ok=True)

# Path to static files
STATIC_FOLDER = os.path.expanduser('/home/user/.config/startpage')

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Add caching headers for static files
@app.after_request
def add_header(response):
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control'] = 'public, max-age=86400'  # Cache for 1 day
    return response

# Houston Rockets team ID
ROCKETS_TEAM_ID = 1610612745
ROCKETS_ABBR = "HOU"

# Arsenal team ID
ARSENAL_TEAM_ID = 359

# NBA API endpoints
NBA_SCHEDULE_URL = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json"
NBA_BOXSCORE_BASE_URL = "https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{}.json"

# ESPN API endpoint for Arsenal
ESPN_ARSENAL_URL = f"https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/{ARSENAL_TEAM_ID}"

# Team abbreviation to logo filename mapping - NBA
TEAM_LOGO_MAP_NBA = {
    'ATL': 'hawks',
    'BOS': 'celtics',
    'BKN': 'nets',
    'CHA': 'hornets',
    'CHI': 'bulls',
    'CLE': 'cavaliers',
    'DAL': 'mavericks',
    'DEN': 'nuggets',
    'DET': 'pistons',
    'GSW': 'warriors',
    'HOU': 'rockets',
    'IND': 'pacers',
    'LAC': 'clippers',
    'LAL': 'lakers',
    'MEM': 'grizzlies',
    'MIA': 'heat',
    'MIL': 'bucks',
    'MIN': 'timberwolves',
    'NOP': 'pelicans',
    'NYK': 'knicks',
    'OKC': 'thunder',
    'ORL': 'magic',
    'PHI': '76ers',
    'PHX': 'suns',
    'POR': 'trailblazers',
    'SAC': 'kings',
    'SAS': 'spurs',
    'TOR': 'raptors',
    'UTA': 'jazz',
    'WAS': 'wizards'
}

# Team abbreviation to logo filename mapping - Premier League
TEAM_LOGO_MAP_PL = {
    'ARS': 'arsenal',
    'AVL': 'villa',
    'BOU': 'bournemouth',
    'BRE': 'brentford',
    'BHA': 'brighton',
    'BUR': 'burnley',
    'CHE': 'chelsea',
    'CRY': 'palace',
    'EVE': 'everton',
    'FUL': 'fulham',
    'LEE': 'leeds',
    'LEI': 'leicester',
    'LIV': 'liverpool',
    'MCI': 'mancity',
    'MNC': 'mancity',
    'MUN': 'manutd',
    'NEW': 'newcastle',
    'NFO': 'forest',
    'SOU': 'southampton',
    'SUN': 'sunderland',
    'TOT': 'tottenham',
    'WHU': 'westham',
    'WOL': 'wolves'
}

# Cache constants
CACHE_DURATION = 3600  # 1 hour cache duration in seconds
LIVE_GAME_CACHE_DURATION = 120  # 2 minutes for live games
LIVE_GAME_CACHE_DURATION_PL = 30  # 30 seconds for live PL games (faster updates)

def get_cache_filepath(endpoint):
    """Return the filepath for the cached data."""
    return os.path.join(CACHE_DIR, f"{endpoint}.json")

def with_cache(endpoint, duration=CACHE_DURATION):
    """Decorator to cache function results to a JSON file."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_file = get_cache_filepath(endpoint)
            
            # Check if cache file exists and is fresh
            if os.path.exists(cache_file):
                file_modified_time = os.path.getmtime(cache_file)
                if time.time() - file_modified_time < duration:
                    try:
                        with open(cache_file, 'r') as f:
                            logger.info(f"Using cached data for {endpoint}")
                            return json.load(f)
                    except (json.JSONDecodeError, IOError) as e:
                        logger.warning(f"Cache read error: {e}")
            
            # Get fresh data
            try:
                logger.info(f"Fetching fresh data for {endpoint}")
                result = func(*args, **kwargs)
                
                # Save to cache
                with open(cache_file, 'w') as f:
                    json.dump(result, f)
                
                return result
            except Exception as e:
                logger.error(f"Error fetching fresh data: {e}")
                
                # Try to use expired cache as fallback
                if os.path.exists(cache_file):
                    try:
                        with open(cache_file, 'r') as f:
                            logger.info(f"Using expired cache as fallback for {endpoint}")
                            return json.load(f)
                    except (json.JSONDecodeError, IOError) as e:
                        logger.warning(f"Fallback cache read error: {e}")
                
                # Return error data structure as last resort
                return {
                    "error": True,
                    "message": str(e)
                }
        
        return wrapper
    return decorator

def get_team_logo_filename(team_abbr, sport='nba'):
    """Convert team abbreviation to filename for logo."""
    if sport == 'nba':
        return TEAM_LOGO_MAP_NBA.get(team_abbr.upper(), team_abbr.lower())
    else:  # premier league
        return TEAM_LOGO_MAP_PL.get(team_abbr.upper(), team_abbr.lower())

def make_request(url, timeout=10):
    """Make a request with proper headers."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed for {url}: {e}")
        raise

def get_rockets_schedule():
    """Get Rockets games from NBA schedule API."""
    try:
        logger.info("Fetching NBA schedule data")
        schedule_data = make_request(NBA_SCHEDULE_URL)
        
        rockets_games = []
        now = datetime.datetime.now()
        
        # Look through the schedule for Rockets games
        if 'leagueSchedule' in schedule_data and 'gameDates' in schedule_data['leagueSchedule']:
            
            # First pass: collect all Rockets games with dates
            all_rockets_games = []
            
            for game_date in schedule_data['leagueSchedule']['gameDates']:
                if 'games' in game_date:
                    for game in game_date['games']:
                        # Check if Rockets are playing
                        home_team_id = game.get('homeTeam', {}).get('teamId')
                        away_team_id = game.get('awayTeam', {}).get('teamId')
                        
                        if home_team_id == ROCKETS_TEAM_ID or away_team_id == ROCKETS_TEAM_ID:
                            # Parse game date to find position relative to today
                            game_date_str = game.get('gameDateEst', '')
                            game_time_str = game.get('gameTimeEst', '')
                            
                            try:
                                # Handle ISO format with Z (UTC)
                                if game_date_str.endswith('Z'):
                                    game_datetime = datetime.datetime.fromisoformat(game_date_str[:-1])
                                elif 'T' in game_date_str:
                                    game_datetime = datetime.datetime.fromisoformat(game_date_str.replace('Z', ''))
                                else:
                                    if game_time_str:
                                        game_datetime_str = f"{game_date_str} {game_time_str}"
                                        game_datetime = datetime.datetime.strptime(game_datetime_str, "%Y-%m-%d %H:%M:%S")
                                    else:
                                        game_datetime = datetime.datetime.strptime(game_date_str, "%Y-%m-%d")
                                
                                all_rockets_games.append((game_datetime, game))
                                
                            except ValueError as e:
                                logger.warning(f"Could not parse game date: {game_date_str} - {e}")
                                continue
            
            # Sort all games by date
            all_rockets_games.sort(key=lambda x: x[0])
            
            # Find today's position and create a window of 5 before + 5 after
            today = now.date()
            relevant_games = []
            
            # Find the index of the first game on or after today
            future_game_index = None
            for i, (game_datetime, game) in enumerate(all_rockets_games):
                if game_datetime.date() >= today:
                    future_game_index = i
                    break
            
            if future_game_index is not None:
                # Get 5 games before and 5 games after today
                start_index = max(0, future_game_index - 5)
                end_index = min(len(all_rockets_games), future_game_index + 5)
                relevant_games = all_rockets_games[start_index:end_index]
            else:
                # All games are in the past, take the last 10
                relevant_games = all_rockets_games[-10:] if len(all_rockets_games) >= 10 else all_rockets_games
            
            # Process the relevant games window
            for game_datetime, game in relevant_games:
                home_team_id = game.get('homeTeam', {}).get('teamId')
                away_team_id = game.get('awayTeam', {}).get('teamId')
                is_rockets_home = (home_team_id == ROCKETS_TEAM_ID)
                
                # Determine game status
                game_status = game.get('gameStatus', 1)
                game_status_text = game.get('gameStatusText', '')
                
                # Get team info
                home_team = game.get('homeTeam', {})
                away_team = game.get('awayTeam', {})
                
                home_team_abbr = home_team.get('teamTricode', 'HOU' if is_rockets_home else 'OPP')
                away_team_abbr = away_team.get('teamTricode', 'OPP' if is_rockets_home else 'HOU')
                
                opponent_abbr = away_team_abbr if is_rockets_home else home_team_abbr
                opponent_id = away_team.get('teamId', 0) if is_rockets_home else home_team.get('teamId', 0)
                
                # Get scores (will be 0 for future games)
                home_score = home_team.get('score', 0)
                away_score = away_team.get('score', 0)
                
                # Format scores for upcoming games
                if game_status == 1:  # Scheduled
                    home_score = "—"
                    away_score = "—"
                
                game_info = {
                    'game_id': game.get('gameId', ''),
                    'game_date': game_datetime.isoformat(),
                    'game_status': game_status,
                    'game_status_text': game_status_text,
                    'is_rockets_home': is_rockets_home,
                    'home_team_id': ROCKETS_TEAM_ID if is_rockets_home else opponent_id,
                    'home_team': 'HOU' if is_rockets_home else opponent_abbr,
                    'home_team_city': 'Houston' if is_rockets_home else '',
                    'home_team_score': home_score,
                    'visitor_team_id': opponent_id if is_rockets_home else ROCKETS_TEAM_ID,
                    'visitor_team': opponent_abbr if is_rockets_home else 'HOU',
                    'visitor_team_city': '' if is_rockets_home else 'Houston',
                    'visitor_team_score': away_score,
                    'period': game.get('period', 0),
                    'game_clock': game.get('gameClock', ''),
                    'opponent': opponent_abbr,
                    'opponent_id': opponent_id,
                    'home_team_abbr': get_team_logo_filename(home_team_abbr),
                    'visitor_team_abbr': get_team_logo_filename(away_team_abbr)
                }
                
                rockets_games.append((game_datetime, game_info))
        
        # Sort games by date
        rockets_games.sort(key=lambda x: x[0])
        
        return rockets_games
        
    except Exception as e:
        logger.error(f"Error fetching Rockets schedule: {e}")
        logger.exception("Full traceback:")
        return []

def get_live_game_details(game_id):
    """Get live game details from boxscore API."""
    try:
        boxscore_url = NBA_BOXSCORE_BASE_URL.format(game_id)
        logger.info(f"Fetching live game data for {game_id}")
        boxscore_data = make_request(boxscore_url)
        
        if 'game' in boxscore_data:
            game = boxscore_data['game']
            
            # Update game status and scores
            game_status = game.get('gameStatus', 1)
            game_status_text = game.get('gameStatusText', '')
            
            # Get current scores
            home_team = game.get('homeTeam', {})
            away_team = game.get('awayTeam', {})
            
            home_score = home_team.get('score', 0)
            away_score = away_team.get('score', 0)
            
            # Get live game details
            period = game.get('period', 0)
            game_clock = game.get('gameClock', '')
            
            return {
                'game_status': game_status,
                'game_status_text': game_status_text,
                'home_team_score': home_score,
                'visitor_team_score': away_score,
                'period': period,
                'game_clock': game_clock
            }
            
    except Exception as e:
        logger.error(f"Error fetching live game details for {game_id}: {e}")
        return None

@with_cache("rockets_games", LIVE_GAME_CACHE_DURATION)
def get_rockets_games():
    """Get recent, current, and upcoming Rockets games using direct NBA APIs."""
    rockets_games = []
    now = datetime.datetime.now()
    
    # Get all Rockets games from schedule
    all_games = get_rockets_schedule()
    
    if not all_games:
        return {
            'update_time': now.isoformat(),
            'games': []
        }
    
    # Separate games by status
    live_games = []
    upcoming_games = []
    completed_games = []
    
    for game_datetime, game_info in all_games:
        game_status = game_info['game_status']
        
        if game_status == 2:  # Live/In Progress
            # Get live updates for this game
            live_details = get_live_game_details(game_info['game_id'])
            if live_details:
                game_info.update(live_details)
            live_games.append(game_info)
            
        elif game_status == 1 and game_datetime > now:  # Scheduled/Upcoming
            upcoming_games.append(game_info)
            
        elif game_status == 3 or (game_status == 1 and game_datetime <= now):  # Completed
            completed_games.append(game_info)
    
    # Priority logic: Live > Today's games > Closest by time
    if live_games:
        logger.info(f"Found {len(live_games)} live Rockets games")
        rockets_games.extend(live_games)
    else:
        # Look for today's games first
        today = now.date()
        today_games = [game for game in upcoming_games + completed_games 
                      if datetime.datetime.fromisoformat(game['game_date']).date() == today]
        
        if today_games:
            rockets_games.extend(today_games[:1])  # Take first today's game
        else:
            # Find closest game by time
            if upcoming_games and completed_games:
                next_game = upcoming_games[0]
                last_game = completed_games[-1] if completed_games else None
                
                if last_game:
                    next_game_time = datetime.datetime.fromisoformat(next_game['game_date'])
                    last_game_time = datetime.datetime.fromisoformat(last_game['game_date'])
                    
                    time_to_next = abs((next_game_time - now).total_seconds())
                    time_since_last = abs((now - last_game_time).total_seconds())
                    
                    if time_since_last < time_to_next:
                        rockets_games.append(last_game)
                    else:
                        rockets_games.append(next_game)
                else:
                    rockets_games.append(next_game)
                    
            elif upcoming_games:
                rockets_games.append(upcoming_games[0])
            elif completed_games:
                rockets_games.append(completed_games[-1])
    
    logger.info(f"Returning {len(rockets_games)} games")
    
    return {
        'update_time': now.isoformat(),
        'games': rockets_games
    }

def fetch_team_rank(team_id):
    """Fetch a team's current league position/rank."""
    try:
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/{team_id}"
        logger.info(f"Fetching rank for team {team_id}")
        data = make_request(url)
        
        if 'team' in data and 'record' in data['team']:
            team_record = data['team']['record'].get('items', [])
            if team_record and len(team_record) > 0:
                stats = team_record[0].get('stats', [])
                if len(stats) > 23:
                    rank_stat = stats[23]
                    if rank_stat.get('name') == 'rank':
                        return int(rank_stat.get('value', 0))
        return None
    except Exception as e:
        logger.error(f"Error fetching team rank for {team_id}: {e}")
        return None

def fetch_arsenal_data():
    """Fetch Arsenal data from ESPN API."""
    try:
        logger.info("Fetching Arsenal data from ESPN")
        data = make_request(ESPN_ARSENAL_URL)
        
        # Extract the nextEvent array which contains current/upcoming/previous games
        if 'team' in data and 'nextEvent' in data['team']:
            next_events = data['team']['nextEvent']
            
            if next_events and len(next_events) > 0:
                game = next_events[0]  # Get the most relevant game
                
                # Get competition details
                if 'competitions' in game and len(game['competitions']) > 0:
                    competition = game['competitions'][0]
                    
                    # Get status information
                    status = competition.get('status', {})
                    status_state = status.get('type', {}).get('state', 'pre')
                    status_id = status.get('type', {}).get('id', 1)
                    status_desc = status.get('type', {}).get('description', '')
                    
                    # Get competitors (home is index 0, away is index 1)
                    competitors = competition.get('competitors', [])
                    if len(competitors) >= 2:
                        home_team = competitors[0]
                        away_team = competitors[1]
                        
                        # Determine if Arsenal is home or away
                        is_arsenal_home = home_team.get('team', {}).get('id') == str(ARSENAL_TEAM_ID)
                        
                        # Get team information
                        home_team_info = home_team.get('team', {})
                        away_team_info = away_team.get('team', {})
                        
                        # Get scores
                        home_score = home_team.get('score', {}).get('value', 0) if 'score' in home_team else None
                        away_score = away_team.get('score', {}).get('value', 0) if 'score' in away_team else None
                        
                        # Get Arsenal's position from the main data
                        arsenal_position = None
                        if 'team' in data and 'record' in data['team']:
                            team_record = data['team']['record'].get('items', [])
                            if team_record and len(team_record) > 0:
                                stats = team_record[0].get('stats', [])
                                if len(stats) > 23:
                                    rank_stat = stats[23]
                                    if rank_stat.get('name') == 'rank':
                                        arsenal_position = int(rank_stat.get('value', 0))
                        
                        # Get opponent's ID from competitors and fetch their rank
                        opponent_competitor_id = away_team.get('id') if is_arsenal_home else home_team.get('id')
                        opponent_team_id = away_team_info.get('id') if is_arsenal_home else home_team_info.get('id')
                        opponent_position = None
                        
                        # Use competitor ID for fetching rank
			# Fetch opponent rank for all game states
                        if opponent_team_id:
                            opponent_position = fetch_team_rank(opponent_team_id)
                        
                        # For live games, try to get positions from the game data itself
                        if status_state == 'in':
                            # Sometimes live games include record data
                            home_record = home_team.get('record', [])
                            away_record = away_team.get('record', [])
                            # You might need to parse these records if they exist
                        
                        # Assign positions based on who is home/away
                        if is_arsenal_home:
                            home_position = arsenal_position
                            away_position = opponent_position
                        else:
                            home_position = opponent_position
                            away_position = arsenal_position
                        
                        # Get clock/time information
                        display_clock = status.get('displayClock', '')
                        period = status.get('period', 0)
                        
                        # Format game data
                        game_data = {
                            'game_id': game.get('id', ''),
                            'game_date': game.get('date', ''),
                            'status_state': status_state,
                            'status_id': status_id,
                            'status_desc': status_desc,
                            'is_arsenal_home': is_arsenal_home,
                            'home_team': home_team_info.get('abbreviation', ''),
                            'home_team_name': home_team_info.get('displayName', ''),
                            'home_team_id': home_team_info.get('id', ''),
                            'home_score': home_score,
                            'home_position': home_position,
                            'away_team': away_team_info.get('abbreviation', ''),
                            'away_team_name': away_team_info.get('displayName', ''),
                            'away_team_id': away_team_info.get('id', ''),
                            'away_score': away_score,
                            'away_position': away_position,
                            'display_clock': display_clock,
                            'period': period
                        }
                        
                        return game_data
                        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching Arsenal data: {e}")
        logger.exception("Full traceback:")
        return None

@with_cache("arsenal_games", LIVE_GAME_CACHE_DURATION_PL)
def get_arsenal_games():
    """Get Arsenal game data."""
    now = datetime.datetime.now()
    
    game_data = fetch_arsenal_data()
    
    if not game_data:
        return {
            'update_time': now.isoformat(),
            'games': [],
            'error': True,
            'message': 'Unable to fetch Arsenal game data'
        }
    
    # Process the game data for frontend consumption
    games = []
    
    # Determine cache duration based on game state
    if game_data['status_state'] == 'in':
        # Live game - use shorter cache
        cache_duration = LIVE_GAME_CACHE_DURATION_PL
    else:
        cache_duration = CACHE_DURATION
    
    games.append(game_data)
    
    return {
        'update_time': now.isoformat(),
        'games': games,
        'cache_duration': cache_duration
    }

# API routes
@app.route('/api/rockets/games', methods=['GET'])
def rockets_games():
    """API endpoint to get Rockets games data."""
    return jsonify(get_rockets_games())

@app.route('/api/rockets/games/refresh', methods=['GET'])
def refresh_rockets_games():
    """Force refresh the rockets games data."""
    cache_file = get_cache_filepath("rockets_games")
    if os.path.exists(cache_file):
        os.remove(cache_file)
    return jsonify(get_rockets_games())

@app.route('/api/arsenal/games', methods=['GET'])
def arsenal_games():
    """API endpoint to get Arsenal games data."""
    return jsonify(get_arsenal_games())

@app.route('/api/arsenal/games/refresh', methods=['GET'])
def refresh_arsenal_games():
    """Force refresh the arsenal games data."""
    cache_file = get_cache_filepath("arsenal_games")
    if os.path.exists(cache_file):
        os.remove(cache_file)
    return jsonify(get_arsenal_games())

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "timestamp": datetime.datetime.now().isoformat()})

# Static file routes
@app.route('/')
def serve_index():
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    return send_from_directory(STATIC_FOLDER, path)

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=8080,
        debug=False,
        use_reloader=False
    )
