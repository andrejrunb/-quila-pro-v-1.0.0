import React, { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';

export const SecretariatRegistrationManager: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', classId: '' });
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await (window as any).aquila?.createStudent?.(formData);
      if (!result?.success) {
        setError(result?.error || 'Não foi possível cadastrar o aluno.');
        return;
      }
      setCreatedStudentId(result.studentId);
      setError(null);
      setFormData({ name: '', classId: '' });
    } catch {
      setError('Não foi possível cadastrar o aluno.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-white">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="text-emerald-500" size={24} />
        <h2 className="text-2xl font-bold">Matrícula e Cadastro Inteligente</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase mb-1 block">Nome Completo</label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase mb-1 block">ID da turma</label>
            <input
              type="text"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none"
              value={formData.classId}
              onChange={e => setFormData({...formData, classId: e.target.value})}
              required
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          
          <button type="submit" className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
            <Check size={18} /> Efetivar Cadastro
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            {createdStudentId ? (
              <p role="status" className="text-emerald-400">
                Aluno cadastrado. Identificador: <span className="font-mono">{createdStudentId}</span>
              </p>
            ) : (
              <p className="text-zinc-400">O cadastro não cria credenciais de acesso.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
