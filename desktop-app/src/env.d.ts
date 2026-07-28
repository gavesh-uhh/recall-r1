declare module 'electron-squirrel-startup';

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
