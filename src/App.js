import React, { useState, useEffect } from 'react';
import './App.css';

import StartingSoon from './components/StartingSoon'
import Spotlight from './components/Spotlight'
import queryString  from 'query-string'

import firebase  from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import Moderator from './components/Moderator';

window.firebase = firebase

// TODO maybe provide this using firebase hosting
/*fetch('/__/firebase/init.json').then(async response => {
  firebase.initializeApp(await response.json());
})*/

if(
  window.location.hostname === 'fff-twitch-chat-log.web.app' ||
  window.location.hostname === 'localhost'
){
  firebase.initializeApp({
    "apiKey": "AIzaSyAFe44BtaxhhmoTjHVQpFfHbBNRPJ37pCw",
    "authDomain": "fff-twitch-chat-log-dev.firebaseapp.com",
    "databaseURL": "https://fff-twitch-chat-log-dev.firebaseio.com",
    "messagingSenderId": "601247741319",
    "projectId": "fff-twitch-chat-log-dev",
    "storageBucket": "fff-twitch-chat-log-dev.appspot.com"
  })
} else {
  firebase.initializeApp({
    "apiKey": "AIzaSyDs6iKM4_vUe7GamT_3HAEX1zOYng0uHLk",
    "authDomain": "fff-twitch-chat-log.firebaseapp.com",
    "databaseURL": "https://fff-twitch-chat-log.firebaseio.com",
    "projectId": "fff-twitch-chat-log",
    "storageBucket": "fff-twitch-chat-log.appspot.com",
    "messagingSenderId": "191307077402",
    "appId": "1:191307077402:web:ba548c6a0f36e318a47ea3"
  })
  
}

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