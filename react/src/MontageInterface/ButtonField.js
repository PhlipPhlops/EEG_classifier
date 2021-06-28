import React from 'react'
import styled from 'styled-components';

export class ButtonField extends React.Component {

  constructor(props) {
    super(props)
    this.onClick = this.props.onButtonClicked
  }
  
  render() {
    return (
      <ButtonGrid>
        {/* Row1 */}
        <div />
        <div />
        <ElectrodeButton onClick={this.onClick} label="FP1" />
        <div />
        <ElectrodeButton onClick={this.onClick} label="FP2" />
        <div />
        <div />

        {/* Row2 */}
        <ElectrodeButton onClick={this.onClick} label="T1" />
        <ElectrodeButton onClick={this.onClick} label="F7" />
        <ElectrodeButton onClick={this.onClick} label="F3" />
        <ElectrodeButton onClick={this.onClick} label="FZ" />
        <ElectrodeButton onClick={this.onClick} label="F4" />
        <ElectrodeButton onClick={this.onClick} label="F8" />
        <ElectrodeButton onClick={this.onClick} label="T2" />

        {/* Row3 */}
        <ElectrodeButton onClick={this.onClick} label="A1" />
        <ElectrodeButton onClick={this.onClick} label="T3" />
        <ElectrodeButton onClick={this.onClick} label="C3" />
        <ElectrodeButton onClick={this.onClick} label="CZ" />
        <ElectrodeButton onClick={this.onClick} label="C4" />
        <ElectrodeButton onClick={this.onClick} label="T4" />
        <ElectrodeButton onClick={this.onClick} label="A2" />

        {/* Row 4 */}
        <div />
        <ElectrodeButton onClick={this.onClick} label="T5" />
        <ElectrodeButton onClick={this.onClick} label="P3" />
        <ElectrodeButton onClick={this.onClick} label="PZ" />
        <ElectrodeButton onClick={this.onClick} label="P4" />
        <ElectrodeButton onClick={this.onClick} label="T6" />
        <div />

        {/* Row5 */}
        <div />
        <div />
        <ElectrodeButton onClick={this.onClick} label="O1" />
        <div />
        <ElectrodeButton onClick={this.onClick} label="O2" />
        <div />
        <div />

        {/* Row6 -- Empty */}
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />

        {/* Row7 */}
        <ElectrodeButton onClick={this.onClick} label="X1" />
        <ElectrodeButton onClick={this.onClick} label="X2" />
        <div />
        <div />
        <div />
        <div />
        <ElectrodeButton onClick={this.onClick} label="None" />

      </ButtonGrid>
    )
  }
}

const ButtonGrid = styled.div`
  display: grid;
  grid-row-gap: 5px;
  grid-column-gap: 5px;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
`


class ElectrodeButton extends React.Component {

  loadLabel = () => {
    let label = this.props.label
    if (label == 'None') {
      label = ''
    }
    this.props.onClick(label)
  }

  render() {
    return (
      <StyledButton onClick={this.loadLabel}>{this.props.label}</StyledButton>
    )
  }
}

const StyledButton = styled.button`
  background-color: cyan;
  border: none;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 3px 5px 3px 5px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.24);
`
