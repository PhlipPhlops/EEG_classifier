import io from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

class ClassifierInterface {
  constructor() {
    // Attempt to establish connection
    this.socket = io(`${BASE_URL}`);
    // this.socket.id is filled on successful establish
    // used to identify socket connection for all requests
    this.edf_uploaded = false;

    // Register some standard events
    const eventListeners = {
      'disconnect': this.onDisconnect,
      'connect_error': () => console.error("Connection Failed. Server is likely down."),
      'establish': this.onConnectionEstablished,
      'loading': this.onLoading,
      'edf uploaded': this.onEDFUploaded,
    }
    for (let key in eventListeners) {
      this.socket.on(key, eventListeners[key])
    }
  }

  //* EVENT LISTENERS *//
  onConnectionEstablished = (response) => {
    // Ping pongs the server
    if (this.socket.id == response.sid) {
      console.log('Neurogram connection established.')
    } else {
      console.error('Establish signal recevied but SIDs do not match.')
    }
  }

  onLoading = (event) => {
    // To return loading progress
    console.log(`Loading: ${parseFloat(event.percent).toFixed(2) *100}%`)
  }

  onEDFUploaded = () => {
    // Flag to tell electrogram display it can request data
    this.edf_uploaded = true;
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

  //* REQUESTS *//
  // All request are made by POST with 'sid': session_id in the formdata
  uploadFile(file) {
    let formData = new FormData();
    formData.append('sid', this.socket.id)
    formData.append('file', file)

    let promise = fetch(BASE_URL + '/edf-upload', {
      method: 'POST',
      body: formData,
      headers: {
        "accepts":"application/json"
      }
    })

    this.edf_uploaded = true
    return promise
  }

  requestChunk(n, N) {
    if (!this.edf_uploaded) {
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

}

// Establish into a singleton
const netface = new ClassifierInterface()
export default netface