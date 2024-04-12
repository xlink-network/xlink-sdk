module.exports = {
  root: true,
  extends: [
    "./node_modules/@c4605/toolconfs/eslintrc.base",
    "./node_modules/@c4605/toolconfs/eslintrc.prettier",
    "./node_modules/@c4605/toolconfs/eslintrc.ts",
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
}