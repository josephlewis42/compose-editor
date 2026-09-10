VERSION?=v0.0.0

.PHONY: all
all: build test

.PHONY: build
build: build-dir composeeditor frontend

.PHONY: composeeditor
composeeditor: build-dir proto
	go build -ldflags "-X main.version=$(VERSION)" -o build/composeeditor main.go

.PHONY: test
test:
	go test -cover ./...

.PHONY: wasm
wasm:
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o frontend/public/composeeditor.wasm pkg/browser/wasm.go
	cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" frontend/public/wasm_exec.js

.PHONY: templates
templates: composeeditor
	./build/composeeditor build specs frontend/public/templates.binpb

# proto regenerates the generated Go (gen/composeeditor/v1) and TS
# (frontend/src/gen/composeeditor/v1) types from proto/, plus
# specs/form_fields.md (see pkg/docgen). Run after editing proto/**.proto;
# the output is committed, so this isn't part of the normal build.
.PHONY: proto
proto:
	buf generate proto
	buf build proto -o build/buf-image.binpb

# frontend-data regenerates the two generated inputs the frontend reads at
# runtime (public/composeeditor.wasm+wasm_exec.js, public/templates.json)
# without doing a full production build. Used by Tilt to keep `pnpm dev`
# fed with fresh data.
.PHONY: frontend-data
frontend-data: wasm templates

.PHONY: frontend
frontend: build-dir frontend-data proto
	cd frontend; pnpm install
	cd frontend; pnpm build
	mv frontend/dist build/frontend

.PHONY: build-dir
build-dir:
	mkdir -p build

.PHONY: clean
clean:
	rm -rf build
	rm -rf pkg/proto
	rm -f frontend/public/composeeditor.wasm frontend/public/wasm_exec.js frontend/public/templates.binpb
