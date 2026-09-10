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
	"fmt"
	"syscall/js"

	composeeditorv1 "github.com/josephlewis42/compose-editor/pkg/proto/composeeditor/v1"
	"github.com/josephlewis42/compose-editor/pkg/templateengine"
)

// uint8ArrayToBytes copies a JS Uint8Array argument into a Go []byte.
func uint8ArrayToBytes(v js.Value) []byte {
	buf := make([]byte, v.Get("length").Int())
	js.CopyBytesToGo(buf, v)
	return buf
}

// bytesToUint8Array copies a Go []byte into a new JS Uint8Array.
func bytesToUint8Array(data []byte) js.Value {
	array := js.Global().Get("Uint8Array").New(len(data))
	js.CopyBytesToJS(array, data)
	return array
}

func main() {
	fmt.Println("started wasm")

	js.Global().Set("convertComposeSpec", js.FuncOf(func(this js.Value, args []js.Value) any {
		var output *composeeditorv1.ConvertOutput

		var input composeeditorv1.ConvertInput

		if err := input.UnmarshalVT(uint8ArrayToBytes(args[0])); err != nil {
			output = &composeeditorv1.ConvertOutput{
				Errors: []*composeeditorv1.Message{{Message: "couldn't decode ConvertInput: " + err.Error()}},
			}
		} else {
			output = templateengine.Convert(&input)
		}

		data, err := output.MarshalVT()
		if err != nil {
			// proto.Marshal only fails on programmer error (e.g. cyclic
			// messages), never on user input - nothing more useful to do
			// than report it and return an empty response.
			fmt.Printf("couldn't encode ConvertOutput: %v\n", err)
			return bytesToUint8Array(nil)
		}

		return bytesToUint8Array(data)
	}))

	<-make(chan bool) // To use anything from Go WASM, the program may not exit.
}
