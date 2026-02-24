export const ConsoleLogs = (tag, message) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${tag}]`, message);
  }
};
