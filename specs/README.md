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
      image: {{.Values.image}}

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

At runtime, values from the fields are injected under the `.Values` key.

## Template functions

Templates provide the following sprig functions: https://masterminds.github.io/sprig/

## Form Fields

Every entry in a spec's `form` list (or a `collapsible`/`oneof` tab's
nested `form`) is one of the elements below, written as a single-key YAML
map, e.g. `- select: {...}`. See [spec.proto](../proto/composeeditor/v1/spec.proto)
for the source of truth this file is generated from.

## `info`

Renders markdown in an info box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `content` | yes | A markdown description to be shown in the alert. |

Example:

```yaml
info:
  content: |-
    **Information**: You should ALWAYS use :latest.
```

## `warning`

Renders markdown in an warning box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `content` | yes | A markdown description to be shown in the alert. |

Example:

```yaml
warning:
  content: |-
    **Warning**: This service should be placed behind a reverse proxy with HTTPS in production.
```

## `danger`

Renders markdown in an danger box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `content` | yes | A markdown description to be shown in the alert. |

Example:

```yaml
danger:
  content: |-
    **Danger**: Deleting this volume will permanently erase all data.
```

## `success`

Renders markdown in an success box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `content` | yes | A markdown description to be shown in the alert. |

Example:

```yaml
success:
  content: |-
    **Success**: Setup complete — you can now log in with the admin account.
```

## `heading`

Heading inserts a heading into a form.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `title` | yes | The title of the heading. |
| `content` | no | Markdown content to be shown below the heading. |

Example:

```yaml
heading:
  title: Security configuration
  content: |-
    See [official documentation](http://example.com) for recommended setup.
```

## `markdown`

Inserts a block of markdown into a form, e.g. for prose that doesn't fit an alert or heading.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `content` | yes | Markdown content to be shown in the block. |

Example:

```yaml
markdown:
  content: |-
    See [official documentation](http://example.com) for recommended setup.
```

## `collapsible`

Collapsible inserts a collapsible section into a form. Usually used to hide advanced elements.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `title` | yes | Title for the collapsible content. |
| `form` | yes | List of form elements shown when expanded. |

Example:

```yaml
collapsible:
  title: Advanced
  form:
    - toggle:
        keyname: enable_access_log
        label: Enable Access Log
```

## `oneof`

OneOf presents the user with a set of options as tabs that contain additional form content. The currently selected tab's value is injected into the template as a variable.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable the currently selected tab's value will be injected as into the template. |
| `tabs` | yes | The tabs to present, list of `OneOfTab` objects (see below). |

**`OneOfTab`**

| Property Name | Required? | Notes |
| --- | --- | --- |
| `title` | yes | Title for the tab. |
| `value` | yes | Unique value for this tab, stored in the parent OneOf's keyname when selected. |
| `form` | yes | List of form elements shown while this tab is selected. |

Example:

```yaml
oneof:
  keyname: backend
  tabs:
    - title: SQLite
      value: sqlite
      form: []
    - title: PostgreSQL
      value: postgres
      form:
        - string:
            keyname: postgres_host
            label: PostgreSQL Host
```

## `url`

Lets a user input a URL in an input box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `placeholder` | no | Placeholder for the URL input. |

Example:

```yaml
url:
  keyname: base_url
  label: Base URL
  placeholder: https://example.com
```

## `string`

Lets a user input a single line text string in an input box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `placeholder` | no | Placeholder for the string input. |
| `regex` | no | Regex used to validate the input. |

Example:

```yaml
string:
  keyname: tz
  label: Time Zone
  description: The timezone the container should run in.
  default_value: UTC
```

## `text`

Lets a user input a multi-line text string in a textarea box.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `placeholder` | no | Placeholder for the textarea. |

Example:

```yaml
text:
  keyname: media_paths
  label: Media Paths
  description: Host directories containing your media libraries, one per line.
  placeholder: |-
    /path/to/movies
    /path/to/tv
```

## `code`

Lets a user input a multi-line text string in a textarea box formatted with a monospace font and line numbers.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `placeholder` | no | Placeholder for the textarea. |

Example:

```yaml
code:
  keyname: extra_config
  label: Extra Configuration
  placeholder: |-
    # additional config, one directive per line
```

## `password`

Lets a user input a single line text string in an input box with masked input.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `placeholder` | no | Placeholder for the input. |

Example:

```yaml
password:
  keyname: admin_password
  label: Admin Password
  description: Required if an admin username is set above.
```

## `toggle`

Displays a toggle so the user can enable/disable something. The value is true or false.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |

Example:

```yaml
toggle:
  keyname: enable_healthcheck
  label: Enable Healthcheck
  default_value: true
```

## `number`

Lets the user enter a number using a numeric input.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `minimum` | yes | Minimum value. |
| `maximum` | yes | Maximum value. |
| `step` | yes | Step value. |

Example:

```yaml
number:
  keyname: port
  label: Port
  default_value: 3433
  minimum: 1
  maximum: 65535
  step: 1
```

## `date`

Lets the user enter a date using a date picker.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |

Example:

```yaml
date:
  keyname: start_date
  label: Start Date
```

## `select`

Lets the user pick a value from a dropdown.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `options` | yes | Options to be shown in order. |

**`SelectOption`**

| Property Name | Required? | Notes |
| --- | --- | --- |
| `title` | yes | Title to show the user for the option. |
| `value` | no | Value associated with the option; if unset, the title is used. |
| `optgroup` | no | If set, this option is created as an optgroup instead of a selectable value. Subsequent options are grouped into it until another optgroup is encountered. |

Example:

```yaml
select:
  keyname: image
  label: Image
  default_value: hello-world:latest
  options:
    - title: hello-world:latest
      value: hello-world:latest
```


## `port`

Lets the user pick a port.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `default_value` | no | Default value. |


## `select`

Lets the user pick a value from a dropdown.

| Property Name | Required? | Notes |
| --- | --- | --- |
| `keyname` | yes | Variable this field's value is injected as into the template. Must be [a-zA-Z0-9_]+. |
| `label` | yes | Label for the field. |
| `description` | no | Markdown description for the field. |
| `help_text` | no | Markdown help text shown under the field. |
| `default_value` | no | Default value. |
| `options` | yes | Options to be shown in order. |

**`SelectOption`**

| Property Name | Required? | Notes |
| --- | --- | --- |
| `title` | yes | Title to show the user for the option. |
| `value` | no | Value associated with the option; if unset, the title is used. |
| `optgroup` | no | If set, this option is created as an optgroup instead of a selectable value. Subsequent options are grouped into it until another optgroup is encountered. |

Example:

```yaml
select:
  keyname: image
  label: Image
  default_value: hello-world:latest
  options:
    - title: hello-world:latest
      value: hello-world:latest
```
