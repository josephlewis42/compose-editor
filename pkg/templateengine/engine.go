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

// Package templateengine renders a variant's Go template against
// user-supplied form values into a compose YAML document. It backs both the
// CLI (for validating specs) and the WASM build used by the frontend, per
// design/template_engine.md.
package templateengine

import (
	"bytes"
	"text/template"

	"github.com/Masterminds/sprig/v3"
	"gopkg.in/yaml.v3"
)

type Input struct {
	Template string         `json:"template"`
	Values   map[string]any `json:"values"`
}

// Message is a single error or warning to surface to the user, optionally
// tied to a specific form field.
type Message struct {
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

type Output struct {
	ComposeOutput string    `json:"compose_output"`
	Errors        []Message `json:"errors"`
	Warnings      []Message `json:"warnings"`
}

// Convert renders input.Template with input.Values using Go templates with
// Sprig functions.
func Convert(input *Input) Output {
	out := Output{
		Errors:   []Message{},
		Warnings: []Message{},
	}

	tmpl, err := template.New("variant").Funcs(funcMap()).Parse(input.Template)
	if err != nil {
		out.Errors = append(out.Errors, Message{Message: "couldn't parse template: " + err.Error()})
		return out
	}

	valuesMap := map[string]any{
		"Values": input.Values,
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, valuesMap); err != nil {
		out.Errors = append(out.Errors, Message{Message: "couldn't render template: " + err.Error()})
		return out
	}

	out.ComposeOutput = buf.String()

	var probe any
	if err := yaml.Unmarshal(buf.Bytes(), &probe); err != nil {
		out.Warnings = append(out.Warnings, Message{Message: "output is not valid YAML: " + err.Error()})
	}

	return out
}

func funcMap() template.FuncMap {

	funcs := sprig.FuncMap()

	// Remove functions tht won't work in WASM
	delete(funcs, "env")
	delete(funcs, "expandenv")
	delete(funcs, "getHostByName")

	return funcs
}
