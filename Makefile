.PHONY: help setup start stop dev db-reset test test-watch test-e2e lint typecheck build clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Install deps and create .env.local from example
	@test -f .env.local || cp .env.local.example .env.local && echo "Created .env.local from example"
	bun install

start: ## Start Supabase local stack
	supabase start

stop: ## Stop Supabase local stack
	supabase stop

dev: ## Start Next.js dev server
	bun run dev

db-reset: ## Reset DB: apply migrations + seed data
	supabase db reset

test: ## Run unit + integration tests
	bun run test

test-watch: ## Run tests in watch mode
	bun run test:watch

test-e2e: ## Run Playwright E2E tests
	bun run test:e2e

lint: ## Run ESLint
	bun run lint

typecheck: ## Run TypeScript type checking
	bun run typecheck

build: ## Production build
	bun run build

clean: ## Stop Supabase and remove build artifacts
	supabase stop --no-backup 2>/dev/null || true
	rm -rf .next node_modules
