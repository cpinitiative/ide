import firebase from 'firebase/app';

export const signInAnonymously = (): void => {
  firebase
    .auth()
    .signInAnonymously()
    .catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert('Error signing in: ' + errorCode + ' ' + errorMessage);
    });
};
