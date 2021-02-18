import React from 'react';
import './index.css';
import { saveAs } from 'file-saver';

import file_upload from '../static/file_upload.svg';
import downloading from '../static/downloading.svg';
import file_download from '../static/file_download.svg';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const statusEnum = Object.freeze({
  "upload": 0,
  "loading": 1,
  "download": 2
})

const buttonText = Object.freeze({
  0: 'Upload your .edf file here',
  1: 'Classifying, this will take a minute...',
  2: 'Download your annotated .edf'
})

const buttonIcon = Object.freeze({
  0: file_upload,
  1: downloading,
  2: file_download,
})

class UploadField extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      status: statusEnum.upload
    }

    // Bind functions to this object
    this.fileUpload = this.fileUpload.bind(this)
    this.triggerInputFile = this.triggerInputFile.bind(this)
    this.onFileSelected = this.onFileSelected.bind(this)
    this.onDownloadClicked = this.onDownloadClicked.bind(this)
    this.onButtonClicked = this.onButtonClicked.bind(this)
  }

  /* NETWORK METHODS */

  fileUpload(file) {
    let formData = new FormData();
    formData.append('file', file)

    return fetch(BASE_URL + '/edf-upload', {
      method: 'POST',
      body: formData,
      headers: {
        "accepts":"application/json"
      }
    })
  }

  fileDownload(filekey) {
    return fetch(BASE_URL + '/edf-download/' + filekey, {
      method: 'GET'
    })
  }

  /* INTERACTION METHODS */

  triggerInputFile() {
    // Asks user to upload a file
    if (this.state.status == statusEnum.upload) {
      this.fileInput.click()
    }
  }

  onDownloadClicked(e) {
    this.fileDownload(this.state.filekey)
      .then((response) => response.blob())
      .then((blob) => {
        saveAs(blob, "ng-annotated_" + this.state.filename)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  onFileSelected(e) {
    // Immediately upload file on selection
    this.setState({
      status: statusEnum.loading
    })

    let file = e.target.files[0]
    this.fileUpload(file)
      .then((response) => response.json())
      .then((data) => {
        let dataObj = {
          filekey: data.file_key,
          filename: data.file_name,
          eegData: JSON.parse(data.eeg_data),
          eegAnnotations: JSON.parse(data.eeg_annotations)
        }

        this.setState({
          status: statusEnum.download,
          ...dataObj
        })

        // Call onDataAvailable callback
        this.props.onEegData(dataObj)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  onButtonClicked(e) {
    // Statewise event
    switch (this.state.status) {
      case statusEnum.upload:
        this.triggerInputFile(e)
        break
      case statusEnum.loading:
        console.log("Loading...")
        break
      case statusEnum.download:
        this.onDownloadClicked(e)
        break
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
