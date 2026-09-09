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

import "testing"

func TestLoadDir_Freshrss(t *testing.T) {
	apps, err := LoadDir("testdata/specs")
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}

	if len(apps) != 1 {
		t.Fatalf("expected 1 application, got %d", len(apps))
	}

	app := apps[0]
	if app.Slug != "freshrss" {
		t.Errorf("got slug %q, want freshrss", app.Slug)
	}
	if app.Name != "FreshRSS" {
		t.Errorf("got name %q, want FreshRSS", app.Name)
	}

	keys := collectInputKeys(app.Form)
	if len(keys) == 0 {
		t.Fatalf("got no keys")
	}
}
