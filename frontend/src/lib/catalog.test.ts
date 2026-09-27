import { describe, expect, it } from 'vitest'
import { loadCatalog } from './catalog'
import { flattenForm } from './formUtil';
import { convertComposeSpec } from './wasm';
import { parseComposeYaml } from './validator';

describe('catalog', async () => {
    const result = await loadCatalog();

    it('has more than one application', () => {
        expect(result.applications.length).toBeGreaterThan(0)
    })

    it('has unique application names', () => {
        const knownNames = new Set<string>();

        for (const application of result.applications) {
            expect(knownNames).not.contains(application.name)

            knownNames.add(application.name)
        }
    })

    describe.each(result.applications)('$slug', (application) => {

        it('has valid metadata', () => {
            expect(application.slug, 'folder (slug) must be lowercase letters, numbers, and underscores').toMatch(/^[a-z0-9_]+$/)
            expect(application.name.length, 'name must not be blank').greaterThan(0)
            expect(application.tagline.length, 'tagline must not be blank').greaterThan(0)
            expect(application.url, 'URL must start with http or https').toMatch(/^https?:\/\/.*/)
            expect(application.spdxLicense.length, 'spdxLicense must not be blank').greaterThan(0)
            expect(application.licenseUrl, 'licenseUrl must start with http or https').toMatch(/^https?:\/\/.*/)
            expect(application.template.length, 'template must not be blank').greaterThan(0)
        })


        const formElements = flattenForm(application.form, "$.form")
        const seenNames = new Set<string>()

        // Validate form fields don't have duplicate names
        describe.each(formElements)("field $jsonPath", (element) => {
            it.skipIf(!element.isInput())('inputs', () => {
                const keyname = element.keyName() || ''
                expect(keyname, 'have a keyname').length.above(0)
                expect(seenNames.has(keyname), "haven't been defined previously").toBe(false)
                seenNames.add(keyname)
            })

            it('is a valid element', () => {
                expect(element.validateElement()).toEqual([])
            })
        })

        it('renders template with default values', async () => {
            const defaultValues: Record<string, unknown> = {};
            formElements
                .forEach(fe => {
                    const keyName = fe.keyName();
                    if (keyName !== undefined) {
                        defaultValues[keyName] = fe.defaultValue()
                    }
            });
            
            const result = await convertComposeSpec({
                template: application.template,
                values: defaultValues,
            })

            expect(result.compose_output.length).greaterThan(0)
            expect(result.errors.length, "expect no errors when rendering").equals(0)
            expect(result.warnings.length, "expect no warnings when rendering").equals(0)

            console.log("## Values: ", defaultValues)
            console.log("## Yaml:\n", result.compose_output)
            const parseResult = parseComposeYaml(result.compose_output)
            const errors = (parseResult.errors || []).
                map(e => `path: ${e.path} msg: ${e.message}`).
                join(", ")
            console.log("## Errors:\n", errors)

            expect(errors).toHaveLength(0)
        })
    })
})
