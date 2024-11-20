import React, { useState, useEffect, useRef } from "react";
import { Model } from "./model";
import "./App.css";
import { Text2TextGenerationOutput } from "@huggingface/transformers";
import { Oval, ThreeDots } from "react-loading-icons";
import axios from "axios";
import * as cheerio from "cheerio";

const App: React.FC = () => {
  const [message, setMessage] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [showAcceptReject, setShowAcceptReject] = useState(false);
  const [loadingText, setLoadingText] = useState<string>("Analyzing Page...");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [cachedPolicy, setCachedPolicy] = useState<string | null>(null); // Cache for scraped text
  const [currentUrl, setCurrentUrl] = useState<string>("");

  const getAndUpdateURL = () => {
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
        } else {
          console.error("Could not retrieve the current tab's URL.");
        }
      });
    } else {
      console.error("Chrome Tabs API is unavailable.");
    }
  }

  useEffect(() => {
    handleInference();
  }, [currentUrl]);


  useEffect(() => {
    getAndUpdateURL();
  }, []);

  const scrapePrivacyPolicy = async (pageUrl: string): Promise<string> => {
    try {
      const response = await axios.get(pageUrl, { responseType: "text" });
      const $ = cheerio.load(response.data);

      const possibleSelectors = [
        'div[id*="privacy"]',
        'div[class*="privacy"]',
        'a[href*="privacy"]',
        'section:contains("Privacy Policy")',
        'p:contains("This Privacy Policy")',
      ];

      for (const selector of possibleSelectors) {
        const element = $(selector);
        if (element.length) {
          return element.text().trim();
        }
      }
      return "Privacy policy content could not be located.";
    } catch (error) {
      console.error("Error scraping privacy policy:", error);
      return "Failed to scrape privacy policy. Please check the URL.";
    }
  };


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
    setLoadingText("Scraping and Analyzing Page...");

    try {
      if (!currentUrl) {
        setMessage("No URL detected. Please ensure you are on a valid webpage.");
        setMessage("URL " + currentUrl)
        setShowContinue(true);
        return;
      }

      // Check Cache First
      let privacyPolicyText = cachedPolicy;
      if (!privacyPolicyText) {
        privacyPolicyText = await scrapePrivacyPolicy(currentUrl);
        setCachedPolicy(privacyPolicyText); // Cache the result
      }

      if (privacyPolicyText.startsWith("Failed")) {
        setMessage(privacyPolicyText);
        setShowContinue(true);
        return;
      }

      setMessage("Privacy Policy Text Scraped. Processing...");
      setMessage(privacyPolicyText)
      setLoadingText("Running Inference...");

      let model = await Model.getInstance(
        () => {
          if (signal.aborted) throw new Error("Inference was cancelled");
        },
        signal
      );

      if (!isCancelled) {
        const output = await model(privacyPolicyText, { max_length: 1000 });
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
        setMessage("Error occurred during the process.");
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
