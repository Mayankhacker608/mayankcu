const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const hostedApiBase = 'https://backend-qj81pgqgz-mayanks-projects-accab2b4.vercel.app';

window.API_BASE = isLocal ? 'http://localhost:5000/api' : `${hostedApiBase}/api`;
window.APP_BASE = isLocal ? 'http://localhost:5000' : hostedApiBase;
