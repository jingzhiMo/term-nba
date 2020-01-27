const inquirer = require('inquirer')
const chalk = require('chalk')
const {
  generateGameListFetcher,
  generateGameDetailFetcher,
  hupuInitFetcher
} = require('./game')
const spinner = require('./spinner')

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

/**
 * @description 获取比赛详情
 * @param {String} id 比赛的id
 * @param {String} nextId 下一页详情的页码
 */
async function fetchGameDetail(id, nextId) {
  spinner.loadingDetail()

  const {
    liveText,
    pid,
    status,
    quarter
  } = await gameDetailFetcher(id, nextId)

  // 直播信息没有更新
  if (status === 404) {
    spinner.waiting()
    delayFetchGameDetail(id, nextId)
    return
  }

  spinner.stop()
  spinner.clear()
  liveText.forEach(text => {
    let scoreText = ''
    // 分数发生改变
    if (text.scoreChange) {
      scoreText = chalk.cyanBright(`(${text.awayScore}) ${awayName} VS ${homeName} (${text.homeScore})`)
      beforeScore = [text.awayScore, text.homeScore]
    }
    console.log(chalk.blueBright(quarter + ': ' + text.time), text.event, scoreText)
  })
  delayFetchGameDetail(id, pid)
  console.log('---------------')
  spinner.waiting()
}

/**
 *
 * @param {String} id 比赛的id
 * @param {String} pid 下一页详情的页码
 * @param {Number} delay 延迟获取比赛详情，默认10s(可选)
 */
function delayFetchGameDetail(id, pid, delay = 10000) {
    setTimeout(() => {
      fetchGameDetail(id, pid)
    }, delay)
}

/**
 * @description 显示列表
 */
async function promptGameList(gameList) {
  // status=2 为进行中
  let selectGame = gameList.filter(game => game.status === '2')
  let gameListPrompt

  // status = 3 为未开始
  selectGame = selectGame.length ? selectGame : gameList.filter(game => game.status === '3')
  gameListPrompt = {
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

  // 已结束/未开始
  if (game.status === '1' || game.status === '3') {
    console.log()
    console.log(`该比赛${game.status === '1' ? '已结束' : '未开始'}`, chalk.greenBright(game.match))
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
    fetchInitGame(id)
  }
}

/**
 * @description  获取比赛数据
 * @param  {String} id 比赛场次对应的id
 */
async function fetchInitGame(id) {
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

  spinner.loadingList()
  const gameList = await generateGameListFetcher()()

  spinner.stop()
  promptGameList(gameList)
}

run()
