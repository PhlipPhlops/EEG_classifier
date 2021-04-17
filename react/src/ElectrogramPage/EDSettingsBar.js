import React from 'react'
import styled from 'styled-components';

class EDSettingsBar extends React.Component {


  render() {
    return (
      <ParentBar/>
    )
  }
}

const ParentBar = styled.div`
  width: 100%;
  height: 3rem;
  border: 3px solid red;
`;

const TextField = styled.div`

`;

export default EDSettingsBar;