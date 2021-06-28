import React from 'react';
import styled from 'styled-components';

export class ElectrodeList extends React.Component {

  constructor(props) {
    super(props)
    this.montageList = this.props.montageList
  }

  componentDidUpdate() {
    this.montageList = this.props.montageList
  }

  renderElectrodePair(pair, i) {
    let backgroundColor;
    if (i%2 == 0) {
      backgroundColor = '#D3D3D3'
    } else {
      backgroundColor = '#F3F3F3'
    }

    let child1, child2;
    if (pair.length == 0) {
      // [ Cursor, Blank ]
      child1 = <CenterChild>
        <ColorCursor />
      </CenterChild>
      child2 = null
    } else if (pair.length == 1) {
      // [ Label, Cursor ]
      child1 = <CenterChild>
        {pair[0]}
      </CenterChild>
      child2 = <CenterChild>
        <ColorCursor />
      </CenterChild>
    } else if (pair.length == 2) {
      // [ Label, Label ]
      child1 = <CenterChild>
        {pair[0]}
      </CenterChild>
      child2 = <CenterChild>
        {pair[1]}
      </CenterChild>
    }
    
    // Pair is an array of lenght 0, 1, or 2
    return (
      <ListPairWrapper key={i} style={{backgroundColor: backgroundColor}}>
        {child1}
        {child2}
      </ListPairWrapper>
    )
  }

  renderList() {
    let montage = this.montageList
    if (montage == undefined) {
      return this.renderElectrodePair([])
    }

    return montage.map((pair, i) => {
      return this.renderElectrodePair(pair, i)
    })
  }
  
  render() {
    return (
      <HorizontallyCenter>
        <ListWrapper>
          {this.renderList()}
        </ListWrapper>
      </HorizontallyCenter>
    )
  }

}

let ListWrapper = styled.div`
  width: 80%;
  margin-top: 20px;
  
`

let ListPairWrapper = styled.div`
  width: 100%;
  height: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
`

let HorizontallyCenter = styled.div`
  display: flex;
  justify-content: center;
`

let CenterChild = styled.div`
  display: grid;
  justify-content: center;
  align-items: center;
`

let ColorCursor = styled.div`
  background-color: darkblue;
  width: 40px;
  height: 2px;
  border-radius: 10px;
`