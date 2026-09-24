// Tests target the package's public interface (parseComposeYaml /
// validateComposeFile) with realistic YAML, not the internal per-def
// helpers — those are exercised indirectly through every field they touch
// on services/jobs/networks/etc below.

import { describe, expect, it } from 'vitest'
import { parseComposeYaml, validateComposeFile, type ValidationError } from './index'

function errorSet(errors: ValidationError[]): string[] {
  return errors.map((e) => `${e.type}:${e.path}`).sort()
}

describe('parseComposeYaml — valid compose files', () => {
  it('accepts a minimal single-service file', () => {
    const result = parseComposeYaml(`
services:
  web:
    image: nginx:latest
`)
    expect(result.errors).toEqual([])
    expect(result.spec?.services?.web.image).toBe('nginx:latest')
  })

  it('accepts an empty document', () => {
    const result = parseComposeYaml('')
    expect(result.errors).toEqual([])
    expect(result.spec).toBeUndefined()
  })

  it('accepts a feature-rich multi-service file', () => {
    const result = parseComposeYaml(`
name: myapp
services:
  web:
    image: nginx:latest
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FOO: bar
    ports:
      - "80:80"
      - target: 443
        published: "443"
        protocol: tcp
    environment:
      FOO: bar
      BAZ: 1
    env_file:
      - .env
      - path: .env.local
        required: false
    labels:
      - "com.example.foo=bar"
    depends_on:
      db:
        condition: service_healthy
        restart: true
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 5s
      retries: 3
    deploy:
      mode: replicated
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          devices:
            - capabilities: ["gpu"]
    develop:
      watch:
        - path: ./src
          action: sync
          target: /app/src
    networks:
      backend:
        aliases: [web-alt]
    volumes:
      - db-data:/data
      - type: bind
        source: ./cfg
        target: /cfg
        read_only: true
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
    restart: unless-stopped
    container_name: my-web-1
    links:
      - db:database
    extends:
      service: base
      file: base.yaml
  db:
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
    secrets:
      - db_password
networks:
  backend: {}
volumes:
  db-data: {}
secrets:
  db_password:
    file: ./db_password.txt
models:
  llm:
    model: gpt-oss
jobs:
  cleanup:
    image: alpine
    command: ["sh", "-c", "echo cleanup"]
    triggers:
      schedule:
        - cron: "0 * * * *"
        - "0 0 * * *"
`)
    expect(result.errors).toEqual([])
  })

  it('allows x- extension keys anywhere additionalProperties is otherwise closed', () => {
    const result = parseComposeYaml(`
x-common: &common
  restart: always
services:
  web:
    image: nginx
    x-foo: bar
`)
    expect(result.errors).toEqual([])
  })

  it('accepts gpus: all and the detailed device-reservation form', () => {
    const result = parseComposeYaml(`
services:
  a:
    image: nginx
    gpus: all
  b:
    image: nginx
    gpus:
      - capabilities: ["gpu"]
        count: 1
`)
    expect(result.errors).toEqual([])
  })

  it('accepts a job triggered only by manual: true', () => {
    const result = parseComposeYaml(`
jobs:
  backup:
    image: alpine
    triggers:
      manual: true
`)
    expect(result.errors).toEqual([])
  })
})

describe('parseComposeYaml — malformed YAML', () => {
  it('reports a parse error instead of throwing', () => {
    const result = parseComposeYaml(`
services:
  web:
   image: nginx
    ports: [1, 2
`)
    expect(result.spec).toBeUndefined()
    expect(result.errors.length).toBeGreaterThan(0)
    for (const e of result.errors) {
      expect(e).toMatchObject({ path: '$', type: 'parse' })
      expect(e.line).toBeGreaterThan(0)
      expect(e.col).toBeGreaterThan(0)
    }
  })
})

describe('parseComposeYaml — source positions', () => {
  it('resolves a value-type error to the value it names', () => {
    const result = parseComposeYaml(`services:\n  web:\n    image: nginx\n    cgroup: bogus\n`)
    expect(result.errors).toEqual([expect.objectContaining({ path: '$.services.web.cgroup', line: 4, col: 5 })])
  })

  it('resolves an additional_property error to the offending key, not the whole document', () => {
    const result = parseComposeYaml(`services:\n  web:\n    image: nginx\n    bogus_field: true\n`)
    expect(result.errors).toEqual([expect.objectContaining({ path: '$.services.web.bogus_field', line: 4, col: 5 })])
  })

  it('resolves a required error to the object missing the field, since the field itself has no position', () => {
    const result = parseComposeYaml(`jobs:\n  cleanup:\n    image: alpine\n`)
    expect(result.errors).toEqual([expect.objectContaining({ path: '$.jobs.cleanup.triggers', line: 3, col: 5 })])
  })

  it('resolves an array-index error to that item', () => {
    const result = parseComposeYaml(`services:\n  web:\n    image: nginx\n    links:\n      - db\n      - db\n`)
    expect(result.errors).toEqual([expect.objectContaining({ path: '$.services.web.links[1]', line: 6, col: 9 })])
  })
})

describe('validateComposeFile — invalid compose files', () => {
  const cases: { name: string; yaml: string; expected: { path: string; type: ValidationError['type'] }[] }[] = [
    {
      name: 'non-object root',
      yaml: `- just\n- a\n- list\n`,
      expected: [{ path: '$', type: 'type' }],
    },
    {
      name: 'wrong type for name',
      yaml: `name: 5\nservices:\n  web:\n    image: nginx\n`,
      expected: [{ path: '$.name', type: 'type' }],
    },
    {
      name: 'unknown top-level key',
      yaml: `foo: bar\nservices:\n  web:\n    image: nginx\n`,
      expected: [{ path: '$.foo', type: 'additional_property' }],
    },
    {
      name: 'service key with invalid characters',
      yaml: `services:\n  "bad name!":\n    image: nginx\n`,
      expected: [{ path: '$.services["bad name!"]', type: 'pattern' }],
    },
    {
      name: 'service is not an object',
      yaml: `services:\n  web: nginx\n`,
      expected: [{ path: '$.services.web', type: 'type' }],
    },
    {
      name: 'unknown service field',
      yaml: `services:\n  web:\n    image: nginx\n    bogus_field: true\n`,
      expected: [{ path: '$.services.web.bogus_field', type: 'additional_property' }],
    },
    {
      name: 'enum violation on cgroup',
      yaml: `services:\n  web:\n    image: nginx\n    cgroup: bogus\n`,
      expected: [{ path: '$.services.web.cgroup', type: 'enum' }],
    },
    {
      name: 'pull_policy fails its pattern',
      yaml: `services:\n  web:\n    image: nginx\n    pull_policy: whenever\n`,
      expected: [{ path: '$.services.web.pull_policy', type: 'pattern' }],
    },
    {
      name: 'container_name fails its pattern (too short)',
      yaml: `services:\n  web:\n    image: nginx\n    container_name: a\n`,
      expected: [{ path: '$.services.web.container_name', type: 'pattern' }],
    },
    {
      name: 'cpu_percent out of range',
      yaml: `services:\n  web:\n    image: nginx\n    cpu_percent: 150\n`,
      expected: [{ path: '$.services.web.cpu_percent', type: 'range' }],
    },
    {
      name: 'oom_score_adj out of range',
      yaml: `services:\n  web:\n    image: nginx\n    oom_score_adj: -2000\n`,
      expected: [{ path: '$.services.web.oom_score_adj', type: 'range' }],
    },
    {
      name: 'environment value must be scalar',
      yaml: `services:\n  web:\n    image: nginx\n    environment:\n      FOO: [1, 2]\n`,
      expected: [{ path: '$.services.web.environment.FOO', type: 'type' }],
    },
    {
      name: 'command must be null, string, or string list',
      yaml: `services:\n  web:\n    image: nginx\n    command:\n      key: value\n`,
      expected: [{ path: '$.services.web.command', type: 'type' }],
    },
    {
      name: 'ports entry with wrong field types',
      yaml: `services:\n  web:\n    image: nginx\n    ports:\n      - target: "80"\n        protocol: 123\n`,
      expected: [{ path: '$.services.web.ports[0].protocol', type: 'type' }],
    },
    {
      name: 'volume mount missing required type',
      yaml: `services:\n  web:\n    image: nginx\n    volumes:\n      - source: ./x\n        target: /x\n`,
      expected: [{ path: '$.services.web.volumes[0].type', type: 'required' }],
    },
    {
      name: 'volume mount enum violation on type',
      yaml: `services:\n  web:\n    image: nginx\n    volumes:\n      - type: bogus\n`,
      expected: [{ path: '$.services.web.volumes[0].type', type: 'enum' }],
    },
    {
      name: 'volume bind recursive enum violation',
      yaml: `services:\n  web:\n    image: nginx\n    volumes:\n      - type: bind\n        source: ./x\n        target: /x\n        bind:\n          recursive: sideways\n`,
      expected: [{ path: '$.services.web.volumes[0].bind.recursive', type: 'enum' }],
    },
    {
      name: 'depends_on condition enum violation',
      yaml: `services:\n  web:\n    image: nginx\n    depends_on:\n      db:\n        condition: bogus\n`,
      expected: [{ path: '$.services.web.depends_on.db.condition', type: 'enum' }],
    },
    {
      name: 'depends_on required condition missing',
      yaml: `services:\n  web:\n    image: nginx\n    depends_on:\n      db: {}\n`,
      expected: [{ path: '$.services.web.depends_on.db.condition', type: 'required' }],
    },
    {
      name: 'healthcheck test must be string or string list',
      yaml: `services:\n  web:\n    image: nginx\n    healthcheck:\n      test:\n        cmd: true\n`,
      expected: [{ path: '$.services.web.healthcheck.test', type: 'type' }],
    },
    {
      name: 'deploy resources reservations device missing capabilities',
      yaml: `services:\n  web:\n    image: nginx\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - count: 1\n`,
      expected: [{ path: '$.services.web.deploy.resources.reservations.devices[0].capabilities', type: 'required' }],
    },
    {
      name: 'deploy update_config order enum violation',
      yaml: `services:\n  web:\n    image: nginx\n    deploy:\n      update_config:\n        order: sideways\n`,
      expected: [{ path: '$.services.web.deploy.update_config.order', type: 'enum' }],
    },
    {
      name: 'develop watch missing required path/action',
      yaml: `services:\n  web:\n    image: nginx\n    develop:\n      watch:\n        - target: /app\n`,
      expected: [
        { path: '$.services.web.develop.watch[0].path', type: 'required' },
        { path: '$.services.web.develop.watch[0].action', type: 'required' },
      ],
    },
    {
      name: 'develop watch action enum violation',
      yaml: `services:\n  web:\n    image: nginx\n    develop:\n      watch:\n        - path: ./src\n          action: bogus\n`,
      expected: [{ path: '$.services.web.develop.watch[0].action', type: 'enum' }],
    },
    {
      name: 'extends requires service name',
      yaml: `services:\n  web:\n    image: nginx\n    extends:\n      file: base.yaml\n`,
      expected: [{ path: '$.services.web.extends.service', type: 'required' }],
    },
    {
      name: 'provider requires type',
      yaml: `services:\n  web:\n    provider: {}\n`,
      expected: [{ path: '$.services.web.provider.type', type: 'required' }],
    },
    {
      name: 'post_start hook missing required command',
      yaml: `services:\n  web:\n    image: nginx\n    post_start:\n      - user: root\n`,
      expected: [{ path: '$.services.web.post_start[0].command', type: 'required' }],
    },
    {
      name: 'ulimits detail requires soft and hard',
      yaml: `services:\n  web:\n    image: nginx\n    ulimits:\n      nofile:\n        soft: 1024\n`,
      expected: [{ path: '$.services.web.ulimits.nofile.hard', type: 'required' }],
    },
    {
      name: 'network external is not a string/boolean/object',
      yaml: `networks:\n  backend:\n    external: [1, 2]\n`,
      expected: [{ path: '$.networks.backend.external', type: 'type' }],
    },
    {
      name: 'network unknown field',
      yaml: `networks:\n  backend:\n    bogus: true\n`,
      expected: [{ path: '$.networks.backend.bogus', type: 'additional_property' }],
    },
    {
      name: 'volume unknown field',
      yaml: `volumes:\n  data:\n    bogus: true\n`,
      expected: [{ path: '$.volumes.data.bogus', type: 'additional_property' }],
    },
    {
      name: 'secret with wrong external type is still reported (secret.external stays open otherwise)',
      yaml: `secrets:\n  s:\n    external: [1, 2]\n`,
      expected: [{ path: '$.secrets.s.external', type: 'type' }],
    },
    {
      name: 'model missing required model field',
      yaml: `models:\n  llm:\n    context_size: 4096\n`,
      expected: [{ path: '$.models.llm.model', type: 'required' }],
    },
    {
      name: 'job missing required triggers',
      yaml: `jobs:\n  cleanup:\n    image: alpine\n`,
      expected: [{ path: '$.jobs.cleanup.triggers', type: 'required' }],
    },
    {
      name: 'job triggers with neither manual nor schedule',
      yaml: `jobs:\n  cleanup:\n    image: alpine\n    triggers: {}\n`,
      expected: [{ path: '$.jobs.cleanup.triggers', type: 'one_of' }],
    },
    {
      name: 'job schedule entry missing required cron',
      yaml: `jobs:\n  cleanup:\n    image: alpine\n    triggers:\n      schedule:\n        - timezone: UTC\n`,
      expected: [{ path: '$.jobs.cleanup.triggers.schedule[0].cron', type: 'required' }],
    },
    {
      name: 'job unknown field (job does not have "links")',
      yaml: `jobs:\n  cleanup:\n    image: alpine\n    triggers:\n      manual: true\n    links:\n      - other\n`,
      expected: [{ path: '$.jobs.cleanup.links', type: 'additional_property' }],
    },
    {
      name: 'duplicate values in a uniqueItems list',
      yaml: `services:\n  web:\n    image: nginx\n    links:\n      - db\n      - db\n`,
      expected: [{ path: '$.services.web.links[1]', type: 'unique_items' }],
    },
    {
      name: 'include entry with wrong field type',
      yaml: `include:\n  - path: 5\n`,
      expected: [{ path: '$.include[0].path', type: 'type' }],
    },
    {
      name: 'multiple independent errors are all reported, not just the first',
      yaml: `name: 5\nservices:\n  web:\n    image: nginx\n    cgroup: bogus\n    unknown: true\n`,
      expected: [
        { path: '$.name', type: 'type' },
        { path: '$.services.web.cgroup', type: 'enum' },
        { path: '$.services.web.unknown', type: 'additional_property' },
      ],
    },
  ]

  it.each(cases)('$name', ({ yaml, expected }) => {
    const result = parseComposeYaml(yaml)
    const got = errorSet(result.errors)
    const want = errorSet(expected as ValidationError[])
    for (const w of want) {
      expect(got).toContain(w)
    }
    expect(result.errors.length).toBeGreaterThanOrEqual(expected.length)
  })
})

describe('validateComposeFile — called directly with a JS value', () => {
  it('validates without going through YAML at all', () => {
    const errors = validateComposeFile({ services: { web: { image: 123 } } })
    expect(errorSet(errors)).toEqual(['type:$.services.web.image'])
  })

  it('rejects non-object input with a single type error', () => {
    expect(errorSet(validateComposeFile('nope'))).toEqual(['type:$'])
    expect(errorSet(validateComposeFile(null))).toEqual(['type:$'])
    expect(errorSet(validateComposeFile([1, 2]))).toEqual(['type:$'])
  })
})
