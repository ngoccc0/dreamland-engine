"use client";
import React, { useState } from 'react';

export default function NarrativePreviewPage() {
  const [lang, setLang] = useState('en');
  const [seed, setSeed] = useState('demo-seed');
  const [persona, setPersona] = useState('p_neutral');
  const [result, setResult] = useState<string | null>(null);
  const personas = [
    { id: 'p_neutral', name: 'Neutral Traveler' },
    { id: 'p_sarcastic', name: 'Sarcastic Wanderer' },
    { id: 'p_thoughtful', name: 'Thoughtful Seeker' },
  ];

  async function generate() {
    const res = await fetch(`/api/narrative-preview?seed=${encodeURIComponent(seed)}&lang=${encodeURIComponent(lang)}&persona=${encodeURIComponent(persona)}`);
    const j = await res.json();
    setResult(j.text + '\n\n' + JSON.stringify(j.meta, null, 2));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Narrative Preview</h1>
      <div className="mt-4">
        <label className="mr-2">Lang</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </div>
      <div className="mt-4">
        <label className="mr-2">Seed</label>
        <input value={seed} onChange={(e) => setSeed(e.target.value)} />
      </div>
      <div className="mt-4">
        <label className="mr-2">Persona voice</label>
        <select value={persona} onChange={(e) => setPersona(e.target.value)}>
          {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="mt-4">
        <button onClick={generate} className="px-3 py-2 bg-blue-600 text-white rounded">Generate</button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded">{result}</pre>
    </div>
  );
}
