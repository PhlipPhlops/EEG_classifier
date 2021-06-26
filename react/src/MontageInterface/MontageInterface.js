import React from 'react';
import styled from 'styled-components';

import noto_brain from '../static/noto_brain.jpg';

class MontageInterface extends React.Component {

  render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <CenterChild>
        <Logo src={noto_brain} />
      </CenterChild>
    )
  }
}

export default MontageInterface;

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