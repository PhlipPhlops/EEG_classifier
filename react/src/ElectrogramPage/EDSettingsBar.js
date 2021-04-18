import React from 'react'
import styled from 'styled-components';

class EDSettingsBar extends React.Component {


  render() {
    return (
      <ParentBar/>
    )
  }
}

export default EDSettingsBar;

const ParentBar = styled.div`
  width: 100%;
  background-image: linear-gradient(to right, blue, cyan);
`;
