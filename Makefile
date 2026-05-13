.PHONY: install lint test build dev update clean next merge

install:
	bun install --no-audit --no-fund

lint: install
	bunx oxlint .

test: lint
	CI=CI node ./node_modules/vitest/vitest.mjs run --coverage

build: test
	rm -Rf dist
	bunx tsc --build

dev: install
	npx @modelcontextprotocol/inspector bun --watch src/index.ts

update: 
	bunx npm-check-updates -u 
	bun install --no-audit --no-fund

clean:
	@chmod +x .scripts/clean.sh || true
	@.scripts/clean.sh

next:
	git rev-parse --verify next >/dev/null 2>&1 || git branch next
	git switch next

merge:
	git pull origin main
	git checkout main
	git merge next
	git push -u origin main
	sleep 1
	make clean