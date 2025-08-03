# Chat-App
A modern, real-time chat application that allows users to communicate instantly. This project is built with React for the frontend and uses Firebase for backend services, including authentication and a real-time database.
## Features

-   **Real-time Messaging:** Messages are sent and received instantly without needing to refresh the page, powered by Cloud Firestore.
-   **User Authentication:** Implements a simple anonymous sign-in flow with Firebase Authentication so each user has a unique temporary ID.
-   **Clean, Modern UI:** A responsive and user-friendly interface built with React and styled with Tailwind CSS.
-   **Scroll-to-Bottom:** The chat view automatically scrolls to the latest message.
-   **Scalable Backend:** Leverages the power and scalability of Google's Firebase platform.

## Technology Stack

-   **Frontend:** React, Tailwind CSS
-   **Backend & Database:** Firebase (Firestore & Authentication)

## Setup and Usage

To run this project locally, you will need Node.js, npm, and a Firebase project.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Anjali-Ajesh/react-chat-app.git](https://github.com/Anjali-Ajesh/react-chat-app.git)
    cd react-chat-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set Up Firebase:**
    * Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    * Add a new **Web App** to your project and copy the `firebaseConfig` object.
    * In the Firebase console, enable **Cloud Firestore** and **Firebase Authentication** (make sure to enable the "Anonymous" sign-in method).

4.  **Environment Variables:**
    * Create a file named `.env.local` in the project's root directory.
    * Add your Firebase configuration details to this file:
        ```
        REACT_APP_FIREBASE_API_KEY="your-api-key"
        REACT_APP_FIREBASE_AUTH_DOMAIN="your-auth-domain"
        REACT_APP_FIREBASE_PROJECT_ID="your-project-id"
        REACT_APP_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
        REACT_APP_FIREBASE_APP_ID="your-app-id"
        ```

5.  **Run the Application:**
    Start the development server:
    ```bash
    npm start
    ```
    The app will be available at `http://localhost:3000`. Open multiple browser tabs to simulate a conversation between different users.
