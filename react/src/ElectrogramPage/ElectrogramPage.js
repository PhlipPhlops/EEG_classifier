import React from 'react';
import styled from 'styled-components';

import ElectrogramDisplay from './ElectrogramDisplay';
import EDSettingsBar from './EDSettingsBar';
import UploadField from '../components/UploadField';
import FeedbackButton from '../components/FeedbackButton';
import MontageInterface from '../MontageInterface/MontageInterface';
import TimeAdjuster from '../components/TimeAdjuster';

import LogoBar from '../components/LogoBar';
import store from '../common/reducers';


class ElectrogramPage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      showMontageModal: false,
      enableMontageButton: false,

      // This is a bit of a hack
      // if a child component is given a key, and that key changes
      // during a rerender, the child is destroyed and a new one is mounted
      // this is an easy way to reset hte entire electrogram
      electrogramKey: 0
    }

  }

  componentDidMount() {
    store.subscribe(() => {
      this.time_adjustment_secs = store.getState().timeAdjuster
      
      if (store.getState().serverStatus === 'UPLOADED') {
        // File has been successfully uploaded
        // activates montage button
        this.setState({enableMontageButton: true})
      }
    })
  }

  toggleMontageModal = () => {
    this.setState({
      showMontageModal: !this.state.showMontageModal
    })
  }

  resetElectrogram = () => {
    this.setState({
      electrogramKey: this.state.electrogramKey + 1
    })
    // Redux dispatch to trigger a store subscribe update,
    // triggering electogram intialization...
    // it's messy I know...
    store.dispatch({
      type: 'reset_switch'
    })
  }

  renderMontageToggler = () => {
    if (this.state.enableMontageButton) {
      return <button onClick={this.toggleMontageModal}>Edit Montage</button>
    } else {
      return <button disabled>Edit Montage</button>
    }
  }
  
  render() {
    return (
      <PageWrapper>
        <LogoBar />
        <EDSettingsBar />
        <ElectrogramDisplay
          key={this.state.electrogramKey}
          ref={(ref) => { this.echartRef = ref }} 
          />
        <MontageInterface show={this.state.showMontageModal} parentRef={this} />
        <div style={{pointerEvents: 'none'}} />
        <EDSettingsBar />
        <UploadFieldParent>
          <div /> {/** FeedbackButton goes here */}
          <TimeAdjuster />
          {this.renderMontageToggler()}
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