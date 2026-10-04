import type { ComposeFile } from "./composeFile";
import { ErrorReporter } from "./errorReporter";
import type { ValidationError } from "./errors";

export function checkStyle(toCheck: ComposeFile): ValidationError[] {
    const errorReporter = new ErrorReporter('style')

    errorReporter.field('version', ()=>{
        errorReporter.assert(
            toCheck.version === undefined, 
            'The version field is obsolete and should be removed.',
        )
    })

    return errorReporter.errors
}
