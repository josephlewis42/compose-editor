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

// Package specs loads the on-disk spec format described in specs/README.md
// (schema defined in proto/composeeditor/v1/spec.proto) into the generated
// composeeditorv1.Application type used by the template engine and
// frontend.
package specs

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	composeeditorv1 "github.com/josephlewis42/compose-editor/pkg/proto/composeeditor/v1"
	"gopkg.in/yaml.v3"
)

// LoadDir reads every application spec under dir (expected to follow the
// specs/<slug>/spec.yaml layout) and returns them sorted by slug.
func LoadDir(dir string) ([]*composeeditorv1.Application, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("couldn't read specs directory %s: %w", dir, err)
	}

	var apps []*composeeditorv1.Application
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		app, err := loadApplication(dir, entry.Name())
		if err != nil {
			return nil, fmt.Errorf("couldn't load spec %q: %w", entry.Name(), err)
		}
		apps = append(apps, app)
	}

	sort.Slice(apps, func(i, j int) bool {
		return apps[i].GetSlug() < apps[j].GetSlug()
	})

	return apps, nil
}

func loadApplication(dir, slug string) (*composeeditorv1.Application, error) {
	appDir := filepath.Join(dir, slug)

	specBytes, err := os.ReadFile(filepath.Join(appDir, "spec.yaml"))
	if err != nil {
		return nil, fmt.Errorf("couldn't read spec.yaml: %w", err)
	}

	var generic any
	if err := yaml.Unmarshal(specBytes, &generic); err != nil {
		return nil, fmt.Errorf("couldn't parse spec.yaml: %w", err)
	}

	jsonBytes, err := json.Marshal(generic)
	if err != nil {
		return nil, fmt.Errorf("couldn't convert spec.yaml to JSON: %w", err)
	}

	var application composeeditorv1.Application
	if err := application.UnmarshalJSON(jsonBytes); err != nil {
		return nil, fmt.Errorf("couldn't parse spec.yaml: %w", err)
	}

	application.Slug = slug

	return &application, nil
}
