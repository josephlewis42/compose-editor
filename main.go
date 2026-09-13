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
	"fmt"
	"log"
	"os"

	"github.com/aperturerobotics/protobuf-go-lite/types/known/structpb"
	composeeditorv1 "github.com/josephlewis42/compose-editor/pkg/proto/composeeditor/v1"
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
				defaultValues := make(map[string]*structpb.Value)
				collectDefaultValues(app.GetForm(), defaultValues)

				out := templateengine.Convert(&composeeditorv1.ConvertInput{
					Template: app.GetTemplate(),
					Values:   defaultValues,
				})
				if len(out.GetErrors()) > 0 {
					return fmt.Errorf("spec %s/spec.yaml has an invalid template: %s", app.GetSlug(), out.GetErrors()[0].GetMessage())
				}
			}

			catalog := &composeeditorv1.Catalog{Applications: apps}
			data, err := catalog.MarshalVT()
			if err != nil {
				return fmt.Errorf("couldn't encode catalog: %w", err)
			}

			if err := os.WriteFile(outputFile, data, 0o644); err != nil {
				return fmt.Errorf("couldn't write %s: %w", outputFile, err)
			}

			fmt.Fprintf(cmd.Writer, "wrote %d application(s) to %s\n", len(apps), outputFile)
			return nil
		},
	}
}

// collectDefaultValues walks a form tree, recursing into layout elements
// that nest their own forms, and records each input's default value under
// its keyname.
func collectDefaultValues(form []*composeeditorv1.FormElement, out map[string]*structpb.Value) {
	for _, el := range form {
		switch field := el.GetElement().(type) {
		case *composeeditorv1.FormElement_Collapsible:
			collectDefaultValues(field.Collapsible.GetForm(), out)
		case *composeeditorv1.FormElement_OneOf:
			for _, tab := range field.OneOf.GetTabs() {
				collectDefaultValues(tab.GetForm(), out)
			}
		case *composeeditorv1.FormElement_Url:
			out[field.Url.GetKeyname()] = structpb.NewStringValue(field.Url.GetDefaultValue())
		case *composeeditorv1.FormElement_Str:
			out[field.Str.GetKeyname()] = structpb.NewStringValue(field.Str.GetDefaultValue())
		case *composeeditorv1.FormElement_Text:
			out[field.Text.GetKeyname()] = structpb.NewStringValue(field.Text.GetDefaultValue())
		case *composeeditorv1.FormElement_Code:
			out[field.Code.GetKeyname()] = structpb.NewStringValue(field.Code.GetDefaultValue())
		case *composeeditorv1.FormElement_Password:
			out[field.Password.GetKeyname()] = structpb.NewStringValue(field.Password.GetDefaultValue())
		case *composeeditorv1.FormElement_Toggle:
			out[field.Toggle.GetKeyname()] = structpb.NewBoolValue(field.Toggle.GetDefaultValue())
		case *composeeditorv1.FormElement_Number:
			out[field.Number.GetKeyname()] = structpb.NewNumberValue(field.Number.GetDefaultValue())
		case *composeeditorv1.FormElement_Date:
			out[field.Date.GetKeyname()] = structpb.NewStringValue(field.Date.GetDefaultValue())
		case *composeeditorv1.FormElement_Select:
			out[field.Select.GetKeyname()] = structpb.NewStringValue(field.Select.GetDefaultValue())
		}
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
