import React from 'react';
import { saveAs } from 'file-saver';
import netface from '../common/network_interface';
import store from '../common/reducers';
import styled from 'styled-components';

// Image sources
import file_upload from '../static/file_upload.svg';
import downloading from '../static/downloading.svg';
import file_download from '../static/file_download.svg';


class UploadField extends React.Component {

  constructor(props) {
    super(props)
    this.filename = '';
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
    this.filename = file.name
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
        // Ensure file extension is edf
        let arr = this.filename.split(".");      // Split the string using dot as separator
        arr.pop()
        arr.push('fif')
        let filenameAsEDF = arr.join(".")

        saveAs(blob, filenameAsEDF)
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
        text: 'Download your changes to file',
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
      <FieldButton onClick={resource.onClick}>
        <InvisibleUpload type="file"
          ref={fileInput => this.fileInput = fileInput}
          name="eegFile"
          onChange={this.onFileSelected}
          />
        <ButtonText>{resource.text}</ButtonText>
        <UploadIcon src={resource.button} />
      </FieldButton>
    )
  }
}

export default UploadField;

const FieldButton = styled.div`
  border-radius: 1rem;
  background-color: white;
  
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  
  color: #294a5d;
  font-size: large;
  
  /* Responsivity */
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.35);
  &:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.35);
    transition: opacity .5s ease-in-out;
  }

  border: 1px solid black;
`;

const ButtonText = styled.span`
  font-weight: 500;
  letter-spacing: .5px;
  font-size: 17px;
  padding: 0 0.5rem 0 0.5rem;
`;

const UploadIcon = styled.img`
  height: 1.3rem;
  padding: 0.5rem;
`;

const InvisibleUpload = styled.input`
  visibility: hidden;
  width: 0;
  height: 0;
`;
