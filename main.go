// Copyright 2026 Joseph Lewis III
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/josephlewis42/compose-editor/pkg/specs"
	"github.com/josephlewis42/compose-editor/pkg/templateengine"
	"github.com/urfave/cli/v3"
)

var version = "0.0.0"

func build() *cli.Command {
	var specDir string
	var outputFile string

	return &cli.Command{
		Name:      "build",
		Usage:     "Build compose editor specs into forms.",
		ArgsUsage: "SPEC_DIR OUTPUT_FILE",
		Arguments: []cli.Argument{
			&cli.StringArg{Name: "SPEC_DIR", Destination: &specDir, UsageText: "The directory with specs", Min: 1, Max: 1},
			&cli.StringArg{Name: "OUTPUT_FILE", Destination: &outputFile, UsageText: "The output file with the compiled specs", Min: 1, Max: 1},
		},
		Action: func(ctx context.Context, cmd *cli.Command) error {
			apps, err := specs.LoadDir(specDir)
			if err != nil {
				return fmt.Errorf("couldn't load specs from %s: %w", specDir, err)
			}

			for _, app := range apps {
				out := templateengine.Convert(&templateengine.Input{Template: app.Template})
				if len(out.Errors) > 0 {
					return fmt.Errorf("spec %s/spec.yaml has an invalid template: %s", app.Slug, out.Errors[0].Message)
				}
			}

			catalog := struct {
				Applications []specs.Application `json:"applications"`
			}{Applications: apps}

			data, err := json.MarshalIndent(&catalog, "", "  ")
			if err != nil {
				return fmt.Errorf("couldn't encode catalog as JSON: %w", err)
			}

			if err := os.WriteFile(outputFile, data, 0o644); err != nil {
				return fmt.Errorf("couldn't write %s: %w", outputFile, err)
			}

			fmt.Fprintf(cmd.Writer, "wrote %d application(s) to %s\n", len(apps), outputFile)
			return nil
		},
	}
}

func main() {
	cmd := &cli.Command{
		Usage:   "Generate compose editor files",
		Version: version,
		Commands: []*cli.Command{
			build(),
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}
