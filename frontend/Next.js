'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('Naia');
  const [batchSize, setBatchSize] = useState(5);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const startBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Bitte lade ein Produktfoto hoch.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);
    formData.append('batch_size', batchSize.toString());

    setStatus('Sende Auftrag an Backend...');

    try {
      const res = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setJobId(data.job_id);
      setStatus('Job gestartet! ID: ' + data.job_id);
      pollStatus(data.job_id);
    } catch (error) {
      console.error(error);
      setStatus('Fehler beim Starten des Jobs.');
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/api/status/${id}`);
      const data = await res.json();
      
      if (data.status === 'completed') {
        setStatus(`Fertig! Download Link: ${data.download_url}`);
        clearInterval(interval);
      } else {
        setStatus(`Status: ${data.status} - ${data.progress || 'Warte...'}`);
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 tracking-tight">AI Batch Studio</h1>
        
        <form onSubmit={startBatch} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Produktbild (Referenz)</label>
            <input 
              type="file" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select 
                value={modelName} 
                onChange={(e) => setModelName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-black focus:border-black"
              >
                <option value="Naia">Naia (Default)</option>
                <option value="Liam">Liam</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Bilder pro Produkt</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={batchSize} 
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-black text-white font-semibold py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Batch Run starten
          </button>
        </form>

        {status && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm font-mono">{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}
