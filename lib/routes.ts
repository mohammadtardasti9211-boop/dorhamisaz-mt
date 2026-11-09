export const homeURL=import.meta.env.BASE_URL;
export const eventURL=(id:string)=>`${homeURL}?g=${encodeURIComponent(id)}`;
export const assetURL=(name:string)=>`${homeURL}${name}`;
