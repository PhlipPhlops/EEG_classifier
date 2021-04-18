import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Landing from './Landing/Landing';
import ElectrogramPage from './ElectrogramPage/ElectrogramPage';

// Configure redux
import { Provider } from 'react-redux';
import store from './common/reducers';


ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ElectrogramPage />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
