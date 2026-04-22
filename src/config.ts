export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT ? +process.env.PORT : 4399,
  group: '595941841',
  author: 'Viki <hi@viki.moe>',
  github: 'https://github.com/vikiboss/60s',
  debug: !!process.env.DEBUG,
  overseas_first: !!process.env.OVERSEAS_FIRST,
  encodingParamName: process.env.ENCODING_PARAM_NAME || 'encoding',
}

export const COMMON_MSG = `获取成功。当前部署平台 Deno Deploy Classic 预计将于 7 月 20 日 终止服务，届时公共 API 服务（60s.viki.moe）可能出现中断。建议尽快迁移至私有部署，以确保服务持续可用。开源地址 ${config.github}，反馈群 ${config.group}。`
