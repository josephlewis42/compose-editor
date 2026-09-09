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
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"gopkg.in/yaml.v3"
)

// LoadDir reads every application spec under dir (expected to follow the
// specs/<slug>/spec.yaml layout) and returns them sorted by slug.
func LoadDir(dir string) ([]Application, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("couldn't read specs directory %s: %w", dir, err)
	}

	var apps []Application
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		app, err := loadApplication(dir, entry.Name())
		if err != nil {
			return nil, fmt.Errorf("couldn't load spec %q: %w", entry.Name(), err)
		}
		apps = append(apps, *app)
	}

	sort.Slice(apps, func(i, j int) bool {
		return apps[i].Slug < apps[j].Slug
	})

	return apps, nil
}

func loadApplication(dir, slug string) (*Application, error) {
	appDir := filepath.Join(dir, slug)

	specBytes, err := os.ReadFile(filepath.Join(appDir, "spec.yaml"))
	if err != nil {
		return nil, fmt.Errorf("couldn't read spec.yaml: %w", err)
	}

	var application Application
	if err := yaml.Unmarshal(specBytes, &application); err != nil {
		return nil, fmt.Errorf("couldn't parse spec.yaml: %w", err)
	}

	application.Slug = slug

	return &application, nil
}
