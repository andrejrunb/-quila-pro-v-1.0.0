    "coordination",
    "teacher_request",
    "other"
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoomExit = typeof roomExits.$inferSelect;
export type InsertRoomExit = typeof roomExits.$inferInsert;

/**
 * Student Comparisons (Comparativos do Aluno)
 * Armazena comparativos pré-calculados com turma e escola
 */
export const studentComparisons = mysqlTable("student_comparisons", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  academicPeriodId: int("academicPeriodId").notNull().references(() => academicPeriods.id),
  classAveragePresence: int("classAveragePresence").notNull(), // percentual
  schoolAveragePresence: int("schoolAveragePresence").notNull(), // percentual
  classRankingPosition: int("classRankingPosition").notNull(), // 1º, 2º, etc
  classRankingTotal: int("classRankingTotal").notNull(), // total de alunos
  classPercentile: int("classPercentile").notNull(), // 0-100
  schoolPercentile: int("schoolPercentile").notNull(), // 0-100
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentComparison = typeof studentComparisons.$inferSelect;
export type InsertStudentComparison = typeof studentComparisons.$inferInsert;
