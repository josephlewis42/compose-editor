VERSION?=v0.0.0
OUTPUT_DIRS=build frontend/src/gen pkg/proto

.PHONY: all
all: composeeditor test frontend 

.PHONY: composeeditor
composeeditor: $(OUTPUT_DIRS) proto
	go build -ldflags "-X main.version=$(VERSION)" -o build/composeeditor main.go

.PHONY: test
test:
	go test -cover ./...

.PHONY: wasm
wasm: frontend/public/gen proto
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o frontend/public/gen/composeeditor.wasm pkg/browser/wasm.go
	cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" frontend/public/gen/wasm_exec.js

.PHONY: templates
templates: composeeditor
	./build/composeeditor build specs frontend/public/gen/templates.binpb

.PHONY: frontend
frontend: build-dir frontend/public/gen wasm templates proto
	cd frontend; pnpm install
	cd frontend; pnpm build
	mv frontend/dist build/frontend

.PHONY: build-dir
build-dir:
	mkdir -p build


$(OUTPUT_DIRS):
	mkdir -p $@

.PHONY: clean
clean:
	rm -rf build
	rm -rf pkg/proto
	rm -rf $(OUTPUT_DIRS) 
