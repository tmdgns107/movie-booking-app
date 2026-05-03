export interface PasswordRule {
  message: string;
  valid: boolean;
}

const SPECIAL_CHAR = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/;

function hasSequentialDigits(pw: string): boolean {
  for (let i = 0; i < pw.length - 2; i++) {
    const a = pw.charCodeAt(i);
    const b = pw.charCodeAt(i + 1);
    const c = pw.charCodeAt(i + 2);
    const aIsDigit = a >= 48 && a <= 57;
    const bIsDigit = b >= 48 && b <= 57;
    const cIsDigit = c >= 48 && c <= 57;
    if (aIsDigit && bIsDigit && cIsDigit) {
      if (b - a === 1 && c - b === 1) return true; // 오름차순 (123)
      if (a - b === 1 && b - c === 1) return true; // 내림차순 (987)
    }
  }
  return false;
}

export function validatePassword(password: string): PasswordRule[] {
  return [
    {
      message: '8자 이상',
      valid: password.length >= 8,
    },
    {
      message: '특수문자 1개 이상 포함',
      valid: SPECIAL_CHAR.test(password),
    },
    {
      message: '연속된 숫자 3개 이상 불가 (예: 123, 987)',
      valid: !hasSequentialDigits(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password).every((r) => r.valid);
}
