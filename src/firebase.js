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

// yagiyama-net（グループウェア）のFirestoreに副接続（休校日データ共有用）
const sharedConfig = {
  apiKey: "AIzaSyBUMYSL31nao-X60sgj1SaDT3uVdoklGo8",
  authDomain: "yagiyama-net.firebaseapp.com",
  projectId: "yagiyama-net",
};
const sharedApp = initializeApp(sharedConfig, "shared");
export const sharedDb = getFirestore(sharedApp);
