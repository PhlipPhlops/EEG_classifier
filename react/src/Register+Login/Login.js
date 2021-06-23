import React from "react";
import noto_brain from "../static/noto_brain.jpg"
import App from "../App.js";
import Landing from "../Landing/Landing";
import "./style.css";
import {useHistory} from 'react-router-dom';

export class Login extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    return (
      <div className="base-container" ref = {this.props.containerRef}>
        <div className="header">Login</div>
        <div className="content">
          <div className="image">
            <img src={noto_brain} />
          </div>
          <div className="form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" name="username" placeholder="username" id="username"/>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" name="password" placeholder="password" id="password"/>
            </div>
          </div>
        </div>
        <div className="footer">
          <button type="button" className="btn" onClick={this.props.handler}>
            {/* () => {fn1(); */}
            Login
          </button>
        </div>
      </div>
    );
  }
}

export default Login;

function fn1() {
  var user = document.getElementById("username").value;
  var pass = document.getElementById("password").value;
  //alert(document.getElementsByClassName("username"));//("username"));
  alert("username is " + user + " and password is " + pass);
  //this.changeState();
}

function getUsername() {
  return document.getElementById("username").value;
}

function getPassword() {
  return document.getElementById("password").value;
}

function goToLanding() {
  // window.location = 'landing';
  // this.props.state.buttonClicked.setState(true);
  // this.props.history.push('../Landing/Landing');
}