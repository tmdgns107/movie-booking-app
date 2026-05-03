#!/bin/bash
# ============================================================
# setup.sh — 최초 1회 실행 (DB 초기화 + 시드 + 서버 기동)
# 사용법: bash scripts/setup.sh
# ============================================================

set -e  # 에러 발생 시 즉시 중단

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── 색상 출력 헬퍼 ─────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 사전 요구사항 확인 ─────────────────────────────────────
info "사전 요구사항을 확인합니다..."

command -v docker  >/dev/null 2>&1 || error "Docker가 설치되어 있지 않습니다."
command -v node    >/dev/null 2>&1 || error "Node.js가 설치되어 있지 않습니다."
command -v npm     >/dev/null 2>&1 || error "npm이 설치되어 있지 않습니다."

# ── .env 파일 확인 ─────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    warning ".env 파일이 없어 .env.example을 복사합니다."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  else
    error "backend/.env 파일이 없습니다. .env.example을 참고하여 생성해 주세요."
  fi
fi

# ── 1. PostgreSQL 컨테이너 기동 ────────────────────────────
info "PostgreSQL 컨테이너를 시작합니다..."
cd "$ROOT_DIR"
docker compose up -d

# ── 2. DB 준비 대기 (최대 30초) ────────────────────────────
info "DB가 준비될 때까지 대기합니다..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U admin -d movie_booking >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    error "DB가 30초 내에 준비되지 않았습니다."
  fi
  sleep 1
done
info "DB 준비 완료."

# ── 3. 백엔드 의존성 설치 ──────────────────────────────────
info "백엔드 의존성을 설치합니다..."
cd "$BACKEND_DIR"
npm install

# ── 4. DB 마이그레이션 ─────────────────────────────────────
info "DB 마이그레이션을 실행합니다..."
npx prisma migrate deploy

# ── 5. Prisma Client 생성 ──────────────────────────────────
info "Prisma Client를 생성합니다..."
npx prisma generate

# ── 6. 시드 데이터 주입 ────────────────────────────────────
info "시드 데이터를 주입합니다..."
npx ts-node prisma/seed.ts

# ── 7. 프론트엔드 의존성 설치 ──────────────────────────────
info "프론트엔드 의존성을 설치합니다..."
cd "$FRONTEND_DIR"
npm install

# ── 8. 서버 기동 ───────────────────────────────────────────
info "서버를 기동합니다..."

# 백엔드 백그라운드 실행
cd "$BACKEND_DIR"
npm run start:dev &
BACKEND_PID=$!

# 프론트엔드 백그라운드 실행
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  설정 완료!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  백엔드  →  http://localhost:3001/api"
echo "  Swagger →  http://localhost:3001/api-docs"
echo "  프론트  →  http://localhost:3000"
echo ""
echo "  종료하려면 Ctrl+C 를 누르세요."
echo ""

# Ctrl+C 시 두 프로세스 모두 종료
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose stop; echo '서버를 종료했습니다.'" INT TERM

# 두 프로세스가 끝날 때까지 대기
wait $BACKEND_PID $FRONTEND_PID
