import React from "react";
import noto_brain from "../static/noto_brain.jpg";
import slide1 from "../static/slide1.png";
import slide2 from "../static/slide2.png";
import slide3 from "../static/slide3.png";
import slide4 from "../static/slide4.png";
import text_logo from "../static/text_logo.png";
import display from "../static/display.png";
import laptop from "../static/laptop.png"
import "./startstyle.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

export class Start extends React.Component {
  constructor(props) {
    super(props);

    this.aboutHandler = this.aboutHandler.bind(this);
    this.homeHandler = this.homeHandler.bind(this);

    this.state = {
      inHome: true,
      inAbout: false,
    };
  }

  aboutHandler() {
    this.setState({
      inHome: false,
      inAbout: true,
    })  
  }

  homeHandler() {
    this.setState({
      inHome: true,
      inAbout: false,
    })
  }

  renderHeader() {
    return (
      <div class="startheader">
        {/* <a href="#default" class="logo"> <img src={text_logo}/> </a> */}
        <img src={text_logo}/>
        <div class="startheader-right">
          <a href="#home" onClick={this.props.onEnterClicked}>Enter Neurogram</a>
          {/* <a href="#home" onClick={this.homeHandler}>Home</a> */}
          {/* <a class="active" href="#about" onClick={this.aboutHandler}>About</a>
          <a href="#signin" onClick={this.props.handler}>Sign in</a> */}
        </div>
      </div>
    )
  }

  render() {
    const inHome = this.state.inHome;
    const inAbout = this.state.inAbout;

    const settings = {
      dots: true,
      // infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      autoplay: true,
      autoplaySpeed: 4000,
      pauseOnFocus: false,
      pauseOnDotsHover: false,
      pauseOnHover: false,
      fade: true,
      // centerMode: true,
      adaptiveHeight: true,
      // variableWidth: true,
    };

    if (inHome) {
      return (

        <div className="startbase-container" ref={this.props.containerRef}>
        {this.renderHeader()}
        <br></br>
          <div className="slides">
            {/* <h2> Single Item</h2> */}
            <Slider {...settings}>
              <div>
                <img src={slide1} width="100%"/> {/* TODO: figure out proper width for slides, probably center on page, add arrows? */}
              </div>
              <div>
                <img src={slide2} width="100%"/>
              </div>
              <div>
                <img src={slide3} width="100%"/>
              </div>
              <div>
                <img src={slide4} width="100%"/>
              </div>
            </Slider>
          </div>
        </div> 
      );
    } else if (inAbout) {
      return (
      <div className="startbase-container" ref={this.props.containerRef}>
        {this.renderHeader()}
      </div> 
      );
    }
  }
}

export default Start;
