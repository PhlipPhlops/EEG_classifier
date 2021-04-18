import { createStore, combineReducers } from 'redux';

let initialState = {
  serverStatus: 'ATTEMPTING',
  fileSampleRate: null,
}

const serverStatus = (state=initialState.serverStatus, action) => {
  switch (action.type) {

    case 'server/connection_established':
      return 'CONNECTED'

    case 'server/upload_file':
      return 'UPLOADING'

    case 'server/upload_successful':
      return 'UPLOADED'

    case 'server/error':
      return 'ERROR'

    default:
      return state
  }
}

const sampleRate = (state=initialState.fileSampleRate, action) => {
  switch (action.type) {

    case 'server/upload_successful':
      return action.payload.sample_rate

    default:
      return state
  }
}

const reducers = combineReducers({
  serverStatus,
  sampleRate,
})

const store = createStore(reducers)
export default store