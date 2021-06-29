import React from 'react';
import styled from 'styled-components';
import netface from '../common/network_interface';

import {ButtonField} from './ButtonField';
import {ElectrodeList} from './ElectrodeList';


class MontageInterface extends React.Component {

  constructor(props) {
    super(props)

    // This is a list of lists(max len 2)
    this.state = {
      montageList: [
        ['FP1', 'F3'],
        ['F3','C3'],
        ['C3','P3'],
        ['P3','O1'],
        ['FP1','F7'],
        ['F7','T3'],
        ['T3','T5'],
        ['T5','O1'],
        ['FZ','CZ'],
        ['CZ','PZ'],
        ['FP2','F4'],
        ['F4','C4'],
        ['C4','P4'],
        ['P4','O2'],
        ['FP2','F8'],
        ['F8','T4'],
        ['T4','T6'],
        ['T6','O2'],
        ['T1','A1'],
        ['A1','A2'],
        ['A2','T2'],
        ['T2','T1'],
        []
      ]
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (!this.props.show) {
      // Nothing should fire if not showing
      return
    }

    const BACKSPACE = 8
    if (event.keyCode == BACKSPACE) {
      this.delElectrode()
    }
  }

  addElectrode = (label) => {
    let montage = this.state.montageList
    let lastPair = montage.slice(-1)[0]
    if (lastPair.length == 0) {
      lastPair.push(label)
    } else if (lastPair.length == 1) {
      lastPair.push(label)
      montage.push([])
    }

    // Store to object
    this.setState({
      montageList: montage
    })
    this.forceUpdate()
  }

  delElectrode = () => {
    // Pops the last electrode from the list
    let montage = this.state.montageList
    let lastPair = montage.slice(-1)[0]

    if (montage.length == 1 && lastPair.length == 0) {
      return
    }

    if (lastPair.length == 0) {
      montage.pop()

      let newLastPair = montage.slice(-1)[0]
      if (newLastPair == undefined) {
        // Reset to original state if empty
        montage = [
          []
        ]
      } else {
        // Pop the last element
        newLastPair.pop()
      }
    } else if (lastPair.length == 1) {
      lastPair.pop()
    }

    // Store to object
    this.setState({
      montageList: montage
    })
  }

  setMontage = () => {
    let montageJson = JSON.stringify(this.state.montageList)
    console.log("Montage sent")
    netface.setMontage(montageJson)
  }

  render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <FloatingParent>
        <ButtonField onButtonClicked={this.addElectrode} />
        <ElectrodeList montageList={this.state.montageList} />
        <ActivityButtonGrid>
          <ActivityButton onClick={this.setMontage}>Save</ActivityButton>
          <ActivityButton onClick={this.delElectrode}>del</ActivityButton>
        </ActivityButtonGrid>
      </FloatingParent>
    )
  }
}

export default MontageInterface;

const FloatingParent = styled.div`
  width: 35%;
  height: 70%;
  background-color: white;
  border-radius: 15px;
  box-shadow: 3px 5px 3px 5px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.24);

  overflow-y: scroll;

  padding: 15px;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

const ActivityButtonGrid = styled.div`
  display: grid;
  margin: 15px;
  grid-column-gap: 5px;
  grid-template-columns: 1fr 1fr ;
`

const ActivityButton = styled.button`
  background-color: #4599ff;
  border: none;
  border-radius: 5px;
  color: white;
  padding: 10px;
  box-shadow: 3px 5px 3px 5px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.24);
`