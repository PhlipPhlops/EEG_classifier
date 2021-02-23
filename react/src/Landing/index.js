import React from 'react';
import './index.css';
import UploadField from '../UploadField';
import ElectrogramDisplay from '../ElectrogramDisplay';
import text_logo from '../static/text_logo.png';

/// Socket Test
import io from 'socket.io-client';
const BASE_URL = process.env.REACT_APP_BACKEND_URL;
let socket = io(`${BASE_URL}`);


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

  socketTest() {
    console.log('test')
    socket.emit("message", "dick bitty")
    // socket.on("FromAPI", data => {
    //   console.log(data)
    // })
  }

  render() {

    return (
      <div className="Landing">
        {/* <img className="logo" src={text_logo}></img> */}
        <div id="uploadContainer">
          <UploadField onEegData={this.onEegData} className="upload" />
        </div>
        <button onClick={this.socketTest}>Socket Test</button>
      </div>
    );
  } 
}

export default Landing;
