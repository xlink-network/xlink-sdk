# xlink-sdk

## How to install the privately published package from GitHub Package Registry

1. Follow the guide [Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) to create a personal access token

2. Add a `.npmrc` file to the project that needs to install this package (the `GITHUB_NPM_KEY' is an environment variable, which is the personal access token created in the previous step)
    ```
    @xlink-network:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${GITHUB_NPM_KEY}
    ```

3. Run `npm install`