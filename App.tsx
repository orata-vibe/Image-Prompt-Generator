import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptList } from './components/PromptList';
import { generatePromptsFromImage } from './services/geminiService';
import { GithubIcon, SparklesIcon } from './components/Icons';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [identifiedStyle, setIdentifiedStyle] = useState<string | null>(null);
  const [identifiedSubject, setIdentifiedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGeneratePrompts = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrompts([]);
    setIdentifiedStyle(null);
    setIdentifiedSubject(null);

    try {
      const { prompts: generatedPrompts, identifiedStyle: style, identifiedSubject: subject } = await generatePromptsFromImage(imageFile);
      setPrompts(generatedPrompts);
      setIdentifiedStyle(style);
      setIdentifiedSubject(subject);
    } catch (err) {
      console.error(err);
      setError('Failed to generate prompts. The model may be unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);
  
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
      <p className="text-indigo-300 font-medium">Analyzing image and crafting prompts...</p>
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
            <h2 className="text-xl font-semibold text-gray-200">1. Upload Your Reference Image</h2>
            <ImageUploader imageUrl={imageUrl} onImageChange={handleImageChange} disabled={isLoading} />
            <button
              onClick={handleGeneratePrompts}
              disabled={!imageFile || isLoading}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>{isLoading ? 'Generating...' : 'Generate Prompts'}</span>
            </button>
          </div>

          <div className="flex flex-col space-y-6">
            <h2 className="text-xl font-semibold text-gray-200">2. Get Your AI Prompts</h2>
            <div className="bg-gray-800 rounded-lg p-6 min-h-[300px] flex flex-col justify-center border border-gray-700">
              {isLoading && <LoadingSpinner />}
              {error && <p className="text-center text-red-400">{error}</p>}
              {!isLoading && !error && prompts.length === 0 && (
                <p className="text-center text-gray-400">Your generated prompts will appear here.</p>
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