/**
 * Cloudflare Worker 脚本
 * 用于代理API请求，绕过域名封锁
 */

// 你的服务器IP和端口
const TARGET_HOST = '106.15.184.68';
const TARGET_PORT = '80';

// 允许的域名（可选，用于安全控制）
const ALLOWED_ORIGINS = [
  'https://xuconghu.github.io',
  'https://yourusername.github.io', // 替换为你的GitHub Pages域名
  'http://localhost',
  'https://localhost'
];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 获取请求的URL
  const url = new URL(request.url);
  
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // 检查是否是API请求
  if (url.pathname.startsWith('/api/')) {
    return await proxyToAPI(request, url);
  }
  
  // 默认返回404
  return new Response('Not Found', { status: 404 });
}

async function proxyToAPI(request, url) {
  try {
    // 构建目标URL
    const targetUrl = `http://${TARGET_HOST}:${TARGET_PORT}${url.pathname}${url.search}`;
    
    // 创建新的请求
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // 发送请求到你的服务器
    const response = await fetch(modifiedRequest);
    
    // 创建新的响应，添加CORS头
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
    
    return modifiedResponse;
    
  } catch (error) {
    console.error('代理请求失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: '代理服务器错误',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  // 检查来源是否被允许
  const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => 
    origin && (origin === allowedOrigin || origin.startsWith(allowedOrigin))
  );
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// 健康检查端点
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/health') {
    event.respondWith(new Response(JSON.stringify({
      success: true,
      message: 'Cloudflare Worker 运行正常',
      timestamp: new Date().toISOString(),
      worker: 'candy-game-proxy'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }));
  }
});
