import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- Firebase Configuration ---
// IMPORTANT: Create a .env.local file in your project root and add your keys.
// Example .env.local file:
// REACT_APP_FIREBASE_API_KEY="your-firebase-api-key"
// REACT_APP_FIREBASE_AUTH_DOMAIN="your-auth-domain"
// ... and so on for all firebase config values
// REACT_APP_GEMINI_API_KEY="your-gemini-api-key"

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const messagesEndRef = useRef(null);

  // State for Firebase services and config validation
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [isConfigValid, setIsConfigValid] = useState(false);

  // --- Initialize Firebase and check config ---
  useEffect(() => {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        const app = initializeApp(firebaseConfig);
        setAuth(getAuth(app));
        setDb(getFirestore(app));
        setIsConfigValid(true);
      } catch (error) {
        console.error("Firebase initialization error:", error);
        setIsConfigValid(false);
      }
    } else {
      setIsConfigValid(false);
    }
  }, []);

  // --- Authentication State Observer ---
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          signInAnonymously(auth).catch((error) => {
            console.error("Error signing in anonymously:", error);
          });
        }
      });
      return () => unsubscribe();
    }
  }, [auth]);

  // --- Firestore Message Listener ---
  useEffect(() => {
    if (db) {
      const q = query(collection(db, 'messages'), orderBy('createdAt'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(msgs);
      }, (error) => {
        console.error("Error fetching messages:", error);
      });
      return () => unsubscribe();
    }
  }, [db]);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, geminiResponse]);

  // --- Send Message Handler ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !db) return;

    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: user.uid,
    });

    setNewMessage('');
  };

  // --- Gemini API Integration ---
  const getGeminiResponse = async (prompt) => {
    const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!geminiApiKey) {
        setGeminiResponse("Error: Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env.local file.");
        return;
    }
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0].text;
        setGeminiResponse(text);
      } else {
        setGeminiResponse(data.error?.message || "Sorry, I couldn't generate a response.");
      }
    } catch (error) {
      console.error("Error fetching Gemini API:", error);
      setGeminiResponse("Sorry, I couldn't generate a response.");
    }
  };

  const handleSummarize = () => {
    const conversation = messages.map(msg => msg.text).join('\n');
    const prompt = `Summarize the following conversation concisely:\n\n${conversation}`;
    getGeminiResponse(prompt);
  };

  const handleSuggestReply = () => {
    if (messages.length === 0) {
        setGeminiResponse("No messages to reply to!");
        return;
    }
    const lastMessage = messages[messages.length - 1].text;
    const prompt = `Based on the last message "${lastMessage}", suggest a short, relevant reply.`;
    getGeminiResponse(prompt);
  };

  // --- Render logic ---
  if (!isConfigValid) {
    return <ConfigErrorMessage />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white">
      <header className="bg-gray-900 p-4 shadow-md flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Real-time Chat</h1>
        <div className="flex gap-2">
          <button onClick={handleSummarize} className="p-2 text-sm bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Summarize</button>
          <button onClick={handleSuggestReply} className="p-2 text-sm bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors">Suggest Reply</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} currentUser={user} />
        ))}
        {geminiResponse && <GeminiMessage text={geminiResponse} onDismiss={() => setGeminiResponse('')} />}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-gray-900 p-4">
        <form onSubmit={sendMessage} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="p-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

function ChatMessage({ message, currentUser }) {
  const { text, uid } = message;
  const messageClass = uid === currentUser?.uid ? 'sent' : 'received';

  return (
    <div className={`flex ${messageClass === 'sent' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md p-3 rounded-lg ${
          messageClass === 'sent'
            ? 'bg-purple-700'
            : 'bg-gray-600'
        }`}
      >
        <p className="break-words">{text}</p>
      </div>
    </div>
  );
}

function GeminiMessage({ text, onDismiss }) {
  return (
    <div className="flex justify-center my-2">
      <div className="relative max-w-md p-3 rounded-lg bg-yellow-600/80 border border-yellow-500">
        <p><strong>Gemini:</strong> {text}</p>
        <button onClick={onDismiss} className="absolute top-1 right-1 text-white text-xs">&times;</button>
      </div>
    </div>
  );
}

function ConfigErrorMessage() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-800 text-white p-4">
            <div className="max-w-2xl p-8 bg-gray-900 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h2>
                <p className="mb-4">
                    Your Firebase or Gemini API keys are missing. The application cannot start without them.
                </p>
                <p className="mb-6">
                    Please create a <code className="bg-gray-700 p-1 rounded">.env.local</code> file in the root of your project and add your configuration details.
                </p>
                <div className="text-left bg-gray-800 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">
                        <code>
                            REACT_APP_FIREBASE_API_KEY="your-firebase-api-key"<br/>
                            REACT_APP_FIREBASE_AUTH_DOMAIN="your-auth-domain"<br/>
                            REACT_APP_FIREBASE_PROJECT_ID="your-project-id"<br/>
                            REACT_APP_FIREBASE_STORAGE_BUCKET="your-storage-bucket"<br/>
                            REACT_APP_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"<br/>
                            REACT_APP_FIREBASE_APP_ID="your-app-id"<br/>
                            REACT_APP_GEMINI_API_KEY="your-gemini-api-key"
                        </code>
                    </pre>
                </div>
                <p className="mt-6 text-gray-400 text-sm">
                    After creating the file, you may need to restart your development server for the changes to take effect.
                </p>
            </div>
        </div>
    );
}

export default App;
