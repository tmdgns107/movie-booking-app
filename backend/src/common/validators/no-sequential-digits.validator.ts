import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * 비밀번호 내 3자 이상 연속된 숫자(오름차순/내림차순) 포함 시 검증 실패 처리.
 * 예) "abc123!" (123) / "qwe987" (987) → 거부
 *     "abc135!" (135는 비연속) → 허용
 */
export function NoSequentialDigits(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noSequentialDigits',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;

          for (let i = 0; i <= value.length - 3; i++) {
            const a = value.charCodeAt(i);
            const b = value.charCodeAt(i + 1);
            const c = value.charCodeAt(i + 2);
            // ASCII 0x30(0) ~ 0x39(9) 범위에서만 검사
            const isDigit = (n: number) => n >= 0x30 && n <= 0x39;
            if (!isDigit(a) || !isDigit(b) || !isDigit(c)) continue;

            if (b === a + 1 && c === b + 1) return false; // 오름차순 (예: 123)
            if (b === a - 1 && c === b - 1) return false; // 내림차순 (예: 987)
          }
          return true;
        },
        defaultMessage(_args: ValidationArguments) {
          return '비밀번호에 3자 이상 연속된 숫자(예: 123, 987)를 포함할 수 없습니다.';
        },
      },
    });
  };
}
