import type { Linter, ValidationError } from "./errors";
import { type JsonType, checkType } from "./primitives";

/** Maps JsonType descriptor to the TypeScript type it narrows to. */
interface JsonTypeMap {
    string: string
    number: number
    integer: number
    boolean: boolean
    null: null
    object: Record<string, unknown>
    array: unknown[]
}


export class ErrorReporter {
    #linter: Linter
    #errors: ValidationError[]
    #currentPath: string

    constructor(linter: Linter) {
        this.#linter = linter
        this.#errors = []
        this.#currentPath = '$'
    }

    get errors(): ValidationError[] {
        return this.#errors
    }

    public assert(assertion: boolean, message: string) {
        if (!assertion) {
            this.addError(message)
        }
    }


    public addError(message: string) {
        this.#errors.push({
            message,
            path: this.#currentPath,
            type: this.#linter,
        })
    }

    public field(name: string, callback: Function) {
        const oldPath = this.#currentPath
        this.#currentPath = `${oldPath}.${name}`

        callback()

        this.#currentPath = oldPath
    }

    public index(idx: number, callback: Function) {
        const oldPath = this.#currentPath
        this.#currentPath = `${oldPath}[${idx}]`

        callback()

        this.#currentPath = oldPath
    }

    public each<T>(fieldName: string, items: T[], callback: (value: T, index: number) => void) {
        this.field(fieldName, () => {
            items.forEach((value, index) => {
                this.index(index, () => {
                    callback(value, index)
                })
            })
        })
    }

    public fields<T>(items: Record<string, T> | undefined, callback: (value: T, key: string) => void) {
        if (items === undefined) {
            return
        }
        for (const [key, value] of Object.entries(items)) {
            this.field(key, () => {
                callback(value, key)
            })
        }
    }

    public assertType<const T extends readonly JsonType[]>(
        value: unknown,
        types: T,
        callback?: (value: JsonTypeMap[T[number]]) => void
    ) {
        if (undefined === value) {
            this.addError(`field is missing`)
            return
        }

        const typeResult = checkType(value, types, '')
        if (typeResult !== null) {
            this.addError(typeResult.message)
            return
        }

        if(callback) {
            callback(value as JsonTypeMap[T[number]])
        }
    }
}