export default async function handler(req, res) {
    const { serverCode, train, edr } = req.query;
    let url;
    if (edr === 'true') {
        url = `https://api1.aws.simrail.eu:8082/api/getEDRTimetables?serverCode=${serverCode}${train ? `&train=${train}` : ''}`;
    } else {
        url = `https://api1.aws.simrail.eu:8082/api/getAllTimetables?serverCode=${serverCode}${train ? `&train=${train}` : ''}`;
    }
    try {
        console.log('Proxying to:', url);
        const response = await fetch(url);
        const text = await response.text();
        console.log('SimRail API response:', text.slice(0, 500)); // log only first 500 chars
        let data;
        try {
            data = JSON.parse(text);
        } catch (jsonErr) {
            res.status(502).json({ error: 'Invalid JSON from SimRail API', details: text });
            return;
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
