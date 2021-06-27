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
        <div class="startheader">
            {/* <a href="#default" class="logo"> <img src={text_logo}/> </a> */}
            <img src={text_logo}/>
            <div class="startheader-right">
                <a class="active" href="#home">Home</a>
                <a href="#about" onClick={this.aboutHandler}>About</a>
                <a href="#signin" onClick={this.props.handler}>Sign in</a>
            </div>
        </div>

        <br></br>
      <div>
        {/* <h2> Single Item</h2> */}
        {/* <slides> */}
        <Slider {...settings}>
          <div>
            <img src={slide1} width="90%"/> {/* TODO: figure out proper width for slides, probably center on page, add arrows? */}
          </div>
          <div>
            <img src={slide2} width="90%"/>
          </div>
          <div>
            <img src={slide3} width="90%"/>
          </div>
          <div>
            <img src={slide4} width="90%"/>
          </div>
          {/* <div>
            <h3>5</h3>
          </div>
          <div>
            <h3>6</h3>
          </div> */}
        </Slider>
        {/* </slides> */}
      </div>


        </div> 
      );
    } else if (inAbout) {
      return (
      <div className="startbase-container" ref={this.props.containerRef}>
      <div class="startheader">
          {/* <a href="#default" class="logo"> <img src={text_logo}/> </a> */}
          <img src={text_logo}/>
          <div class="startheader-right">
              <a href="#home" onClick={this.homeHandler}>Home</a>
              <a class="active" href="#about" onClick={this.aboutHandler}>About</a>
              <a href="#signin" onClick={this.props.handler}>Sign in</a>
          </div>
      </div>
      </div> 
      );
    }
  }
}

export default Start;
