import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App'
import Landing from './Landing/Landing';
import ElectrogramPage from './ElectrogramPage/ElectrogramPage';
import Register from './Register+Login/Register';
import Login from './Register+Login/Login'

// Configure redux
import { Provider } from 'react-redux';
import store from './common/reducers';


ReactDOM.render(<App/>, document.getElementById('root'));
