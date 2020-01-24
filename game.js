const request = require('request-promise-native')
const moment = require('moment')
const response = require('./response.json')
// import moment from 'moment'

console.log()
/**
 *
 * @param {Date} date 日期类型
 * @param {Number} order 是否过期的比赛，1为未来，2为过期
 */
async function hupuListFetcher(date, order) {
  // 默认请求当天的比赛列表
  date = moment(Date.now() - 86400000).format('YYYY-MM-DD')
  order = order || 1

  // console.log('uri', `https://m.hupu.com/api/nba/gameslist?order=${order}&date=${date}`)
  const { data } = await request({
    method: 'POST',
    uri: `https://m.hupu.com/api/nba/gameslist?order=${order}&date=${date}`,
    headers: {
      referer: 'https://m.hupu.com/nba/game',
      origin: 'https://m.hupu.com',
      accept: 'application/json'
    },
    json: true
  })
  let gameinfo = []

  Object.keys(data).forEach(id => {
    const info = data[id].gameinfo.map(item => {
      // 未开始
      // if (item.status === 3) {
      //   // ..
      // } else if (item.status === 1) {
      //   // 已结束
      // } else {
      //   // 进行中
      // }
      let match = `(${item.home.score}) ${item.home.name} VS ${item.away.name} (${item.away.score})`

      return {
        value: item.match_id,
        status: item.status,
        homeName: item.home.name,
        awayName: item.away.name,
        name: `${match} -- ${item.process}`
      }
    })
    gameinfo.push(...info)
  })
  // console.log('result', gameinfo)
  return gameinfo.sort((a, b) => a.status - b.status)
}

async function delay() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 3000)
  })
}
/**
 * @param {String} id gameId 比赛的id
 * @param {String} pid 每次请求对应的唯一id
 */
async function hupuDetailFetcher(id, pid) {
  // console.log(`https://m.hupu.com/api/nba/game/getlastdata?gameid=${id}&pid=${pid || 0}`)
  /*
  const result = await request({
    method: 'POST',
    uri: `https://m.hupu.com/api/nba/game/getlastdata?gameid=${id}&pid=${pid || 0}`,
    json: true
  })
  */
  await delay()
  const result = response

  // console.log('detail', result)
  // 有数据返回，404为无更新
  if (result && result.status === '200') {
    let liveText = result.data.liveText

    // 没有传pid，为初始化的情况
    if (!pid) {
      liveText = liveText.slice(0, 10)
    }

    return {
      liveText: liveText.map(item => ({
        event: item.event,
        time: item.left_time,
        homeScore: item.home_score,
        awayScore: item.away_score
      })).reverse(),
      pid: result.data.prevpid,
      status: 200
    }
  }

  return {
    status: 404
  }
}

exports.generateGameListFetcher = function(channel) {
  switch (channel) {
  case 'hupu':
  default:
      return hupuListFetcher
  }
}

exports.generateGameDetailFetcher = function(channel) {
  switch (channel) {
  case 'hupu':
  default:
    return hupuDetailFetcher
  }
}
// generateGameListFetcher()()
