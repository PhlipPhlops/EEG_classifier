"""Used to make extensions available to files other than webserver.py"""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from logging.config import dictConfig
from flask_caching import Cache

cache = Cache()

## Configure Flask app
app = Flask("backend", static_folder="../react/build", template_folder="../react/build")
config = {
    "SECRET_KEY": "dev",
    "DEBUG": True
}
app.config.from_mapping(config)
cache.init_app(app, config={'CACHE_TYPE': 'simple'})
socketio = SocketIO(app, cors_allowed_origins="*")

## Setup CORS headers
cors = CORS(app)

## Pull out the logger for use
dictConfig({
    'version': 1,
    'root': {
        'level': 'INFO'
    }
})
logger = app.logger