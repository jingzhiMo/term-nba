const inquirer = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')
const {
  generateGameListFetcher,
  generateGameDetailFetcher
} = require('./game')

let spinner
// 主客队名称
let homeName
let awayName

// 提供选择的渠道
const CHANNEL = {
  'hupu': 'https://m.hupu.com',
  'zhiboba': 'https://zhiboba.com',
  'tencent': 'https://sports.qq.com'
}
let gameDetailFetcher

async function fetchGameDetail(id, ...arg) {
  spinner.text = '加载比赛信息...'
  spinner.color = 'green'
  spinner.start()

  const result = await gameDetailFetcher(id, ...arg)
  const {
    liveText,
    pid,
    status
  } = result

  // 直播信息没有更新
  if (status === 404) {
    setTimeout(() => {
      fetchGameDetail(id, ...args)
    }, 5000)
    return
  }
  // console.log('liveText', pid)
  spinner.stop()

  let beforeScore = [0, 0]

  liveText.forEach(text => {
    let scoreText = ''
    // 分数发生改变
    if (beforeScore[0] !== text.awayScore || beforeScore[1] !== text.homeScore) {
      scoreText = chalk.cyanBright(`(${text.awayScore}) ${homeName} VS ${awayName} (${text.homeScore})`)
      beforeScore = [text.awayScore, text.homeScore]
    }
    console.log(chalk.blueBright(text.time), text.event, scoreText)
  })
  setTimeout(() => {
    fetchGameDetail(id, pid)
  }, 5000)
  console.log('---------------')
  spinner.text = '等待下一次请求...'
  spinner.color = 'yellow'
  spinner.start()
}

async function run() {
  const { channel } = await inquirer.prompt([{
      type: 'list',
      name: 'channel',
      message: '选择加载渠道',
      choices: [
        { name: '虎扑', value: 'hupu' },
        { name: '直播吧', value: 'zhiboba' },
        { name: '腾讯直播', value: 'tencent' }
      ]
  }])

  // console.log('answer', CHANNEL[channel])
  // console.log()
  spinner = ora({
    text: '加载比赛列表...',
    color: 'blue'
  }).start()
  // console.log(chalk.greenBright('加载比赛列表...'))
  // console.log()
  const gameList = await generateGameListFetcher()()

  spinner.stop()
  const { id } = await inquirer.prompt({
    type: 'list',
    name: 'id',
    message: '选择比赛场次',
    choices: gameList
  })

  // console.log(result)
  let game = gameList.filter(g => g.value === id)[0]

  homeName = game.homeName
  awayName = game.awayName
  gameDetailFetcher = generateGameDetailFetcher()
  fetchGameDetail(id)
}

run()
