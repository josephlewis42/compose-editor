# proto

This is the source of truth for the spec/engine schema described in
[../specs/README.md](../specs/README.md).

- `composeeditor/v1/spec.proto` - the on-disk spec format.
- `composeeditor/v1/wasm.proto` - messages for calls between JS and WASM.

## Regenerating

`make proto` (from the repo root) with two plugins:

1. `protoc-gen-go-lite` - regenerates the Go types under
   `pkg/proto/composeeditor/v1/*.pb.go`.
2. `protoc-gen-es` - regenerates the TypeScript types under
   `frontend/src/gen/composeeditor/v1/*_pb.ts`. Installed as an npm
   devDependency of `frontend/` (`pnpm install` picks it up); the Makefile
   invokes it from `frontend/node_modules/.bin`.

The same `protoc` invocation also writes a self-contained descriptor image
with source info to `out/proto-image.binpb` (via `--descriptor_set_out
--include_imports --include_source_info`), for any future tooling that
needs `.proto` source comments (plain `protoc-gen-go-lite` output strips
them).

Protos are generated on every build and aren't committed.

### Prerequisites

`protoc` needs to be on `PATH`. Go and Node/pnpm tooling (already required
to build the rest of the project) supply the two plugins.
