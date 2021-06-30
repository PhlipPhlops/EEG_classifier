import React from "react";
import "./App.css";
import Register from './Register+Login/Register';
import Login from './Register+Login/Login';
import Landing from './Landing/Landing';
import Start from './Start/Start';
import ElectrogramPage from "./ElectrogramPage/ElectrogramPage";
import RegisterandLogin from "./Register+Login/RegisterandLogin";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.loginHandler = this.loginHandler.bind(this);
        this.startHandler = this.startHandler.bind(this);
    
        this.state = {
            isLoginActive: true,
            buttonClicked: false,
            inStart: true,
        };
    }

    switchToElectrogramPage = () => {
        this.setState({
            // Change this variable name
            buttonClicked: true
        })
    }

    loginHandler() {
        this.setState({
            buttonClicked: true,
        })
    }

    startHandler() {
        this.setState({
            inStart: false,
        })
    }

    changeState() {
        const isLoginActive  = this.state.isLoginActive;

        if (isLoginActive) {
            this.rightSide.classList.remove("right");
            this.rightSide.classList.add("left");
        } else {
            this.rightSide.classList.remove("left");
            this.rightSide.classList.add("right");
        }
        this.setState(prevState => ({isLoginActive: !prevState.isLoginActive}));
    }

    render() {
        const isLoginActive = this.state.isLoginActive;
        const current = isLoginActive ? "Sign up" : "Login";
        const currentActive = isLoginActive ? "login" : "register";
        const buttonClicked = this.state.buttonClicked;
        const inStart = this.state.inStart;

        if (buttonClicked) {
            return (
                <ElectrogramPage/>
            );
        } else if (inStart) {
            return (
                <Start containerRef={ref=> (this.current = ref)} onEnterClicked={this.switchToElectrogramPage}/>
            );
        } else {
            return (
                <RegisterandLogin containerRef={ref=> (this.current = ref)} handler={this.loginHandler}/>
            );
        }
    }
}

export default App;