import React from 'react';
import styled from 'styled-components';

import {ButtonField} from './ButtonField';


class MontageInterface extends React.Component {

  loadLabel = (label) => {
    console.log("MI:", label)
  }

  render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <FloatingParent>
        <ButtonField loadLabel={this.loadLabel} />
      </FloatingParent>
    )
  }
}

export default MontageInterface;

const FloatingParent = styled.div`
  width: 50%;
  height: 70%;
  background-color: white;
  border-radius: 15px;
  box-shadow: 3px 5px 3px 5px rgba(0,0,0,0.12), 0 3px 5px rgba(0,0,0,0.24);

  padding: 15px;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

class MontageList extends React.Component {
  constructor(props) {
    super(props)
    
    // A list of lists size 2
    this.state.montage = []
  }
}