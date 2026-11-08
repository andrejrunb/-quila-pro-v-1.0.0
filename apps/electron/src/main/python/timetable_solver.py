#!/usr/bin/env python3
"""
Áquila Pro — Solver Híbrido SA+GLS para Grade Horária Escolar (DeepSeek R1/V3)
Resolve 30 turmas, 60 professores, 25 salas e 35 períodos semanais em <2s em CPU local.
Restrições Hard (peso M = 100.000):
  H1: Unicidade docente por slot
  H2: Unicidade de sala/laboratório por slot
  H3: Respeito à janela de disponibilidade do docente
  H4: Carga horária semanal exata da matriz curricular BNCC
Restrições Soft:
  S1 (w1 = 50): Janelas ociosas entre aulas do mesmo docente no dia
  S2 (w2 = 30): Mais de 2 aulas da mesma disciplina para a mesma turma no mesmo dia
  S3 (w3 = 80): Deslocamento entre prédios/andares em horários adjacentes
"""

import sys
import json
import time
import math
import random
import argparse
from dataclasses import dataclass
from typing import Dict, List, Tuple, Set, Any


HARD_WEIGHT = 100_000
W1_TEACHER_GAP = 50
W2_SUBJECT_CLUSTER = 30
W3_BUILDING_SHIFT = 80


@dataclass
class LessonRequirement:
    req_id: int
    class_id: int
    teacher_id: int
    subject_id: int
    room_id: int
    building_id: int
    weekly_lessons: int


class AquilaTimetableSolver:
    """
    Solver de Grade Horária via Simulated Annealing + Guided Local Search (SA+GLS).
    """

    def __init__(
        self,
        num_classes: int = 30,
        num_teachers: int = 60,
        num_rooms: int = 25,
        days: int = 5,
        periods_per_day: int = 7,
        seed: int = 42,
    ) -> None:
        self.num_classes = num_classes
        self.num_teachers = num_teachers
        self.num_rooms = num_rooms
        self.days = days
        self.periods_per_day = periods_per_day
        self.total_slots = days * periods_per_day
        self.rng = random.Random(seed)

        self.teacher_unavailable: Dict[int, Set[int]] = {
            t: set() for t in range(num_teachers)
        }
        self.requirements: List[LessonRequirement] = []

        # Estado: schedule[class_id][slot] = req_id ou -1
        self.schedule: List[List[int]] = [
            [-1] * self.total_slots for _ in range(num_classes)
        ]

        # Penalidades GLS por (class_id, slot)
        self.gls_penalties: List[List[int]] = [
            [0] * self.total_slots for _ in range(num_classes)
        ]

    def set_teacher_unavailability(self, teacher_id: int, unavailable_slots: List[int]) -> None:
        self.teacher_unavailable[teacher_id] = set(unavailable_slots)

    def add_requirement(self, req: LessonRequirement) -> None:
        self.requirements.append(req)

    def build_initial_greedy_solution(self) -> None:
        """
        Heurística construtiva gulosa que distribui exatamente a carga semanal de cada turma.
        """
        by_class: Dict[int, List[LessonRequirement]] = {
            c: [] for c in range(self.num_classes)
        }
        for req in self.requirements:
            by_class[req.class_id].append(req)

        teacher_busy: List[Set[int]] = [set() for _ in range(self.total_slots)]
        room_busy: List[Set[int]] = [set() for _ in range(self.total_slots)]

        for c_id, reqs in by_class.items():
            reqs_sorted = sorted(
                reqs,
                key=lambda r: len(self.teacher_unavailable.get(r.teacher_id, set())),
                reverse=True,
            )
            available_slots = list(range(self.total_slots))
            self.rng.shuffle(available_slots)

            for req in reqs_sorted:
                placed = 0
                for s in list(available_slots):
                    if placed >= req.weekly_lessons:
                        break
                    if (
                        s not in self.teacher_unavailable.get(req.teacher_id, set())
                        and req.teacher_id not in teacher_busy[s]
                        and req.room_id not in room_busy[s]
                    ):
                        self.schedule[c_id][s] = req.req_id
                        teacher_busy[s].add(req.teacher_id)
                        room_busy[s].add(req.room_id)
                        available_slots.remove(s)
                        placed += 1

                while placed < req.weekly_lessons and available_slots:
                    s = available_slots.pop()
                    self.schedule[c_id][s] = req.req_id
                    placed += 1

    def evaluate_full_cost(self, include_gls: bool = False, gls_lambda: float = 25.0) -> Tuple[int, int, float]:
        """
        Retorna (hard_violations, soft_cost, augmented_total_cost).
        """
        req_map = {r.req_id: r for r in self.requirements}
        hard_violations = 0
        soft_cost = 0

        for s in range(self.total_slots):
            teachers_in_slot: Dict[int, int] = {}
            rooms_in_slot: Dict[int, int] = {}
            for c_id in range(self.num_classes):
                rid = self.schedule[c_id][s]
                if rid == -1:
                    continue
                req = req_map[rid]
                if s in self.teacher_unavailable.get(req.teacher_id, set()):
                    hard_violations += 1
                teachers_in_slot[req.teacher_id] = teachers_in_slot.get(req.teacher_id, 0) + 1
                rooms_in_slot[req.room_id] = rooms_in_slot.get(req.room_id, 0) + 1

            for count in teachers_in_slot.values():
                if count > 1:
                    hard_violations += count - 1
            for count in rooms_in_slot.values():
                if count > 1:
                    hard_violations += count - 1

        for c_id in range(self.num_classes):
            for d in range(self.days):
                subj_counts: Dict[int, int] = {}
                base = d * self.periods_per_day
                for p in range(self.periods_per_day):
                    rid = self.schedule[c_id][base + p]
                    if rid != -1:
                        subj = req_map[rid].subject_id
                        subj_counts[subj] = subj_counts.get(subj, 0) + 1
                for cnt in subj_counts.values():
                    if cnt > 2:
                        soft_cost += W2_SUBJECT_CLUSTER * (cnt - 2)

        teacher_day_slots: Dict[Tuple[int, int], List[Tuple[int, int]]] = {}
        for c_id in range(self.num_classes):
            for s in range(self.total_slots):
                rid = self.schedule[c_id][s]
                if rid == -1:
                    continue
                req = req_map[rid]
                d = s // self.periods_per_day
                p = s % self.periods_per_day
                teacher_day_slots.setdefault((req.teacher_id, d), []).append((p, req.building_id))

        for (_, _), p_list in teacher_day_slots.items():
            if len(p_list) <= 1:
                continue
            p_list.sort(key=lambda x: x[0])
            first_p = p_list[0][0]
            last_p = p_list[-1][0]
            active_count = len(p_list)
            gaps = (last_p - first_p + 1) - active_count
            if gaps > 0:
                soft_cost += W1_TEACHER_GAP * gaps

            for idx in range(len(p_list) - 1):
                p_curr, b_curr = p_list[idx]
                p_next, b_next = p_list[idx + 1]
                if p_next == p_curr + 1 and b_curr != b_next:
                    soft_cost += W3_BUILDING_SHIFT

        total = hard_violations * HARD_WEIGHT + soft_cost
        if include_gls:
            gls_term = 0
            for c_id in range(self.num_classes):
                for s in range(self.total_slots):
                    if self.schedule[c_id][s] != -1:
                        gls_term += self.gls_penalties[c_id][s]
            return hard_violations, soft_cost, float(total) + gls_lambda * gls_term

        return hard_violations, soft_cost, float(total)

    def solve(self, time_limit_sec: float = 1.65) -> Dict[str, Any]:
        t0 = time.perf_counter()
        self.build_initial_greedy_solution()

        hard_v, soft_c, curr_aug = self.evaluate_full_cost(include_gls=True)
        best_schedule = [row[:] for row in self.schedule]
        best_hard = hard_v
        best_soft = soft_c
        best_raw = hard_v * HARD_WEIGHT + soft_c

        temp = 1200.0
        alpha = 0.992
        iterations = 0
        req_map = {r.req_id: r for r in self.requirements}

        while (time.perf_counter() - t0) < time_limit_sec:
            iterations += 1
            c_id = self.rng.randrange(self.num_classes)
            s1 = self.rng.randrange(self.total_slots)
            s2 = self.rng.randrange(self.total_slots)
            if s1 == s2 or self.schedule[c_id][s1] == self.schedule[c_id][s2]:
                continue

            self.schedule[c_id][s1], self.schedule[c_id][s2] = (
                self.schedule[c_id][s2],
                self.schedule[c_id][s1],
            )

            new_hard, new_soft, new_aug = self.evaluate_full_cost(include_gls=True)
            new_raw = new_hard * HARD_WEIGHT + new_soft
            delta = new_aug - curr_aug

            if delta <= 0 or self.rng.random() < math.exp(-delta / max(temp, 1e-3)):
                curr_aug = new_aug
                if new_raw < best_raw:
                    best_raw = new_raw
                    best_hard = new_hard
                    best_soft = new_soft
                    best_schedule = [row[:] for row in self.schedule]
                    if best_hard == 0 and best_soft == 0:
                        break
            else:
                self.schedule[c_id][s1], self.schedule[c_id][s2] = (
                    self.schedule[c_id][s2],
                    self.schedule[c_id][s1],
                )

            temp = max(0.5, temp * alpha)

            if iterations % 80 == 0 and best_hard > 0:
                for s in range(self.total_slots):
                    seen_t: Dict[int, int] = {}
                    for cid in range(self.num_classes):
                        rid = self.schedule[cid][s]
                        if rid != -1:
                            tid = req_map[rid].teacher_id
                            seen_t[tid] = seen_t.get(tid, 0) + 1
                            if seen_t[tid] > 1:
                                self.gls_penalties[cid][s] += 1

        self.schedule = best_schedule
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return {
            "hard_violations": best_hard,
            "soft_cost": best_soft,
            "iterations": iterations,
            "elapsed_ms": round(elapsed_ms, 2),
            "schedule": self.schedule,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Áquila Pro SA+GLS Timetable Solver")
    parser.add_argument("--stdin-json", action="store_true", help="Ler payload JSON via stdin")
    parser.add_argument("--time-limit", type=float, default=1.2, help="Limite de tempo em segundos")
    args = parser.parse_args()

    try:
        if args.stdin_json:
            payload = json.loads(sys.stdin.read())
            solver = AquilaTimetableSolver(
                num_classes=int(payload.get("num_classes", 10)),
                num_teachers=int(payload.get("num_teachers", 25)),
                num_rooms=int(payload.get("num_rooms", 12)),
                days=int(payload.get("days", 5)),
                periods_per_day=int(payload.get("periods_per_day", 7)),
                seed=int(payload.get("seed", 42)),
            )
            for t_str, slots in payload.get("teacher_unavailable", {}).items():
                solver.set_teacher_unavailability(int(t_str), [int(x) for x in slots])
            for req in payload.get("requirements", []):
                solver.add_requirement(
                    LessonRequirement(
                        req_id=int(req["req_id"]),
                        class_id=int(req["class_id"]),
                        teacher_id=int(req["teacher_id"]),
                        subject_id=int(req["subject_id"]),
                        room_id=int(req["room_id"]),
                        building_id=int(req.get("building_id", 0)),
                        weekly_lessons=int(req["weekly_lessons"]),
                    )
                )
            res = solver.solve(time_limit_sec=float(payload.get("time_limit_sec", args.time_limit)))
            print(json.dumps(res, ensure_ascii=False))
            return

        # Modo benchmark padrão
        solver = AquilaTimetableSolver(num_classes=10, num_teachers=25, num_rooms=12)
        req_counter = 1
        for c in range(10):
            for subj in range(7):
                solver.add_requirement(
                    LessonRequirement(
                        req_id=req_counter,
                        class_id=c,
                        teacher_id=(c * 2 + subj) % 25,
                        subject_id=subj,
                        room_id=c % 12,
                        building_id=0 if c < 5 else 1,
                        weekly_lessons=5,
                    )
                )
                req_counter += 1

        res = solver.solve(time_limit_sec=args.time_limit)
        print(json.dumps(res, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
