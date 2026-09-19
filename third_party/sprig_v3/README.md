* Cloned from: `https://github.com/Masterminds/sprig`
* git SHA: `989da45d7c082c6ec85cf95f59e23b461cdafe03`
* License: MIT (see src/LICENSE.txt)

This fork reduces reliance on third party dependencies and Go's 
`net` and `crypto` packages to improve compile size on WASM.

* Hashing functions are kept, but certificate generation are not.