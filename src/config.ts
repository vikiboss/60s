export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT ? +process.env.PORT : 4399,
  group: '1134573460',
  author: 'boycot <boycot2017@163.com>',
  github: 'https://github.com/boycot/byt.api_v2',
  debug: !!process.env.DEBUG,
  encodingParamName: process.env.ENCODING_PARAM_NAME || 'encoding',
}

export const COMMON_MSG = `获取成功。数据来自官方/权威源头，以确保稳定与实时。开源地址 ${config.github}，反馈群 ${config.group}`
