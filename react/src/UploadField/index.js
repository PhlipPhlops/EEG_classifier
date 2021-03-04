import React from 'react';
import './index.css';
import { saveAs } from 'file-saver';
import netface from '../api/classifier_interface';

import file_upload from '../static/file_upload.svg';
import downloading from '../static/downloading.svg';
import file_download from '../static/file_download.svg';


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
    const { triggerElectrogram, onAnnotationData } = props
    this.state = {
      status: statusEnum.connecting
    }

    // Bind functions to this object
    this.triggerInputFile = this.triggerInputFile.bind(this)
    this.onFileSelected = this.onFileSelected.bind(this)
    this.onDownloadClicked = this.onDownloadClicked.bind(this)
    this.onButtonClicked = this.onButtonClicked.bind(this)
  }

  componentDidMount() {
    this.awaitConnection()
  }

  awaitConnection = () => {
    if (!netface.connectionEstablished) {
      console.log(netface.connectionEstablished)
      setTimeout(this.awaitConnection, 200) // Wait .1s and try again
    }
    console.log(netface.connectionEstablished)
    this.setState({
      status: statusEnum.upload
    })
  }

  triggerInputFile() {
    // Asks user to upload a file
    if (this.state.status == statusEnum.upload) {
      this.fileInput.click()
    }
  }

  onDownloadClicked(e) {
    netface.downloadByFilekey(this.state.filekey)
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
    // Tell electrogram to lookout for data
    this.props.triggerElectrogram()

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

        // Call onDataAvailable callback
        this.props.onAnnotationData(dataObj)
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
      case statusEnum.connecting:
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
