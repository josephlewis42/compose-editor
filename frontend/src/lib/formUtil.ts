import { type FormElement } from './catalog'
import { type ValidationError } from '@/lib/validator'
import { childPath, indexPath } from './validator/errors'

export function flattenForm(elements: FormElement[], parentJsonPath: string): FormElementWrapper[] {
    const output: FormElementWrapper[] = []

    elements.forEach((element, idx) => {
        output.push(...flattenFormElement(element, `${parentJsonPath}[${idx}]`))
    })

    return output
}

function flattenFormElement(formElement: FormElement, parentJsonPath: string): FormElementWrapper[] {
    const basePath: string = `${parentJsonPath}.${formElement.element.case}`
    const output: FormElementWrapper[] = []
    output.push(new FormElementWrapper(formElement, basePath))

    switch(formElement.element.case) {
        // Form elements that don't support values:
        case "info":
        case "warning":
        case "danger":
        case "success":
        case "heading":
        case "markdown":
        case undefined:
            return output

        // Elements without children:
        case "toggle":
        case "port":
        case "number":
        case "select":
        case "date":
        case "url":
        case "str":
        case "text":
        case "code":
        case "password":
            return output

        // Elements that can have sub-forms:
        case "collapsible": 
        case "toggleSection": {
            return output.concat(flattenForm(formElement.element.value.form, `${basePath}.form`)) 
        }
        case "oneOf": {
            formElement.element.value.tabs.forEach((tab, idx) => {
                output.push(...flattenForm(tab.form, `${basePath}[${idx}].form`))
            })

            return output
        }
    }
}

export class FormElementWrapper {
    _formElement: FormElement
    _jsonPath: string

    constructor(formElement: FormElement, jsonPath: string) {
        this._formElement = formElement
        this._jsonPath = jsonPath
    }

    public get formElement(): FormElement{
        return this._formElement
    }

    public get jsonPath(): string{
        return this._jsonPath
    }

    public isInput(): boolean {
        return this.keyName() !== undefined
    }

    public keyName(): string|undefined {
        switch(this._formElement.element.case) {
            case "info":
            case "warning":
            case "danger":
            case "success":
            case "heading":
            case "markdown":
            case "collapsible":
            case undefined:
                return undefined 

            default:
                return this._formElement.element.value.keyname
        }
    }

    public defaultValue(): string|number|boolean|undefined {
         switch(this._formElement.element.case) {
            case "info":
            case "warning":
            case "danger":
            case "success":
            case "heading":
            case "markdown":
            case "collapsible":
            case undefined:
                return undefined 

            case "oneOf":
                return this._formElement.element.value.tabs[0].value

            default:
                return this._formElement.element.value.defaultValue
        }
    }

    public isValid(value: string|number|boolean|undefined): boolean {
        switch(this._formElement.element.case) {
            // Form elements that don't support values:
            case "info":
            case "warning":
            case "danger":
            case "success":
            case "heading":
            case "markdown":
            case "collapsible":
            case undefined:
                return false 

            // oneOf allows any of its sub-tabs:
            case "oneOf": {
                const found = this._formElement.element.value.tabs.find(tab => tab.value === value)
                return undefined !== found
            }

            // boolean values
            case "toggle":
            case "toggleSection":
                return value === true || value === false

            case "port": {
                if (Number.isFinite(value)) {
                    const parsed = Number(value)
                    return (parsed > 0 && parsed <= 65536)
                } else {
                    return false
                }
            }

            case "number": {
                if (Number.isFinite(value)) {
                    const parsed = Number(value)

                    return (parsed >= this._formElement.element.value.minimum) && 
                            (parsed <= this._formElement.element.value.maximum) &&
                            (parsed % this._formElement.element.value.step === 0);
                } else {
                    return false
                }
            }

            case "select": {
                if (value === undefined) {
                    return false
                }

                const strValue = value?.toString()

                const matchingOption = this._formElement.element.value.options.find(option => {
                    if (option.value === '') {
                        return option.title === strValue
                    } else {
                        return option.value === strValue
                    }
                })

                return undefined !== matchingOption
            }

            case "date": {
                if (value === undefined) {
                    return false
                }

                const strValue = value?.toString()

                return /^\d\d\d\d-\d\d-\d\d$/.test(strValue)
            }
            
            case "url":
            case "str":
            case "text":
            case "code":
            case "password": {
                if (value === undefined) {
                    return false
                }
                const strValue = value?.toString()

                const validation = this._formElement.element.value.validation
                if (!validation) {
                    return true
                }

                return RegExp(validation.regex).test(strValue)
            }
        }
    }

    public validateElement(): ValidationError[] {
        const element = this._formElement.element
        const errors: ValidationError[] = []
        const rootPath = this._jsonPath

        const requireString = function(propertyName: string, value: string, path?: string) {
            if (value.length == 0) {
                errors.push({
                    path: childPath(path || rootPath, propertyName),
                    type: 'required',
                    message: 'field must not be empty'
                })
            }
        }


        switch(element.case) {
            case undefined:
                return [{path: this._jsonPath, type: 'parse', message: 'Unknown element type'}]

            // Alerts
            case "info":
            case "warning":
            case "danger":
            case "success": {
                if (element.value.content.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'content'),
                        type: 'required',
                        message: 'content must not be empty'
                    })
                }
                return errors
            }

            case "heading": {
                if (element.value.title.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'title'),
                        type: 'required',
                        message: 'title must not be empty'
                    })
                }

                if (element.value.content.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'content'),
                        type: 'required',
                        message: 'content must not be empty'
                    })
                }
                return errors
            }
            case "markdown": {
                if (element.value.content.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'content'),
                        type: 'required',
                        message: 'content must not be empty'
                    })
                }
                return errors
            }
            case "collapsible": {
                if (element.value.title.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'title'),
                        type: 'required',
                        message: 'title must not be empty'
                    })
                }
                if (element.value.form.length == 0) {
                    errors.push({
                        path: childPath(this._jsonPath, 'form'),
                        type: 'required',
                        message: 'form must not be empty'
                    })
                }

                return errors
            }

            case "oneOf": {
                const input = element.value
                requireString('keyname', input.keyname)

                if (input.tabs.length == 0) {
                    errors.push({
                        path: childPath(rootPath, 'tabs'),
                        type: 'required',
                        message: 'tabs must not be empty'
                    })
                }

                const tabsPath = childPath(rootPath, 'tabs')
                const seenTabValues = new Set<string>()
                input.tabs.forEach((tab, idx) => {
                    const tabPath = indexPath(tabsPath, idx)
                    requireString('title', tab.title, tabPath)
                    requireString('value', tab.value, tabPath)

                    if (tab.value.length > 0) {
                        if (seenTabValues.has(tab.value)) {
                            errors.push({
                                path: childPath(tabPath, 'value'),
                                type: 'unique_items',
                                message: `duplicate tab value ${JSON.stringify(tab.value)}`
                            })
                        }
                        seenTabValues.add(tab.value)
                    }

                    if (tab.form.length == 0) {
                        errors.push({
                            path: childPath(tabPath, 'form'),
                            type: 'required',
                            message: 'form must not be empty'
                        })
                    }
                })

                return errors
            }

            case "toggle": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)
                return errors
            }
            case "toggleSection": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)
                // description is optional

                if (input.form.length == 0) {
                    errors.push({
                        path: childPath(rootPath, 'form'),
                        type: 'required',
                        message: 'form must not be empty'
                    })
                }

                return errors
            }
            case "port": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)

                if (!this.isValid(input.defaultValue)) {
                    errors.push({
                        path: childPath(rootPath, 'defaultValue'),
                        type: 'range',
                        message: 'default value must be a port between 1 and 65536'
                    })
                }

                return errors
            }

            case "number": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)

                if (input.minimum > input.maximum) {
                    errors.push({
                        path: childPath(rootPath, 'minimum'),
                        type: 'range',
                        message: 'minimum must not be greater than maximum'
                    })
                }

                if (input.step <= 0) {
                    errors.push({
                        path: childPath(rootPath, 'step'),
                        type: 'range',
                        message: 'step must be greater than zero'
                    })
                }

                if (!this.isValid(input.defaultValue)) {
                    errors.push({
                        path: childPath(rootPath, 'defaultValue'),
                        type: 'range',
                        message: 'default value must be between minimum and maximum and a multiple of step'
                    })
                }

                return errors
            }
            case "select": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)

                if (input.options.length == 0) {
                    errors.push({
                        path: childPath(rootPath, 'options'),
                        type: 'required',
                        message: 'options must not be empty'
                    })
                }

                const optionsPath = childPath(rootPath, 'options')
                const seenOptionValues = new Set<string>()
                input.options.forEach((option, idx) => {
                    const optionPath = indexPath(optionsPath, idx)
                    requireString('title', option.title, optionPath)

                    // optgroups are headers, not selectable values
                    if (option.optgroup.length > 0) {
                        return
                    }

                    const value = option.value.length > 0 ? option.value : option.title
                    if (seenOptionValues.has(value)) {
                        errors.push({
                            path: childPath(optionPath, 'value'),
                            type: 'unique_items',
                            message: `duplicate option value ${JSON.stringify(value)}`
                        })
                    }
                    seenOptionValues.add(value)
                })

                const defaultValue = this.defaultValue() || ''
                if (!this.isValid(defaultValue)) {
                    errors.push({
                        path: childPath(rootPath, 'defaultValue'),
                        type: 'parse',
                        message: `the default value ('${defaultValue}') must pass validation rules`
                    })
                }

                return errors
            }

            case "date": {
                const input = element.value
                requireString('keyname', input.keyname)
                requireString('label', input.label)
                return errors
            }
            
            // String values
            case "url":
            case "str":
            case "text":
            case "code":
            case "password": {
                const stringInput = element.value
                requireString('keyname', stringInput.keyname)
                requireString('label', stringInput.label)
                // description is optional
                
                if (stringInput.validation !== undefined) {
                    const stringValidation = stringInput.validation
                    const stringValidationPath = childPath(rootPath, 'validation')

                    requireString('regex', stringValidation.regex, stringValidationPath)

                    try {
                        new RegExp(stringValidation.regex)
                    } catch (e) {
                        errors.push({
                            path: childPath(stringValidationPath, 'regex'),
                            type: 'pattern',
                            message: `invalid regex: ${e}`
                        })
                    }

                    stringValidation.regex
                }

                const defaultValue = this.defaultValue() || ''
                if (!this.isValid(defaultValue)) {
                    errors.push({
                        path: childPath(rootPath, 'defaultValue'),
                        type: 'parse',
                        message: `the default value ('${defaultValue}') must pass validation rules`
                    })
                }

                return errors
            }
        }
    }
}
