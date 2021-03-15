from .webserver import socketio, app

log_string = "In backend/webserver/__main__.py"
print(log_string)
app.logger.info(log_string)

## VERIFY THIS BEFORE COMMITTING
# For development
socketio.run(app, host='127.0.0.1', port='5000', debug=True)
# For live
# socketio.run(app, host='0.0.0.0', port='8080')