# proto

This is the source of truth for the spec/engine schema described in
[../specs/README.md](../specs/README.md).

- `composeeditor/v1/spec.proto` - the on-disk spec format.
- `composeeditor/v1/wasm.proto` - messages for calls between JS and WASM.

## Regenerating

`make proto` (from the repo root) runs:

1. `buf generate proto` - regenerates the committed Go
   (`gen/composeeditor/v1/*.pb.go`) and TypeScript
   (`frontend/src/gen/composeeditor/v1/*_pb.ts`) types via the
   `protoc-gen-go`/`protoc-gen-es` plugins configured in `buf.gen.yaml`.
2. `buf build proto -o build/buf-image.binpb` - builds a self-contained
   descriptor image (this is what carries the `.proto` source comments and
   the `form_field_example` extension values through to the next step;
   plain `protoc-gen-go` output strips comments).
3. `composeeditor docs build/buf-image.binpb specs/form_fields.md` -
   `pkg/docgen` walks that image via `protoreflect` and renders
   `specs/form_fields.md`. There's no protoc plugin involved in this step -
   it's a small hand-written Go program (see `pkg/docgen`), not a template
   language.

Run `make proto` after editing any `.proto` file and commit the
regenerated output alongside your change, the same way you'd run `go
generate`.

### Prerequisites

`protoc`, `buf`, and `protoc-gen-go` need to be on `PATH`. `protoc-gen-es`
is installed as an npm devDependency of `frontend/` (`pnpm install` picks it
up); `buf.gen.yaml` invokes it from `frontend/node_modules/.bin`.
