import React from 'react';
import './Landing.css';
import UploadField from '../UploadField/UploadField';
import ElectrogramDisplay from '../ElectrogramDisplay/ElectrogramDisplay';
import text_logo from '../static/text_logo.png';


class Landing extends React.Component{

  render() {

    return (
      <div className="Landing">
        <img className="logo" src={text_logo}></img>
        <ElectrogramDisplay />
        <UploadField />
      </div>
    );
  } 
}

export default Landing;
