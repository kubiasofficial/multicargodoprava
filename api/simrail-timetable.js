export default async function handler(req, res) {
    const { serverCode, train, edr } = req.query;
    let url;
    if (edr === 'true') {
        url = `https://api1.aws.simrail.eu:8082/api/getEDRTimetables?serverCode=${serverCode}${train ? `&train=${train}` : ''}`;
    } else {
        url = `https://api1.aws.simrail.eu:8082/api/getAllTimetables?serverCode=${serverCode}${train ? `&train=${train}` : ''}`;
    }
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
