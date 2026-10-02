import type { Linter, ValidationError } from "./errors";


export class ErrorReporter {
    private _linter: Linter
    private _errors: ValidationError[]
    private _currentPath: string

    constructor(linter: Linter) {
        this._linter = linter
        this._errors = []
        this._currentPath = '$'
    }

    get errors(): ValidationError[] {
        return this._errors
    }

    public assert(assertion: boolean, message: string) {
        if (! assertion) {
            this.addError(message)
        }
    }


    public addError(message: string) {
        this._errors.push({
            path: this._currentPath,
            type: this._linter,
            message: message,
        })
    }

    public field(name: string, callback: Function){
        var _oldPath = this._currentPath
        this._currentPath = `${_oldPath}.${name}`

        callback()

        this._currentPath = _oldPath
    }

    public index(idx: number, callback: Function){
                var _oldPath = this._currentPath
        this._currentPath = `${_oldPath}[${idx}]`

        callback()

        this._currentPath = _oldPath
    }

    public each<T>(fieldName: string, items: T[], callback: (value: T, index: number) => void){
        this.field(fieldName, () => {
            items.forEach((value, index) => {
                this.index(index, ()=>{
                    callback(value, index)
                })
            })
        })
    }

    public fields<T>(items: Record<string, T>|undefined, callback: (value: T, key: string) => void){
        if(items === undefined) {
            return
        }
        for (let prop in items) {
            this.field(prop, () => {
                callback(items[prop], prop)
            })
        }
    }

}