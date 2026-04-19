import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 見守りナビ独自のFirestore（登録・特別日データ用）
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

// yagiyama-net（共有：認証 + ユーザー情報 + 休校日連携）
const sharedConfig = {
  apiKey: "AIzaSyBUMYSL31nao-X60sgj1SaDT3uVdoklGo8",
  authDomain: "yagiyama-net.firebaseapp.com",
  projectId: "yagiyama-net",
  storageBucket: "yagiyama-net.firebasestorage.app",
  messagingSenderId: "521005930868",
  appId: "1:521005930868:web:ec8d8afb837114ad833421",
};
const sharedApp = initializeApp(sharedConfig, "shared");
export const sharedDb = getFirestore(sharedApp);
export const sharedAuth = getAuth(sharedApp);
