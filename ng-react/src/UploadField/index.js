import React from 'react';
import axios, { post } from 'axios';
import './index.css';

import file_upload from '../static/file_upload.svg';


class UploadField extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      file: null
    }
    this.onChange = this.onChange.bind(this)
    this.fileUpload = this.fileUpload.bind(this)
    this.triggerInputFile = this.triggerInputFile.bind(this)
  }

  triggerInputFile() {
    this.fileInput.click()
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
    this.setState({file: e.target.files[0]})
    this.fileUpload(this.state.file).then((response) => {
      console.log(response.data);
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

        <span className="text">Upload your .edf file here</span>
        {/* <div className="divider" /> */}
        <img className="uploadButton" src={file_upload} />
          {/* <form onSubmit={this.onFormSubmit}>
            <input type="file"
                id="file_upload"
                onChange={this.onChange}/>
            <button type="submit">Upload</button>
          </form> */}
      </div>
    )
  }
}

export default UploadField;