declare module "*.yaml" {
  interface Content {
    [key: string]: string | Content;
  }

  const content: Content;
  export default content;
}
