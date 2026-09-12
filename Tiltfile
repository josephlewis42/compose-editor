local_resource(
    'wasm',
    cmd=['make', 'wasm'],
    deps=['pkg/', 'main.go'],
    ignore=['pkg/proto'],
)

local_resource(
    'templates',
    cmd=['make', 'templates'],
    deps=['specs/'],
)


local_resource(
    'frontend',
    serve_dir='frontend',
    serve_cmd=['pnpm', 'dev'],
    resource_deps=['wasm', 'templates'],
)
