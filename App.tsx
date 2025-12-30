
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateAIImage, editAIImage } from './services/gemini';
import { GeneratedImage, AspectRatio, StylePreset, ModelTier } from './types';
import { ASPECT_RATIOS, STYLE_PRESETS } from './constants';
import { Button } from './components/Button';

// Extend window for AI Studio API
// Fix: All declarations of 'aistudio' must have identical modifiers.
// Property 'aistudio' must be of type 'AIStudio'.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(STYLE_PRESETS[0]);
  const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.STANDARD);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const historyEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleModelChange = async (tier: ModelTier) => {
    if (tier === ModelTier.PRO) {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // After returning from key selection, we proceed as if key is selected per instructions
        }
      }
    }
    setModelTier(tier);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const fullPrompt = `${prompt}${selectedStyle.promptSuffix}`;
      const result = await generateAIImage(fullPrompt, {
        aspectRatio,
        modelTier
      });
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        aspectRatio,
        model: modelTier
      };
      
      setHistory(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("Pro model access requires a valid API key. Re-selecting key...");
        if (typeof window.aistudio !== 'undefined') {
          await window.aistudio.openSelectKey();
        }
      } else {
        setError(err.message || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (!editingImage || !editPrompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await editAIImage(editingImage.url, editPrompt, modelTier);
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.imageUrl,
        prompt: editPrompt,
        timestamp: Date.now(),
        aspectRatio: editingImage.aspectRatio as AspectRatio,
        model: modelTier
      };
      
      setHistory(prev => [newImage, ...prev]);
      setEditingImage(null);
    } catch (err: any) {
      setError(err.message || "Failed to edit image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Luminary AI</h1>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => handleModelChange(ModelTier.STANDARD)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${modelTier === ModelTier.STANDARD ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Flash (Fast)
            </button>
            <button
              onClick={() => handleModelChange(ModelTier.PRO)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${modelTier === ModelTier.PRO ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Pro (High Quality)
            </button>
          </div>
          {modelTier === ModelTier.PRO && (
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Billing Setup Guide
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-slate-800 p-6 space-y-8 overflow-y-auto bg-slate-900/50">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${aspectRatio === ratio.value ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Art Style</label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all ${selectedStyle.id === style.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <img src={style.previewUrl} alt={style.name} className="w-full h-20 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">{style.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
             <h3 className="text-sm font-bold text-slate-200 mb-2">Instructions</h3>
             <ul className="text-xs text-slate-400 space-y-2">
               <li>• Use descriptive prompts (e.g., "A neon cat in space")</li>
               <li>• Switch to Pro for 1K resolution</li>
               <li>• Select an image to edit it</li>
             </ul>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-4 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto hover:text-rose-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {history.length === 0 && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
                <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-200 mb-2">No generations yet</h2>
              <p className="text-slate-500 max-w-md">Start your creative journey by typing a prompt below. Your generated images will appear here.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
            {isGenerating && (
              <div className="aspect-square bg-slate-900 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center text-center p-6 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-300 font-medium">AI is dreaming...</p>
                <p className="text-slate-500 text-xs mt-2">This might take up to 20 seconds for Pro models</p>
              </div>
            )}
            
            {history.map((item) => (
              <div key={item.id} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
                <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-white text-xs font-medium line-clamp-2 mb-3 leading-relaxed">{item.prompt}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 py-1.5 text-xs" onClick={() => setEditingImage(item)}>
                      Edit
                    </Button>
                    <Button variant="secondary" className="flex-1 py-1.5 text-xs" onClick={() => downloadImage(item.url, item.id)}>
                      Save
                    </Button>
                  </div>
                </div>
                {item.model === ModelTier.PRO && (
                  <div className="absolute top-2 right-2 bg-amber-500/90 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    Pro
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={historyEndRef} />
        </div>

        {/* Floating Input Panel */}
        <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-40">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative bg-slate-900 rounded-2xl border border-slate-800 p-2 flex items-center gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Describe your vision (e.g. 'A futuristic city in the clouds at sunset')..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 px-4 py-3"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  className="px-6 py-3 min-w-[120px]"
                >
                  Generate
                </Button>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">
              Style: {selectedStyle.name} • Format: {aspectRatio} • {modelTier === ModelTier.PRO ? 'High Res (1K)' : 'Flash Fast'}
            </p>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">AI Image Editor</h3>
              <button onClick={() => setEditingImage(null)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-start">
                <img src={editingImage.url} className="w-32 h-32 rounded-xl object-cover border border-slate-800" />
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Original Prompt</label>
                  <p className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 line-clamp-3">
                    {editingImage.prompt}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 italic">What changes would you like to make?</label>
                <textarea
                  id="edit-prompt"
                  autoFocus
                  placeholder="Example: 'Make the sky purple and add a neon hummingbird next to the flower'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[100px]"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setEditingImage(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const val = (document.getElementById('edit-prompt') as HTMLTextAreaElement).value;
                    handleEdit(val);
                  }} 
                  isLoading={isGenerating}
                  className="flex-1"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
              <span>Uses existing image context</span>
              <span>Model: {modelTier}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
