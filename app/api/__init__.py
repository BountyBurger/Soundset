from flask import Blueprint

def register_blueprints(app):
    from app.api import sets, artists, tags, search, stats, admin
    
    app.register_blueprint(sets.bp)
    app.register_blueprint(artists.bp)
    app.register_blueprint(tags.bp)
    app.register_blueprint(search.bp)
    app.register_blueprint(stats.bp)
    app.register_blueprint(admin.bp)
