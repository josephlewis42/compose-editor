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

package specs

import (
	"encoding/json"
	"testing"

	"gopkg.in/yaml.v3"
)

func decodeForm(t *testing.T, doc string) []FormElement {
	t.Helper()
	var form []FormElement
	if err := yaml.Unmarshal([]byte(doc), &form); err != nil {
		t.Fatalf("yaml.Unmarshal: %v", err)
	}
	return form
}

func TestFormElement_MarshalJSON(t *testing.T) {
	form := decodeForm(t, `
- select:
    keyname: image
    label: Image
    options:
    - title: latest
`)

	data, err := json.Marshal(form[0])
	if err != nil {
		t.Fatalf("json.Marshal: %v", err)
	}

	var got map[string]any
	if err := json.Unmarshal(data, &got); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}

	if got["type"] != "select" {
		t.Errorf("got type %v", got["type"])
	}
	if got["keyname"] != "image" {
		t.Errorf("got keyname %v", got["keyname"])
	}
}

func TestFormElement_UnknownType(t *testing.T) {
	var form []FormElement
	err := yaml.Unmarshal([]byte("- bogus:\n    foo: bar\n"), &form)
	if err == nil {
		t.Fatal("expected error for unknown form element type")
	}
}
