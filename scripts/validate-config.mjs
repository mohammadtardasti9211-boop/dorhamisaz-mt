const value=process.env.VITE_API_BASE_URL;
if(!value)throw new Error("Set the repository variable VITE_API_BASE_URL to your deployed API URL before publishing.");
const url=new URL(value);
if(url.protocol!=="https:" && !(url.protocol==="http:" && ["localhost","127.0.0.1"].includes(url.hostname)))throw new Error("API URL must use HTTPS.");
if(url.pathname!=="/"||url.search||url.hash||url.username||url.password)throw new Error("API URL must be an origin, without a path, key or query.");
