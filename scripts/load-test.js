// scripts/load-test.js
// Basic K6 load test
// To run: k6 run scripts/load-test.js (Requires k6 installed)
// Or use this as a reference or use a Node.js based runner if k6 is not available.

import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
};

export default function () {
    const BASE_URL = 'http://localhost:3000'; // Target local dev

    const res = http.get(BASE_URL);

    check(res, {
        'is status 200': (r) => r.status === 200,
        'protocol is HTTP/2': (r) => r.proto === 'HTTP/2.0',
    });

    sleep(1);
}
