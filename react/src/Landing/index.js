import React from 'react';
import './index.css';
import UploadField from '../UploadField';
import ElectrogramDisplay from '../ElectrogramDisplay';
import text_logo from '../static/text_logo.png';

import netface from '../api/classifier_interface';


class Landing extends React.Component{
  
  constructor(props) {
    super(props)
    this.state = {
      renderElectrogram: false,
      annotations: {},
    }
  }

  onAnnotationData = (dataObj) => {
    console.log("annotations setstate")
    this.setState({
      annotations: dataObj
    })
  }

  triggerElectrogram = () => {
    console.log("waiting for data")
    if (netface.edf_uploaded) {
      this.setState({
        renderElectrogram: true,
      })
    } else {
      setTimeout(this.triggerElectrogram, 1000) // wait a second and try again
    }
  }

  renderElectrogram() {
    if (this.state.renderElectrogram) {
      return <ElectrogramDisplay annotations={this.state.annotations} />
    }
  }

  render() {

    return (
      <div className="Landing">
        <img className="logo" src={text_logo}></img>
        {this.renderElectrogram()}
        <div id="uploadContainer">
          <UploadField
              className="upload"
              triggerElectrogram={this.triggerElectrogram}
              onAnnotationData={this.onAnnotationData}
          />
        </div>
      </div>
    );
  } 
}

export default Landing;
