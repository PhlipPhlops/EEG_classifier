import React from 'react';
import styled from 'styled-components';

import ElectrogramDisplay from './ElectrogramDisplay';
import EDSettingsBar from './EDSettingsBar';
import UploadField from '../components/UploadField';
import FeedbackButton from '../components/FeedbackButton';
import MontageInterface from '../MontageInterface/MontageInterface';
import TimeAdjuster from '../components/TimeAdjuster';

import LogoBar from '../components/LogoBar';

class ElectrogramPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      showMontageModal: false
    }
  }

  toggleMontageModal = () => {
    this.setState({
      showMontageModal: !this.state.showMontageModal
    })
  }
  
  render() {
    return (
      <PageWrapper>
        <LogoBar />
        <EDSettingsBar />
        <ElectrogramDisplay />
        <MontageInterface show={this.state.showMontageModal} />
        <div style={{pointerEvents: 'none'}} />
        <EDSettingsBar />
        <UploadFieldParent>
          <div /> {/** FeedbackButton goes here */}
          <TimeAdjuster />
          <button onClick={this.toggleMontageModal}>Edit Montage</button>
          <UploadField />
          <div />
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
  grid-template-rows: 1.25fr 0.75rem 30fr 1.5rem 0.75rem 1.75fr;
`;

const UploadFieldParent = styled.div`
  display: grid;
  grid-template-columns: 12vw 20vw 32vw 35vw 1vw;
  padding-top: 5px;
  grid-template-rows: 2rem;
`;