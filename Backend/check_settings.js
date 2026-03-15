import { MongoClient } from 'mongodb';

async function run() {
    const uri = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dafaterAccounting');
        const settings = await db.collection('settings').find({ category: 'general' }).toArray();
        console.log(JSON.stringify(settings, null, 2));
    } finally {
        await client.close();
    }
}
run().catch(console.error);
