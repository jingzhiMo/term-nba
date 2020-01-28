const ora = require('ora')
const spinner = ora({
  text: '加载比赛列表...',
  color: 'blue'
})

module.exports = {
  waiting() {
    spinner.text = '等待下一次请求...(ctrl + d 返回比赛列表)'
    spinner.color = 'yellow'
    spinner.start()
  },
  loadingList() {
    spinner.text = '加载比赛列表...'
    spinner.color = 'blue'
    spinner.start()
  },
  loadingDetail() {
    spinner.text = '加载比赛信息...(ctrl + d 返回比赛列表)'
    spinner.color = 'green'
    spinner.start()
  },
  start() {
    spinner.start()
  },
  stop() {
    spinner.stop()
  },
  clear() {
    spinner.clear()
  }
}
