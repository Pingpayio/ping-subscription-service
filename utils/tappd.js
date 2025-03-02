import net from 'net';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export function to_hex(data) {
    if (typeof data === 'string') {
        return Buffer.from(data).toString('hex');
    }
    if (data instanceof Uint8Array) {
        return Buffer.from(data).toString('hex');
    }
    return data.toString('hex');
}

function x509key_to_uint8array(pem, max_length) {
    const content = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\n/g, '');
    const binaryDer = atob(content);
    if (!max_length) {
        max_length = binaryDer.length;
    }
    const result = new Uint8Array(max_length);
    for (let i = 0; i < max_length; i++) {
        result[i] = binaryDer.charCodeAt(i);
    }
    return result;
}

function replay_rtmr(history) {
    const INIT_MR =
        '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    if (history.length === 0) {
        return INIT_MR;
    }
    let mr = Buffer.from(INIT_MR, 'hex');
    for (const content of history) {
        // Convert hex string to buffer
        let contentBuffer = Buffer.from(content, 'hex');
        // Pad content with zeros if shorter than 48 bytes
        if (contentBuffer.length < 48) {
            const padding = Buffer.alloc(48 - contentBuffer.length, 0);
            contentBuffer = Buffer.concat([contentBuffer, padding]);
        }
        mr = crypto
            .createHash('sha384')
            .update(Buffer.concat([mr, contentBuffer]))
            .digest();
    }
    return mr.toString('hex');
}

function reply_rtmrs(event_log) {
    const rtmrs = [];
    for (let idx = 0; idx < 4; idx++) {
        const history = event_log
            .filter((event) => event.imr === idx)
            .map((event) => event.digest);
        rtmrs[idx] = replay_rtmr(history);
    }
    return rtmrs;
}

export function send_rpc_request(endpoint, path, payload) {
    return new Promise((resolve, reject) => {
        const abortController = new AbortController();
        const timeout = setTimeout(() => {
            abortController.abort();
            reject(new Error('Request timed out'));
        }, 30_000); // 30 seconds timeout

        const isHttp =
            endpoint.startsWith('http://') || endpoint.startsWith('https://');

        if (isHttp) {
            const url = new URL(path, endpoint);
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };

            const req = (url.protocol === 'https:' ? https : http).request(
                url,
                options,
                (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        clearTimeout(timeout);
                        try {
                            const result = JSON.parse(data);
                            resolve(result);
                        } catch (error) {
                            reject(new Error('Failed to parse response'));
                        }
                    });
                },
            );

            req.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            abortController.signal.addEventListener('abort', () => {
                req.destroy();
                reject(new Error('Request aborted'));
            });

            req.write(payload);
            req.end();
        } else {
            const client = net.createConnection({ path: endpoint }, () => {
                client.write(`POST ${path} HTTP/1.1\r\n`);
                client.write(`Host: localhost\r\n`);
                client.write(`Content-Type: application/json\r\n`);
                client.write(`Content-Length: ${payload.length}\r\n`);
                client.write('\r\n');
                client.write(payload);
            });

            let data = '';
            let headers = {};
            let headersParsed = false;
            let contentLength = 0;
            let bodyData = '';

            client.on('data', (chunk) => {
                data += chunk;
                if (!headersParsed) {
                    const headerEndIndex = data.indexOf('\r\n\r\n');
                    if (headerEndIndex !== -1) {
                        const headerLines = data
                            .slice(0, headerEndIndex)
                            .split('\r\n');
                        headerLines.forEach((line) => {
                            const [key, value] = line.split(': ');
                            if (key && value) {
                                headers[key.toLowerCase()] = value;
                            }
                        });
                        headersParsed = true;
                        contentLength = parseInt(
                            headers['content-length'] || '0',
                            10,
                        );
                        bodyData = data.slice(headerEndIndex + 4);
                    }
                } else {
                    bodyData += chunk;
                }

                if (headersParsed && bodyData.length >= contentLength) {
                    client.end();
                }
            });

            client.on('end', () => {
                clearTimeout(timeout);
                try {
                    const result = JSON.parse(bodyData.slice(0, contentLength));
                    resolve(result);
                } catch (error) {
                    reject(new Error('Failed to parse response'));
                }
            });

            client.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });

            abortController.signal.addEventListener('abort', () => {
                client.destroy();
                reject(new Error('Request aborted'));
            });
        }
    });
}

export class TappdClient {
    constructor(endpoint = '/var/run/tappd.sock') {
        if (process.env.DSTACK_SIMULATOR_ENDPOINT) {
            console.debug(
                `Using simulator endpoint: ${process.env.DSTACK_SIMULATOR_ENDPOINT}`,
            );
            endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
        }
        this.endpoint = endpoint;
    }

    async getInfo() {
        const result = await send_rpc_request(
            this.endpoint,
            '/prpc/Tappd.Info',
            '',
        );

        return result;
    }

    async deriveKey(path, subject, alt_names) {
        let raw = {
            path: path || '',
            subject: subject || path || '',
        };
        if (alt_names && alt_names.length) {
            raw['alt_names'] = alt_names;
        }
        const payload = JSON.stringify(raw);
        const result = await send_rpc_request(
            this.endpoint,
            '/prpc/Tappd.DeriveKey',
            payload,
        );
        
        // Add asUint8Array method to the result
        result.asUint8Array = (length) => x509key_to_uint8array(result.key, length);
        
        return Object.freeze(result);
    }

    async tdxQuote(report_data, hash_algorithm) {
        let hex = to_hex(report_data);
        if (hash_algorithm === 'raw') {
            if (hex.length > 128) {
                throw new Error(
                    `Report data is too large, it should less then 64 bytes when hash_algorithm is raw.`,
                );
            }
            if (hex.length < 128) {
                hex = hex.padStart(128, '0');
            }
        }
        const payload = JSON.stringify({ report_data: hex, hash_algorithm });
        const result = await send_rpc_request(
            this.endpoint,
            '/prpc/Tappd.TdxQuote',
            payload,
        );
        if ('error' in result) {
            const err = result['error'];
            throw new Error(err);
        }
        
        // Add replayRtmrs method to the result
        result.replayRtmrs = () => reply_rtmrs(JSON.parse(result.event_log));
        
        return Object.freeze(result);
    }
}
