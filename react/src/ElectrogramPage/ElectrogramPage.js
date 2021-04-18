import React from 'react';
import styled from 'styled-components';

import ElectrogramDisplay from './ElectrogramDisplay';
import EDSettingsBar from './EDSettingsBar';
import UploadField from '../components/UploadField';

import LogoBar from '../components/LogoBar';

class ElectrogramPage extends React.Component {
  
  render() {
    return (
      <PageWrapper>
        <LogoBar />
        <EDSettingsBar />
        <ElectrogramDisplay />
        <div />
        <EDSettingsBar />
        <UploadFieldParent>
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
  grid-template-rows: 1.5fr 1.5rem 15fr 1.5rem 1.5rem 2fr;
`;

const UploadFieldParent = styled.div`
  display: grid;
  grid-template-columns: 64vw 35vw 1vw;
  padding-top: 5px;
  grid-template-rows: 2rem;
`;