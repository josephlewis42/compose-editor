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
	"reflect"
	"strings"

	composeeditorv1 "github.com/josephlewis42/compose-editor/pkg/proto/composeeditor/v1"
)

// The generated UnmarshalProtoJSON methods in spec.pb.go silently skip any
// object key they don't recognize (`default: s.Skip() // ignore unknown
// field`), so a typo'd field name - or, e.g., a YAML indentation mistake
// that puts a form input's fields as siblings of its oneof key instead of
// nested under it - loads without error and just quietly drops the data.
// validateKnownFields walks the yaml.v3-decoded spec and reports any key
// that no message in spec.proto would recognize, so build fails loudly
// instead.

// fieldInfo is one JSON-recognized key of a generated proto message type,
// derived from its `protobuf:"..."` struct tag so it can't drift from
// spec.proto.
type fieldInfo struct {
	names    []string
	nested   reflect.Type // nested message type; nil for scalar/scalar-list fields
	repeated bool
}

// formElementVariants lists the oneof branches of FormElement (mirrors the
// "Types that are assignable to Element" comment on FormElement.Element in
// spec.pb.go). Each branch's accepted YAML key(s) and nested message type
// are read from its own struct tag; this list only needs a new entry when
// spec.proto gains a new form element.
var formElementVariants = []any{
	&composeeditorv1.FormElement_Info{},
	&composeeditorv1.FormElement_Warning{},
	&composeeditorv1.FormElement_Danger{},
	&composeeditorv1.FormElement_Success{},
	&composeeditorv1.FormElement_Heading{},
	&composeeditorv1.FormElement_Markdown{},
	&composeeditorv1.FormElement_Collapsible{},
	&composeeditorv1.FormElement_OneOf{},
	&composeeditorv1.FormElement_Url{},
	&composeeditorv1.FormElement_Str{},
	&composeeditorv1.FormElement_Text{},
	&composeeditorv1.FormElement_Code{},
	&composeeditorv1.FormElement_Password{},
	&composeeditorv1.FormElement_Toggle{},
	&composeeditorv1.FormElement_Number{},
	&composeeditorv1.FormElement_Date{},
	&composeeditorv1.FormElement_Select{},
	&composeeditorv1.FormElement_Port{},
	&composeeditorv1.FormElement_ToggleSection{},
}

// oneofFields maps a message type's name to the field infos for its oneof
// branches. FormElement is the only oneof in spec.proto.
var oneofFields = map[string][]fieldInfo{
	"FormElement": variantFieldInfos(formElementVariants),
}

func variantFieldInfos(wrappers []any) []fieldInfo {
	infos := make([]fieldInfo, 0, len(wrappers))
	for _, w := range wrappers {
		f := reflect.TypeOf(w).Elem().Field(0)
		infos = append(infos, fieldInfo{
			names:  tagNames(f.Tag.Get("protobuf")),
			nested: f.Type.Elem(),
		})
	}
	return infos
}

// tagNames returns the accepted JSON key(s) for a `protobuf:"..."` struct
// tag: the proto field name and, if distinct, its camelCase JSON name.
// This mirrors the `case "snake_name", "camelName":` pairs generated for
// each field in UnmarshalProtoJSON.
func tagNames(tag string) []string {
	var name, json string
	for _, part := range strings.Split(tag, ",") {
		switch {
		case strings.HasPrefix(part, "name="):
			name = strings.TrimPrefix(part, "name=")
		case strings.HasPrefix(part, "json="):
			json = strings.TrimPrefix(part, "json=")
		}
	}
	if json != "" && json != name {
		return []string{name, json}
	}
	return []string{name}
}

// messageFields returns the recognized JSON keys for message type t,
// including its oneof branches (if any) via oneofFields.
func messageFields(t reflect.Type) []fieldInfo {
	var infos []fieldInfo
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		if _, ok := f.Tag.Lookup("protobuf_oneof"); ok {
			infos = append(infos, oneofFields[t.Name()]...)
			continue
		}
		tag, ok := f.Tag.Lookup("protobuf")
		if !ok {
			continue // e.g. the unexported unknownFields byte slice
		}
		ft := f.Type
		repeated := false
		if ft.Kind() == reflect.Slice {
			repeated = true
			ft = ft.Elem()
		}
		var nested reflect.Type
		if ft.Kind() == reflect.Ptr && ft.Elem().Kind() == reflect.Struct {
			nested = ft.Elem()
		}
		infos = append(infos, fieldInfo{
			names:    tagNames(tag),
			nested:   nested,
			repeated: repeated,
		})
	}
	return infos
}

func findFieldInfo(infos []fieldInfo, key string) (fieldInfo, bool) {
	for _, fi := range infos {
		for _, n := range fi.names {
			if n == key {
				return fi, true
			}
		}
	}
	return fieldInfo{}, false
}

// validateKnownFields recursively checks a yaml.v3-decoded value (nested
// map[string]any / []any) against message type t and returns an error
// naming the first field it doesn't recognize.
func validateKnownFields(t reflect.Type, value any, path string) error {
	if value == nil {
		return nil
	}
	obj, ok := value.(map[string]any)
	if !ok {
		return fmt.Errorf("%s: expected a mapping, got %T", path, value)
	}

	infos := messageFields(t)
	for key, v := range obj {
		fi, ok := findFieldInfo(infos, key)
		if !ok {
			return fmt.Errorf("%s: unrecognized field %q", path, key)
		}
		if fi.nested == nil {
			continue
		}

		childPath := fmt.Sprintf("%s.%s", path, key)
		if !fi.repeated {
			if err := validateKnownFields(fi.nested, v, childPath); err != nil {
				return err
			}
			continue
		}

		if v == nil {
			continue
		}
		arr, ok := v.([]any)
		if !ok {
			return fmt.Errorf("%s: expected a list, got %T", childPath, v)
		}
		for i, elem := range arr {
			if err := validateKnownFields(fi.nested, elem, fmt.Sprintf("%s[%d]", childPath, i)); err != nil {
				return err
			}
		}
	}
	return nil
}
