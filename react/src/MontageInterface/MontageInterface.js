import React from 'react';
import styled from 'styled-components';

import noto_brain from '../static/noto_brain.jpg';

class MontageInterface extends React.Component {

  render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <FloatingParent>
        <CenterChild>
          <Logo src={noto_brain} />
        </CenterChild>
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

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

const CenterChild = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background-color: white;
`;

const Logo = styled.img`
  height: 2.5rem;
  padding: 2px;
`;