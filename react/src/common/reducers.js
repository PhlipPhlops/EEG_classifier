import { createStore, combineReducers } from 'redux';

let initialState = {
  serverStatus: 'ATTEMPTING',
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

const reducers = combineReducers({
  serverStatus,
})

const store = createStore(reducers)
export default store