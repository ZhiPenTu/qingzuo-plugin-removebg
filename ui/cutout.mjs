export async function cutout(client, input) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(input.mime) || input.size > 22 * 1024 ** 2) throw new Error('请选择小于 22 MB 的 JPG、PNG 或 WebP 图片。');
  const response = await client.network.request({
    url: 'https://api.remove.bg/v1.0/removebg', method: 'POST',
    credential: 'removebg', credentialHeader: 'X-Api-Key', taskId: 'cutout',
    multipart: { fields: { size: 'auto', format: 'png' }, files: [{ field: 'image_file', token: input.token }] },
    responseType: 'file', filename: input.name.replace(/\.[^.]*$/, '') + '-透明背景.png',
  });
  try {
    if (response.status === 401 || response.status === 403) throw new Error('API 密钥无效或未授权。');
    if (response.status === 402) throw new Error('remove.bg 调用额度不足。');
    if (response.status === 429) throw new Error('服务请求过于频繁，请稍后手动重试。');
    if (response.status < 200 || response.status >= 300) throw new Error('抠图服务未完成处理（' + response.status + '）。');
    const value = await client.files.read(response.file.token), bytes = Uint8Array.from(atob(value.data), character => character.charCodeAt(0));
    if (![137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) throw new Error('服务没有返回有效的 PNG 图片。');
    return response.file;
  } catch (error) { await client.files.release(response.file.token); throw error; }
}
