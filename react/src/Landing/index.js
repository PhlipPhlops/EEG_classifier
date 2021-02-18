import React from 'react';
import './index.css';
import UploadField from '../UploadField';
import ElectrogramDisplay from '../ElectrogramDisplay';
import text_logo from '../static/text_logo.png';


class Landing extends React.Component{
  
  constructor(props) {
    super(props)
    this.state = {
      dataIsAvailable: false,
    }

    // Bind functions to this object
    this.onEegData = this.onEegData.bind(this)
  }

  onEegData(dataObj) {
    this.setState({
      dataIsAvailable: true,
      data: dataObj
    })
  }

  renderElectrogram() {
    if (this.state.dataIsAvailable) {
      return <ElectrogramDisplay data={this.state.data} />
    }
  }

  render() {

    return (
      <div className="Landing">
        <img className="logo" src={text_logo}></img>
        <div id="uploadContainer">
          <UploadField onEegData={this.onEegData} className="upload" />
        </div>
      </div>
    );
  } 
}

export default Landing;
