#!/bin/bash
# ============================================================
# start.sh — 이후 재실행 시 사용 (DB는 이미 초기화된 상태)
# 사용법: bash scripts/start.sh
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 사전 요구사항 확인 ─────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker가 설치되어 있지 않습니다."
command -v node   >/dev/null 2>&1 || error "Node.js가 설치되어 있지 않습니다."

# ── 1. PostgreSQL 컨테이너 기동 ────────────────────────────
info "PostgreSQL 컨테이너를 시작합니다..."
cd "$ROOT_DIR"
docker compose up -d

# ── 2. DB 준비 대기 ────────────────────────────────────────
info "DB 준비 대기 중..."
RETRIES=20
until docker compose exec -T postgres pg_isready -U admin -d movie_booking >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  [ $RETRIES -eq 0 ] && error "DB 연결 실패."
  sleep 1
done
info "DB 준비 완료."

# ── 3. 서버 기동 ───────────────────────────────────────────
info "백엔드 서버를 시작합니다..."
cd "$BACKEND_DIR"
npm run start:dev &
BACKEND_PID=$!

info "프론트엔드 서버를 시작합니다..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  서버 기동 완료!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  백엔드  →  http://localhost:3001/api"
echo "  Swagger →  http://localhost:3001/api-docs"
echo "  프론트  →  http://localhost:3000"
echo ""
echo "  종료하려면 Ctrl+C 를 누르세요."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose stop; echo '서버를 종료했습니다.'" INT TERM

wait $BACKEND_PID $FRONTEND_PID
