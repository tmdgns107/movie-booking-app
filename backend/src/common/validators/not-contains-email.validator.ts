import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * 비밀번호 내 이메일 local part(@ 앞부분) 포함 시 검증 실패 처리.
 * 예) email="alice@x.com", password="alice123!" → 거부.
 */
export function NotContainsEmail(
  emailProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'notContainsEmail',
      target: object.constructor,
      propertyName,
      constraints: [emailProperty],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          const [relatedProperty] = args.constraints as [string];
          const email = (args.object as Record<string, unknown>)[
            relatedProperty
          ];
          if (typeof email !== 'string' || !email.includes('@')) return true;

          const localPart = email.split('@')[0].toLowerCase();
          // local part 3자 미만 시 우연 매칭 가능성 → 검증 스킵
          if (localPart.length < 3) return true;
          return !value.toLowerCase().includes(localPart);
        },
        defaultMessage() {
          return '비밀번호에 이메일과 동일한 문자열을 포함할 수 없습니다.';
        },
      },
    });
  };
}
