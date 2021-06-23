import React from "react";
import noto_brain from "../static/noto_brain.jpg"
import "./style.css";


export class Register extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="base-container" ref={this.props.containerRef}>
        <div className="header">Sign up</div>
        <div className="content">
          <div className="image">
            <img src={noto_brain} width="100px"/>
          </div>
          <div className="form">
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" name="email" placeholder="email" id="email"/>
            </div>
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
            Register
          </button>
        </div>
      </div>
    );
  }
}

export default Register;

function fn1() {
  var user = document.getElementById("username").value;
  var pass = document.getElementById("password").value;
  var email = document.getElementById("email").value;
  //alert(document.getElementsByClassName("username"));//("username"));
  alert("username is " + user + ", email is " + email + ", and password is " + pass + ".");
}

function getUsername() {
  return document.getElementById("username").value;
}

function getPassword() {
  return document.getElementById("password").value;
}

function getEmail() {
  return document.getElementById("email").value;
}