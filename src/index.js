#!/usr/bin/env node
const inquirer = require('inquirer')
const chalk = require('chalk')
const program = require('commander')

const {
  generateGameListFetcher,
  generateGameDetailFetcher,
  hupuInitFetcher
} = require('./game')
const spinner = require('./spinner')
const KBListener = require('./keybroad-listener')()

// 主客队名称
let homeName
let awayName
let gameDetailFetcher

// TODO 暂时只提供虎扑，后续支持其他渠道
// const CHANNEL = {
//   'hupu': 'https://m.hupu.com',
//   'zhiboba': 'https://zhiboba.com',
//   'tencent': 'https://sports.qq.com'
// }

program.option('-t, --time <number>', '请求比赛的时间间隔，单位：秒，最小值为5', parseInt)
program.parse(process.argv)

// 请求游戏之间的间隔，默认10s
const GAME_DELAY = program.time ? (program.time < 5 ? 5000 : program.time * 1000) : 10000

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
 */
function delayFetchGameDetail(id, pid) {
    setTimeout(() => {
      fetchGameDetail(id, pid)
    }, GAME_DELAY)
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
    KBListener.start()
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
  // TODO 暂时注释多渠道入口，默认为虎扑
  // const { channel } = await inquirer.prompt([{
  //     type: 'list',
  //     name: 'channel',
  //     message: '选择加载渠道',
  //     choices: [
  //       { name: '虎扑', value: 'hupu' },
  //       { name: '直播吧', value: 'zhiboba' },
  //       { name: '腾讯直播', value: 'tencent' }
  //     ]
  // }])
  spinner.loadingList()
  // 获取当日所有比赛列表
  const gameList = await generateGameListFetcher()()

  spinner.stop()
  promptGameList(gameList)
}

KBListener.init(() => {
  run()
  spinner.stop()
})
run()
