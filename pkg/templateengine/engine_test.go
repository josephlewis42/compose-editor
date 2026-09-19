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

import (
	"testing"

	structpb "github.com/aperturerobotics/protobuf-go-lite/types/known/structpb"

	composeeditorv1 "github.com/josephlewis42/compose-editor/pkg/proto/composeeditor/v1"
)

func TestConvert_Success(t *testing.T) {
	out := Convert(&composeeditorv1.ConvertInput{
		Template: "image: {{.Values.image | quote }}\nport: {{.Values.port}}",
		Values: map[string]*structpb.Value{
			"image": structpb.NewStringValue("freshrss/freshrss:latest"),
			"port":  structpb.NewNumberValue(3433),
		},
	})

	if len(out.GetErrors()) != 0 {
		t.Fatalf("unexpected errors: %+v", out.GetErrors())
	}
	if len(out.GetWarnings()) != 0 {
		t.Fatalf("unexpected warnings: %+v", out.GetWarnings())
	}

	want := "image: \"freshrss/freshrss:latest\"\nport: 3433"
	if out.GetComposeOutput() != want {
		t.Errorf("got %q, want %q", out.GetComposeOutput(), want)
	}
}

func TestConvert_SprigFunctions(t *testing.T) {
	out := Convert(&composeeditorv1.ConvertInput{
		Template: "name: {{.Values.name | upper}}",
		Values: map[string]*structpb.Value{
			"name": structpb.NewStringValue("freshrss"),
		},
	})

	if len(out.GetErrors()) != 0 {
		t.Fatalf("unexpected errors: %+v", out.GetErrors())
	}
	if out.GetComposeOutput() != "name: FRESHRSS" {
		t.Errorf("got %q", out.GetComposeOutput())
	}
}

func TestConvert_ParseError(t *testing.T) {
	out := Convert(&composeeditorv1.ConvertInput{Template: "{{ .Values.broken "})

	if len(out.GetErrors()) == 0 {
		t.Fatal("expected a parse error")
	}
}

func TestConvert_ExecuteError(t *testing.T) {
	out := Convert(&composeeditorv1.ConvertInput{Template: `{{ fail "boom" }}`})

	if len(out.GetErrors()) == 0 {
		t.Fatal("expected an execution error")
	}
}
