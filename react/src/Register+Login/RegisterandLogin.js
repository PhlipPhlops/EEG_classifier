import React from "react";
import "../App.css";
import Register from './Register';
import Login from './Login';
import "../Start/startstyle.css";

class RegisterandLogin extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            isLoginActive: true,
            buttonClicked: false,
            inStart: true,
        };
    }

    componentDidMount() {
        this.rightSide.classList.add("right");
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

        return (            
                <div className = "App">
                <div className = "login">
                    <div className = "container" ref = {ref => (this.container = ref)}>
                        {isLoginActive && (
                            <Login containerRef={ref => (this.current = ref)} handler={this.props.handler}/>
                        )}
                        {!isLoginActive && (
                            <Register containerRef={ref => (this.current = ref)} handler={this.props.handler} />
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

export default RegisterandLogin;