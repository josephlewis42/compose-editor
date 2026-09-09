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
	"fmt"

	"gopkg.in/yaml.v3"
)

// Element type discriminators used in the JSON emitted for the frontend.
const (
	TypeAlertInfo    = "info"
	TypeAlertWarning = "warning"
	TypeAlertDanger  = "danger"
	TypeAlertSuccess = "success"
	TypeHeading      = "heading"
	TypeText         = "text"
	TypeMarkdown     = "markdown"
	TypeCollapsible  = "collapsible"
	TypeOneOf        = "oneof"

	TypeURL      = "url"
	TypeString   = "string"
	TypeTextArea = "textarea"
	TypeCode     = "code"
	TypePassword = "password"
	TypeToggle   = "toggle"
	TypeNumber   = "number"
	TypeDate     = "date"
	TypeSelect   = "select"
)

// FormElement is a single entry in a variant's form. It is a tagged union:
// in YAML it is written as a single-key map, e.g. `- select: {...}`. Exactly
// one of the fields below is populated, matching Type.
type FormElement struct {
	Type string

	Alert       *Alert
	Heading     *Heading
	Text        *TextBlock
	Collapsible *Collapsible
	OneOf       *OneOf

	URL      *URLInput
	String   *StringInput
	TextArea *TextAreaInput
	Code     *CodeInput
	Password *PasswordInput
	Toggle   *ToggleInput
	Number   *NumberInput
	Date     *DateInput
	Select   *SelectInput
}

// UnmarshalYAML decodes a single-key map like `select: {...}` into the
// matching concrete type.
func (fe *FormElement) UnmarshalYAML(node *yaml.Node) error {
	if node.Kind != yaml.MappingNode || len(node.Content) != 2 {
		return fmt.Errorf("form element must be a single-key map, got %d keys", len(node.Content)/2)
	}

	key := node.Content[0].Value
	value := node.Content[1]

	switch key {
	case TypeAlertInfo, TypeAlertWarning, TypeAlertDanger, TypeAlertSuccess:
		var alert Alert
		if err := value.Decode(&alert); err != nil {
			return fmt.Errorf("decoding %s alert: %w", key, err)
		}
		fe.Type = key
		fe.Alert = &alert

	case TypeHeading:
		var heading Heading
		if err := value.Decode(&heading); err != nil {
			return fmt.Errorf("decoding heading: %w", err)
		}
		fe.Type = TypeHeading
		fe.Heading = &heading

	case TypeMarkdown:
		var block TextBlock
		if err := value.Decode(&block); err != nil {
			return fmt.Errorf("decoding text block: %w", err)
		}
		fe.Type = TypeText
		fe.Text = &block

	case TypeText:
		var input TextAreaInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding text input: %w", err)
		}
		fe.Type = TypeTextArea
		fe.TextArea = &input

	case TypeCollapsible:
		var collapsible Collapsible
		if err := value.Decode(&collapsible); err != nil {
			return fmt.Errorf("decoding collapsible: %w", err)
		}
		fe.Type = TypeCollapsible
		fe.Collapsible = &collapsible

	case TypeOneOf:
		var oneof OneOf
		if err := value.Decode(&oneof); err != nil {
			return fmt.Errorf("decoding oneof: %w", err)
		}
		fe.Type = TypeOneOf
		fe.OneOf = &oneof

	case TypeURL:
		var input URLInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding url input: %w", err)
		}
		fe.Type = TypeURL
		fe.URL = &input

	case TypeString:
		var input StringInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding string input: %w", err)
		}
		fe.Type = TypeString
		fe.String = &input

	case TypeCode:
		var input CodeInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding code input: %w", err)
		}
		fe.Type = TypeCode
		fe.Code = &input

	case TypePassword:
		var input PasswordInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding password input: %w", err)
		}
		fe.Type = TypePassword
		fe.Password = &input

	case TypeToggle:
		var input ToggleInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding toggle input: %w", err)
		}
		fe.Type = TypeToggle
		fe.Toggle = &input

	case TypeNumber:
		var input NumberInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding number input: %w", err)
		}
		fe.Type = TypeNumber
		fe.Number = &input

	case TypeDate:
		var input DateInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding date input: %w", err)
		}
		fe.Type = TypeDate
		fe.Date = &input

	case TypeSelect:
		var input SelectInput
		if err := value.Decode(&input); err != nil {
			return fmt.Errorf("decoding select input: %w", err)
		}
		fe.Type = TypeSelect
		fe.Select = &input

	default:
		return fmt.Errorf("unknown form element type %q", key)
	}

	return nil
}

// payload returns the concrete value populated for this element, used for
// both JSON marshaling and rendering.
func (fe *FormElement) payload() any {
	switch fe.Type {
	case TypeAlertInfo, TypeAlertWarning, TypeAlertDanger, TypeAlertSuccess:
		return fe.Alert
	case TypeHeading:
		return fe.Heading
	case TypeText:
		return fe.Text
	case TypeCollapsible:
		return fe.Collapsible
	case TypeOneOf:
		return fe.OneOf
	case TypeURL:
		return fe.URL
	case TypeString:
		return fe.String
	case TypeTextArea:
		return fe.TextArea
	case TypeCode:
		return fe.Code
	case TypePassword:
		return fe.Password
	case TypeToggle:
		return fe.Toggle
	case TypeNumber:
		return fe.Number
	case TypeDate:
		return fe.Date
	case TypeSelect:
		return fe.Select
	default:
		return nil
	}
}

// MarshalJSON flattens the element into `{"type": "...", ...fields}` so the
// frontend can switch on a single "type" discriminator.
func (fe FormElement) MarshalJSON() ([]byte, error) {
	payload := fe.payload()
	if payload == nil {
		return nil, fmt.Errorf("form element has no populated type (Type=%q)", fe.Type)
	}

	fieldsJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	var fields map[string]any
	if err := json.Unmarshal(fieldsJSON, &fields); err != nil {
		return nil, err
	}
	fields["type"] = fe.Type

	return json.Marshal(fields)
}

// InputKeys returns every keyname referenced by input elements nested
// anywhere under this element (including inside collapsible/oneof
// children).
func (fe *FormElement) InputKeys() []string {
	switch fe.Type {
	case TypeURL:
		return []string{fe.URL.KeyName}
	case TypeString:
		return []string{fe.String.KeyName}
	case TypeTextArea:
		return []string{fe.TextArea.KeyName}
	case TypeCode:
		return []string{fe.Code.KeyName}
	case TypePassword:
		return []string{fe.Password.KeyName}
	case TypeToggle:
		return []string{fe.Toggle.KeyName}
	case TypeNumber:
		return []string{fe.Number.KeyName}
	case TypeDate:
		return []string{fe.Date.KeyName}
	case TypeSelect:
		return []string{fe.Select.KeyName}
	case TypeCollapsible:
		return collectInputKeys(fe.Collapsible.Form)
	case TypeOneOf:
		var keys []string
		keys = append(keys, fe.OneOf.KeyName)
		for _, tab := range fe.OneOf.Tabs {
			keys = append(keys, collectInputKeys(tab.Form)...)
		}
		return keys
	default:
		return nil
	}
}

func collectInputKeys(elements []FormElement) []string {
	var keys []string
	for _, el := range elements {
		keys = append(keys, el.InputKeys()...)
	}
	return keys
}
