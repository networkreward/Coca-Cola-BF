module.exports = {
  plugins: ['@firebase/eslint-plugin-security-rules'],
  rules: {
    '@firebase/security-rules/no-insecure-rules': 'error'
  }
};
