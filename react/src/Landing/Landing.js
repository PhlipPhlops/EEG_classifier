import React from 'react';
import UploadField from '../UploadField/UploadField';
import ElectrogramDisplay from '../ElectrogramDisplay/ElectrogramDisplay';
import styled from 'styled-components';
import text_logo from '../static/text_logo.png';
import splash_photo from '../static/encephalogram.png';


class Landing extends React.Component{

  render() {

    return (
      <LandingWrapper className="Landing">
        <Logo className="logo" src={text_logo}></Logo>
        <ElectrogramDisplay />
        <UploadField />
      </LandingWrapper>
    );
  } 
}

export default Landing;

const LandingWrapper = styled.div`
  height: 100vh;
  text-align: center;
  background-image: url(${splash_photo});
  background-color: #61dafb;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
`;

const Logo = styled.img`
  position: absolute;
  width: 40rem;
  left: 0;
  padding: 3rem;
  align-self: start;
`;
