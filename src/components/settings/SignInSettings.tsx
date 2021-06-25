import React from 'react';
import firebase from 'firebase/app';
import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import { connectionRefAtom } from '../../atoms/firebaseAtoms';
import {
  firebaseUserAtom,
  signInWithGoogleAtom,
} from '../../atoms/firebaseUserAtoms';

const buttonClasses =
  'inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400';

export default function SignInSettings(): JSX.Element {
  const firebaseUser = useAtomValue(firebaseUserAtom);
  const setConnectionRef = useUpdateAtom(connectionRefAtom);
  const handleSignInWithGoogle = useUpdateAtom(signInWithGoogleAtom);

  const handleSignOut = () => {
    setConnectionRef(null);
    firebase.auth().signOut();
  };

  return (
    <div>
      <div className="block font-medium text-gray-700">Sign In</div>
      <p className="text-sm text-gray-700 mt-1">
        This will sync your files across devices. If this is your first time
        signing in, your data will be linked automatically. However, if this is
        not your first time signing in, your local data will be overwritten by
        the server data.
      </p>

      {firebaseUser && (
        <p className="mt-1 text-sm text-gray-700">
          Signed in{firebaseUser.isAnonymous ? ' anonymously' : ''} as{' '}
          {firebaseUser.displayName}
        </p>
      )}

      <div className="h-2" />

      {!firebaseUser || firebaseUser.isAnonymous ? (
        <button
          className={buttonClasses + ' pl-3'}
          onClick={handleSignInWithGoogle}
        >
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="18px"
            height="18px"
            viewBox="0 0 48 48"
            className="abcRioButtonSvg"
          >
            <g>
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </g>
          </svg>
          <span className="ml-3">Sign In With Google</span>
        </button>
      ) : (
        <button className={buttonClasses + ' pl-3'} onClick={handleSignOut}>
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );
}
