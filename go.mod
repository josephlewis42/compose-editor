module github.com/josephlewis42/compose-editor

go 1.27.0

require (
	github.com/DataDog/datadog-agent/pkg/template v0.83.2
	github.com/Masterminds/sprig/v3 v3.3.0
	github.com/aperturerobotics/protobuf-go-lite v0.18.0
	github.com/urfave/cli/v3 v3.0.0-beta1
	gopkg.in/yaml.v3 v3.0.1
)

require (
	dario.cat/mergo v1.0.2 // indirect
	github.com/Masterminds/goutils v1.1.1 // indirect
	github.com/Masterminds/semver/v3 v3.4.0 // indirect
	github.com/aarzilli/whydeadcode v0.0.0-20260303092945-8d908f77de3a // indirect
	github.com/aperturerobotics/json-iterator-lite v1.1.0 // indirect
	github.com/google/subcommands v1.2.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/huandu/xstrings v1.5.0 // indirect
	github.com/loov/goda v0.10.1 // indirect
	github.com/mitchellh/copystructure v1.2.0 // indirect
	github.com/mitchellh/reflectwalk v1.0.2 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/spf13/cast v1.9.2 // indirect
	golang.org/x/crypto v0.40.0 // indirect
	golang.org/x/image v0.45.0 // indirect
	golang.org/x/mod v0.40.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/tools v0.49.0 // indirect
	google.golang.org/protobuf v1.36.12 // indirect
)

replace github.com/Masterminds/sprig/v3 v3.3.0 => ./third_party/sprig_v3/src

tool github.com/aperturerobotics/protobuf-go-lite/cmd/protoc-gen-go-lite

tool github.com/loov/goda

tool github.com/aarzilli/whydeadcode
