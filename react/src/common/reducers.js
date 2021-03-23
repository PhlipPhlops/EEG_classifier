import { createStore, combineReducers } from 'redux';

let initialState = {
  socketStatus: 'ATTEMPTING',
  fileUploadStatus: 'NO_FILE',
  dischargeClassifierStatus: 'NONE',
}

const socketStatus = (state=initialState.socketStatus, action) => {
  switch (action.type) {

    case 'socket/connection_established':
      return 'CONNECTED'

    case 'socket/connection_error':
      return 'ERROR'

    default:
      return state
  }
}

const fileUploadStatus = (state=initialState.fileUploadStatus, action) => {
  switch (action.type) {

    case 'file/upload_file':
      return 'UPLOADING'

    case 'file/upload_successful':
      return 'UPLOADED'

    case 'file/upload_failed':
      return 'ERROR'

    default:
      return state
  }
}

const dischargeClassifierStatus = (state=initialState.dischargeClassifierStatus, action) => {
  switch (action.type) {

    case 'discharge/request_annotations':
      return 'REQUESTING_ANNOTATIONS'

    case 'discharge/received_annotations':
      return 'ANNOTATIONS_RECEIVED'

    case 'discharge/failed_annotations':
      return 'ERROR'

    default:
      return state
  }
}

const reducers = combineReducers({
  socketStatus,
  fileUploadStatus,
  dischargeClassifierStatus,
})

const store = createStore(reducers)
export default store