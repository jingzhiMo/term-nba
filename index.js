const inquirer = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')
const {
  generateGameListFetcher,
  generateGameDetailFetcher,
  hupuInitFetcher
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

async function fetchGameDetail(id, nextId) {
  spinner.text = '加载比赛信息...'
  spinner.color = 'green'
  spinner.start()

  const {
    liveText,
    pid,
    status,
    quarter
  } = await gameDetailFetcher(id, nextId)

  // 直播信息没有更新
  if (status === 404) {
    spinner.text = '等待下一次请求...'
    spinner.color = 'yellow'
    setTimeout(() => {
      fetchGameDetail(id, nextId)
    }, 10000)
    return
  }
  spinner.stop()

  liveText.forEach(text => {
    let scoreText = ''
    // 分数发生改变
    if (text.scoreChange) {
      scoreText = chalk.cyanBright(`(${text.awayScore}) ${awayName} VS ${homeName} (${text.homeScore})`)
      beforeScore = [text.awayScore, text.homeScore]
    }
    console.log(chalk.blueBright(quarter + ': ' + text.time), text.event, scoreText)
  })
  setTimeout(() => {
    fetchGameDetail(id, pid)
  }, 10000)
  console.log('---------------')
  spinner.text = '等待下一次请求...'
  spinner.color = 'yellow'
}

/**
 * @description 显示列表
 */
async function promptGameList(gameList) {
  const selectGame = gameList.filter(game => game.status === '2')
  const gameListPrompt = {
    type: 'list',
    name: 'id',
    message: '选择比赛场次',
    choices: gameList,
    default: selectGame.length ? selectGame[0].value: undefined
  }
  let { id } = await inquirer.prompt(gameListPrompt)

  let game = gameList.filter(g => g.value === id)[0]

  homeName = game.homeName
  awayName = game.awayName

  // 已结束
  if (game.status === '1') {
    console.log('该比赛已结束')
    console.log(chalk.cyanBright(game.match))
    console.log()

    const { isContinue } = await inquirer.prompt({
      type: 'list',
      name: 'isContinue',
      message: '是否选择其他比赛？',
      choices: [
        { value: 1, name: '是' },
        { value: 0, name: '否' }
      ]
    })

    if (isContinue) {
      promptGameList(gameList)
    } else {
      process.exit(1)
    }
  } else {
    fetchGame(id)
  }
}

/**
 * @description  获取比赛数据
 * @param  {String} id 比赛场次对应的id
 */
async function fetchGame(id) {
  let { nextId } = await hupuInitFetcher(id)

  gameDetailFetcher = generateGameDetailFetcher()
  fetchGameDetail(id, nextId)
}

/**
 * @description 启动显示
 */
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

  spinner = ora({
    text: '加载比赛列表...',
    color: 'blue'
  }).start()
  const gameList = await generateGameListFetcher()()

  spinner.stop()
  promptGameList(gameList)
}

run()
