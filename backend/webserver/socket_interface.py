"""This file presents a websocket interface to communicate
events to the client
"""
from .app_config import socketio

class SocketInterface:

  def establish_connection(self, sid):
    socketio.emit('establish', {'sid': sid}, room=sid)

  def emit_percentage(self, perc):
    socketio.emit('loading', {'percent': perc}, room=sid)