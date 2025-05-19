importScripts("https://www.gstatic.com/firebasejs/9.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.0/firebase-messaging-compat.js");
const firebaseConfig = {
    apiKey: "AIzaSyCmZfmTHP9BSffgB6jbLpQChrNidxS6uDs",
    authDomain: "opengis-27f76.firebaseapp.com",
    projectId: "opengis-27f76",
    storageBucket: "opengis-27f76.firebasestorage.app",
    messagingSenderId: "247256197770",
    appId: "1:247256197770:web:0a11bd1c8f55ecde29db73",
    measurementId: "G-FGCGT4PC2V"
};
firebase.initializeApp(firebaseConfig);
firebase.messaging();