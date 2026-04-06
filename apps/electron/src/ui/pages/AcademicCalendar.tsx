import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Save, MapPin, Award } from 'lucide-react';
import './AcademicCalendar.css';

/**
 * AcademicCalendar.tsx — Passo 28 do Roadmap.
 * Gestão de Feriados, Dias Letivos e Períodos Acadêmicos.
 */
interface AcademicCalendarProps {
  onBack: () => void;
}

export const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ onBack }) => {
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const aquila = (window as any).aquila;

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday]);
      setNewHoliday('');
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h !== date));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await aquila.invoke('save-settings', { holidays: JSON.stringify(holidays) });
      alert('Calendário Acadêmico Atualizado!');
    } catch (err) {
      console.error('Erro ao salvar calendário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="academic-calendar-page">
      <header className="calendar-header">
        <h1 className="calendar-title">
          <CalendarIcon className="text-orange-500" size={40} />
          Calendário Acadêmico
        </h1>
        <p className="calendar-subtitle">Defina feriados e recessos para evitar falsos alertas de falta</p>
      </header>

      <div className="calendar-grid">
        {/* Holiday Management */}
        <section className="calendar-section">
          <h2 className="section-title">
             <Plus className="text-orange-400" /> Adicionar Feriado / Recesso
          </h2>
          <div className="add-holiday-form">
            <input 
              type="date" 
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              title="Data do Feriado"
              aria-label="Data do Feriado"
              placeholder="Selecione a data"
              className="date-input"
            />
            <button 
                onClick={handleAddHoliday}
                className="btn-add-holiday"
                aria-label="Adicionar Feriado"
            >
                Adicionar
            </button>
          </div>

          <div className="holidays-list custom-scrollbar">
            {holidays.map((date, i) => (
              <div key={date + i} className="holiday-item">
                <span className="holiday-date">{new Date(date).toLocaleDateString('pt-BR')}</span>
                <button 
                    onClick={() => handleRemoveHoliday(date)}
                    title="Remover Feriado"
                    aria-label="Remover Feriado"
                    className="btn-remove-holiday"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            ))}
            {holidays.length === 0 && <p className="empty-msg">Nenhum feriado cadastrado.</p>}
          </div>
        </section>

        {/* Academic Periods */}
        <section className="calendar-section periods-section">
           <h2 className="section-title">
             <MapPin className="text-blue-400" /> Períodos (Bimestres)
           </h2>
           <p className="section-hint">Este módulo será integrado ao sistema de rankings automaticamente.</p>
           
           <div className="periods-list">
              <div className="period-item">
                <div>
                    <p className="period-name">1º Bimestre</p>
                    <p className="period-range">01 Fev — 30 Abr</p>
                </div>
                <div className="current-badge">ATUAL</div>
              </div>
              <div className="period-item">
                <div>
                    <p className="period-name">2º Bimestre</p>
                    <p className="period-range">10 Mai — 15 Jul</p>
                </div>
                <div className="waiting-badge">AGUARDANDO</div>
              </div>
           </div>

           <div className="bncc-milestones-box">
               <h3 className="bncc-title">
                  <Award size={14} className="text-purple-400" />
                  Marcos BNCC (Pacto Nacional)
               </h3>
               <div className="milestones-flex">
                  <div className="milestone-pill">C1: Cultura Digital</div>
                  <div className="milestone-pill">C4: Comunicação</div>
                  <div className="milestone-pill">C7: Argumentação</div>
               </div>
               <p className="bncc-info">Prazos de preenchimento de evidências pedagógicas conforme LDB.</p>
           </div>
        </section>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-save-calendar"
        aria-label="Salvar Calendário Acadêmico"
      >
        {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Calendário Acadêmico</>}
      </button>
    </div>
  );
};

export default AcademicCalendar;
