const axios = require('axios');
async function test() {
    try {
        const r = await axios.post('http://localhost:4000/api/v1/auth/signIn', {
            email: 'superadmin@gmail.com',
            password: 'password123'
        });
        const token = r.data.token;
        console.log("Token:", token);

        const taxes = await axios.get('http://localhost:4000/api/v1/taxes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Taxes:", taxes.data);
    } catch (e) {
        console.error('API error:', e.response?.data || e.message);
    }
}
test();
