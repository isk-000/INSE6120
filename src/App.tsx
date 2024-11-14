
import React, { useState, useEffect } from 'react';

import { Model } from './model';

import './App.css';
import { Text2TextGenerationOutput } from '@huggingface/transformers';

const App: React.FC = () => {
  // State representing the message that the Model should output
  const [message, setMessage] = useState<string | null>(null);

  //set the enviromnt for the model to work
  // useEffect(() => {
  //   setEnviromnent();
  // }, []);

  /**
   * This function is used as button click handler to start the inference process of the LLM model
   * TODO: This function should be removed/refactored such that the inference is done automatically
   * When the user opens a web page
   */
  const handleButtonClick = async () => {
    let model = await Model.getInstance(()=> {
      setMessage("Model Is running");
    });
    
    const txt = "Can you summarize the following privacy policy: Cookies and Other Tracking Technologies: Atlassian and our third-party partners, such as our advertising and analytics partners, use cookies and other tracking technologies (e.g., web beacons, device identifiers and pixels) to provide functionality and to recognize you across different Services and devices. For more information, please see our Cookies and Tracking Notice, which includes information on how to control or opt out of these cookies and tracking technologies. Please refer to Loom's Cookie Policy for details on cookies and tracking technologies used within Loom products and websites";

    let output = await model(txt, {max_length: 1000}) as Text2TextGenerationOutput;

    setMessage(output[0].generated_text);
    
  }

  /**
   * This function is used to return the UI representation of the message to be
   * displayed
   * @returns The JSX represneting the message
   * TODO: This function should be updated to match the UI
   */
  const getMessageUI = (): JSX.Element => {
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