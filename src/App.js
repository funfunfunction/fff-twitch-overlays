import React, { useState, useEffect } from 'react';
import './App.css';

import StartingSoon from './components/StartingSoon'
import Spotlight from './components/Spotlight'
import queryString  from 'query-string'

import firebase  from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import firebaseConfiguration from "./firebase.secret.json"
import Moderator from './components/Moderator';

window.firebase = firebase
firebase.initializeApp(firebaseConfiguration);


function App() {
  const [ query, setQuery ] = useState({})
  useEffect(function() {
    setQuery(queryString.parse(window.location.search))
  }, [])

  return (
    <div className="App">
      {query.scene === 'soon' && <StartingSoon  /> }
      {query.scene === 'spotlight' && <Spotlight /> }
      {query.scene === 'moderator' && <Moderator /> }
    </div>
  )

  
}



export default App;