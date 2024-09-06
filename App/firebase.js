import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 
import { getFirestore, doc, setDoc } from 'firebase/firestore'; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf8yimsuwoKJKJmziMAQcBMGQSSKXtVgo",
  authDomain: "payroll-app-f054a.firebaseapp.com",
  projectId: "payroll-app-f054a",
  storageBucket: "payroll-app-f054a.appspot.com",
  messagingSenderId: "817672142656",
  appId: "1:817672142656:web:7710acd24b7d6da9f444a5"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

if (!auth) {
  initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

const db = getFirestore(app)

export { auth, db };
 
