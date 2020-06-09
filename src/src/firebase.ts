import firebase from 'firebase';
const config = {
    apiKey: "AIzaSyD-NzYlHmpXTHykDD29BwsxD1ZZ-yRGit0",
    authDomain: "weathermap-1b4c6.firebaseapp.com",
    databaseURL: "https://weathermap-1b4c6.firebaseio.com",
    projectId: "weathermap-1b4c6",
    storageBucket: "weathermap-1b4c6.appspot.com",
    messagingSenderId: "394607592827",
    appId: "1:394607592827:web:33c309c70f38c87c7129de"
  };
firebase.initializeApp(config);
export default firebase;