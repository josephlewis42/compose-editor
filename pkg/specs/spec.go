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

// Package specs defines the on-disk spec format described in
// design/spec_format.md and loads it into structures the template engine
// and frontend can consume.
package specs

// Application combines an application's metadata with its variants for use
// by the frontend catalog/editor.
type Application struct {
	Slug        string        `json:"slug"`
	Name        string        `json:"name" yaml:"name"`
	Tagline     string        `json:"tagline" yaml:"tagline"`
	URL         string        `json:"url" yaml:"url"`
	SPDXLicense string        `json:"spdx_license" yaml:"spdx_license"`
	LicenseURL  string        `json:"license_url" yaml:"license_url"`
	Tags        []string      `json:"tags,omitempty" yaml:"tags,omitempty"`
	Template    string        `json:"template" yaml:"template"`
	Form        []FormElement `json:"form,omitempty" yaml:"form,omitempty"`
}

// InputBase holds the fields shared by every input form element.
type InputBase struct {
	KeyName      string `json:"keyname" yaml:"keyname"`
	Label        string `json:"label" yaml:"label"`
	Description  string `json:"description,omitempty" yaml:"description,omitempty"`
	HelpText     string `json:"help_text,omitempty" yaml:"help_text,omitempty"`
	DefaultValue any    `json:"default_value,omitempty" yaml:"default_value,omitempty"`
}

type URLInput struct {
	InputBase   `yaml:",inline"`
	Placeholder string `json:"placeholder,omitempty" yaml:"placeholder,omitempty"`
}

type StringInput struct {
	InputBase   `yaml:",inline"`
	Placeholder string `json:"placeholder,omitempty" yaml:"placeholder,omitempty"`
	Regex       string `json:"regex,omitempty" yaml:"regex,omitempty"`
}

// TextAreaInput is the multi-line "text" input element from the spec doc.
// It is given the wire type "textarea" (rather than "text") so it doesn't
// collide with the layout TextBlock element, which is also called "text" in
// the design doc.
type TextAreaInput struct {
	InputBase   `yaml:",inline"`
	Placeholder string `json:"placeholder,omitempty" yaml:"placeholder,omitempty"`
}

type CodeInput struct {
	InputBase   `yaml:",inline"`
	Placeholder string `json:"placeholder,omitempty" yaml:"placeholder,omitempty"`
}

type PasswordInput struct {
	InputBase   `yaml:",inline"`
	Placeholder string `json:"placeholder,omitempty" yaml:"placeholder,omitempty"`
}

type ToggleInput struct {
	InputBase `yaml:",inline"`
}

type NumberInput struct {
	InputBase `yaml:",inline"`
	Minimum   float64 `json:"minimum" yaml:"minimum"`
	Maximum   float64 `json:"maximum" yaml:"maximum"`
	Step      float64 `json:"step" yaml:"step"`
}

type DateInput struct {
	InputBase `yaml:",inline"`
}

type SelectOption struct {
	Title    string `json:"title" yaml:"title"`
	Value    string `json:"value,omitempty" yaml:"value,omitempty"`
	OptGroup string `json:"optgroup,omitempty" yaml:"optgroup,omitempty"`
}

type SelectInput struct {
	InputBase `yaml:",inline"`
	Options   []SelectOption `json:"options" yaml:"options"`
}

// Alert is shared by the four alert variants (info/warning/danger/success).
// Which variant it is comes from the YAML key used and is stored in Type.
type Alert struct {
	Content string `json:"content" yaml:"content"`
}

type Heading struct {
	Title   string `json:"title" yaml:"title"`
	Content string `json:"content,omitempty" yaml:"content,omitempty"`
}

type TextBlock struct {
	Content string `json:"content" yaml:"content"`
}

// Collapsible is a layout element whose children are hidden until expanded.
// The design doc only documents its Title field; Form is required to make
// it a usable container and was added here.
type Collapsible struct {
	Title string        `json:"title" yaml:"title"`
	Form  []FormElement `json:"form" yaml:"form"`
}

type OneOfTab struct {
	Title string        `json:"title" yaml:"title"`
	Value string        `json:"value" yaml:"value"`
	Form  []FormElement `json:"form" yaml:"form"`
}

type OneOf struct {
	KeyName string     `json:"keyname" yaml:"keyname"`
	Tabs    []OneOfTab `json:"tabs" yaml:"tabs"`
}
