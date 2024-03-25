

// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics ,logEvent } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBj68srU6Q4hxlNQFXXN76Et4fKJ3ISIAU",
    authDomain: "strangerchat-367db.firebaseapp.com",
    projectId: "strangerchat-367db",
    storageBucket: "strangerchat-367db.appspot.com",
    messagingSenderId: "967879070111",
    appId: "1:967879070111:web:ab9eb1f59f279dd3276daa",
    measurementId: "G-1H765TRQ6W"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get the Firebase Analytics instance
const analytics = getAnalytics(app);
logEvent(analytics, 'goal_completion', { name: 'done'});

export { analytics,logEvent }; // Export the analytics object for use in other modules
