import { createServer } from 'node:http';
export async function startFakeIntegrations(port = 0) {
  const state = {
    mode: 'ok',
    consumptionRequests: 0,
    redirectedRequests: 0,
    authenticated: 0,
    spool: {
      id: 101,
      filament: {
        id: 201,
        name: 'Synthetic remote PLA',
        material: 'PLA',
        color_hex: '22AA88',
        price: 20,
        weight: 1000,
        vendor: { id: 301, name: 'Synthetic Vendor' },
      },
      price: 20,
      initial_weight: 1000,
      remaining_weight: 900 as number | null,
      location: 'Test shelf',
      archived: false,
    },
    logs: [
      {
        id: 401,
        printer_id: 7,
        print_name: 'Synthetic terminal job',
        status: 'IDLE',
        completed_at: null as string | null,
        duration_seconds: 60 as number | null,
        filament_used_grams: 2 as number | null,
        failure_reason: null as string | null,
      },
    ],
  };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, 'http://localhost');
    if (url.pathname === '/redirect-target') state.redirectedRequests++;
    const isSpoolman =
      url.pathname === '/api/v1/spool' ||
      url.pathname.startsWith('/api/v1/spool/') ||
      url.pathname === '/api/v1/info';
    if (
      (isSpoolman && request.headers.authorization !== 'Bearer synthetic-secret') ||
      (!isSpoolman && request.headers['x-api-key'] !== 'synthetic-key')
    ) {
      response.writeHead(401);
      response.end('{}');
      return;
    }
    state.authenticated++;
    if (state.mode === 'redirect') {
      response.writeHead(302, { location: '/redirect-target' });
      response.end();
      return;
    }
    if (state.mode === 'offline') {
      response.writeHead(503);
      response.end('{}');
      return;
    }
    if (state.mode === 'malformed') {
      response.end('{oops');
      return;
    }
    response.setHeader('content-type', 'application/json');
    if (url.pathname === '/api/v1/spool/101/use') {
      state.consumptionRequests++;
      let raw = '';
      for await (const chunk of request) raw += chunk;
      state.spool.remaining_weight = (state.spool.remaining_weight ?? 0) - Number(JSON.parse(raw).use_weight);
      if (state.mode === 'ambiguous') {
        request.socket.destroy();
        return;
      }
      response.end(JSON.stringify(state.spool));
      return;
    }
    if (state.mode === 'timeout') {
      setTimeout(() => response.end('{}'), 4000).unref();
      return;
    }
    let body: unknown;
    if (url.pathname === '/api/v1/info' || url.pathname === '/api/v1/updates/version')
      body = { version: 'test-1', data_dir: 'synthetic-secret' };
    else if (url.pathname === '/api/v1/spool')
      body = Number(url.searchParams.get('offset') ?? 0) === 0 ? [state.spool] : [];
    else if (url.pathname === '/api/v1/spool/101') {
      if (state.mode === 'missing') {
        response.writeHead(404);
        response.end('{}');
        return;
      }
      body = state.spool;
    } else if (url.pathname === '/api/v1/printers/')
      body = [{ id: 7, name: 'Synthetic remote printer', access_code: 'synthetic-secret' }];
    else if (url.pathname === '/api/v1/printers/7')
      body = { id: 7, name: 'Synthetic remote printer', access_code: 'synthetic-secret' };
    else if (url.pathname === '/api/v1/printers/7/status')
      body = {
        id: 7,
        name: 'Synthetic remote printer',
        connected: true,
        state: 'IDLE',
        ams: [{ id: 0, tray: [{ id: 0, tray_type: 'PLA', tray_color: '22AA88' }] }],
        vt_tray: [],
        access_code: 'synthetic-secret',
      };
    else if (url.pathname === '/api/v1/spoolman/inventory/slot-assignments/all')
      body = [{ printer_id: 7, ams_id: 0, tray_id: 0, spoolman_spool_id: 101 }];
    else if (url.pathname === '/api/v1/print-log/') {
      const offset = Number(url.searchParams.get('offset') ?? 0);
      body = { items: state.logs.slice(offset, offset + 50), total: state.logs.length };
    } else {
      response.writeHead(404);
      body = {};
    }
    response.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No fake server address');
  return {
    state,
    url: `http://127.0.0.1:${address.port}`,
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}
