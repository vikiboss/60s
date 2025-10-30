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

export const COMMON_MSG = `获取成功，开源地址 ${config.github}，反馈群 ${config.group}`
