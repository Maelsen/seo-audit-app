import type { Grade } from "./types";

export const ALL_GRADES: Grade[] = [
  "A+", "A", "A-",
  "B+", "B", "B-",
  "C+", "C", "C-",
  "D+", "D", "D-",
  "F",
];

export function gradeToPercent(grade: Grade): number {
  const idx = ALL_GRADES.indexOf(grade);
  if (idx === -1) return 0;
  return Math.round(((ALL_GRADES.length - idx) / ALL_GRADES.length) * 100);
}

export function gradeColor(grade: Grade): string {
  const letter = grade.charAt(0);
  switch (letter) {
    case "A":
      return "#22c55e";
    case "B":
      return "#a855f7";
    case "C":
      return "#38E1E1";
    case "D":
      return "#f97316";
    case "F":
    default:
      return "#ef4444";
  }
}

export function scoreToGrade(score: number): Grade {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}
