import React from 'react';
import styled from 'styled-components';

class FeedbackPopup extends React.Component {

  render() {
    return (
      <Modal>
        <div />
        <div />
        <div />
        <div />
        <Popup />
      </Modal>
    )
  }
}

export default FeedbackPopup;

const Modal = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  color: transparent;
  // filter: blur(4px);

  display: grid;
  grid-template-columns: 33vw 34vw 33vw;
  grid-template-rows: 15vw 45vw 10vw;

  border: 3px solid red;
`;

const Popup = styled.div`
  background-color: white;
  border-radius; 2rem;

  border: 3px solid green;

  // grid-row: 3;
  // grid-column; 1;
`;