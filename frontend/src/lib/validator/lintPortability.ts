import type { ComposeFile } from "./composeFile";
import { ErrorReporter } from "./errorReporter";
import type { ValidationError } from "./errors";

export function checkPortability(toCheck: ComposeFile): ValidationError[] {
    const reporter = new ErrorReporter('portability')

    reporter.field('services', ()=>{
        reporter.fields(toCheck.services, (value) => {
            reporter.field('image', ()=> {
                const {image} = value
                if (image) {
                    reporter.assert(
                        image.split('/').length > 2, 
                        'Images should have registry name and namespace to improve portability between runtimes e.g. Docker and Podman',
                    )
                }
            })
        })
        
    })

    return reporter.errors
}
