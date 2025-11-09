import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// 加载环境变量
config();

const PORT = process.env.PORT || 8000;
const OPERATOR_NAME = process.env.OPERATOR_NAME;

// 验证必需的环境变量
function validateEnvironment(): void {
  if (!OPERATOR_NAME) {
    console.error('❌ 错误：缺少必需的环境变量 OPERATOR_NAME（启动者姓名）');
    console.error('\n请设置环境变量：');
    console.error('1. 创建 .env 文件：');
    console.error('   OPERATOR_NAME=张三');
    console.error('   PORT=8000');
    console.error('\n2. 或者在启动时设置：');
    console.error('   OPERATOR_NAME=张三 npm start');
    process.exit(1);
  }
  
  console.log('✅ 环境变量验证通过');
  console.log(`   启动者: ${OPERATOR_NAME}`);
  console.log(`   端口: ${PORT}`);
}

// 启动前验证
validateEnvironment();

// 定义计算器工具
const TOOLS: Tool[] = [
  {
    name: 'add',
    description: '加法运算：计算两个数的和',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '第一个数字',
        },
        b: {
          type: 'number',
          description: '第二个数字',
        },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'subtract',
    description: '减法运算：计算两个数的差',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '被减数',
        },
        b: {
          type: 'number',
          description: '减数',
        },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'multiply',
    description: '乘法运算：计算两个数的积',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '第一个数字',
        },
        b: {
          type: 'number',
          description: '第二个数字',
        },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'divide',
    description: '除法运算：计算两个数的商',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '被除数',
        },
        b: {
          type: 'number',
          description: '除数（不能为0）',
        },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'power',
    description: '幂运算：计算 a 的 b 次方',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '底数',
        },
        b: {
          type: 'number',
          description: '指数',
        },
      },
      required: ['a', 'b'],
    },
  },
  {
    name: 'sqrt',
    description: '平方根运算：计算一个数的平方根',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: '需要计算平方根的数字（非负数）',
        },
      },
      required: ['a'],
    },
  },
  {
    name: 'factorial',
    description: '阶乘运算：计算一个非负整数的阶乘',
    inputSchema: {
      type: 'object',
      properties: {
        n: {
          type: 'number',
          description: '需要计算阶乘的非负整数',
        },
      },
      required: ['n'],
    },
  },
  {
    name: 'get_operator_info',
    description: '获取服务器启动者信息',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// 计算阶乘的辅助函数
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('阶乘只能计算非负整数');
  }
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// 创建 MCP 服务器实例
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'mcp-calculator',
      version: '1.0.1',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 处理工具列表请求
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // 处理工具调用请求
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: number;

      switch (name) {
        case 'add': {
          const a = args?.a as number;
          const b = args?.b as number;
          result = a + b;
          return {
            content: [
              {
                type: 'text',
                text: `${a} + ${b} = ${result}`,
              },
            ],
          };
        }

        case 'subtract': {
          const a = args?.a as number;
          const b = args?.b as number;
          result = a - b;
          return {
            content: [
              {
                type: 'text',
                text: `${a} - ${b} = ${result}`,
              },
            ],
          };
        }

        case 'multiply': {
          const a = args?.a as number;
          const b = args?.b as number;
          result = a * b;
          return {
            content: [
              {
                type: 'text',
                text: `${a} × ${b} = ${result}`,
              },
            ],
          };
        }

        case 'divide': {
          const a = args?.a as number;
          const b = args?.b as number;
          if (b === 0) {
            throw new Error('除数不能为零');
          }
          result = a / b;
          return {
            content: [
              {
                type: 'text',
                text: `${a} ÷ ${b} = ${result}`,
              },
            ],
          };
        }

        case 'power': {
          const a = args?.a as number;
          const b = args?.b as number;
          result = Math.pow(a, b);
          return {
            content: [
              {
                type: 'text',
                text: `${a}^${b} = ${result}`,
              },
            ],
          };
        }

        case 'sqrt': {
          const a = args?.a as number;
          if (a < 0) {
            throw new Error('不能计算负数的平方根');
          }
          result = Math.sqrt(a);
          return {
            content: [
              {
                type: 'text',
                text: `√${a} = ${result}`,
              },
            ],
          };
        }

        case 'factorial': {
          const n = args?.n as number;
          result = factorial(n);
          return {
            content: [
              {
                type: 'text',
                text: `${n}! = ${result}`,
              },
            ],
          };
        }

        case 'get_operator_info': {
          const info = {
            operatorName: OPERATOR_NAME,
            serverName: 'mcp-calculator',
            version: '1.0.1',
            port: PORT,
            startTime: new Date().toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            }),
          };
          return {
            content: [
              {
                type: 'text',
                text: `服务器信息:\n${JSON.stringify(info, null, 2)}`,
              },
            ],
          };
        }

        default:
          throw new Error(`未知工具: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `错误: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// 启动 Express 服务器
async function main() {
  const app = express();

  // 启用 CORS
  app.use(cors());
  app.use(express.json());

  // 健康检查端点
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'mcp-calculator',
      version: '1.0.1',
      operator: OPERATOR_NAME,
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  // SSE 端点
  app.get('/sse', async (req, res) => {
    console.log('新的 SSE 连接');

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 创建 MCP 服务器实例
    const mcpServer = createMCPServer();

    // 创建 SSE transport
    const transport = new SSEServerTransport('/message', res);

    // 连接服务器和 transport
    await mcpServer.connect(transport);

    console.log('MCP 服务器已通过 SSE 连接');

    // 处理连接关闭
    req.on('close', () => {
      console.log('SSE 连接已关闭');
      mcpServer.close();
    });
  });

  // POST 端点用于接收客户端消息
  app.post('/message', async (req, res) => {
    // 这个端点会被 SSE transport 自动处理
    res.json({ status: 'ok' });
  });

  // 启动服务器
  app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🚀 MCP 计算器服务器已启动');
    console.log('=================================');
    console.log(`👤 启动者: ${OPERATOR_NAME}`);
    console.log(`🌐 服务地址: http://localhost:${PORT}`);
    console.log(`📡 SSE 端点: http://localhost:${PORT}/sse`);
    console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('=================================\n');
  });
}

main().catch((error) => {
  console.error('服务器错误:', error);
  process.exit(1);
});

