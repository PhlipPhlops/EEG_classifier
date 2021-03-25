import React from 'react';
import './UploadField.css';
import { saveAs } from 'file-saver';
import netface from '../common/network_interface';
import store from '../common/reducers';

// Image sources
import file_upload from '../static/file_upload.svg';
import downloading from '../static/downloading.svg';
import file_download from '../static/file_download.svg';


class UploadField extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      status: store.getState().serverStatus
    }
  }

  componentDidMount() {
    store.subscribe(() => {
      let serverStatus = store.getState().serverStatus
      if (serverStatus != this.state.status) {
        this.setState({ status: serverStatus })
      }
    })
  }

  onFileSelected = (e) => {
    // Upload file immediately
    let file = e.target.files[0]
    netface.uploadFile(file)
  }


  triggerFileInput = () => {
    // Asks user to upload a file
    this.fileInput.click()
  }

  downloadFile = () => {
    netface.downloadByFilekey(this.state.filekey)
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, "ng-annotated_" + this.state.filename)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  getButtonResources() {
    const resources = {
      'ATTEMPTING': {
        text: 'Connecting to server...',
        button: downloading,
        onClick: () => console.log('Loading...')
      },
      'CONNECTED': {
        text: 'Upload your .edf file here',
        button: file_upload,
        onClick: this.triggerFileInput
      },
      'UPLOADING': {
        text: 'Classifying, this will take a minute...',
        button: downloading,
        onClick: () => console.log('Loading...')
      },
      'UPLOADED': {
        text: 'Download Currently Unavailable',
        button: file_download,
        onClick: this.downloadFile
      }
    }

    let resource = resources[this.state.status]
    if (resource == undefined) {
      throw Error('invalid resource key')
    } else {
      return resource
    }
  }

  render() {
    const resource = this.getButtonResources()

    return (
      <div className="fieldButton" onClick={resource.onClick}>
        <input type="file"
          ref={fileInput => this.fileInput = fileInput}
          id="fileUpload"
          name="eegFile"
          onChange={this.onFileSelected}
        />
        <span className="text">{resource.text}</span>
        <img className="uploadButton" src={resource.button} />
      </div>
    )
  }
}

export default UploadField;
