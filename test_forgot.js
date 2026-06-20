const { POST } = require('./.next/server/app/api/auth/forgot-password/route.js');
async function test() {
  const req = {
    json: async () => ({ email: 'vaibhavbhalla67@gmail.com' })
  };
  const res = await POST(req);
  console.log(await res.json());
}
test().catch(console.error);
