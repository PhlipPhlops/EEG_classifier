import io from 'socket.io-client';
import store from './reducers';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

class ClassifierInterface {
  constructor() {
    // Attempt connection establish
    this.socket = io(`${BASE_URL}`);

    // this.socket.id is filled on successful establish
    // used to identify socket connection for all requests
    this.edf_uploaded = false;

    this.registerSocketEvents()
  }

  registerSocketEvents = () => {
    // Register some standard events
    const eventListeners = {
      'disconnect': this.onDisconnect,
      'connect_error': this.onConnectError,
      'establish': this.onConnectionEstablished,
      'loading': this.onLoading,
      'edf uploaded': this.onEDFUploaded,
      'close': () => console.error('closed')
    }
    for (let key in eventListeners) {
      this.socket.on(key, eventListeners[key])
    }
  }

  /**
   * Network Requests
   * All request are made by POST with 'sid': session_id in the formdata
   */
  uploadFile(file) {
    let formData = new FormData();
    formData.append('sid', this.socket.id)
    formData.append('file', file)

    console.log(`UPLOADING TO: ${BASE_URL + '/edf-upload'}`)
    store.dispatch({
      type: 'server/upload_file'
    })

    fetch(BASE_URL + '/edf-upload', {
      method: 'POST',
      body: formData,
      headers: {
        "accepts":"application/json"
      }
    })
      .then(response => response.json())
      .then(data => {
        store.dispatch({
          type: 'server/upload_successful',
          payload: data,
        })
      })
  }

  requestChunk(n, N) {
    if (store.getState().serverStatus != 'UPLOADED') {
      throw 'EDF must be uploaded before requesting a chunk'
    }
    let formData = new FormData();
    formData.append('sid', this.socket.id)
    formData.append('chunk_i', n)
    formData.append('chunk_total', N)

    return fetch(BASE_URL + '/edf-chunk', {
      method: 'POST',
      body: formData,
      headers: {
        "accepts":"application/json",
      }
    })
  }

  downloadByFilekey(filekey) {
    let formData = new FormData();
    formData.append('sid', this.socket.id)

    return fetch(BASE_URL + '/edf-download/' + filekey, {
      method: 'POST',
      body: formData,
    })
  }

  /**
   * Event Listeners
   */
  onConnectionEstablished = (response) => {
    // Ping pongs the server
    if (this.socket.id == response.sid) {
      store.dispatch({
        type: 'server/connection_established'
      })
      console.log('Neurogram connection established.')
      console.log(`SID: ${this.socket.id}`)
    } else {
      console.error('Establish signal recevied but SIDs do not match.')
    }
  }

  onConnectError = (error) => {
    console.error(`Connection Failed. Server is likely down.`)
    console.error(error)
  }

  onLoading = (event) => {
    // To return loading progress
    console.log(`Loading: ${parseFloat(event.percent).toFixed(2) *100}%`)
  }

  onEDFUploaded = () => {
    console.log("Server received file successfully")
  }

  onDisconnect = (reason) => {
    const reasonResponses = {
      'io server disconnect': () => {},
      'io client disconnect': () => {},
      'ping timeout': () => {},
      'transport close': () => {},
      'transport error': () => {},
    }
    // Eventually will use this switch to error handle disconnections
    // Because I love this goofy language.
    console.log(reasonResponses[reason]() || (() => {
      return "Your connection was terminated"
    })())
  }

}

// Establish into a singleton
const netface = new ClassifierInterface()
export default netface