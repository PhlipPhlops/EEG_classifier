import React from 'react';
import './index.css';
import UploadField from '../UploadField';
import text_logo from '../static/text_logo.png';


class Landing extends React.Component{
  
  render() {
    return (
      <div className="Landing">
        <img className="logo" src={text_logo}></img>
        <div id="uploadContainer">
          <UploadField className="upload" />
        </div>
      </div>
    );
  } 
}

export default Landing;
