export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT ? +process.env.PORT : 4399,
//   group: '595941841',
  group: '',
  author: '',
//   github: 'https://github.com/vikiboss/60s',
  github: '',
  encodingParamName: process.env.ENCODING_PARAM_NAME || 'encoding',
}

export const COMMON_MSG = `所有数据均来自官方，确保稳定与实时，用户群: ${config.group}，开源地址: ${config.github}`
