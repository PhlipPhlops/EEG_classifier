import React from "react";
import noto_brain from "../static/noto_brain.jpg";
import text_logo from "../static/text_logo.png";
import display from "../static/display.png";
import laptop from "../static/laptop.png"
import "./startstyle.css";

export class Start extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div className="startbase-container" ref = {this.props.containerRef}>

            <div className="startheader-container">
                <div className="startheaderimage">
                    <img src={text_logo} />
                </div>
                <div className="startheader">Making neurology diagnosis more accessible to you</div>
            </div>
        
            <div className="startfooter">
                <button type="button" className="btn" onClick={this.props.handler}>
                    Go to login
                </button>
            </div> 

            <div className="startcontent">
                <div className="startimage">
                    <img src={laptop}/>
                </div>
                {/* <div className="startcontenttext">
                    Upload your EEG file
                     from wherever you are
                </div> */}
            </div>
    

         </div>   
    );
  }
}

export default Start;