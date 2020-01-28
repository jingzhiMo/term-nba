const readline = require('readline')
const MuteStream = require('mute-stream')

/**
 * @description 监听用户键盘输入
 */
module.exports = () => {
  let returnCallback
  const input = process.stdin
  const output = new MuteStream()
  const rl = readline.createInterface({
    terminal: true,
    input,
    output
  })
  const onKeypress = (value, key) => {
    // 返回列表
    if (key.ctrl && key.name === 'd') {
      returnCallback(key)
      stop()
    }
  }

  output.pipe(process.stdout)
  /**
   * @description 初始化定义回调函数
   * @param {Function} callback 当按下 ctrl + d 的回调函数
   */
  const init = callback => {
    returnCallback = callback
  }

  /**
   * @description 开始监听键盘输入
   */
  const start = () => {
      if (typeof returnCallback !== 'function') {
        throw new Error('You should execute "init" method and pass a function as a param to "init" before execute "start" method')
      }
      rl.input.on('keypress', onKeypress)
  }

  /**
   * @description 暂停监听键盘输入
   */
  const stop = () => {
    rl.input.removeListener('keypress', onKeypress)
  }


  return {
    init,
    start,
    stop
  }
}
