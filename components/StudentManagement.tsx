
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, Search, Pencil, Trash2, School, Phone, 
  Printer, FileText, ChevronDown, Hash, 
  Award, FileUp, FileDown, RefreshCw, Layers
} from 'lucide-react';
import { Student } from '../types';

interface StudentManagementProps {
  students: Student[];
  onDelete: (id: string) => void;
  onUpdateStudents: (list: Student[]) => Promise<boolean>;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, onDelete, onUpdateStudents }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('Alle');
  const [isRegrouping, setIsRegrouping] = useState(false);

  const allClasses = useMemo(() => {
    const classes = Array.from(new Set(students.map(s => s.className)));
    return ['Alle', ...classes.sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            (s.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'Alle' || s.className === selectedClass;
      return matchesSearch && matchesClass;
    }).sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  }, [students, searchTerm, selectedClass]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Möchten Sie den Schüler ${name} (ID: ${id}) wirklich unwiderruflich aus dem System löschen?`)) {
      onDelete(id);
    }
  };

  const handleRegroupFamilies = async () => {
    if (window.confirm("Möchten Sie alle Schüler neu in Familien gruppieren? Dies basiert auf dem Nachnamen und validen Eltern-Kontaktdaten. Schüler ohne Eltern-Daten werden als Einzelpersonen geführt.")) {
      setIsRegrouping(true);
      const success = await onUpdateStudents(students);
      if (success) {
        alert("Familien-Gruppierung erfolgreich aktualisiert!");
      }
      setIsRegrouping(false);
    }
  };

  const handleDeleteAllInClass = () => {
    if (selectedClass === 'Alle') return;
    
    const count = filteredStudents.length;
    if (count === 0) return;

    if (window.confirm(`ACHTUNG: Möchten Sie wirklich ALLE ${count} Schüler der Klasse "${selectedClass}" unwiderruflich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden!`)) {
      filteredStudents.forEach(s => onDelete(s.id));
      alert(`${count} Schüler wurden aus der Klasse ${selectedClass} entfernt.`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-950 pointer-events-none rotate-12"><Users size={280} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="bg-madrassah-950 p-6 rounded-[2rem] shadow-2xl text-white transform -rotate-3">
              <Users size={36} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-madrassah-950 uppercase italic tracking-tighter leading-none">Schüler-Register</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Zentralverwaltung & Listenführung</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto relative z-10">
           {selectedClass !== 'Alle' && filteredStudents.length > 0 && (
             <button 
               onClick={handleDeleteAllInClass}
               className="bg-red-50 text-red-600 border-2 border-red-100 px-6 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-4 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-lg shadow-red-100"
             >
                <Trash2 size={20} /> Klasse {selectedClass} leeren
             </button>
           )}
           <button 
             onClick={handleRegroupFamilies}
             disabled={isRegrouping}
             className="bg-indigo-50 text-indigo-600 border-2 border-indigo-100 px-6 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-4 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
           >
              {isRegrouping ? <RefreshCw size={20} className="animate-spin" /> : <Layers size={20} />} Familien neu ordnen
           </button>
           <button 
             onClick={() => navigate(`/blank-registration`)}
             className="bg-white border-2 border-gray-100 text-gray-400 px-6 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-4 hover:bg-madrassah-950 hover:text-white hover:border-madrassah-950 transition-all"
           >
              <FileDown size={20} /> Blanko-Formular
           </button>
           <button 
             onClick={() => navigate(`/students/print?class=${selectedClass}`)}
             className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center gap-4 shadow-xl hover:bg-black transition-all"
           >
              <Printer size={22} /> Klassenliste PDF
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Name oder Schüler-ID suchen..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] text-sm font-bold outline-none focus:bg-white focus:border-madrassah-950 transition-all shadow-sm" 
            />
         </div>
         <div className="relative w-full lg:w-72">
            <School className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full pl-16 pr-12 py-5 bg-white border-2 border-gray-100 rounded-[2.5rem] text-xs font-black uppercase outline-none appearance-none cursor-pointer shadow-sm focus:border-madrassah-950 transition-all"
            >
              {allClasses.map(c => <option key={c} value={c}>{c === 'Alle' ? 'Alle Klassen' : `Klasse ${c}`}</option>)}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
         </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-gray-100">
                <th className="px-10 py-8 w-16 text-center italic">Nr.</th>
                <th className="px-6 py-8">Schüler / ID</th>
                <th className="px-6 py-8 text-center">Klasse</th>
                <th className="px-6 py-8">Erziehungsberechtigte</th>
                <th className="px-6 py-8 text-center">Status</th>
                <th className="px-12 py-8 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((s, index) => (
                <tr key={s.id} className="hover:bg-madrassah-50/10 transition-all group">
                  <td className="px-10 py-6 text-center font-black text-gray-300 italic">
                     {index + 1}.
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg transform group-hover:rotate-3 transition-transform ${s.gender === 'Junge' || s.gender === 'Mann' ? 'bg-indigo-600' : 'bg-pink-600'}`}>
                           {s.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                           <p className="font-black text-gray-900 text-xl uppercase italic leading-none group-hover:text-madrassah-950 transition-colors">{s.firstName} {s.lastName}</p>
                           <p className="text-[10px] font-black text-indigo-600 mt-2 flex items-center gap-2 italic uppercase">
                             <Hash size={10}/> {s.id}
                           </p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                     <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-indigo-100">
                        {s.className}
                     </span>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-700">{s.guardian}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1.5 mt-1">
                           <Phone size={10} /> {s.whatsapp}
                        </p>
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                     <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-black uppercase ${s.status === 'active' ? 'text-emerald-700' : 'text-gray-400'}`}>
                           {s.status === 'active' ? 'Aktiv' : s.status}
                        </span>
                     </div>
                  </td>
                  <td className="px-12 py-6 text-right">
                     <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/print-registration/${s.id}`}
                          title="Offizielles Anmeldeformular drucken"
                          className="p-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm border border-emerald-100"
                        >
                           <FileUp size={18} />
                        </Link>
                        <Link 
                          to={`/certificates`}
                          title="Urkunden Hub öffnen"
                          className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-2xl transition-all shadow-sm border border-amber-100"
                        >
                           <Award size={18} />
                        </Link>
                        <Link 
                          to={`/report-card/${s.id}`}
                          title="Zeugnisvorschau"
                          className="p-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm border border-indigo-100"
                        >
                           <FileText size={18} />
                        </Link>
                        <Link 
                          to={`/edit-student/${s.id}`}
                          className="p-4 bg-white text-gray-400 hover:text-amber-600 rounded-2xl transition-all shadow-sm border border-gray-100"
                        >
                           <Pencil size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}
                          className="p-4 bg-white text-gray-400 hover:text-red-600 rounded-2xl transition-all shadow-sm border border-gray-100"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
