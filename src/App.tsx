// import React, { useState } from 'react';
// import './App.css';

// // Define the type for a message
// interface Message {
//   sender: 'User' | 'AI';
//   text: string;
// }

// const App: React.FC = () => {
//   // State to store messages in the conversation
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState<string>('');

//   // Handle sending a message
//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() === '') return;

//     // Add the user message to the conversation
//     const userMessage: Message = { sender: 'User', text: input };
//     setMessages([...messages, userMessage]);

//     // Clear input field
//     setInput('');

//     // Simulate a response from "AI"
//     simulateAIResponse(input);
//   };

//   // Simulate AI response
//   const simulateAIResponse = (userInput: string) => {
//     setTimeout(() => {
//       const aiMessage: Message = { sender: 'AI', text: `You said: ${userInput}` };
//       setMessages((prevMessages) => [...prevMessages, aiMessage]);
//     }, 1000); // Mock response delay
//   };

//   return (
//     <div className="App">
//       <h1>Privacy Policy Analyzer</h1>

//       <div className="chat-window">
//         {/* Display the conversation */}
//         {messages.map((msg, index) => (
//           <div key={index} className={`message ${msg.sender}`}>
//             <strong>{msg.sender}:</strong> {msg.text}
//           </div>
//         ))}
//       </div>

//       <form onSubmit={handleSend} className="input-form">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type a message..."
//           className="input-field"
//         />
//         <button type="submit" className="send-button">Send</button>
//       </form>
//     </div>
//   );
// };

// export default App;

import React, { useState } from 'react';
import './App.css';

interface Message {
  sender: 'User' | 'AI';
  text: string;
}

// Define categories and descriptions
const categories = [
  { name: "First Party Collection/Use", description: "How and why user data is collected by the service provider." },
  { name: "Third Party Sharing/Collection", description: "Details about sharing or collecting data with/by third parties." },
  { name: "User Choice/Control", description: "Options available to users to manage data use and sharing." },
  { name: "User Access, Edit & Deletion", description: "How users can access, edit, or delete their data." },
  { name: "Data Retention", description: "How long data is kept." },
  { name: "Data Security", description: "Measures taken to protect user data." },
  { name: "Policy Change", description: "How users are informed of policy changes." },
  { name: "Do Not Track", description: "Describes Do Not Track (DNT) signals and their use." },
  { name: "Specific Audiences", description: "Practices for specific groups (e.g., children, Europeans)." },
  { name: "Other", description: "General information or content not fitting other categories." }
];

// Mock categorization function to simulate local AI response
const categorizeText = (text: string): string => {
  for (const category of categories) {
    if (text.toLowerCase().includes(category.name.toLowerCase().split(" ")[0])) {
      return category.name;
    }
  }
  return "Other";
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'User', text: input };
    setMessages([...messages, userMessage]);
    setInput('');

    simulateAIResponse(input);
  };

  const simulateAIResponse = (userInput: string) => {
    // Determine the category for the input text
    const category = categorizeText(userInput);
  
    // Format the categories list with line breaks
    const formattedCategories = categories.map(cat => `- <strong>${cat.name}</strong>: ${cat.description}<br />`).join("");
  
    // Format the full prompt with bold headers and line breaks for each section
    const formattedPrompt = `
      <strong>Task:</strong> Categorize privacy policy text into defined categories.<br /><br />
      <strong>Categories:</strong><br />${formattedCategories}<br />
      <strong>Text:</strong><br />"${userInput}"
    `;
  
    // Create the AI response with category on a separate line
    const aiMessage: Message = { 
      sender: 'AI', 
      text: `<strong>Category:</strong> ${category}<br /><br />${formattedPrompt}`
    };
  
    // Add a delay to simulate processing time
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    }, 1000);
  };    

  return (
    <div className="App">
      <h1>Privacy Policy Analyzer</h1>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <strong>{msg.sender}:</strong>
            <div dangerouslySetInnerHTML={{ __html: msg.text }} />
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a privacy policy sentence..."
          className="input-field"
        />
        <button type="submit" className="send-button">Send</button>
      </form>
    </div>
  );
};

export default App;