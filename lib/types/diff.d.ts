declare module 'diff' {
  interface DiffPart {
    value: string;
    added?: boolean;
    removed?: boolean;
  }

  export function diffChars(oldStr: string, newStr: string): DiffPart[];
  export function diffWords(oldStr: string, newStr: string): DiffPart[];
  export function diffLines(oldStr: string, newStr: string): DiffPart[];
}
