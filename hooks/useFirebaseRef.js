import firebase from "firebase/app";
import "firebase/database";
import "firebase/analytics";
import { useState, useEffect } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyDAYhsX5I8X1l_hu6AhBZx8prDdvY2i2EA",
  authDomain: "live-cp-ide.firebaseapp.com",
  databaseURL: "https://live-cp-ide.firebaseio.com",
  projectId: "live-cp-ide",
  storageBucket: "live-cp-ide.appspot.com",
  messagingSenderId: "350143604950",
  appId: "1:350143604950:web:3a5716645632d42def0177",
  measurementId: "G-V2G3NLWBWF"
};

if (typeof window !== "undefined") {
  // firepad needs access to firebase
  window.firebase = firebase;
}

if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
  if (typeof window !== "undefined" && firebase.analytics) firebase.analytics();
}

function getFirebaseRef() {
  var ref = firebase.database().ref();
  var hash = window.location.hash.replace(/#/g, '');
  if (hash) {
    ref = ref.child(hash);
  } else {
    ref = ref.push(); // generate unique location.
    window.location = window.location + '#' + ref.key; // add it as a hash to the URL.
  }
  return ref;
}

export const useFirebaseRef = () => {
  const [ref, setRef] = useState(null);
  useEffect(() => {
    setRef(getFirebaseRef());
  }, []);
  return ref;
}