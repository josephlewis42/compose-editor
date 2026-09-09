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

package templateengine

import "testing"

func TestConvert_Success(t *testing.T) {
	out := Convert(&Input{
		Template: "image: {{.Values.image | quote }}\nport: {{.Values.port}}",
		Values: map[string]any{
			"image": "freshrss/freshrss:latest",
			"port":  3433,
		},
	})

	if len(out.Errors) != 0 {
		t.Fatalf("unexpected errors: %+v", out.Errors)
	}
	if len(out.Warnings) != 0 {
		t.Fatalf("unexpected warnings: %+v", out.Warnings)
	}

	want := "image: \"freshrss/freshrss:latest\"\nport: 3433"
	if out.ComposeOutput != want {
		t.Errorf("got %q, want %q", out.ComposeOutput, want)
	}
}

func TestConvert_SprigFunctions(t *testing.T) {
	out := Convert(&Input{
		Template: "name: {{.Values.name | upper}}",
		Values:   map[string]any{"name": "freshrss"},
	})

	if len(out.Errors) != 0 {
		t.Fatalf("unexpected errors: %+v", out.Errors)
	}
	if out.ComposeOutput != "name: FRESHRSS" {
		t.Errorf("got %q", out.ComposeOutput)
	}
}

func TestConvert_ParseError(t *testing.T) {
	out := Convert(&Input{Template: "{{ .Values.broken "})

	if len(out.Errors) == 0 {
		t.Fatal("expected a parse error")
	}
}

func TestConvert_ExecuteError(t *testing.T) {
	out := Convert(&Input{Template: `{{ fail "boom" }}`})

	if len(out.Errors) == 0 {
		t.Fatal("expected an execution error")
	}
}

func TestConvert_InvalidYAMLWarning(t *testing.T) {
	out := Convert(&Input{Template: "key: [unterminated"})

	if len(out.Errors) != 0 {
		t.Fatalf("unexpected errors: %+v", out.Errors)
	}
	if len(out.Warnings) == 0 {
		t.Fatal("expected a warning about invalid YAML output")
	}
}
