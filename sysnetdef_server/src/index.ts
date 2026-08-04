import { createApp } from '#/app';
import { ENV } from '#/core/config/env';
import Table from 'cli-table3';
import path from 'path';

const { httpServer, dbPath } = createApp();

httpServer.listen(ENV.PORT, () => {
  // Rút gọn đường dẫn Database để hiển thị không bị tràn dòng
  const displayDbPath = path.relative(process.cwd(), dbPath);

  // Khởi tạo bảng Dashboard
  const table = new Table({
    head: [
      {
        colSpan: 2,
        content: '\x1b[36m🛡️  SYSNETDEF SERVER CONTROL\x1b[0m',
        hAlign: 'center',
      } as any,
    ],
    colWidths: [20, 53], // Tăng nhẹ độ rộng cột tiêu đề
    wordWrap: true,
    style: {
      head: [],
      border: ['gray'],
    },
  });

  // Gom nhóm các đường dẫn UDS vào 1 chuỗi duy nhất
  const udsPaths = `\x1b[33m• IDS/IPS:\x1b[0m ${ENV.UDS_PATH_IDPS}`;

  // Nạp dữ liệu vào các hàng của bảng
  table.push(
    [{ content: 'Status' }, `\x1b[32m● RUNNING\x1b[0m`],
    [{ content: 'Node Env' }, ENV.NODE_ENV],
    [{ content: 'Streaming Mode' }, ENV.STREAMING_MODE],
    [{ content: 'Endpoint' }, `http://localhost:${ENV.PORT}`],
    [{ content: 'Database' }, `\x1b[90m${displayDbPath}\x1b[0m`],
    [{ content: 'TCP Control' }, `Port ${ENV.TCP_PORT} \x1b[32m(Ready)\x1b[0m`],
    [{ content: 'Security UDS' }, udsPaths] // 3 đường dẫn nằm gọn trong 1 ô
  );
  console.log('\n' + table.toString() + '\n');
});