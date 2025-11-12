
import React, { useState } from 'react';
import { CopyIcon, CheckIcon, ClipboardListIcon } from './Icons';

interface PromptListProps {
  prompts: string[];
}

const PromptCard: React.FC<{ prompt: string; index: number; onCopy: (text: string) => void; isCopied: boolean }> = ({ prompt, index, onCopy, isCopied }) => {
  return (
    <div className="bg-gray-700/50 p-4 rounded-lg flex items-start gap-4 transition-all duration-300">
      <span className="text-indigo-400 font-bold text-lg">{index + 1}.</span>
      <p className="flex-1 text-gray-300 text-sm">{prompt}</p>
      <button
        onClick={() => onCopy(prompt)}
        className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-all"
        aria-label="Copy prompt"
      >
        {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

export const PromptList: React.FC<PromptListProps> = ({ prompts }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState<boolean>(false);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setAllCopied(false);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allPromptsText = prompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
    navigator.clipboard.writeText(allPromptsText);
    setAllCopied(true);
    setCopiedIndex(null);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {prompts.map((prompt, index) => (
          <PromptCard 
            key={index} 
            prompt={prompt} 
            index={index}
            onCopy={(text) => handleCopy(text, index)}
            isCopied={copiedIndex === index}
          />
        ))}
      </div>
       <button
        onClick={handleCopyAll}
        className="w-full flex items-center justify-center gap-3 bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 transition-all duration-300"
      >
        {allCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardListIcon className="w-5 h-5" />}
        <span>{allCopied ? 'All Copied!' : 'Copy All Prompts'}</span>
      </button>
    </div>
  );
};
