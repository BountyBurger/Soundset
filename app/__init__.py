from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from app.core import config
from app.api import register_blueprints
import os

def create_app(config_class=config.Config):
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(config_class)
    
    CORS(app)
    
    register_blueprints(app)

    # Apply ProxyFix to handle real IP addresses from Nginx
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Configure Logging
    import logging
    from logging.handlers import RotatingFileHandler
    
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/soundset.log', maxBytes=10485760, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Soundset startup')
    
    # Serve Frontend
    @app.route('/')
    def index():
        return render_template('index.html')
        
    @app.route('/manage')
    def manage():
        return render_template('manage.html')
        
    @app.route('/stats')
    def stats():
        return render_template('stats.html')
        
    @app.route('/about')
    def about():
        return render_template('about.html')
        
    @app.route('/login')
    def login():
        return render_template('login.html')

    @app.route('/database')
    def database():
        return render_template('database.html')
    
    return app
