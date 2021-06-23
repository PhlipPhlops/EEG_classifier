import React from "react";
import "./App.css";
import Register from './Register+Login/Register';
import Login from './Register+Login/Login';
import Landing from './Landing/Landing';
import Start from './Start/Start';
import ElectrogramPage from "./ElectrogramPage/ElectrogramPage";

{/* <Router>
    <Route path="./Landing/Landing" component={Landing}/>
</Router> */}

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

    // componentDidMount() {
    //     this.rightSide.classList.add("right");
    // }

    loginHandler() {
        this.setState({
            buttonClicked: true,
        })
    }

    startHandler() {
        this.setState({
            inStart: false,
        })
        // this.changeState();
        // this.goToLogin();
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
                <Start containerRef={ref=> (this.current = ref)} handler = {this.startHandler}/>
            );
        } else {
            // this.changeState();
            return (
                // <Login handler = {this.handler}> </Login>
                    <div className = "App">
                    <div className = "login">
                        <div className = "container" ref = {ref => (this.container = ref)}>
                            {isLoginActive && (
                                <Login containerRef={ref => (this.current = ref)} handler={this.loginHandler}/>
                            )}
                            {!isLoginActive && (
                                <Register containerRef={ref => (this.current = ref)} handler={this.loginHandler} />
                            )}                 
                        </div>
                        <RightSide 
                            current = {current}
                            currentActive = {currentActive}
                            containerRef = {ref => (this.rightSide = ref)}
                            onClick = {this.changeState.bind(this)}
                        />
                    </div>
                </div>
            );
            // this.changeState();
        }
    }
}

const RightSide = props => {
    return (
        <div
            className = "right-side"
            ref = {props.containerRef}
            onClick = {props.onClick}
        >
            <div className = "inner-container">
                <div className = "text">{props.current}</div>
            </div>
        </div>
    )
}

export default App;