.PHONY: install lint test build update

install:
	bun install --no-audit --no-fund

lint: install
	bunx oxlint .

test: lint
	CI=CI node ./node_modules/vitest/vitest.mjs run --coverage

build: test
	rm -Rf dist
	bunx tsc --build

update: 
	bunx npm-check-updates -u 
	bun install --no-audit --no-fund