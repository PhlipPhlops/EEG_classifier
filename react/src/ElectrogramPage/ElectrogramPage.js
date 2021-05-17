import React from 'react';
import styled from 'styled-components';

import ElectrogramDisplay from './ElectrogramDisplay';
import EDSettingsBar from './EDSettingsBar';
import UploadField from '../components/UploadField';
import FeedbackButton from '../components/FeedbackButton';

import LogoBar from '../components/LogoBar';

class ElectrogramPage extends React.Component {
  
  render() {
    return (
      <PageWrapper>
        <LogoBar />
        <EDSettingsBar />
        <ElectrogramDisplay />
        <div style={{pointerEvents: 'none'}} />
        <EDSettingsBar />
        <UploadFieldParent>
          <div />
          <div /> {/** FeedbackButton goes here */}
          <div />
          <UploadField />
        </UploadFieldParent>
      </PageWrapper>
    )
  }
}

export default ElectrogramPage

const PageWrapper = styled.div`
  height: 100vh;
  display: grid;
  grid-gap: 3px;
  grid-template-rows: 1.5fr 1.5rem 17fr 1.5rem 1.5rem 2fr;
`;

const UploadFieldParent = styled.div`
  display: grid;
  grid-template-columns: 2vw 20vw 42vw 35vw 1vw;
  padding-top: 5px;
  grid-template-rows: 2rem;
`;