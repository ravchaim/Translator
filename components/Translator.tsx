import React, { useState, useRef } from 'react';
import { ArrowRight, Volume2, Loader2, RotateCcw, Copy, Check, Settings2, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { translateText, generateSpeech } from '../services/gemini';
import { decodeAudioData, playAudioBuffer, getAudioContext } from '../services/audioContext';
import { Visualizer } from './Visualizer';
import { Language, PlaybackState } from '../types';

const VOICES = [
  { id: 'Fenrir', label: 'Fenrir (Male)', type: 'Deep' },
  { id: 'Charon', label: 'Charon (Male)', type: 'Deep' },
  { id: 'Puck', label: 'Puck (Male)', type: 'Soft' },
  { id: 'Zephyr', label: 'Zephyr (Female)', type: 'Soft' },
  { id: 'Kore', label: 'Kore (Female)', type: 'Calm' },
];

const LANGUAGES = [
  { value: Language.HEBREW, label: 'Hebrew' },
  { value: Language.ENGLISH, label: 'English' },
  { value: Language.FRENCH, label: 'French' },
  { value: Language.SPANISH, label: 'Spanish' },
];

export const Translator: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  
  // Language State
  const [sourceLang, setSourceLang] = useState<Language>(Language.HEBREW);
  const [targetLang, setTargetLang] = useState<Language>(Language.ENGLISH);
  
  // Audio State
  const [playbackState, setPlaybackState] = useState<Record<string, PlaybackState>>({});

  const activeAudioSource = useRef<{ stop: () => void } | null>(null);
  const activeAnalyser = useRef<AnalyserNode | null>(null);
  const [visActive, setVisActive] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const getDir = (lang: Language) => lang === Language.HEBREW ? 'rtl' : 'ltr';
  const getFont = (lang: Language) => lang === Language.HEBREW ? 'hebrew-text' : 'font-sans';

  // Helper to handle language change from dropdowns
  const handleLanguageChange = (type: 'source' | 'target', value: Language) => {
    if (type === 'source') {
      if (value === targetLang) {
        setTargetLang(sourceLang); // Auto-swap if picking same
      }
      setSourceLang(value);
    } else {
      if (value === sourceLang) {
        setSourceLang(targetLang); // Auto-swap
      }
      setTargetLang(value);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setTranslatedText(''); // Clear previous
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result);
    } catch (e) {
      alert("Failed to translate. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwap = () => {
    // Swap languages
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    
    // Swap text content
    const oldSource = sourceText;
    const oldTranslated = translatedText;
    setSourceText(oldTranslated);
    setTranslatedText(oldSource);

    // Stop audio if playing
    if (activeAudioSource.current) {
        activeAudioSource.current.stop();
        setVisActive(false);
        setPlaybackState({});
    }
  };

  const handlePlay = async (text: string, lang: Language, side: 'source' | 'target') => {
    if (!text.trim()) return;
    
    const playbackKey = `${side}-${lang}`;

    // Stop any currently playing audio
    if (activeAudioSource.current) {
      activeAudioSource.current.stop();
      activeAudioSource.current = null;
      setVisActive(false);
      setPlaybackState({});
      // If we clicked the same button, just toggle off
      if (playbackState[playbackKey] === PlaybackState.PLAYING) {
        return; 
      }
    }

    setPlaybackState({ [playbackKey]: PlaybackState.LOADING });

    try {
      // Ensure context is running
      getAudioContext();

      // Pass selected voice
      const base64Audio = await generateSpeech(text, selectedVoice);
      const audioBuffer = await decodeAudioData(base64Audio);

      setPlaybackState({ [playbackKey]: PlaybackState.PLAYING });
      setVisActive(true);

      const { stop, analyser } = playAudioBuffer(audioBuffer, () => {
        // On Ended
        setPlaybackState({});
        activeAudioSource.current = null;
        setVisActive(false);
      });
      
      activeAudioSource.current = { stop };
      activeAnalyser.current = analyser;

    } catch (e) {
      console.error(e);
      setPlaybackState({});
      alert("Could not generate speech.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    if (activeAudioSource.current) {
        activeAudioSource.current.stop();
    }
    setPlaybackState({});
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Voice Selector Header */}
      <div className="flex justify-between items-center">
        <button 
           onClick={handleSwap}
           className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors md:hidden"
        >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Switch Languages</span>
        </button>

        <div className="ml-auto inline-flex items-center gap-2 bg-white pl-3 pr-4 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
          <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <div className="flex flex-col relative">
             <label htmlFor="voice-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute -top-1.5 left-0">Voice</label>
             <select 
                id="voice-select"
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="appearance-none bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer pt-2 pr-4 focus:ring-0"
             >
                {VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                ))}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        
        {/* SOURCE INPUT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="relative flex items-center">
               <select 
                  value={sourceLang}
                  onChange={(e) => handleLanguageChange('source', e.target.value as Language)}
                  className="appearance-none bg-transparent font-bold text-slate-600 uppercase tracking-wider text-sm focus:outline-none cursor-pointer hover:text-blue-600 transition-colors pr-6 py-1"
               >
                 {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
               </select>
               <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
               <span className="ml-2 text-xs text-slate-400 font-medium">(Source)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => copyToClipboard(sourceText, 'source')}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                title="Copy text"
              >
                 {copied === 'source' ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
              </button>
              {sourceText && (
                <button 
                    onClick={handleClear} 
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                    title="Clear text"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <textarea
            className={`flex-1 w-full p-6 text-xl md:text-2xl text-slate-800 resize-none focus:outline-none focus:bg-slate-50/50 transition-colors ${getFont(sourceLang)}`}
            dir={getDir(sourceLang)}
            placeholder={`Type ${sourceLang} text here...`}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
             <div className="text-xs text-slate-400">
               {sourceText.length} chars
             </div>
             <button
               onClick={() => handlePlay(sourceText, sourceLang, 'source')}
               disabled={!sourceText || playbackState[`source-${sourceLang}`] === PlaybackState.LOADING}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                 playbackState[`source-${sourceLang}`] === PlaybackState.PLAYING
                   ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-2'
                   : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
             >
               {playbackState[`source-${sourceLang}`] === PlaybackState.LOADING ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <Volume2 className={`w-4 h-4 ${playbackState[`source-${sourceLang}`] === PlaybackState.PLAYING ? 'animate-pulse' : ''}`} />
               )}
               {playbackState[`source-${sourceLang}`] === PlaybackState.PLAYING ? 'Playing...' : 'Listen'}
             </button>
          </div>
        </div>

        {/* Action Button Area */}
        {/* Desktop: Translate button in center, Swap button slightly above or separate */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex flex-col gap-4 items-center">
           {/* Swap Toggle */}
           <button 
             onClick={handleSwap}
             className="bg-white hover:bg-slate-50 text-slate-500 p-2 rounded-full shadow-md border border-slate-200 transition-all hover:text-blue-600 mb-16"
             title="Switch Languages"
           >
             <ArrowRightLeft className="w-5 h-5" />
           </button>

           {/* Translate Button */}
           <button 
             onClick={handleTranslate}
             disabled={isTranslating || !sourceText}
             className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-200 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
             title="Translate"
           >
             {isTranslating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
           </button>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="md:hidden flex justify-center gap-4 -my-3 z-10">
           <button 
             onClick={handleTranslate}
             disabled={isTranslating || !sourceText}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
           >
             {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Translate</span>}
           </button>
        </div>

        {/* TARGET OUTPUT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="relative flex items-center">
               <select 
                  value={targetLang}
                  onChange={(e) => handleLanguageChange('target', e.target.value as Language)}
                  className="appearance-none bg-transparent font-bold text-slate-600 uppercase tracking-wider text-sm focus:outline-none cursor-pointer hover:text-blue-600 transition-colors pr-6 py-1"
               >
                 {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
               </select>
               <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
               <span className="ml-2 text-xs text-slate-400 font-medium">(Result)</span>
            </div>

             <button 
                onClick={() => copyToClipboard(translatedText, 'target')}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                title="Copy text"
                disabled={!translatedText}
              >
                 {copied === 'target' ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4"/>}
              </button>
          </div>
          <div 
             className={`flex-1 w-full p-6 text-xl md:text-2xl text-slate-800 bg-slate-50/30 overflow-y-auto ${getFont(targetLang)}`}
             dir={getDir(targetLang)}
          >
            {translatedText ? (
              <p className="leading-relaxed">{translatedText}</p>
            ) : (
              <p className="text-slate-300 italic">Translation will appear here...</p>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 flex justify-end items-center bg-white">
             <button
               onClick={() => handlePlay(translatedText, targetLang, 'target')}
               disabled={!translatedText || playbackState[`target-${targetLang}`] === PlaybackState.LOADING}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                 playbackState[`target-${targetLang}`] === PlaybackState.PLAYING
                   ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2'
                   : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
             >
               {playbackState[`target-${targetLang}`] === PlaybackState.LOADING ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
               ) : (
                 <Volume2 className={`w-4 h-4 ${playbackState[`target-${targetLang}`] === PlaybackState.PLAYING ? 'animate-pulse' : ''}`} />
               )}
               {playbackState[`target-${targetLang}`] === PlaybackState.PLAYING ? 'Playing...' : 'Listen'}
             </button>
          </div>
        </div>
      </div>

      {/* Visualizer Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-all duration-500">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">
                Voice Visualizer <span className="text-blue-500 ml-1">({VOICES.find(v => v.id === selectedVoice)?.label})</span>
            </h3>
            {visActive && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
         </div>
         <Visualizer analyser={activeAnalyser.current} isPlaying={visActive} />
      </div>
    </div>
  );
};