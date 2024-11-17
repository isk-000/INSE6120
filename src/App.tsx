import React, { useState, useEffect, useRef } from 'react';
import { Model } from './model';
import './App.css';
import { Text2TextGenerationOutput } from '@huggingface/transformers';
import { Oval, ThreeDots } from 'react-loading-icons';

const App: React.FC = () => {
  const [message, setMessage] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [showAcceptReject, setShowAcceptReject] = useState(false);
  const [loadingText, setLoadingText] = useState<string>("Analyzing Page...");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleUrlChange = () => {
      handleInference();
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    handleInference(); // Trigger inference on initial load

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleInference = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    // Reset States
    setIsLoading(true);
    setIsCancelled(false);
    setShowContinue(false);
    setShowAcceptReject(false);
    setMessage(
      <div className="loading-icon">
        <ThreeDots stroke="#4fa94d" fill="transparent" width={50} height={10} />
      </div>
    );
    setLoadingText("Analyzing Page...");

    try {
      let model = await Model.getInstance(
        () => {
          if (signal.aborted) throw new Error("Inference was cancelled");
        },
        signal
      );

      const txt = "Can you summarize the following privacy policy: Cookies and Other Tracking Technologies: Atlassian and our third-party partners, such as our advertising and analytics partners, use cookies and other tracking technologies (e.g., web beacons, device identifiers and pixels) to provide functionality and to recognize you across different Services and devices. For more information, please see our Cookies and Tracking Notice, which includes information on how to control or opt out of these cookies and tracking technologies. Please refer to Loom's Cookie Policy for details on cookies and tracking technologies used within Loom products and websites";

      if (!isCancelled) {
        const output = await model(txt, { max_length: 1000 });
        const generatedText = (output as Text2TextGenerationOutput)[0]?.generated_text;
        setMessage(generatedText || "No output was generated.");
        setShowAcceptReject(true); // Show Accept/Reject buttons after inference completes
      }
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error";
      if (errorMessage === "Inference was cancelled") {
        setMessage("Inference cancelled");
      } else {
        console.error("Error during inference:", errorMessage);
      }
    } finally {
      setIsLoading(false);
      if (isCancelled) {
        setShowContinue(true);
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsCancelled(true);
    setIsLoading(false);
    setShowContinue(true);
    setLoadingText("Inference cancelled");
  };

  const handleContinue = () => {
    setIsCancelled(false);
    setShowContinue(false);
    handleInference();
  };

  const handleAccept = () => {
    window.close(); // Close extension popup
  };

  const handleReject = () => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id !== undefined) {
          chrome.tabs.remove(tabs[0].id); // Close the current active tab
        } else {
          console.error("No active tab found.");
        }
      });
    } else {
      console.error("Chrome Tabs API is unavailable.");
      alert("Please close this tab manually.");
    }
  };   

  const getMessageUI = (): JSX.Element => (
    <div className={`message AI`}>
      <strong>{"AI"}:</strong>
      <div>{message}</div>
    </div>
  );

  return (
    <div className="App">
      <h1>Privacy Policy Analyzer</h1>

      <div className="chat-window">
        {message !== null ? getMessageUI() : null}
      </div>

      {(isLoading || isCancelled) && (
        <div className="loading-container">
          <div className="loading-content">
            {isLoading && (
              <>
                <Oval stroke="#4fa94d" fill="transparent" width={40} height={40} />
                <p className="loading-message">{loadingText}</p>
              </>
            )}
            {isCancelled && !isLoading && (
              <p className="loading-message">{loadingText}</p>
            )}
          </div>
          {isLoading && !isCancelled && (
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          )}
          {showContinue && !isLoading && (
            <button type="button" className="continue-button" onClick={handleContinue}>
              Continue
            </button>
          )}
        </div>
      )}

      {showAcceptReject && !isLoading && (
        <div className="action-buttons">
          <button type="button" className="accept-button" onClick={handleAccept}>
            Accept
          </button>
          <button type="button" className="reject-button" onClick={handleReject}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
