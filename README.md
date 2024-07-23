# xlink-sdk

## How to install the privately published package

1. [Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)
2. Add a `.npmrc' file to the project that needs to install this package
    ```
    @xlink-network:registry=https://npm.pkg.github.com
    ```
3. Run `npm install`