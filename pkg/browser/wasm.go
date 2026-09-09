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

//go:build js && wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/josephlewis42/compose-editor/pkg/templateengine"
)

func main() {
	fmt.Println("started wasm")

	js.Global().Set("convertComposeSpec", js.FuncOf(func(this js.Value, args []js.Value) any {
		var input templateengine.Input

		if err := json.Unmarshal([]byte(args[0].String()), &input); err != nil {
			return js.ValueOf(err.Error())
		}

		output := templateengine.Convert(&input)

		data, err := json.Marshal(output)
		if err != nil {
			fmt.Printf("couldn't encode JSON to return: %w\n", err)
			return js.ValueOf(err.Error())
		}

		return js.ValueOf(string(data))
	}))

	<-make(chan bool) // To use anything from Go WASM, the program may not exit.
}
