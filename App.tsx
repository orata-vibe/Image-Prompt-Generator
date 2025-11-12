import React, { useState, useCallback, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptList } from './components/PromptList';
import { generatePromptsFromImage } from './services/geminiService';
import { GithubIcon, SparklesIcon, KeyIcon } from './components/Icons';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');
  const [imageDescription, setImageDescription] = useState<string>('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptCount, setPromptCount] = useState<number>(5);
  const [identifiedStyle, setIdentifiedStyle] = useState<string | null>(null);
  const [identifiedSubject, setIdentifiedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const generationAbortController = useRef<AbortController | null>(null);


  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setPrompts([]);
    setIdentifiedStyle(null);
    setIdentifiedSubject(null);
    setError(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageUrl(null);
    }
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKey = e.target.value;
      setApiKey(newKey);
      localStorage.setItem('gemini-api-key', newKey);
  }

  const handleGeneratePrompts = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    if (!apiKey) {
      setError('Please enter your Google Gemini API key.');
      return;
    }
    
    generationAbortController.current = new AbortController();
    const signal = generationAbortController.current.signal;

    setIsLoading(true);
    setError(null);
    setPrompts([]);
    setIdentifiedStyle(null);
    setIdentifiedSubject(null);

    try {
        const totalBatches = Math.ceil(promptCount / 5);
        let accumulatedPrompts: string[] = [];

        for (let i = 0; i < totalBatches; i++) {
            if (signal.aborted) {
                console.log("Generation aborted by user.");
                break;
            }
            const currentBatch = i + 1;
            const promptsToGenerate = Math.min(5, promptCount - accumulatedPrompts.length);
            if (promptsToGenerate <= 0) break;

            setLoadingStatus(`Generating ${accumulatedPrompts.length + promptsToGenerate} of ${promptCount}...`);
            
            const existingPrompts = i === 0 ? undefined : accumulatedPrompts;
            const { prompts: newPrompts, identifiedStyle: style, identifiedSubject: subject } = await generatePromptsFromImage(imageFile, apiKey, promptsToGenerate, existingPrompts, imageDescription);

            if (i === 0) {
                setIdentifiedStyle(style);
                setIdentifiedSubject(subject);
            }
            
            accumulatedPrompts = [...accumulatedPrompts, ...newPrompts];
            setPrompts(prev => [...prev, ...newPrompts]);
        }
    } catch (err) {
      console.error(err);
      if ((err as Error).name !== 'AbortError') {
        setError('Failed to generate prompts. Check your API key or try again later.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, [imageFile, apiKey, promptCount, imageDescription]);
  
  const handleCancel = () => {
    if (generationAbortController.current) {
      generationAbortController.current.abort();
    }
    setIsLoading(false);
    setLoadingStatus('');
  }

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
      <p className="text-indigo-300 font-medium">{loadingStatus || 'Analyzing image and crafting prompts...'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl flex justify-between items-center pb-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Image-to-Prompt Generator
          </h1>
        </div>
        <a 
          href="https://github.com/google/labs-prototypes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="View source on GitHub"
        >
          <GithubIcon className="w-7 h-7" />
        </a>
      </header>

      <main className="w-full max-w-5xl flex-grow mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-6">
             <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4">1. Configure Your API Key</h2>
               <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="w-5 h-5 text-gray-400" />
                </div>
                 <input
                     id="api-key-input"
                     type="password"
                     value={apiKey}
                     onChange={handleApiKeyChange}
                     placeholder="Enter your Google Gemini API Key"
                     className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                     disabled={isLoading}
                     aria-label="Google Gemini API Key"
                 />
               </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4">2. Upload Your Image</h2>
              <ImageUploader imageUrl={imageUrl} onImageChange={handleImageChange} disabled={isLoading} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4">3. Describe Your Image (Optional)</h2>
                <textarea
                    id="image-description"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="e.g., 'A logo for a coffee shop', 'Focus on the character's sad expression'..."
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isLoading}
                    aria-label="Image Description"
                />
            </div>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
               <h2 className="text-xl font-semibold text-gray-200">4. Generate</h2>
                <div className="flex items-center gap-4">
                    <label htmlFor="prompt-count" className="text-gray-300 font-medium whitespace-nowrap">Number of Prompts:</label>
                    <span className="font-bold text-indigo-400 w-12 text-center">{promptCount}</span>
                </div>
                 <input
                    id="prompt-count"
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={promptCount}
                    onChange={(e) => setPromptCount(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
            
            {isLoading ? (
                <button
                    onClick={handleCancel}
                    className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                >
                    <span>{loadingStatus || 'Generating...'}</span>
                </button>
            ) : (
                <button
                  onClick={handleGeneratePrompts}
                  disabled={!imageFile || !apiKey}
                  className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate Prompts</span>
                </button>
            )}
            
          </div>

          <div className="flex flex-col space-y-6">
            <h2 className="text-xl font-semibold text-gray-200">5. Get Your AI Prompts</h2>
            <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] flex flex-col justify-start border border-gray-700">
              {isLoading && prompts.length === 0 && <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
              {error && <p className="text-center text-red-400 pt-4">{error}</p>}
              {!isLoading && !error && prompts.length === 0 && (
                <p className="text-center text-gray-400 flex-grow flex items-center justify-center">Your generated prompts will appear here.</p>
              )}
              {prompts.length > 0 && (
                <>
                  {(identifiedSubject || identifiedStyle) && (
                    <div className="mb-4 flex flex-wrap justify-center items-center gap-2 text-center">
                      {identifiedSubject && (
                         <div>
                            <span className="text-gray-400 text-sm">Subject: </span>
                            <span className="font-semibold text-teal-300 bg-teal-900/50 px-3 py-1 rounded-full text-sm">
                                {identifiedSubject}
                            </span>
                         </div>
                      )}
                      {identifiedStyle && (
                        <div>
                            <span className="text-gray-400 text-sm">Style: </span>
                            <span className="font-semibold text-indigo-300 bg-indigo-900/50 px-3 py-1 rounded-full text-sm">
                                {identifiedStyle}
                            </span>
                        </div>
                      )}
                    </div>
                  )}
                  <PromptList prompts={prompts} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-5xl text-center text-gray-500 mt-12 text-sm">
        <p>Built with React, Tailwind CSS, and the Google Gemini API.</p>
      </footer>
    </div>
  );
}
