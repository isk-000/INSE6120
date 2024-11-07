
import React, { useState } from 'react';
import './App.css';


const App: React.FC = () => {
  // State representing the message that the Model should output
  const [message, setMessage] = useState<string | null>(null);

  /**
   * This function is used as button click handler to start the inference process of the LLM model
   * TODO: This function should be removed/refactored such that the inference is done automatically 
   * When the user opens a web page 
   */
  const handleButtonClick = () => {
    setMessage("This is the AI Model");    
  }

  /**
   * This function is used to return the UI representation of the message to be 
   * displayed
   * @returns The JSX represneting the message
   * TODO: This function should be updated to match the UI
   */
  const getMessageUI = () : JSX.Element => {
    return (
      <div className={`message AI`}>
        <strong>{"AI"}:</strong>
        <div>
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Privacy Policy Analyzer</h1>
      <div className="chat-window">
        {
          message !== null ? getMessageUI() : null
        }
      </div>
      <button type="submit" className="send-button" onClick={handleButtonClick}>Send</button>
    </div>
  );
};


export default App;