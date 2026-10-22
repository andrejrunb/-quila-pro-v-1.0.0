import React, { useState, useRef } from 'react';
import { Camera, Check, UserPlus, Fingerprint, Lock } from 'lucide-react';

export const SecretariatRegistrationManager: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', cpf: '', role: 'student', classId: '' });
  const [photo, setPhoto] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{login: string, password: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Erro ao acessar webcam", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      // Stop tracks
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const win = window as any;
    if (!win.aquila) return;

    try {
      let res;
      if (formData.role === 'student') {
        res = await win.aquila.invoke('secretaria:add-student', formData);
      } else {
        res = await win.aquila.invoke('secretaria:add-teacher', formData);
      }

      if (res.success) {
        setCredentials({ login: res.login, password: res.password });
        if (photo && formData.role === 'student') {
          // Send to FaceWorkerBridge via IPC
          await win.aquila.invoke('secretaria:register-face', { studentId: formData.cpf, base64Image: photo });
        }
      }
    } catch (err) {
      console.error(err);
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
            <label className="text-xs text-zinc-400 font-bold uppercase mb-1 block">CPF (Gera Credencial)</label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none"
              value={formData.cpf}
              onChange={e => setFormData({...formData, cpf: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold uppercase mb-1 block">Função</label>
            <select 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="student">Aluno</option>
              <option value="teacher">Professor</option>
            </select>
          </div>
          
          <button type="submit" className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
            <Check size={18} /> Efetivar Cadastro
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[300px] relative">
            {!photo ? (
              <>
                <video ref={videoRef} className="w-full h-48 bg-black rounded-lg object-cover mb-4" />
                <button type="button" onClick={startCamera} className="text-sm bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full mb-2 hover:bg-blue-500/40">Ativar Câmera</button>
                <button type="button" onClick={capturePhoto} className="text-sm bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full hover:bg-emerald-500/40 flex items-center gap-2"><Camera size={16} /> Capturar Biometria Facial</button>
              </>
            ) : (
              <>
                <img src={photo} className="w-full h-48 object-cover rounded-lg border border-emerald-500/50" alt="Biometria" />
                <button type="button" onClick={() => setPhoto(null)} className="mt-4 text-xs text-zinc-400 underline">Recapturar</button>
              </>
            )}
          </div>

          {credentials && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl animate-fade-in flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Lock size={18} />
                <span className="font-bold">Credenciais Geradas com Sucesso</span>
              </div>
              <div className="text-sm">
                <span className="text-zinc-400 block">Usuário (Login):</span>
                <span className="font-mono text-lg font-bold">{credentials.login}</span>
              </div>
              <div className="text-sm mt-2">
                <span className="text-zinc-400 block">Senha Criptografada (Provisória):</span>
                <span className="font-mono text-lg font-bold">{credentials.password}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
