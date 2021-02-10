import React from 'react';
import axios, { post } from 'axios';
import './index.css';

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
      file: null,
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
    const url = 'http://127.0.0.1:5000/edf-upload'
    const formData = new FormData();
    formData.append('file', file)
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*'
      }
    }
    return post(url, formData, config)
  }

  onChange(e) {
    // Immediately upload file on selection
    this.setState({
      file: e.target.files[0],
      status: statusEnum.loading
    })
    this.fileUpload(this.state.file)
      .then((response) => {
        this.setState({status: statusEnum.download})
        console.log(response.data);
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