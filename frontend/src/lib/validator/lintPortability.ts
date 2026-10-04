import type { ComposeFile } from "./composeFile";
import { ErrorReporter } from "./errorReporter";
import type { ValidationError } from "./errors";

const MIN_SLASHES_IN_FULL_DOCKER_URI = 2

export function checkPortability(toCheck: ComposeFile): ValidationError[] {
    const reporter = new ErrorReporter('portability')

    reporter.field('services', ()=>{
        reporter.fields(toCheck.services, (value) => {
            reporter.field('image', ()=> {
                const {image} = value
                if (image) {
                    reporter.assert(
                        image.split('/').length > MIN_SLASHES_IN_FULL_DOCKER_URI, 
                        'Images should have registry name and namespace to improve portability between runtimes e.g. Docker and Podman',
                    )
                }
            })
        })
        
    })

    return reporter.errors
}
