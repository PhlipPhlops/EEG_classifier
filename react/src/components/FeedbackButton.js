import React from 'react';
import styled from 'styled-components';
import html2canvas from 'html2canvas';

import FeedbackPopup from './FeedbackPopup';

class FeedbackButton extends React.Component {


  saveAs = (uri, filename) => {
    var link = document.createElement('a');

    if (typeof link.download === 'string') {
        link.href = uri;
        link.download = filename;
        //Firefox requires the link to be in the body
        document.body.appendChild(link);
        //simulate click
        link.click();
        //remove the link when done
        document.body.removeChild(link);
    } else {
        window.open(uri);
    }
  }

  screenshot = () => {
    const screenshotTarget = document.body;

    html2canvas(screenshotTarget).then((canvas) => {
      this.saveAs(canvas.toDataURL(), 'test_screenshot.png')
      // const base64image = canvas.toDataURL("image/png");
      // window.location.href = base64image;
    });
  }

  handleClick = () => {
    console.log('thus has been clickethed')
    this.screenshot()
  }

  render() {
    return (
      <div>
        <FieldButton onClick={this.handleClick}>
          <ButtonText>Send us feedback</ButtonText>
        </FieldButton>
        <FeedbackPopup />
      </div>
    )
  }
}

export default FeedbackButton;

const FieldButton = styled.div`
  border-radius: 1rem;
  background-color: white;
  
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  
  color: #294a5d;
  font-size: large;
  
  /* Responsivity */
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.35);
  &:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.35);
    transition: opacity .5s ease-in-out;
  }

  border: 1px solid black;
`;

const ButtonText = styled.span`
  font-weight: 500;
  letter-spacing: .5px;
  font-size: 17px;
  padding: 0 0.5rem 0 0.5rem;
`;