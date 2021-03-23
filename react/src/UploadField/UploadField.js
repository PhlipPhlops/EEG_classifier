import React from 'react';
import './UploadField.css';
import { saveAs } from 'file-saver';
import netface from '../common/network_interface';
import store from '../common/reducers';

// Image sources
import file_upload from '../static/file_upload.svg';
import downloading from '../static/downloading.svg';
import file_download from '../static/file_download.svg';

/**
 * Enumerators for view and upload logic
 */
const statusEnum = Object.freeze({
  "upload": 0,
  "loading": 1,
  "download": 2,
  "connecting": 3,
})
const buttonText = Object.freeze({
  0: 'Upload your .edf file here',
  1: 'Classifying, this will take a minute...',
  2: 'Download your annotated .edf',
  3: 'Connecting to server...'
})
const buttonIcon = Object.freeze({
  0: file_upload,
  1: downloading,
  2: file_download,
  3: downloading,
})

class UploadField extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      status: statusEnum.connecting
    }
  }

  componentDidMount() {
    this.awaitConnection()
  }

  awaitConnection = () => {
    /**
     * Test the socket connection at intervals until the connection is
     * established, telling us it's ready to upload
     */
    if (store.getState().socketStatus != 'CONNECTED') {
      console.log('Awaiting connection..')
      console.log(store.getState())
      setTimeout(this.awaitConnection, 500)
    } else {
      console.log('Connected')
      this.setState({ status: statusEnum.upload })
    }
  }

  onFileSelected = (e) => {
    this.setState({ status: statusEnum.loading })
    // dispatch an event to tell electrogram ready for render
    store.dispatch({
      type: 'file/upload_file'
    })

    let uploadFile = () => {
      /**
       * Upload a file and parse the annotations from response
       * Called immediately upon file selection
       */
      let file = e.target.files[0]
      netface.uploadFile(file)
        .then((response) => response.json())
        .then((data) => {
          let dataObj = {
            filekey: data.file_key,
            filename: data.file_name,
            eegAnnotations: JSON.parse(data.eeg_annotations)
          }
  
          this.setState({
            status: statusEnum.download,
            ...dataObj
          })
        })
        .catch((err) => {
          console.log(err)
        })
    }
    uploadFile()
  }

  onButtonClicked = (e) => {

    let triggerInputFile = () => {
      // Asks user to upload a file
      if (this.state.status == statusEnum.upload) {
        this.fileInput.click()
      }
    }

    let downloadFile = () => {
      netface.downloadByFilekey(this.state.filekey)
        .then((response) => response.blob())
        .then((blob) => {
          saveAs(blob, "ng-annotated_" + this.state.filename)
        })
        .catch((err) => {
          console.log(err)
        })
    }

    // Statewise event
    switch (this.state.status) {

      case statusEnum.upload:
        triggerInputFile()
        break

      case statusEnum.download:
        downloadFile()
        break

      default:
        console.log("Loading...")
    }
  }

  render() {
    return (
      <div className="fieldButton" onClick={this.onButtonClicked}>
        <input type="file"
          ref={fileInput => this.fileInput = fileInput}
          id="fileUpload"
          name="eegFile"
          onChange={this.onFileSelected}
        />
        <span className="text">{buttonText[this.state.status]}</span>
        <img className="uploadButton" src={buttonIcon[this.state.status]} />
      </div>
    )
  }
}

export default UploadField;
