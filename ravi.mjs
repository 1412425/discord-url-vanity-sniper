import tls from 'tls';
import uws from 'ws'; 
import ky from 'ky';
import extractJsonFromString from "extract-json-from-string";
import https from 'https';

const apiUrl = 'https://canary.discord.com/api/v8/'; 
let tlsSocket;
let websocket;
let vanity;
const guilds = {};

const snipertoken = 'BURAYA URL Yİ CEKİCEK TOKENİ GİR';
const mesajtoken = 'MESAJ GONDERİCEK TOKENİ SİL';
const self = 'SUNUCULARIN İCİNDE BULUNAN TOKENİ GİR';
const id = '14X SUNUCU İD SİNİ GİR';
const channel = 'MESAJ TOKENİN YETKİSİ OLAN BİR KANAL İD GİR';

function connectTLS() {
    tlsSocket = tls.connect({ host: 'canary.discord.com', port: 443 });
    tlsSocket.on('data', onData);
    tlsSocket.on('error', connectTLS);
    tlsSocket.on('end', connectTLS);
    tlsSocket.on('secureConnect', () => {
        const urlRequest = `GET /api/v8/gateway HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n`;
        tlsSocket.write(urlRequest);
        websocket = new uws('wss://gateway.discord.gg');
        websocket.on('open', () => {
            setInterval(() => {
                if (websocket.readyState === websocket.OPEN) {
                    websocket.ping();
                }
                tlsSocket.write('GET / HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n');
            }, 7500);
        });
        websocket.on('close', connectTLS);
        websocket.on('message', onMessage);
        tlsSocket.on("data", async (data) => {
            const ext = extractJsonFromString(data.toString());
            const find = ext.find((e) => e.code || e.message);
            if (find) { 
                console.log(find);
                const requestBody = JSON.stringify({ content: `@everyone  \`\`\`json\n${JSON.stringify(find)}\`\`\`` });
                tlsSocket.write(`POST /api/v8/channels/${channel}/messages HTTP/1.1\r\nHost: canary.discord.com\r\nAuthorization: ${mesajtoken}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(requestBody)}\r\n\r\n${requestBody}`);
            }
        });
    });
}
async function onData(data) {}
async function onMessage(message) {
    const { d, op, t } = JSON.parse(message.toString());
    if (t === 'GUILD_UPDATE') GuildUpdate(d);
    else if (t === 'GUILD_DELETE') GuildDelete(d);
    else if (t === 'READY') Ready(d);
    if (op === 10) Op10(d, websocket);
    else if (op === 7) Op7();
}
async function GuildUpdate(guild) {
    const find = guilds[guild.id];
    vanity = guild.vanity_url_code;
    if (find && find !== guild.vanity_url_code) {
        const requestBody = JSON.stringify({ code: find });
        const patchRequest = `PATCH /api/v8/guilds/${id}/vanity-url HTTP/1.1\r\nHost: canary.discord.com\r\nAuthorization: ${mesajtoken}\r\nContent-Type: application/json\r\nContent-Length: ${requestBody.length}\r\n\r\n${requestBody}`;
        tlsSocket.write(patchRequest);
        const vanityPayload = JSON.stringify({ code: find });
        const vanityHeaders = {
            'Host': 'canary.discord.com',
            'Authorization': mesajtoken,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(vanityPayload),
            'Connection': 'keep-alive',
        };
        const uwsRequest = `PATCH /api/v8/guilds/${id}/vanity-url HTTP/1.1\r\n${Object.entries(vanityHeaders).map(([key, value]) => `${key}: ${value}`).join('\r\n')}\r\n\r\n${vanityPayload}`;
        websocket.send(uwsRequest);
        try {
            const response = await fasterrequest(`${apiUrl}/guilds/${id}/vanity-url`, 'PATCH', vanityHeaders, vanityPayload, true);
            if (response.ok) {
                console.log('ky update.');
            } else {
                console.error('Failed via Ky:', response);
            }
        } catch (error) {
            console.error('Error  via Ky:', error);
        }
        await fasterrequest(`${apiUrl}/guilds/${id}/vanity-url`, 'PATCH', vanityHeaders, vanityPayload, true);
    }
}
async function GuildDelete(guild) {
    const find = guilds[guild.id];
    if (find) {
        const vanityPayload = JSON.stringify({ code: find });
        const vanityHeaders = {
            'Host': 'canary.discord.com',
            'Authorization': snipertoken,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(vanityPayload),
            'Connection': 'keep-alive',
        };
        const endpoint = `${apiUrl}/guilds/${id}/vanity-url`;
        try {
            const response = await ky.patch(endpoint, { headers: vanityHeaders, json: { code: find } });
            if (response.ok) {
                console.log('change vanity:',find);
            } else {
                console.error('Failed to update Vanity URL:', await response.text());
            }
        } catch (error) {
            console.error('Error occurred while updating Vanity URL:', error);
        }
    }
}
async function fasterrequest(url, method, headers, body, json) {
    try {
        const response = await https.request(url, {
            method: method,
            headers: headers,
            body: body,
            json: json
        });
        return response;
    } catch (error) {
        throw error;
    }
}
async function Ready(data) {
    data.guilds.forEach((guild) => { if (guild.vanity_url_code) guilds[guild.id] = guild.vanity_url_code; });
}
async function Op10(data, websocket) {
    websocket.send(JSON.stringify({ op: 2, d: { token: self, intents: 513 << 0, properties: { os: 'linux', browser: 'Brave', device: 'desktop' } } }));
}
async function Op7() {}
function reconnectWebSocket() {
    if (!websocket || websocket.readyState === WebSocket.CLOSED) connectTLS();
}
connectTLS();