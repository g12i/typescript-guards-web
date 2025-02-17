# TypeScript Type Guard Generator

This project is a web application built with SvelteKit that generates TypeScript type guards based on provided TypeScript type definitions.  It's available online at: [TypeScript Type Guard Generator](https://typescript-guards-web.pages.dev/)

## Usage
1.  **Input TypeScript Code**: Enter the TypeScript code for which you want to generate type guards in the left editor pane.
2.  **Configure Options**: Use the "Options" menu to customize the generation settings:
    -   **Plain object check**: Choose between 'simple', 'insert', 'lodash', or 'es-toolkit'.
    -   **Has own check**: Choose between 'in' or 'hasOwn'.
3.  **View Generated Type Guards**: The generated type guards will be displayed in the right editor pane. The code is automatically formatted using Prettier.

## TODO
1. Fix generic type handling
2. Fix indexed types handling
3. Implement interface inheritance
4. Branded/Nominal Types
