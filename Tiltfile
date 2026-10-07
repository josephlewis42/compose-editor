local_resource(
    'wasm',
    cmd=['make', 'wasm'],
    deps=['pkg/'],
    ignore=['pkg/proto'],
)


local_resource(
    'frontend',
    serve_dir='frontend',
    serve_cmd=['pnpm', 'dev'],
    resource_deps=['wasm'],
)
