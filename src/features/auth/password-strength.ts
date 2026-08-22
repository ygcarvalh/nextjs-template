import { MIN_PASSWORD_LENGTH } from "@/features/auth/types";

export const STRENGTHS = ["empty", "weak", "fair", "strong"] as const;

export type Strength = (typeof STRENGTHS)[number];

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^a-z\d]/i];
const LONG_LENGTH = 12;
const VERY_LONG_LENGTH = 16;
const STRONG_SCORE = 4;

function classesUsed(password: string): number {
  return CHARACTER_CLASSES.filter((pattern) => pattern.test(password)).length;
}

// One repeated character and a walk up or down the keyboard both leave every
// gap between neighbours identical, so a single pass catches the two of them.
function walksInOneDirection(password: string): boolean {
  const codes = Array.from(password.toLowerCase(), (character) => character.charCodeAt(0));
  const step = codes[1] - codes[0];
  return (
    Math.abs(step) <= 1 &&
    codes.every((code, index) => index === 0 || code - codes[index - 1] === step)
  );
}

function lengthPoints(length: number): number {
  if (length >= VERY_LONG_LENGTH) {
    return 3;
  }
  return length >= LONG_LENGTH ? 2 : 1;
}

// Advisory only: the form still submits whatever clears the API floor, because
// this reads length and variety and knows nothing about a password being famous.
export function passwordStrength(password: string): Strength {
  if (!password) {
    return "empty";
  }

  const classes = classesUsed(password);
  if (password.length < MIN_PASSWORD_LENGTH || classes === 1 || walksInOneDirection(password)) {
    return "weak";
  }

  return lengthPoints(password.length) + classes - 1 >= STRONG_SCORE ? "strong" : "fair";
}
