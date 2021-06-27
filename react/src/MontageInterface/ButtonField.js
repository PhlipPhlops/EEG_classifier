import React from 'react'
import styled from 'styled-components';

export class ButtonField extends React.Component {
  
  render() {
    return (
      <ButtonGrid>
        {/* Row1 */}
        <div />
        <div />
        <ElectrodeButton label="FP1" />
        <div />
        <ElectrodeButton label="FP2" />
        <div />
        <div />

        {/* Row2 */}
        <ElectrodeButton label="T1" />
        <ElectrodeButton label="F7" />
        <ElectrodeButton label="F3" />
        <ElectrodeButton label="FZ" />
        <ElectrodeButton label="F4" />
        <ElectrodeButton label="F8" />
        <ElectrodeButton label="T2" />

        {/* Row3 */}
        <ElectrodeButton label="A1" />
        <ElectrodeButton label="T3" />
        <ElectrodeButton label="C3" />
        <ElectrodeButton label="CZ" />
        <ElectrodeButton label="C4" />
        <ElectrodeButton label="T4" />
        <ElectrodeButton label="A2" />

        {/* Row 4 */}
        <div />
        <ElectrodeButton label="T5" />
        <ElectrodeButton label="P3" />
        <ElectrodeButton label="PZ" />
        <ElectrodeButton label="P4" />
        <ElectrodeButton label="T6" />
        <div />

        {/* Row5 */}
        <div />
        <div />
        <ElectrodeButton label="O1" />
        <div />
        <ElectrodeButton label="O2" />
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
        <ElectrodeButton label="X1" />
        <ElectrodeButton label="X2" />

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
  constructor(props) {
    super(props)
  }

  loadLabel = () => {
    // loadLabel(this.props.label)
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
