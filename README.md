# <img src="frontend/public/favicon.svg" align="left" height="40" width="40" > Compose Editor

An interactive editor to build Docker Compose/[Compose Specs](https://compose-spec.io/) for self-hosting.

> [!TIP]
> <a href="https://josephlewis42.github.io/compose-editor/" target="_blank" class="btn">Try it in your browser!</a>

## Why?

Self-hosting should be more about using your applications than fiddling with
YAML and debugging containers.

Compose editor simplifies this by giving you:

* A web based GUI to edit important values.
* Feedback for common errors.
* Downloadable compose YAML files.

## Adding new specs

Follow the instructions in [specs/README.md](specs/README.md) to add a new spec.

The template language is inspired by [Helm templates](https://helm.sh/docs/chart_template_guide/)
and provides a rich set of built-in functions [mostly identical to Helm's](https://helm.sh/docs/chart_template_guide/function_list).

## License

Licensed under the [Apache 2 License](LICENSE).

    Copyright 2026 Joseph Lewis III

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
