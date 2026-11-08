import { TimetableSolverService, timetableSolverService, TimetableRequirementInput } from '../TimetableSolverService';

describe('TimetableSolverService Unit Tests (SA+GLS Hybrid Solver)', () => {
  test('Deve ser um Singleton retornando a mesma instância', () => {
    const a = TimetableSolverService.getInstance();
    const b = TimetableSolverService.getInstance();
    expect(a).toBe(b);
    expect(a).toBe(timetableSolverService);
  });

  test('Deve rejeitar matriz curricular vazia', () => {
    expect(() =>
      timetableSolverService.solveTimetable({
        num_classes: 2,
        num_teachers: 4,
        num_rooms: 2,
        requirements: [],
      })
    ).toThrow('não pode estar vazia');
  });

  test('Deve resolver grade horária escolar com 0 violações Hard em <2 segundos', () => {
    const requirements: TimetableRequirementInput[] = [];
    let reqCounter = 1;
    const numClasses = 6;
    const numTeachers = 18;
    const numRooms = 8;

    for (let c = 0; c < numClasses; c++) {
      for (let subj = 0; subj < 7; subj++) {
        requirements.push({
          req_id: reqCounter++,
          class_id: c,
          teacher_id: (c * 2 + subj) % numTeachers,
          subject_id: subj,
          room_id: c % numRooms,
          building_id: c < 3 ? 0 : 1,
          weekly_lessons: 5,
        });
      }
    }

    const res = timetableSolverService.solveTimetable({
      num_classes: numClasses,
      num_teachers: numTeachers,
      num_rooms: numRooms,
      days: 5,
      periods_per_day: 7,
      time_limit_sec: 0.65,
      requirements,
    });

    expect(res.hard_violations).toBe(0);
    expect(res.iterations).toBeGreaterThan(100);
    expect(res.schedule).toHaveLength(numClasses);
    expect(res.schedule[0]).toHaveLength(35);
  });
});
