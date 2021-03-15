"""Used to make extensions available to files other than webserver.py"""
from flask_caching import Cache

cache = Cache()