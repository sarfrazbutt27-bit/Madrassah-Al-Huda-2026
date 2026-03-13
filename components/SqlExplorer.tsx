
import React, { useState } from 'react';
import { Database, Play, AlertCircle, Table, Code, Save, Trash2, RefreshCw } from 'lucide-react';

const SqlExplorer: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM students LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (result.success) {
        setResults(Array.isArray(result.data) ? result.data : [result.data]);
        if (!history.includes(query)) {
          setHistory([query, ...history].slice(0, 10));
        }
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tables = [
    'students', 'users', 'grades', 'attendance', 'teacher_attendance', 
    'waitlist', 'class_configs', 'participation_records', 'homework', 
    'homework_submissions', 'curricula', 'resources', 'messages', 
    'whatsapp_logs', 'quiz_results', 'homework_assignments', 
    'homework_quiz_questions', 'homework_attempts', 'homework_attempt_answers', 
    'homework_teacher_ratings', 'homework_reports', 'tajweed_practice', 
    'library_resources'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-madrassah-950 text-white rounded-2xl shadow-lg">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-madrassah-950 uppercase italic tracking-tight">SQL Explorer</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Direkter Datenbank-Zugriff via SQL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Tables & History */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Table size={14} /> Tabellen
              </h3>
              <div className="flex flex-wrap gap-2">
                {tables.map(t => (
                  <button 
                    key={t}
                    onClick={() => setQuery(`SELECT * FROM ${t} LIMIT 10;`)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-madrassah-950 hover:text-white border border-gray-100 rounded-xl text-[9px] font-black uppercase transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Code size={14} /> Verlauf
                </h3>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => setQuery(h)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-[9px] font-mono truncate"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Area: Editor & Results */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-48 p-6 bg-madrassah-950 text-emerald-400 font-mono text-sm rounded-[2rem] border-4 border-madrassah-900 shadow-inner outline-none focus:border-emerald-500/30 transition-all"
                placeholder="Geben Sie hier Ihre SQL-Abfrage ein..."
              />
              <button 
                onClick={runQuery}
                disabled={loading}
                className="absolute bottom-6 right-6 bg-emerald-500 text-madrassah-950 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                Abfrage ausführen
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4 text-red-600">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">SQL Fehler</p>
                  <p className="text-xs font-medium italic">{error}</p>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-madrassah-950">Ergebnisse ({results.length})</h4>
                  <button onClick={() => setResults([])} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b">
                      <tr>
                        {Object.keys(results[0]).map(key => (
                          <th key={key} className="px-6 py-4 border-r border-gray-100">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {results.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-6 py-4 text-[10px] font-medium text-gray-600 border-r border-gray-100 whitespace-nowrap">
                              {val === null ? <span className="text-gray-300 italic">NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SqlExplorer;
