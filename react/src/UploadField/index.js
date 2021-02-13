import React from 'react';
import './index.css';
import { saveAs } from 'file-saver';

import LinearProgress from '@material-ui/core/LinearProgress';
import file_upload from '../static/file_upload.svg';
import file_download from '../static/file_download.svg';

const statusEnum = Object.freeze({
  "upload": 0,
  "loading": 1,
  "download": 2
})

const buttonText = Object.freeze({
  0: 'Upload your .edf file here',
  1: 'Classifying, this will take a minute...',
  2: 'Done! Download your annotated .edf here'
})

class UploadField extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      status: statusEnum.upload
    }
    this.onChange = this.onChange.bind(this)
    this.fileUpload = this.fileUpload.bind(this)
    this.triggerInputFile = this.triggerInputFile.bind(this)
  }

  triggerInputFile() {
    if (this.state.status == statusEnum.upload) {
      this.fileInput.click()
    }
  }

  fileUpload(file) {
    let formData = new FormData();
    formData.append('file', file)

    return fetch('http://127.0.0.1:5000/edf-upload', {
      method: 'POST',
      body: formData,
    })
  }

  onChange(e) {
    // Immediately upload file on selection
    this.setState({
      status: statusEnum.loading
    })

    let file = e.target.files[0]
    this.fileUpload(file)
      .then((response) => {
        this.setState({status: statusEnum.download})
        console.log(response.blob);
        return response.blob()
      })
      .then((blob) => {
        saveAs(blob, "testFile.edf");
      })
      .catch((err) => {
        console.log(err)
      })
  }

  render() {
    return (
      <div className="fieldButton" onClick={this.triggerInputFile}>
        <input type="file"
          ref={fileInput => this.fileInput = fileInput}
          id="fileUpload"
          name="eegFile"
          onChange={this.onChange}
        />
        <LinearProgress />
        <span className="text">{buttonText[this.state.status]}</span>
        {
          this.state.status == statusEnum.loading
          ? <LinearProgress />
          : <img className="uploadButton" src={
              this.state.status == statusEnum.upload ? file_upload : file_download} />
        }
      </div>
    )
  }
}

export default UploadField;