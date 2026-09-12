local_resource(
    'frontend-data',
    cmd=['make', 'frontend-data'],
    deps=['pkg/', 'main.go', 'specs/'],
)

local_resource(
    'frontend',
    serve_dir='frontend',
    serve_cmd=['pnpm', 'dev'],
    resource_deps=['frontend-data'],
)
