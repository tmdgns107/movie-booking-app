import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

/**
 * 모든 예외를 일관된 JSON 형식으로 응답하는 전역 필터.
 * - HttpException: 그대로 매핑
 * - Prisma known request error: 적절한 HTTP 상태로 변환 (P2002/P2025/P2003)
 * - 그 외 unknown error: 500 + 일반 메시지 (운영 환경에서 내부 정보 노출 차단)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolveError(exception);

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      ...(error ? { error } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 5xx는 stack 포함 error 로그, 4xx는 warn 로그
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status} ${this.toMessageString(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${status} ${this.toMessageString(message)}`,
      );
    }

    response.status(status).json(body);
  }

  private resolveError(exception: unknown): {
    status: number;
    message: string | string[];
    error?: string;
  } {
    // 1. NestJS HttpException 계열 (NotFoundException, ConflictException 등)
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const status = exception.getStatus();
      if (typeof res === 'string') {
        return { status, message: res };
      }
      const obj = res as { message?: string | string[]; error?: string };
      return {
        status,
        message: obj.message ?? exception.message,
        error: obj.error,
      };
    }

    // 2. Prisma known request error → HTTP 상태로 매핑
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: '요청하신 리소스를 찾을 수 없습니다.',
            error: 'Not Found',
          };
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: '중복된 값이 존재합니다.',
            error: 'Conflict',
          };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: '참조하는 리소스가 유효하지 않습니다.',
            error: 'Bad Request',
          };
        default:
          return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: '데이터베이스 처리 중 오류가 발생했습니다.',
            error: 'Internal Server Error',
          };
      }
    }

    // 3. Prisma validation error (잘못된 쿼리)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: '요청 형식이 올바르지 않습니다.',
        error: 'Bad Request',
      };
    }

    // 4. unknown error → 500
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '서버 내부 오류가 발생했습니다.',
      error: 'Internal Server Error',
    };
  }

  private toMessageString(message: string | string[]): string {
    return Array.isArray(message) ? message.join(', ') : message;
  }
}
