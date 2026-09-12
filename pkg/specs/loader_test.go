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
	"testing"
)

func TestLoadDir_Freshrss(t *testing.T) {
	apps, err := LoadDir("testdata/specs")
	if err != nil {
		t.Fatalf("LoadDir: %v", err)
	}

	if len(apps) != 1 {
		t.Fatalf("expected 1 application, got %d", len(apps))
	}

	app := apps[0]
	if app.GetSlug() != "freshrss" {
		t.Errorf("got slug %q, want freshrss", app.GetSlug())
	}
	if app.GetName() != "FreshRSS" {
		t.Errorf("got name %q, want FreshRSS", app.GetName())
	}
	if len(app.GetForm()) == 0 {
		t.Fatalf("got no form elements")
	}

	first := app.GetForm()[0]
	if first.GetSelect().GetKeyname() != "image" {
		t.Errorf("got first form element %+v, want a select with keyname=image", first)
	}
}
