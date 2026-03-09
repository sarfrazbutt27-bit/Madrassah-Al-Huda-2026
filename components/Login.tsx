
import React, { useState } from 'react';
import { ShieldCheck, User as UserIcon, Eye, EyeOff, Lock, AlertCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { User, UserRole, Student } from '../types';
import { supabase } from '../lib/supabase';
import LogoIcon from './LogoIcon';

interface LoginProps {
  onLogin: (user: User) => void;
  logoUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, logoUrl }) => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.PRINCIPAL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Fallback for Default Admin
      if (role === UserRole.PRINCIPAL && username.toLowerCase() === 'admin' && password === 'admin') {
        onLogin({
          id: 'admin-fixed',
          name: 'Sarfraz Azmat Butt',
          role: UserRole.PRINCIPAL
        });
        return;
      }

      if (role === UserRole.STUDENT) {
        // Students log in with their ID (HUDA-XXXXXX)
        const { data, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', username.toUpperCase())
          .single();

        if (studentError || !data) {
          setError('Schüler-ID nicht gefunden.');
        } else {
          onLogin({ 
            id: data.id, 
            name: `${data.first_name} ${data.last_name}`, 
            role: UserRole.STUDENT, 
            assignedClasses: [data.class_name] 
          });
        }
      } else {
        // Staff logs in with Username and Password
        const { data, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('name', username)
          .eq('password', password)
          .eq('role', role)
          .single();

        if (userError || !data) {
          setError('Login fehlgeschlagen. Bitte Email und Passwort prüfen.');
        } else {
          onLogin({
            id: data.id,
            name: data.name,
            role: data.role as UserRole,
            assignedClasses: data.assigned_classes,
            teacherTitle: data.teacher_title,
            firstName: data.first_name,
            lastName: data.last_name,
            whatsapp: data.whatsapp
          });
        }
      }
    } catch (err: any) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none rotate-12"><LogoIcon className="w-[500px] h-[500px] text-white" /></div>
      <div className="absolute bottom-0 left-0 p-32 opacity-5 pointer-events-none -rotate-12"><LogoIcon className="w-[300px] h-[300px] text-gold-400" /></div>
      
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border border-white/20 fade-in">
        <div className="bg-madrassah-950 p-12 text-white text-center relative">
          <div className="absolute inset-0 islamic-pattern opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-6 transform hover:rotate-6 transition-transform p-5 text-madrassah-950">
               <LogoIcon className="w-16 h-16" />
             </div>
             <h1 className="text-2xl font-black tracking-tighter uppercase italic text-gold-400">Madrassah Al-Huda</h1>
             <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Digital Campus Hamburg</p>
          </div>
        </div>
        
        <div className="p-10 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-[1.75rem] shadow-inner">
              {[UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.STUDENT].map(r => (
                <button key={r} type="button" onClick={() => { setRole(r); setError(''); }} className={`flex-1 py-3 px-1 rounded-xl text-[9px] font-black uppercase transition-all duration-300 ${role === r ? 'bg-madrassah-950 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}>
                  {r === UserRole.PRINCIPAL ? 'Schulleiter' : r === UserRole.TEACHER ? 'Lehrer' : 'Schüler'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-madrassah-950 transition-colors" size={18} />
                <input 
                  type="text" required value={username} onChange={e => setUsername(e.target.value)} 
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-madrassah-950 focus:bg-white outline-none font-bold text-sm transition-all shadow-inner" 
                  placeholder={role === UserRole.STUDENT ? "HUDA-XXXXXX" : "Benutzername"} 
                />
              </div>

              {role !== UserRole.STUDENT && (
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-madrassah-950 transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-14 pr-14 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-madrassah-950 focus:bg-white outline-none font-bold text-sm transition-all shadow-inner" 
                    placeholder="Passwort" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-madrassah-950 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-left-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-madrassah-950 text-white font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(63,0,66,0.3)] uppercase text-[10px] tracking-widest hover:bg-black hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Einloggen <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
          
          <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-[9px] font-black text-gold-600 uppercase tracking-widest">
                <Sparkles size={12} /> Exzellenz in Bildung
             </div>
             <p className="text-[8px] text-center text-gray-300 uppercase tracking-widest font-black">Madrassah Al-Huda &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
