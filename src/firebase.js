import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1cLdOir9tuhRdUlv5GqR0N0FY3KiWUs4",
  authDomain: "mimamori-navi-306da.firebaseapp.com",
  projectId: "mimamori-navi-306da",
  storageBucket: "mimamori-navi-306da.firebasestorage.app",
  messagingSenderId: "934421674856",
  appId: "1:934421674856:web:9752a528c3d2b98ecf74dd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
