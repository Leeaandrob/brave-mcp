# Makefile for Brave Search MCP Server

# Variables
PROJECT_NAME = brave-search-mcp-server
BUILD_DIR = dist
SRC_DIR = src

# Targets
.PHONY: all build clean run test lint

all: build

build:
	pnpm run build

clean:
	rm -rf $(BUILD_DIR)

run:
	pnpm run start

test:
	pnpm run test

lint:
	pnpm run lint

dev:
	pnpm run dev

# Help target
help:
	@echo "Makefile for $(PROJECT_NAME)"
	@echo "Targets:"
	@echo "  all    : Default target. Builds the project."
	@echo "  build  : Builds the project using TypeScript compiler."
	@echo "  clean  : Removes the build directory."
	@echo "  run    : Runs the built application."
	@echo "  test   : Runs tests using Jest."
	@echo "  lint   : Lints the TypeScript code."
	@echo "  dev    : Runs the application in development mode."
	@echo "  help   : Displays this help message."