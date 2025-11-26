import React from 'react';
import { Translator } from './components/Translator';
import { Mic, ArrowRightLeft } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <header className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full shadow-lg mb-4">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          AI Voice Translator
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Professional translation with deep male voice synthesis (TTS) powered by Gemini.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white/50 py-1.5 px-4 rounded-full mx-auto w-fit mt-4 border border-slate-100 shadow-sm">
             <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
             <span>Click the arrows or "Switch Languages" to toggle direction</span>
        </div>
      </header>

      <main className="w-full max-w-4xl">
        <Translator />
      </main>

      <footer className="mt-16 text-center text-slate-400 text-sm">
        <p>Powered by Google Gemini 2.5 Flash & TTS</p>
      </footer>
    </div>
  );
};

export default App;