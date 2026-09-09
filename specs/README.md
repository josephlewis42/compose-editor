# Spec docs

This page outlines how to write compose editor specs.

## Best practices

* Defaults should be secure.
  * Use a warning block if a value is insecure.
* Hide advanced features (like debugging) in collapsible sections.
  * Use more than one collapsible section if needed e.g. for developer options versus security.
* Link to authoritative sources in form elements.
* Use the most specific field type possible.

## File format

Specs are written in YAML and stored in the `specs/` folder under a directory
named after the application e.g. `/specs/freshrss/spec.yaml`. The directory
should be all lower-case and use underscores rather than spaces.

An example spec is below:

```yaml
# Human readable name of the application.
name: FreshRSS
# Tagline for the application.
tagline: A free, self-hostable feed aggregator.
# URL to the application's main website or source code repository.
# MUST be HTTP/HTTPS
url: https://freshrss.org/
# License code from https://spdx.org/licenses/
# If the license isn't listed, use "Other"
spdx_license: AGPL-3.0
# License URL
license_url: https://github.com/FreshRSS/FreshRSS/blob/edge/LICENSE.txt
# Freeform tags to help users search for the format.
# Ideally, one word and lowercase.
tags:
- rss
- news

# YAML template, see sections below
# for how to use the template language and functions.
template: |-
  services:
    hello_world:
      image: {{.image}}

# Form fields, see below for examples
form:
- select:
    keyname: image
    label: Image
    description: Container image to use.
    default_value: hello-world:latest
    options:
    - title: hello-world:latest
      value: hello-world:latest
```


`composeeditor build specs/ out.json` renders template with no
values as a sanity check and fails the build if any template fails to parse
or execute, so a spec with a broken template can't reach the published
catalog.


## Template language

The template language is Go's: https://pkg.go.dev/text/template

## Template functions

Templates provide the following sprig functions: https://masterminds.github.io/sprig/

## Form Fields

### Layout Elements

Layout elements help structure a form so it's easy for a human to understand.

#### Alerts

Alerts come in four variants `info`, `warning`, `danger`, `success` and have the following common fields:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `content` | yes | A markdown description to be shown in the alert. |

Example:

```yaml
info:
  content: |-
    **Information**: You should ALWAYS use :latest.
```

#### `heading`

Headings insert a heading text into a form:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `title` | yes | The title of the heading. |
| `content` | no | Markdown content to be shown below the heading. |

Example:

```yaml
heading:
  title: Security configuration
  content: |-
    See [official documentation](http://example.com) for recommended setup.
```

#### `markdown`

Markdown inserts a block of markdown into a form, e.g. for prose that doesn't fit
an alert or heading:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `content` | yes | Markdown content to be shown in the block. |

Example:

```yaml
text:
  content: |-
    See [official documentation](http://example.com) for recommended setup.
```

#### `collapsible`

Collapsible insert a collapsible section into a form. These are usually used to hide
advanced elements.

| Property Name | Required? | Notes |
|--- | --- | --- |
| `title` | yes | Title for the collapsible content. |
| `form` | yes | List of form elements shown when expanded. |

#### `oneof`

The `oneof` is a special type of layout element. It presents the user with a set of 
options as tabs that contain additional form content.

Each entry in a oneof must have a unique name, and the currently selected tab is injected
as a variable.

`oneof` properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `tabs` | yes | Repeated `tab` (see below). |
| `keyname` | yes | Variable the currently selected tab will be injected as into the template. |

`tab` properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `title` | yes | Title for the tab. |
| `value` | yes | Unique value for this tab to be stored in `keyname` when selected. |
| `form` | yes | List of form elements. |

### Input elements

Input elements are used to create variables for the user.

They are generally built around HTML elements. All input elements
share the following common properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `keyname` | yes | Variable the value of this field will be injected as into the template. Must be `[a-zA-Z0-9_]+` |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |


#### `url`

Allows a user to input a URL in an input box.

Additional properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `placeholder` | no | Placeholder for the URL |

#### `string`

Allows a user to input a single line text string in an input box.

Additional properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `placeholder` | no | Placeholder for the string. |
| `regex` | no | Regex used to validate the input. |

#### `text`

Allows a user to input a multi-line text string in a textarea box. Compiles
to `"type": "textarea"` in the output JSON — see the naming-collision note
under the layout `text` element above.

Additional properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `placeholder` | no | Placeholder for the textarea. |

#### `code`

Allows a user to input a multi-line text string in a textarea box formatted with
a monospace font and line numbers.

Additional properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `placeholder` | no | Placeholder for the textarea. |

#### `password`

Allows a user to input a single line text string in a input box with masked input.

Additional properties:

| Property Name | Required? | Notes |
|--- | --- | --- |
| `placeholder` | no | Placeholder for the input. |

#### `toggle`

Displays a toggle so the user can enable/disable something. The value is true or false.


#### `number`

Allows the user to enter a number using a numeric input

| Property Name | Required? | Notes |
|--- | --- | --- |
| `minimum` | yes | Minimum value. |
| `maximum` | yes | Maximum value. |
| `step` | yes | Step value. |

#### `date`

Allows the user to enter a date using a date picker.

#### `select`

Allows the user to pick a value from a dropdown.

| Property Name | Required? | Notes |
|--- | --- | --- |
| `options` | yes | An array of `option` to be shown in order, see below. |

`option`

| Property Name | Required ? | Notes |
| --- | --- | --- |
| `title` | yes | Title to show the user for the option. |
| `value` | no | Value associated with the option, if unset, the title is used. |
| `optgroup` | no | If set, this `option` is created as an optgroup instead of a selectable value. Subsequent options are grouped into it until another optgroup is encountered. |
