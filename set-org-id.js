// Script to set the correct organization ID for testing
const correctOrgId = "8df94c53-1364-4bbd-99a4-f9a0ffb01f9a";

console.log(`Setting organization ID to: ${correctOrgId}`);

// This script should be run in the browser console on http://localhost:3001
console.log(`Run this in browser console on http://localhost:3001:`);
console.log(`localStorage.setItem('chtq_org_id', '${correctOrgId}');`);
console.log(`localStorage.setItem('chtq_api_url', 'http://localhost:3000');`);
console.log(`window.location.reload();`);
