VERSION?=v0.0.0
BUILD_DIR=out
OUTPUT_DIRS=$(BUILD_DIR) frontend/src/gen pkg/proto frontend/public/gen

.PHONY: all
all: build test

.PHONY: build
build: composeeditor test frontend

.PHONY: composeeditor
composeeditor: $(OUTPUT_DIRS) proto
	go build -ldflags "-X main.version=$(VERSION)" -o out/composeeditor main.go

.PHONY: test
test: frontend/node_modules/.bin/protoc-gen-es
	go test -cover ./...
	cd frontend; pnpm test

.PHONY: wasm
wasm: frontend/public/gen proto
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o frontend/public/gen/composeeditor.wasm pkg/browser/wasm.go
	cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" frontend/public/gen/wasm_exec.js

.PHONY: templates
templates: composeeditor
	./$(BUILD_DIR)/composeeditor build specs frontend/public/gen/templates.binpb

frontend/node_modules/.bin/protoc-gen-es:
	cd frontend; pnpm install

.PHONY: proto
proto: $(OUTPUT_DIRS) frontend/node_modules/.bin/protoc-gen-es
	protoc \
		-I proto \
		--plugin=protoc-gen-go-lite="./tools/protoc-gen-go-lite" \
		--go-lite_out=pkg/proto \
		--go-lite_opt=paths=source_relative,features=marshal+unmarshal+size+equal+clone+text+json \
		--plugin=protoc-gen-es=frontend/node_modules/.bin/protoc-gen-es \
		--es_out=frontend/src/gen \
		--es_opt=target=ts \
		--descriptor_set_out=$(BUILD_DIR)/proto-image.binpb \
		--include_imports \
		--include_source_info \
		proto/composeeditor/v1/*.proto

.PHONY: frontend
frontend: $(BUILD_DIR) frontend/public/gen wasm templates proto
	cd frontend; pnpm install
	cd frontend; pnpm build
	rm -rf $(BUILD_DIR)/frontend
	mv frontend/dist $(BUILD_DIR)/frontend

$(OUTPUT_DIRS):
	mkdir -p $@

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIRS) 
