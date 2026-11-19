import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Calendar,
  Users,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  ArrowLeftRight,
  ArrowLeft,
  BarChart3,
  Grid,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import {
  TimetableEngine,
  TeacherSlot,
  ClassRequirement,
  GridSlot,
  VISAO_PERIODS,
  COLEGIO_VISAO_TEACHERS_PRESET,
  SwapCandidateInfo
} from '../../services/TimetableEngine';
import rawVisaoScheduleJson from '../../database/schedule_data.json';
import { isMvp01Active } from '../../config/mvpProfile';
import './TimetableBuilder.css';

type AquilaViewMode = 'by_class' | 'by_teacher' | 'master_mosaic' | 'quality_audit';

const DAYS_CONFIG = [
  { id: 'monday', short: 'Seg', label: 'Segunda-feira', num: 1 },
  { id: 'tuesday', short: 'Ter', label: 'Terça-feira', num: 2 },
  { id: 'wednesday', short: 'Qua', label: 'Quarta-feira', num: 3 },
  { id: 'thursday', short: 'Qui', label: 'Quinta-feira', num: 4 },
  { id: 'friday', short: 'Sex', label: 'Sexta-feira', num: 5 }
];

const VISAO_CLASS_CATALOG: Array<{ id: string; name: string; segment: 'EF1' | 'EF2' | 'EM' }> = [
  { id: 'F-EF11A', name: '1 ANO A', segment: 'EF1' },
  { id: 'F-EF11B', name: '1 ANO B', segment: 'EF1' },
  { id: 'F-EF12A', name: '2 ANO A', segment: 'EF1' },
  { id: 'F-EF12B', name: '2 ANO B', segment: 'EF1' },
  { id: 'F-EF13A', name: '3 ANO A', segment: 'EF1' },
  { id: 'F-EF13B', name: '3 ANO B', segment: 'EF1' },
  { id: 'F-EF14A', name: '4 ANO A', segment: 'EF1' },
  { id: 'F-EF14B', name: '4 ANO B', segment: 'EF1' },
  { id: 'F-EF15A', name: '5 ANO A', segment: 'EF1' },
  { id: 'F-EF15B', name: '5 ANO B', segment: 'EF1' },
  { id: 'F-EF26A', name: '6 ANO A', segment: 'EF2' },
  { id: 'F-EF26B', name: '6 ANO B', segment: 'EF2' },
  { id: 'F-EF27A', name: '7 ANO A', segment: 'EF2' },
  { id: 'F-EF27B', name: '7 ANO B', segment: 'EF2' },
  { id: 'F-EF28A', name: '8 ANO A', segment: 'EF2' },
  { id: 'F-EF28B', name: '8 ANO B', segment: 'EF2' },
  { id: 'F-EF29A', name: '9 ANO A', segment: 'EF2' },
  { id: 'F-EF29B', name: '9 ANO B', segment: 'EF2' },
  { id: 'F-EM1A',  name: '1 SERIE A', segment: 'EM' },
  { id: 'F-EM1B',  name: '1 SERIE B', segment: 'EM' },
  { id: 'F-EM2A',  name: '2 SERIE A', segment: 'EM' },
  { id: 'F-EM3A',  name: '3 SERIE A', segment: 'EM' }
];

const TIME_TO_PERIOD: Record<string, number> = {
  '07:30': 1,
  '08:20': 2,
  '09:10': 3,
  '10:20': 4,
  '10:30': 4,
  '11:10': 5,
  '12:00': 6,
  '14:20': 7,
  '15:10': 8,
  '16:20': 9,
  '17:10': 10
};

const DAY_SHORT_TO_ID: Record<string, string> = {
  Seg: 'monday',
  Ter: 'tuesday',
  Qua: 'wednesday',
  Qui: 'thursday',
  Sex: 'friday'
};

/**
 * Converte o JSON real "GRADE INSTITUCIONAL MODELO" do Colégio Áquila Modelo
 * diretamente para a estrutura de grades do Grade Inteligente Áquila+ Engine.
 */
function buildRealVisaoScheduleFromJson(): {
  schedules: Record<string, GridSlot[]>;
  classes: ClassRequirement[];
} {
  const schedules: Record<string, GridSlot[]> = {};
  const demandMap: Record<string, Record<string, number>> = {};

  VISAO_CLASS_CATALOG.forEach(c => {
    schedules[c.id] = [];
    demandMap[c.id] = {};
  });

  const teacherSubjectLookup: Record<string, string> = {};
  COLEGIO_VISAO_TEACHERS_PRESET.forEach(t => {
    teacherSubjectLookup[t.teacherId] = t.subject;
  });

  const pages = Array.isArray(rawVisaoScheduleJson) ? rawVisaoScheduleJson : [];
  for (const page of pages) {
    const rows: any[][] = page.rows || [];
    if (rows.length < 2) continue;
    const headerRow = rows[0];
    let currentDayId = 'monday';

    for (let rIdx = 1; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row || row.length < 3) continue;
      const dayCell = row[0];
      const timeCell = String(row[1] || '').trim();
      if (dayCell && DAY_SHORT_TO_ID[String(dayCell).trim()]) {
        currentDayId = DAY_SHORT_TO_ID[String(dayCell).trim()];
      }
      const period = TIME_TO_PERIOD[timeCell];
      if (!period) continue;

      for (let colIdx = 2; colIdx < row.length; colIdx++) {
        const classHeaderName = String(headerRow[colIdx] || '').trim();
        const classMeta = VISAO_CLASS_CATALOG.find(c => c.name === classHeaderName);
        if (!classMeta) continue;

        const rawTeacher = String(row[colIdx] || '').trim();
        if (!rawTeacher || rawTeacher === '---' || rawTeacher === '-') continue;

        const subjectLabel = teacherSubjectLookup[rawTeacher] || rawTeacher;
        schedules[classMeta.id].push({
          day: currentDayId,
          period,
          subject: subjectLabel,
          teacherId: rawTeacher,
          locked: false
        });

        demandMap[classMeta.id][rawTeacher] = (demandMap[classMeta.id][rawTeacher] || 0) + 1;
      }
    }
  }

  const classes: ClassRequirement[] = VISAO_CLASS_CATALOG.map(c => ({
    classId: c.id,
    className: c.name,
    segment: c.segment,
    demand: demandMap[c.id] || {}
  }));

  return { schedules, classes };
}

interface TimetableBuilderProps {
  onBack?: () => void;
}

export const TimetableBuilder: React.FC<TimetableBuilderProps> = ({ onBack }) => {
  const initialVisaoData = useMemo(() => buildRealVisaoScheduleFromJson(), []);

  const [viewMode, setViewMode] = useState<AquilaViewMode>('by_class');
  const [teachers, setTeachers] = useState<TeacherSlot[]>(COLEGIO_VISAO_TEACHERS_PRESET);
  const [classes, setClasses] = useState<ClassRequirement[]>(initialVisaoData.classes);
  const [generatedSchedules, setGeneratedSchedules] = useState<Record<string, GridSlot[]>>(
    initialVisaoData.schedules
  );

  // Catálogo MVP 0.1 para publicação direta via saveTimetableSlot
  const [mvpAcademicYears, setMvpAcademicYears] = useState<any[]>([]);
  const [mvpClasses, setMvpClasses] = useState<any[]>([]);

  // Núcleo Manual de Edição & Detecção de Conflitos
  const [manualClassId, setManualClassId] = useState<string>(VISAO_CLASS_CATALOG[0].id);
  const [manualDay, setManualDay] = useState<string>('monday');
  const [manualPeriod, setManualPeriod] = useState<number>(1);
  const [manualSubject, setManualSubject] = useState<string>('Matemática');
  const [manualTeacherId, setManualTeacherId] = useState<string>(COLEGIO_VISAO_TEACHERS_PRESET[0]?.teacherId || 'DANIELLE');
  const [manualLock, setManualLock] = useState<boolean>(true);
  const [showManualEditor, setShowManualEditor] = useState<boolean>(true);

  // Filtros de visualização
  const [selectedSegment, setSelectedSegment] = useState<'ALL' | 'EF1' | 'EF2' | 'EM'>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('DANIELLE');
  const [selectedMosaicDay, setSelectedMosaicDay] = useState<string>('monday');

  // Estado de Permutação 2-opt (Clique Guiado Grade Horária Áquila)
  const [swapOrigin, setSwapOrigin] = useState<{
    classId: string;
    day: string;
    period: number;
    slot: GridSlot;
  } | null>(null);

  // Pesos do Solver Assistido da Grade Horária Áquila
  const [weights, setWeights] = useState({
    weightJanelas: 10,
    weightGeminadas: 8,
    weightSingleClassDay: 6,
    weightLAP: 9
  });

  // Versão Sandbox ("Horário Experimental" Grade Horária Áquila)
  const [experimentalMode, setExperimentalMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiInsight, setAiInsight] = useState<{
    type: 'success' | 'warn' | 'error';
    message: string;
  } | null>({
    type: 'success',
    message:
      'Grade Horária Áquila carregada: cadastro/edição manual com detecção de conflitos e publicação como núcleo, e otimização assistida que preserva ajustes fixados.'
  });

  const mvp01 = isMvp01Active();
  const aquila = (window as any).aquila;
  const engine = useMemo(() => new TimetableEngine(), []);

  const classCatalog = useMemo<Array<{ id: string; name: string; segment: 'EF1' | 'EF2' | 'EM'; academicYearId?: string }>>(() => {
    if (mvp01 && mvpClasses.length > 0) {
      return mvpClasses.map(c => {
        const stage = String(c.stage || '').toUpperCase();
        const segment: 'EF1' | 'EF2' | 'EM' =
          stage === 'MEDIO' || String(c.name || '').toUpperCase().includes('EM')
            ? 'EM'
            : /^[1-5]\s/.test(String(c.name || ''))
            ? 'EF1'
            : 'EF2';
        return {
          id: String(c.id),
          name: String(c.name || c.id),
          segment,
          academicYearId: c.academic_year_id ? String(c.academic_year_id) : undefined,
        };
      });
    }
    return VISAO_CLASS_CATALOG;
  }, [mvp01, mvpClasses]);

  useEffect(() => {
    const loadFromDatabaseIfPresent = async () => {
      try {
        let loadedMvpClasses: any[] = [];
        if (aquila?.mvp01?.getPortalOverview) {
          const ov = await aquila.mvp01.getPortalOverview({ portal: 'secretariat' }).catch(() => null)
            || await aquila.mvp01.getPortalOverview({ portal: 'coordination' }).catch(() => null);
          if (ov?.success && ov.data) {
            setMvpAcademicYears(ov.data.academicYears || []);
            loadedMvpClasses = ov.data.classes || [];
            setMvpClasses(loadedMvpClasses);
            if (loadedMvpClasses.length > 0) {
              setManualClassId(prev =>
                loadedMvpClasses.some(c => c.id === prev) ? prev : loadedMvpClasses[0].id
              );
              setClasses(
                loadedMvpClasses.map(c => ({
                  classId: c.id,
                  className: c.name,
                  segment: String(c.stage || '').toUpperCase() === 'MEDIO' ? 'EM' : 'EF2',
                  demand: {},
                }))
              );
              setGeneratedSchedules(prev => {
                const next: Record<string, GridSlot[]> = {};
                loadedMvpClasses.forEach(c => {
                  next[c.id] = prev[c.id] || [];
                });
                return next;
              });
            }
          }
        }
        const sRes = await aquila?.invoke('get-schedules');
        if (Array.isArray(sRes) && sRes.length > 0) {
          const dayOfWeekMap: Record<number, string> = {
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday'
          };
          const formatted: Record<string, GridSlot[]> = {};
          if (loadedMvpClasses.length > 0) {
            loadedMvpClasses.forEach(c => {
              formatted[c.id] = [];
            });
          }
          sRes.forEach((s: any) => {
            const dayStr = dayOfWeekMap[s.dayOfWeek] || 'monday';
            const periodNum = TIME_TO_PERIOD[s.startTime] || 1;
            const classId = s.classId;
            if (loadedMvpClasses.length > 0 && !loadedMvpClasses.some(c => c.id === classId)) {
              return;
            }
            if (!formatted[classId]) formatted[classId] = [];
            formatted[classId].push({
              day: dayStr,
              period: periodNum,
              subject: s.subject,
              teacherId: s.teacher || s.teacherId,
              locked: false
            });
          });
          if (Object.values(formatted).some(arr => arr.length > 0) || !mvp01) {
            setGeneratedSchedules(formatted);
          }
        }
      } catch (_) {
        // Mantém o seed real embutido ou catálogo vazio do MVP 0.1
      }
    };
    loadFromDatabaseIfPresent();
  }, []);

  // Auditoria em tempo real "Situação do Horário" (Grade Horária Áquila)
  const qualityReport = useMemo(
    () => engine.analyzeScheduleQuality(generatedSchedules, teachers),
    [generatedSchedules, teachers, engine]
  );

  const manualConflict = useMemo(() => {
    if (!manualTeacherId || manualTeacherId === 'none') return null;
    for (const [otherClassId, slots] of Object.entries(generatedSchedules)) {
      if (otherClassId === manualClassId) continue;
      const clash = slots.find(
        s => s.day === manualDay && s.period === manualPeriod && s.teacherId === manualTeacherId
      );
      if (clash) {
        return `Conflito detectado: ${manualTeacherId} já está alocado(a) na turma ${otherClassId} neste mesmo dia e horário (${clash.subject}).`;
      }
    }
    return null;
  }, [generatedSchedules, manualClassId, manualDay, manualPeriod, manualTeacherId]);

  const handleApplyManualSlot = async () => {
    if (manualConflict) {
      setAiInsight({ type: 'error', message: manualConflict });
      return;
    }
    const subjectText = manualSubject.trim() || 'Disciplina';
    setGeneratedSchedules(prev => {
      const list = [...(prev[manualClassId] || [])];
      const idx = list.findIndex(s => s.day === manualDay && s.period === manualPeriod);
      const nextSlot: GridSlot = {
        day: manualDay,
        period: manualPeriod,
        subject: subjectText,
        teacherId: manualTeacherId,
        locked: manualLock
      };
      if (idx >= 0) {
        list[idx] = nextSlot;
      } else {
        list.push(nextSlot);
      }
      return { ...prev, [manualClassId]: list };
    });

    const dayToNum: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5
    };
    const pMeta = VISAO_PERIODS.find(p => p.period === manualPeriod);
    const [startTime = '07:30', endTime = '08:20'] = (pMeta?.time || '07:30 - 08:20').split(' - ');
    const matchedMvpClass = mvpClasses.find(c => c.id === manualClassId || c.name === manualClassId);
    const academicYearId = matchedMvpClass?.academic_year_id || mvpAcademicYears[0]?.id;

    if (aquila?.mvp01?.saveTimetableSlot && matchedMvpClass && academicYearId) {
      const slotRes = await aquila.mvp01
        .saveTimetableSlot({
          academicYearId,
          classId: matchedMvpClass.id,
          dayOfWeek: dayToNum[manualDay] || 1,
          slotIndex: manualPeriod,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          subject: subjectText,
          teacherUserId: manualTeacherId,
          published: true
        })
        .catch((err: any) => ({ success: false, error: err?.message || 'Erro ao salvar slot.' }));
      if (slotRes?.success === false) {
        setAiInsight({
          type: 'error',
          message: `Falha ao persistir ajuste manual no servidor: ${slotRes.error || slotRes.message || 'Erro desconhecido'}`
        });
        return;
      }
    }

    setAiInsight({
      type: 'success',
      message: `Ajuste manual aplicado em ${getClassName(manualClassId)} (${manualDay} • ${manualPeriod}º horário) com ${manualTeacherId}${manualLock ? ' e fixado para preservação pelo solver' : ''}.`
    });
  };

  // Mapa de candidatos de troca quando swapOrigin está ativo
  const swapEvaluationMap = useMemo(() => {
    const map: Record<string, SwapCandidateInfo> = {};
    if (!swapOrigin) return map;
    const classSlots = generatedSchedules[swapOrigin.classId] || [];
    for (const targetSlot of classSlots) {
      if (targetSlot.day === swapOrigin.day && targetSlot.period === swapOrigin.period) continue;
      const evalInfo = engine.evaluatePairSwap(
        generatedSchedules,
        teachers,
        swapOrigin.classId,
        swapOrigin.slot,
        targetSlot
      );
      map[`${targetSlot.day}_${targetSlot.period}`] = evalInfo;
    }
    return map;
  }, [swapOrigin, generatedSchedules, teachers, engine]);

  const handleCellClickForSwap = (classId: string, day: string, period: number, slot: GridSlot) => {
    if (!swapOrigin) {
      if (slot.locked) {
        setAiInsight({
          type: 'warn',
          message: 'Esta aula está fixada com cadeado. Destrave o cadeado antes de movê-la.'
        });
        return;
      }
      setSwapOrigin({ classId, day, period, slot });
      return;
    }

    // Se clicou na mesma célula ou em outra turma, cancela/troca seleção
    if (swapOrigin.classId !== classId || (swapOrigin.day === day && swapOrigin.period === period)) {
      setSwapOrigin(null);
      return;
    }

    const candidate = swapEvaluationMap[`${day}_${period}`];
    if (!candidate || candidate.status === 'BLOCKED') {
      setAiInsight({
        type: 'error',
        message: `Permutação bloqueada pela Grade Horária Áquila: ${candidate?.reason || 'Conflito de horário'}.`
      });
      return;
    }

    // Executar a permutação 2-opt na turma
    setGeneratedSchedules(prev => {
      const classSlots = [...(prev[classId] || [])];
      const idx1 = classSlots.findIndex(
        s => s.day === swapOrigin.day && s.period === swapOrigin.period
      );
      const idx2 = classSlots.findIndex(s => s.day === day && s.period === period);
      if (idx1 === -1 || idx2 === -1) return prev;

      const copy1 = { ...classSlots[idx1] };
      const copy2 = { ...classSlots[idx2] };

      classSlots[idx1] = {
        ...copy1,
        subject: copy2.subject,
        teacherId: copy2.teacherId
      };
      classSlots[idx2] = {
        ...copy2,
        subject: copy1.subject,
        teacherId: copy1.teacherId
      };

      return { ...prev, [classId]: classSlots };
    });

    setAiInsight({
      type: 'success',
      message: `Permuta Grade Horária Áquila concluída em ${getClassName(classId)}: [${swapOrigin.slot.teacherId} ⇄ ${slot.teacherId}] (${candidate.reason}).`
    });
    setSwapOrigin(null);
  };

  const toggleLockSlot = (e: React.MouseEvent, classId: string, day: string, period: number) => {
    e.stopPropagation();
    setGeneratedSchedules(prev => {
      const classSlots = (prev[classId] || []).map(s =>
        s.day === day && s.period === period ? { ...s, locked: !s.locked } : s
      );
      return { ...prev, [classId]: classSlots };
    });
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setSwapOrigin(null);
    setTimeout(() => {
      try {
        const result = engine.generate(classes, teachers, generatedSchedules, weights);
        setGeneratedSchedules(result);
        const newAudit = engine.analyzeScheduleQuality(result, teachers);
        setAiInsight({
          type: 'success',
          message: `Solver assistido Grade Horária Áquila concluído preservando os ajustes manuais fixados! Índice de Qualidade: ${newAudit.globalScore}% • ${newAudit.totalGeminadasAchieved} dobradinhas.`
        });
      } catch (err: any) {
        setAiInsight({
          type: 'error',
          message: `Erro na otimização: ${err.message || String(err)}`
        });
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  const handleRestoreOfficialVisao = () => {
    setSwapOrigin(null);
    if (mvp01 && mvpClasses.length > 0) {
      const resetMap: Record<string, GridSlot[]> = {};
      mvpClasses.forEach(c => {
        resetMap[c.id] = [];
      });
      setGeneratedSchedules(resetMap);
    } else {
      setGeneratedSchedules(initialVisaoData.schedules);
    }
    setAiInsight({
      type: 'success',
      message: 'Grade base restaurada para o catálogo de turmas ativo!'
    });
  };

  const handleSaveSchedules = async () => {
    setIsGenerating(true);
    try {
      await aquila?.invoke?.('clear-schedules');
      const dayToNumber: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5
      };
      const periodToTime: Record<number, { start: string; end: string }> = {
        1: { start: '07:30', end: '08:20' },
        2: { start: '08:20', end: '09:10' },
        3: { start: '09:10', end: '10:00' },
        4: { start: '10:30', end: '11:10' },
        5: { start: '11:10', end: '12:00' },
        6: { start: '12:00', end: '12:50' },
        7: { start: '14:20', end: '15:10' },
        8: { start: '15:10', end: '16:00' },
        9: { start: '16:20', end: '17:10' },
        10: { start: '17:10', end: '18:00' }
      };

      let count = 0;
      const errors: string[] = [];

      for (const [classId, slots] of Object.entries(generatedSchedules)) {
        const matchedMvpClass = mvpClasses.find(c => c.id === classId || c.name === classId);
        const academicYearId = matchedMvpClass?.academic_year_id || mvpAcademicYears[0]?.id;

        for (const slot of slots) {
          if (slot.subject === 'JANELA' || slot.teacherId === 'none') continue;
          const dayOfWeek = dayToNumber[slot.day] || 1;
          const timeInfo = periodToTime[slot.period] || { start: '07:30', end: '08:20' };
          const scheduleId = `aquila-${dayOfWeek}-${timeInfo.start.replace(':', '')}-${classId}`;

          if (aquila?.invoke) {
            const legacyRes = await aquila.invoke('upsert-schedule', {
              id: scheduleId,
              classId,
              roomId: `room-${classId}`,
              teacherId: slot.teacherId,
              subject: slot.subject,
              teacher: slot.teacherId,
              dayOfWeek,
              startTime: timeInfo.start,
              endTime: timeInfo.end
            });
            if (legacyRes?.success === false) {
              errors.push(`${classId} (${slot.day} ${slot.period}º): ${legacyRes.error || legacyRes.message || 'Falha upsert-schedule'}`);
            }
          }

          if (aquila?.mvp01?.saveTimetableSlot && matchedMvpClass && academicYearId) {
            const mvpRes = await aquila.mvp01.saveTimetableSlot({
              academicYearId,
              classId: matchedMvpClass.id,
              dayOfWeek,
              slotIndex: slot.period,
              startTime: timeInfo.start,
              endTime: timeInfo.end,
              subject: slot.subject,
              teacherUserId: slot.teacherId,
              published: true
            });
            if (mvpRes?.success === false) {
              errors.push(`${matchedMvpClass.name} (${slot.day} ${slot.period}º): ${mvpRes.error || mvpRes.message || 'Falha ao salvar slot MVP 0.1'}`);
            }
          }
          count++;
        }
      }

      if (errors.length > 0) {
        setAiInsight({
          type: 'error',
          message: `Erro ao publicar ${errors.length} horário(s): ${errors[0]}`
        });
      } else {
        setAiInsight({
          type: 'success',
          message: `Grade Horária Áquila publicada e persistida no banco SQLite com sucesso (${count} aulas sincronizadas em todos os portais)!`
        });
      }
    } catch (err: any) {
      setAiInsight({
        type: 'error',
        message: `Falha ao publicar grade no banco SQLite: ${err?.message || String(err)}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportScheduleCsv = () => {
    const lines = ['Turma;Dia;Periodo;Horario;Professor;Disciplina;Fixada'];
    Object.entries(generatedSchedules).forEach(([clsId, slots]) => {
      const clsName = getClassName(clsId);
      slots.forEach(s => {
        const pMeta = VISAO_PERIODS.find(p => p.period === s.period);
        lines.push(
          `${clsName};${s.day};${s.period}o Horario;${pMeta?.time || ''};${s.teacherId};"${s.subject}";${s.locked ? 'SIM' : 'NAO'}`
        );
      });
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade_horaria_aquila_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTeacherSlotRestriction = (teacherId: string, day: string, period: number) => {
    setTeachers(prev =>
      prev.map(t => {
        if (t.teacherId !== teacherId) return t;
        const key = `${day}_${period}`;
        const current = t.slotRestrictions?.[key];
        const nextMap = { ...(t.slotRestrictions || {}) };
        if (!current) nextMap[key] = 'UNAVAILABLE';
        else if (current === 'UNAVAILABLE') nextMap[key] = 'HAF';
        else delete nextMap[key];
        return { ...t, slotRestrictions: nextMap };
      })
    );
  };

  const getClassName = (clsId: string) => {
    const found = classCatalog.find(c => c.id === clsId);
    return found ? found.name : clsId;
  };

  const visibleClassIds = useMemo(() => {
    return classCatalog.filter(c => {
      if (selectedSegment !== 'ALL' && c.segment !== selectedSegment) return false;
      if (selectedClassFilter !== 'ALL' && c.id !== selectedClassFilter) return false;
      return true;
    }).map(c => c.id);
  }, [classCatalog, selectedSegment, selectedClassFilter]);

  return (
    <div className="timetable-builder urania-sovereign-shell animate-fade-in">
      {/* Top Header Grade Horária Áquila */}
      <header className="builder-header urania-header">
        <div className="title-section">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-setup"
              style={{ marginRight: '16px', background: 'rgba(255, 255, 255, 0.08)' }}
              title="Voltar ao Painel"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          )}
          <Calendar size={30} className="text-emerald-400" />
          <div>
            <div className="urania-badge-row">
              <span className="urania-version-pill">GRADE HORÁRIA ÁQUILA • NÚCLEO MANUAL &amp; PUBLICAÇÃO</span>
              <span className="urania-quality-pill">
                Qualidade da Grade: <strong>{qualityReport.globalScore}%</strong>
              </span>
              <span className="urania-stat-pill">
                Janelas Docentes: <strong>{qualityReport.totalTeacherJanelas}</strong>
              </span>
              <span className="urania-stat-pill">
                Dobradinhas: <strong>{qualityReport.totalGeminadasAchieved}</strong>
              </span>
            </div>
            <h1>Grade Horária Áquila — Cadastro Manual, Conflitos &amp; Publicação</h1>
            <p>
              Edição manual com detecção de conflitos em tempo real • Solver assistido opcional que preserva ajustes manuais fixados
            </p>
          </div>
        </div>

        <div className="actions urania-top-actions">
          <button
            className={`btn-setup ${showManualEditor ? 'experimental-active' : ''}`}
            onClick={() => setShowManualEditor(prev => !prev)}
            title="Cadastro e Edição Manual de Horário com Detecção de Conflitos"
          >
            <Edit3 size={16} />
            {showManualEditor ? 'Editor Manual (Aberto)' : 'Editor Manual'}
          </button>

          <button
            className={`btn-setup ${experimentalMode ? 'experimental-active' : ''}`}
            onClick={() => setExperimentalMode(prev => !prev)}
            title="Alternar Modo Horário Experimental (Sandbox Grade Horária Áquila)"
          >
            <Sparkles size={16} />
            {experimentalMode ? 'Sandbox Experimental (Ativo)' : 'Modo Experimental'}
          </button>

          <button className="btn-setup" onClick={handleRestoreOfficialVisao} title="Restaurar Grade Base">
            <RefreshCw size={16} /> Restaurar Grade Base
          </button>

          <button className="btn-setup" onClick={handleExportScheduleCsv} title="Exportar Grade Horária em CSV">
            <Download size={16} /> Exportar CSV
          </button>

          <button
            className="btn-setup"
            onClick={handleSaveSchedules}
            style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981' }}
            disabled={isGenerating}
          >
            <Save size={16} /> Publicar Grade
          </button>

          <button
            className={`btn-generate ${isGenerating ? 'processing' : ''}`}
            onClick={handleGenerate}
            disabled={isGenerating}
            title="Incremento assistido: otimiza horários livres preservando todos os ajustes manuais fixados"
          >
            <Play size={16} /> {isGenerating ? 'Otimizando...' : 'Solver Assistido (Preserva Fixados)'}
          </button>
        </div>
      </header>

      {/* Núcleo: Cadastro/Edição Manual com Detecção de Conflitos & Publicação */}
      {showManualEditor && (
        <section className="class-schedule-card" style={{ marginBottom: '12px', padding: '14px' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 style={{ margin: 0, fontSize: '0.95rem' }}>
                Cadastro &amp; Edição Manual de Aula (Núcleo Grade Horária Áquila)
              </h2>
              <small style={{ color: '#94a3b8' }}>
                Ajustes manuais com cadeado são preservados automaticamente quando o solver assistido for executado.
              </small>
            </div>
            {manualConflict ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-300">
                {manualConflict}
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                Sem conflito docente detectado neste horário
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Turma</label>
              <select
                value={manualClassId}
                onChange={e => setManualClassId(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              >
                {classCatalog.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Dia</label>
              <select
                value={manualDay}
                onChange={e => setManualDay(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              >
                {DAYS_CONFIG.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Horário / Tempo</label>
              <select
                value={manualPeriod}
                onChange={e => setManualPeriod(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              >
                {VISAO_PERIODS.map(p => (
                  <option key={p.period} value={p.period}>{p.label} ({p.time})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Disciplina</label>
              <input
                type="text"
                value={manualSubject}
                onChange={e => setManualSubject(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Professor(a)</label>
              <select
                value={manualTeacherId}
                onChange={e => setManualTeacherId(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-white"
              >
                {teachers.map(t => (
                  <option key={t.teacherId} value={t.teacherId}>{t.teacherId} ({t.subject})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualLock}
                  onChange={e => setManualLock(e.target.checked)}
                />
                <span>Fixar ajuste</span>
              </label>
              <button
                type="button"
                onClick={handleApplyManualSlot}
                disabled={Boolean(manualConflict)}
                className="btn-setup"
                style={{
                  background: manualConflict ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.2)',
                  borderColor: manualConflict ? '#ef4444' : '#10b981',
                  color: '#fff',
                  justifyContent: 'center'
                }}
              >
                <Save size={13} /> Aplicar &amp; Publicar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Barra de Navegação das 4 Visões da Grade Horária Áquila */}
      <div className="urania-mode-tabs">
        <button
          className={`urania-tab-btn ${viewMode === 'by_class' ? 'active' : ''}`}
          onClick={() => setViewMode('by_class')}
        >
          <ArrowLeftRight size={16} />
          <div>
            <strong>Horário das Turmas & Troca Guiada</strong>
            <small>Permutação 2-opt (Verde = Sem Conflito) & Cadeado</small>
          </div>
        </button>

        <button
          className={`urania-tab-btn ${viewMode === 'by_teacher' ? 'active' : ''}`}
          onClick={() => setViewMode('by_teacher')}
        >
          <Users size={16} />
          <div>
            <strong>Horário dos Professores (41 Docentes)</strong>
            <small>Disponibilidade, Janelas & Hora-Atividade (HAF)</small>
          </div>
        </button>

        <button
          className={`urania-tab-btn ${viewMode === 'master_mosaic' ? 'active' : ''}`}
          onClick={() => setViewMode('master_mosaic')}
        >
          <Grid size={16} />
          <div>
            <strong>Quadro Geral Mosaico (22 Turmas)</strong>
            <small>Espelho Oficial &quot;GRADE INSTITUCIONAL MODELO&quot;</small>
          </div>
        </button>

        <button
          className={`urania-tab-btn ${viewMode === 'quality_audit' ? 'active' : ''}`}
          onClick={() => setViewMode('quality_audit')}
        >
          <BarChart3 size={16} />
          <div>
            <strong>Situação do Horário & Pesos (Grade Horária Áquila)</strong>
            <small>Diagnóstico de Janelas, LAP & Sugestões Assistidas</small>
          </div>
        </button>
      </div>

      {/* Banner de Diagnóstico / Status da Permutação */}
      {aiInsight && (
        <div className={`ai-insight-panel insight-${aiInsight.type} animate-fade-in`}>
          <div className="insight-icon">
            {aiInsight.type === 'success' && <CheckCircle size={20} />}
            {aiInsight.type === 'warn' && <AlertTriangle size={20} />}
            {aiInsight.type === 'error' && <Lock size={20} />}
          </div>
          <div className="insight-content">
            <h4>Grade Horária Áquila • Diagnóstico em Tempo Real</h4>
            <p>{aiInsight.message}</p>
          </div>
          {swapOrigin && (
            <button className="btn-setup" onClick={() => setSwapOrigin(null)}>
              Cancelar Permuta
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          VISÃO 1: HORÁRIO POR TURMA + PERMUTAÇÃO INTELIGENTE 2-OPT (GRADE HORÁRIA ÁQUILA)
         ===================================================================== */}
      {viewMode === 'by_class' && (
        <>
          <div className="urania-filter-strip">
            <div className="urania-segment-pills">
              <span>SEGMENTO:</span>
              {[
                { id: 'ALL', label: 'Todas (22 Turmas)' },
                { id: 'EF1', label: 'Fund. I (1º ao 5º Ano)' },
                { id: 'EF2', label: 'Fund. II (6º ao 9º Ano)' },
                { id: 'EM', label: 'Ensino Médio (1ª a 3ª Série)' }
              ].map(seg => (
                <button
                  key={seg.id}
                  className={`urania-seg-pill ${selectedSegment === seg.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSegment(seg.id as any);
                    setSelectedClassFilter('ALL');
                  }}
                >
                  {seg.label}
                </button>
              ))}
            </div>

            <div className="urania-class-picker">
              <span>TURMA ESPECÍFICA:</span>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
              >
                <option value="ALL">Exibir Turmas do Segmento ({visibleClassIds.length})</option>
                {classCatalog.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="urania-swap-legend">
              <span className="legend-dot free" /> <strong>Verde:</strong> Troca Livre Sem Choque
              <span className="legend-dot blocked" /> <strong>Vermelho:</strong> Choque em Outra Turma
            </div>
          </div>

          <div className="schedules-grid-view">
            {visibleClassIds.map(clsId => {
              const classSlots = generatedSchedules[clsId] || [];
              const maxPeriodInClass = classSlots.reduce((max, s) => Math.max(max, s.period), 5);
              const periodsToRender = VISAO_PERIODS.filter(p => p.period <= maxPeriodInClass);

              return (
                <div key={clsId} className="class-schedule-card">
                  <div className="class-header-flex">
                    <div>
                      <h2>Turma: {getClassName(clsId)}</h2>
                      <small style={{ color: '#94a3b8' }}>
                        Código da Turma: {clsId} • {classSlots.length} tempos semanais
                      </small>
                    </div>
                    <span className="urania-hint-tag">
                      💡 Clique em uma aula para ver em VERDE os horários livres para permuta
                    </span>
                  </div>

                  <div className="schedule-table-wrapper">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th style={{ width: '130px' }}>Horário</th>
                          {DAYS_CONFIG.map(d => (
                            <th key={d.id}>{d.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periodsToRender.map(pInfo => (
                          <tr key={pInfo.period} className={pInfo.afterBreak ? 'row-after-break' : ''}>
                            <td className="period-col">
                              <strong>{pInfo.label}</strong>
                              <span className="period-time">{pInfo.time}</span>
                            </td>
                            {DAYS_CONFIG.map(day => {
                              const slot = classSlots.find(
                                s => s.day === day.id && s.period === pInfo.period
                              ) || {
                                day: day.id,
                                period: pInfo.period,
                                subject: 'JANELA',
                                teacherId: 'none',
                                locked: false
                              };

                              const isHole = slot.subject === 'JANELA' || slot.teacherId === 'none';
                              const isSelectedOrigin =
                                swapOrigin?.classId === clsId &&
                                swapOrigin?.day === day.id &&
                                swapOrigin?.period === pInfo.period;

                              const swapCandidate =
                                swapOrigin?.classId === clsId && !isSelectedOrigin
                                  ? swapEvaluationMap[`${day.id}_${pInfo.period}`]
                                  : null;

                              let swapClass = '';
                              if (isSelectedOrigin) swapClass = 'urania-swap-origin';
                              else if (swapCandidate?.status === 'FREE_DIRECT_SWAP')
                                swapClass = 'urania-swap-free';
                              else if (swapCandidate?.status === 'SOFT_WARNING_SWAP')
                                swapClass = 'urania-swap-warn';
                              else if (swapCandidate?.status === 'BLOCKED')
                                swapClass = 'urania-swap-blocked';

                              return (
                                <td
                                  key={day.id}
                                  className={`slot-cell ${isHole ? 'hole-cell' : 'filled-cell'} ${swapClass}`}
                                  onClick={() =>
                                    handleCellClickForSwap(clsId, day.id, pInfo.period, slot)
                                  }
                                >
                                  <div className="slot-top-bar">
                                    <span className="slot-teacher-badge">{slot.teacherId}</span>
                                    <button
                                      className={`slot-lock-btn ${slot.locked ? 'locked' : ''}`}
                                      onClick={e => toggleLockSlot(e, clsId, day.id, pInfo.period)}
                                      title={
                                        slot.locked
                                          ? 'Aula Fixada (Clique para desafixar)'
                                          : 'Fixar aula com cadeado (Grade Horária Áquila)'
                                      }
                                    >
                                      {slot.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                  </div>

                                  {isHole ? (
                                    <span className="hole-text">— Horário Livre —</span>
                                  ) : (
                                    <div className="slot-info">
                                      <span className="slot-subject">{slot.subject}</span>
                                    </div>
                                  )}

                                  {swapCandidate && (
                                    <div className="swap-tooltip-chip">{swapCandidate.reason}</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =====================================================================
          VISÃO 2: HORÁRIO INDIVIDUAL POR PROFESSOR & MATRIZ DE DISPONIBILIDADE
         ===================================================================== */}
      {viewMode === 'by_teacher' && (
        <section className="urania-teacher-view">
          <div className="urania-teacher-sidebar">
            <h4>Docentes Colégio Áquila Modelo ({teachers.length})</h4>
            <div className="urania-teacher-scroll">
              {teachers.map(t => {
                const defect = qualityReport.teacherDefects.find(d => d.teacherId === t.teacherId);
                return (
                  <button
                    key={t.teacherId}
                    className={`urania-teacher-item ${selectedTeacherId === t.teacherId ? 'active' : ''}`}
                    onClick={() => setSelectedTeacherId(t.teacherId)}
                  >
                    <div>
                      <strong>Prof. {t.teacherId}</strong>
                      <small>{t.subject}</small>
                    </div>
                    <div className="urania-teacher-badges">
                      <span className="t-count-badge">{defect?.totalClasses || 0}h</span>
                      {(defect?.janelasCount || 0) > 0 && (
                        <span className="t-janela-badge">{defect?.janelasCount} jan</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="urania-teacher-main">
            {(() => {
              const activeT =
                teachers.find(t => t.teacherId === selectedTeacherId) || teachers[0];
              const defect = qualityReport.teacherDefects.find(
                d => d.teacherId === activeT.teacherId
              );

              return (
                <div className="class-schedule-card">
                  <div className="class-header-flex">
                    <div>
                      <h2>Grade Individual & Disponibilidade: Prof. {activeT.teacherId}</h2>
                      <small style={{ color: '#94a3b8' }}>
                        Disciplina: {activeT.subject} • Aulas Semanais: {defect?.totalClasses || 0} • Janelas: {defect?.janelasCount || 0} • Score Qualidade: {defect?.qualityScore || 100}%
                      </small>
                    </div>
                    <span className="urania-hint-tag">
                      Clique em qualquer slot livre para alternar: LIVRE ➔ INDISPONÍVEL (Vermelho) ➔ HAF (Hora-Atividade)
                    </span>
                  </div>

                  <div className="schedule-table-wrapper">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th style={{ width: '130px' }}>Horário</th>
                          {DAYS_CONFIG.map(d => (
                            <th key={d.id}>{d.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {VISAO_PERIODS.map(pInfo => (
                          <tr key={pInfo.period}>
                            <td className="period-col">
                              <strong>{pInfo.label}</strong>
                              <span className="period-time">{pInfo.time}</span>
                            </td>
                            {DAYS_CONFIG.map(day => {
                              // Descobrir em quais turmas este professor está dando aula neste dia/período
                              const assignedClasses: string[] = [];
                              Object.entries(generatedSchedules).forEach(([cId, slots]) => {
                                const match = slots.find(
                                  s =>
                                    s.day === day.id &&
                                    s.period === pInfo.period &&
                                    s.teacherId === activeT.teacherId
                                );
                                if (match) assignedClasses.push(getClassName(cId));
                              });

                              const restState =
                                activeT.slotRestrictions?.[`${day.id}_${pInfo.period}`];

                              return (
                                <td
                                  key={day.id}
                                  className={`slot-cell ${
                                    assignedClasses.length > 0
                                      ? 'filled-cell teacher-assigned'
                                      : restState === 'UNAVAILABLE'
                                      ? 'urania-swap-blocked'
                                      : restState === 'HAF'
                                      ? 'extra-cell'
                                      : 'hole-cell'
                                  }`}
                                  onClick={() => {
                                    if (assignedClasses.length === 0) {
                                      toggleTeacherSlotRestriction(
                                        activeT.teacherId,
                                        day.id,
                                        pInfo.period
                                      );
                                    }
                                  }}
                                >
                                  {assignedClasses.length > 0 ? (
                                    <div className="slot-info">
                                      <span className="slot-teacher-badge">
                                        {assignedClasses.join(' + ')}
                                      </span>
                                      <span className="slot-subject">{activeT.subject}</span>
                                    </div>
                                  ) : restState === 'UNAVAILABLE' ? (
                                    <span className="hole-text">🚫 Indisponível (Bloqueado)</span>
                                  ) : restState === 'HAF' ? (
                                    <span className="slot-subject" style={{ color: '#c084fc', fontSize: '0.82rem' }}>
                                      📚 HAF (Hora-Atividade Fixa)
                                    </span>
                                  ) : (
                                    <span className="hole-text" style={{ color: '#64748b' }}>
                                      Livre (Clique p/ bloquear/HAF)
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* =====================================================================
          VISÃO 3: QUADRO GERAL MOSAICO (22 TURMAS × 10 HORÁRIOS — ESPELHO OFICIAL)
         ===================================================================== */}
      {viewMode === 'master_mosaic' && (
        <section className="urania-mosaic-section">
          <div className="urania-filter-strip">
            <div className="urania-segment-pills">
              <span>DIA DO QUADRO GERAL:</span>
              {DAYS_CONFIG.map(d => (
                <button
                  key={d.id}
                  className={`urania-seg-pill ${selectedMosaicDay === d.id ? 'active' : ''}`}
                  onClick={() => setSelectedMosaicDay(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <span className="urania-hint-tag">
              Espelho integral das 22 turmas simultâneas (Padrão "GRADE INSTITUCIONAL MODELO" — Colégio Áquila Modelo)
            </span>
          </div>

          <div className="class-schedule-card">
            <div className="schedule-table-wrapper">
              <table className="schedule-table mosaic-compact-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '95px' }}>Horário</th>
                    {classCatalog.map(c => (
                      <th key={c.id} style={{ minWidth: '88px', textAlign: 'center' }}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VISAO_PERIODS.map(pInfo => (
                    <tr key={pInfo.period}>
                      <td className="period-col">
                        <strong>{pInfo.period}º Hor</strong>
                        <span className="period-time">{pInfo.time.split(' ')[0]}</span>
                      </td>
                      {classCatalog.map(c => {
                        const slot = (generatedSchedules[c.id] || []).find(
                          s => s.day === selectedMosaicDay && s.period === pInfo.period
                        );
                        return (
                          <td
                            key={c.id}
                            className="mosaic-cell"
                            onClick={() => {
                              setSelectedClassFilter(c.id);
                              setSelectedSegment('ALL');
                              setViewMode('by_class');
                            }}
                            title={`Clique para abrir e permutar na turma ${c.name}`}
                          >
                            {slot && slot.teacherId !== 'none' ? (
                              <span className="mosaic-teacher-chip">{slot.teacherId}</span>
                            ) : (
                              <span className="mosaic-empty">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          VISÃO 4: SITUAÇÃO DO HORÁRIO & PESOS DE OTIMIZAÇÃO (GRADE HORÁRIA ÁQUILA)
         ===================================================================== */}
      {viewMode === 'quality_audit' && (
        <section className="urania-quality-section">
          <div className="urania-quality-grid">
            {/* Painel de Pesos Grade Horária Áquila pos[0..39] */}
            <div className="class-schedule-card urania-weights-card">
              <div className="class-header-flex">
                <h2>
                  <Sliders size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  Vetor de Pesos do Solver Assistido (Grade Horária Áquila [-10 a +10])
                </h2>
              </div>
              <div className="urania-sliders-body">
                <div className="urania-slider-row">
                  <label>
                    <span>Prioridade de Eliminação de Janelas Docentes (<code>pos[0]</code>)</span>
                    <strong>Peso: {weights.weightJanelas}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={weights.weightJanelas}
                    onChange={e =>
                      setWeights(prev => ({ ...prev, weightJanelas: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="urania-slider-row">
                  <label>
                    <span>Estímulo a Aulas Geminadas / Dobradinhas Ideais (<code>pos[7]</code>)</span>
                    <strong>Peso: {weights.weightGeminadas}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={weights.weightGeminadas}
                    onChange={e =>
                      setWeights(prev => ({ ...prev, weightGeminadas: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="urania-slider-row">
                  <label>
                    <span>Evitar Dias com Aula Única para o Professor (<code>pos[5]</code>)</span>
                    <strong>Peso: {weights.weightSingleClassDay}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={weights.weightSingleClassDay}
                    onChange={e =>
                      setWeights(prev => ({
                        ...prev,
                        weightSingleClassDay: Number(e.target.value)
                      }))
                    }
                  />
                </div>

                <div className="urania-slider-row">
                  <label>
                    <span>Rigor do Limite de Aulas por Professor na Turma — LAP (<code>pos[33]</code>)</span>
                    <strong>Peso: {weights.weightLAP}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={weights.weightLAP}
                    onChange={e =>
                      setWeights(prev => ({ ...prev, weightLAP: Number(e.target.value) }))
                    }
                  />
                </div>

                <button className="btn-generate" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate}>
                  <Play size={16} /> Reotimizar Grade com Estes Pesos
                </button>
              </div>
            </div>

            {/* Sugestões Automáticas de Flexibilização (verSugestoesController) */}
            <div className="class-schedule-card urania-suggestions-card">
              <div className="class-header-flex">
                <h2>Sugestões de Melhoria &amp; Flexibilização (Grade Horária Áquila)</h2>
              </div>
              <div className="urania-suggestions-list">
                {qualityReport.suggestions.map(sug => (
                  <div key={sug.id} className="urania-suggestion-item">
                    <div>
                      <strong>Prof. {sug.teacherId}</strong>
                      <p>{sug.description}</p>
                    </div>
                    <button
                      className="btn-setup"
                      onClick={() => {
                        handleGenerate();
                      }}
                    >
                      <CheckCircle2 size={14} /> Acatar ({sug.impact})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela de Auditoria Docente (situacaoDoHorarioController) */}
          <div className="class-schedule-card" style={{ marginTop: '18px' }}>
            <div className="class-header-flex">
              <h2>Situação do Horário por Professor (Auditoria de Janelas & Concentração)</h2>
            </div>
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Professor(a)</th>
                    <th>Aulas Alocadas</th>
                    <th>Dias na Escola</th>
                    <th>Janelas no Turno</th>
                    <th>Localização das Janelas</th>
                    <th>Dias de Aula Única</th>
                    <th>Índice Individual</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityReport.teacherDefects.map(td => (
                    <tr key={td.teacherId}>
                      <td><strong>Prof. {td.teacherId}</strong></td>
                      <td>{td.totalClasses} aulas/sem</td>
                      <td>{td.workingDaysCount} dias</td>
                      <td>
                        <span className={td.janelasCount === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          <strong>{td.janelasCount}</strong>
                        </span>
                      </td>
                      <td>{td.janelasLocations.length > 0 ? td.janelasLocations.join(', ') : 'Zero Janelas ✨'}</td>
                      <td>{td.singleClassDays.length > 0 ? td.singleClassDays.join(', ') : 'Nenhum'}</td>
                      <td><strong>{td.qualityScore}%</strong></td>
                      <td>
                        <button
                          className="btn-setup"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => {
                            setSelectedTeacherId(td.teacherId);
                            setViewMode('by_teacher');
                          }}
                        >
                          Inspecionar Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default TimetableBuilder;
