// Admin JS for EasyQuran — uses Firebase Web SDK v9 modular
// Replace the firebaseConfig below with your project's config and set ADMIN_UID to your user uid if you want UID-based protection as well.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  // storageBucket, messagingSenderId, appId optional
};
// Optionally restrict by UID as well. Not required if you only want to check email.
const ADMIN_UID = 'REPLACE_WITH_ADMIN_UID';
const ADMIN_EMAIL = 'ahmadshahwaiz@gmail.com'; // only this Google account will be allowed

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout');
const googleBtn = document.getElementById('google-signin');
const unauthMsg = document.getElementById('unauth-msg');
const dashboard = document.getElementById('dashboard');
const usersTableBody = document.querySelector('#users-table tbody');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    unauthMsg.textContent = 'Sign-in failed: ' + err.message;
    unauthMsg.classList.remove('hidden');
  }
});

googleBtn.addEventListener('click', async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // popup returns result.user — onAuthStateChanged will handle authorization check
    // but do a quick check and sign out immediately if email doesn't match
    const u = result.user;
    if (!u.email || u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      unauthMsg.textContent = 'This Google account is not authorized.';
      unauthMsg.classList.remove('hidden');
      await signOut(auth);
    }
  } catch (err) {
    unauthMsg.textContent = 'Google sign-in failed: ' + err.message;
    unauthMsg.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  unauthMsg.classList.add('hidden');
  errorBox.classList.add('hidden');
  if (user) {
    // enforce admin email and/or UID
    const isAllowedEmail = user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isAllowedUid = ADMIN_UID && ADMIN_UID !== 'REPLACE_WITH_ADMIN_UID' ? (user.uid === ADMIN_UID) : false;
    if (!isAllowedEmail && !isAllowedUid) {
      unauthMsg.textContent = 'You are not authorized to view this page.';
      unauthMsg.classList.remove('hidden');
      logoutBtn.classList.remove('hidden');
      loginForm.classList.add('hidden');
      dashboard.classList.add('hidden');
      googleBtn.classList.add('hidden');
      // proactively sign out to prevent lingering session
      await signOut(auth);
      return;
    }

    // authorized
    loginForm.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    dashboard.classList.remove('hidden');
    googleBtn.classList.add('hidden');
    await loadUsers();
  } else {
    // signed out
    loginForm.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    dashboard.classList.add('hidden');
    googleBtn.classList.remove('hidden');
  }
});

async function loadUsers() {
  try {
    usersTableBody.innerHTML = '';
    loading.style.display = 'block';
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    snapshot.forEach(doc => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = doc.id;
      const td2 = document.createElement('td'); td2.textContent = doc.data().email || '';
      const td3 = document.createElement('td'); td3.textContent = JSON.stringify(doc.data());
      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
      usersTableBody.appendChild(tr);
    });
    loading.style.display = 'none';
  } catch (err) {
    loading.style.display = 'none';
    errorBox.textContent = 'Failed to load users: ' + err.message;
    errorBox.classList.remove('hidden');
  }
}
