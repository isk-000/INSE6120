import React, { useState, useEffect, useRef } from "react";
import { SummarizationOutput, TextClassificationOutput } from "@huggingface/transformers";
import { Oval, ThreeDots } from "react-loading-icons";
import GaugeChart from "react-gauge-chart";
import axios from "axios";
import * as cheerio from "cheerio";

import { Model } from "./model";
import { HTTP_URL, USE_HTTP_REQUEST } from "./settings";
import { HTTPResponse, MatchedElement, GenericObject } from "./helperInterface";
import { scorePrompt, summaryPrompt, CATEGORIES_MAPPING, CATEGORY_TO_EMOJI } from "./constants";

import "./App.css";

const App: React.FC = () => {
  const [message, setMessage] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryValues, setCategorValues] = useState<number[]>([]);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [showAcceptReject, setShowAcceptReject] = useState(false);
  const [loadingText, setLoadingText] = useState<string>("Analyzing Page...");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [cachedPolicy, setCachedPolicy] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);


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
  };

  useEffect(() => {
    getAndUpdateURL();
  }, []);

  useEffect(() => {
    if (currentUrl) {
      handleInference();
    }
  }, [currentUrl]);

  const handleCancelingModelInference = (signal: AbortSignal) => {
    if (signal.aborted) throw new Error("Inference was cancelled");
  };

  const findPrivacyPolicyLink = async (pageUrl: string): Promise<string> => {
    try {
      const response = await axios.get(pageUrl, { responseType: "text" });
      const $ = cheerio.load(response.data);

      const linkSelectors = [
        "footer a[href*='privacy']",
        "a:contains('Privacy Policy')",
        "a:contains('privacy')",
        "a:contains('Privacy Notice')",
        "a:contains('Privacy')",
        "a:contains('data protection')",
      ];

      for (const selector of linkSelectors) {
        const link = $(selector).attr("href");
        if (link) {
          return link.startsWith("http") ? link : new URL(link, pageUrl).href;
        }
      }

      return "Privacy policy link not found.";
    } catch (error) {
      console.error("Error finding privacy policy link:", error);
      return "Failed to find privacy policy link.";
    }
  };

  const splitText = (text: string, maxLength: number = 512) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]; // Split into sentences
    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }


  const scrapePrivacyPolicy = async (pageUrl: string): Promise<{
    concatenatedText: string;
    matchedElements: MatchedElement[];
  }> => {
    try {
      const response = await axios.get(pageUrl, { responseType: "text" });
      const $ = cheerio.load(response.data);

      const possibleSelectors = [
        'div[id*="privacy"]',
        'div[class*="privacy"]',
        'a[href*="privacy"]',
        'section:contains("Privacy Policy")',
        'p:contains("This Privacy Policy")',
        'p:contains("Account Information.")',
        'p:contains("Account Information.")',
        'p:contains("privacy")',
        'p:contains("personal data")',
        'p:contains("parties")',
        'p:contains("personal information")',
        'p:contains("collect information")',
        'p:contains("IP address")',
        'p:contains("use the information")',
        'p:contains("cookies")',
        'h2[id*="privacy"]',
        'h2:contains("Privacy Policy")',
        'h2:contains("Plain English Privacy Policy")',
        'h1:contains("Privacy Policy")',
        'h1:contains("Privacy Statement")',
        'p[class*="text"]:contains("Privacy Policy")',
        'p[class*="privacy"]',
        'p:contains("Privacy Policy")',
        'meta[name="description"][content*="Privacy policy"]',
        'title:contains("Privacy Policy")',
        'title:contains("Privacy policy")',
        '#privacy-policy + p',
        '#information_you_provide + p',
      ];

      const relevantText: MatchedElement[] = [];


      possibleSelectors.forEach((selector) => {
        $(selector).each((_, element) => {
          const text = $(element).text().trim();
          if (text) {
            relevantText.push({
              selector,
              content: text,
            });
          }
        });
      });

      const concatenatedText = relevantText
        .map((entry) => `${entry.content}`)
        .join("\n\n");

      return {
        concatenatedText: concatenatedText || "No relevant content found.",
        matchedElements: relevantText,
      };
    } catch (error) {
      console.error("Error scraping privacy policy:", error);
      return {
        concatenatedText: "Failed to scrape privacy policy. Please check the URL.",
        matchedElements: [],
      };
    }
  };

  const handleInference = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    setIsLoading(true);
    setIsCancelled(false);
    setShowContinue(false);
    setShowAcceptReject(false);
    setMessage(
      <div className="loading-icon">
        <ThreeDots stroke="#4fa94d" fill="transparent" width={50} height={10} />
      </div>
    );
    setLoadingText("Finding Privacy Policy Link...");

    try {
      if (!currentUrl) {
        setMessage("No URL detected. Please ensure you are on a valid webpage.");
        setShowContinue(true);
        return;
      }

      // Step 1: Find Privacy Policy link
      const privacyPolicyLink = await findPrivacyPolicyLink(currentUrl);

      if (privacyPolicyLink.startsWith("Failed") || privacyPolicyLink.includes("not found")) {
        setMessage(privacyPolicyLink);
        setShowContinue(true);
        return;
      }

      console.log("Privacy Policy Link Found:", privacyPolicyLink);
      setLoadingText("Scraping Privacy Policy Content...");

      // Step 2: Scrape the content of the Privacy Policy
      const { concatenatedText, matchedElements } = await scrapePrivacyPolicy(
        privacyPolicyLink
      );

      if (concatenatedText.startsWith("Failed")) {
        setMessage(concatenatedText);
        setShowContinue(true);
        return;
      }

      setMessage("Privacy Policy Text Detected. Processing...");
      console.log("Matched Elements:", matchedElements);
      setLoadingText("Analyzing ...");

      let generatedText = "";
      let responseFinalScore = -1;
      let categories: string[] = []
      let responseScores: number[] = []

      // Step 3: Prompt engineering for AI model
      const prompt = summaryPrompt(concatenatedText);

      if (USE_HTTP_REQUEST === false) {
        const summaryModel = await Model.getSummaryInstance(
          () => handleCancelingModelInference(signal),
          signal
        );

        const scoreModel = await Model.getScoringInstance(
          () => handleCancelingModelInference(signal),
          signal
        );

        if (!isCancelled) {
          const output = await summaryModel(concatenatedText);

          generatedText = (output as SummarizationOutput)[0]?.summary_text as string;
          const inputText = scorePrompt(concatenatedText);

          const response = await scoreModel(inputText, {
            top_k: 50,        // Top-k sampling
          }) as TextClassificationOutput;

          categories = response.map((responseValue) => CATEGORIES_MAPPING[responseValue.label])
          responseScores = response.map((responseValue) => 1 + (responseValue.score * 4))
          responseFinalScore = responseScores.reduce((acc, value) => acc + value) / responseScores.length;

        }
      }
      else {
        let rawResponse = await fetch(HTTP_URL, {
          method: "POST",
          signal: signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ "privacy_policy": prompt })
        });

        let response: HTTPResponse = await rawResponse.json();
        generatedText = response.analysis;
      }
      
      generatedText = generatedText.replace(/\bwe\b/gi, "They");
      generatedText = generatedText.replace(/\bour\b/gi, "there");
      
      setMessage(generatedText || "No output was generated.");
      setScore(Math.round(responseFinalScore));
      setCategories(categories)
      setCategorValues(responseScores)

      setShowAcceptReject(true);// Show Accept/Reject buttons after inference completes
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error";
      console.error("Error during inference:", errorMessage);
      setMessage("Error occurred during the process.");
      setMessage((error as Error)?.message);
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
      {categories.length !== 0 ? getCategoriesUI() : null}
    </div>
  );

  const getCategoriesUI = (): JSX.Element => {
    return (<>
      <br />
      <div>
        <b>Catgories:</b>
      </div>
      <ul>
        {categories.map((category: string, index: number) => {
          return (<li>{category} : {CATEGORY_TO_EMOJI[Math.round(categoryValues[index])]}</li>);
        })}
      </ul>

    </>
    );
  };

  return (
    <div className="App">
      <h1>Privacy Policy Analyzer</h1>

      {score !== null && (
        <div style={{ width: "50%", margin: "0 auto" }}>
          <GaugeChart
            id="gauge-chart"
            nrOfLevels={5}
            colors={["#FF5F6D", "#FFC371", "#FFEB3B", "#76C7C0", "#00C49F"]}
            hideText={true}
            textColor="#000"
            needleColor="#464A4F"
            percent={score / 5}
          />
          <h2 style={{ textAlign: "center" }}>{score.toFixed(1)} / 5</h2>
        </div>
      )}

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
