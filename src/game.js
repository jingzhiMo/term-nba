const request = require('request-promise-native')
const moment = require('moment')
const JSDOM = require('jsdom').JSDOM

/**
 *
 * @param {Date} date 日期类型
 * @param {Number} order 是否过期的比赛，1为未来，2为过期
 */
async function hupuListFetcher(date, order) {
  // 默认请求当天的比赛列表
  date = moment(Date.now() - 2 * 86400000).format('YYYY-MM-DD')
  order = order || 1

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
  const midnight = new Date().setHours(0, 0, 0, 0) / 1000

  // 没有比赛
  if (typeof data === 'string') return []

  Object.keys(data).filter(time => Number(time) >= midnight).forEach(id => {
    const info = data[id].gameinfo.map(item => {
      let match = `(${item.away.score}) ${item.away.name} VS ${item.home.name} (${item.home.score}) `

      return {
        value: item.match_id,
        status: item.status,
        homeName: item.home.name,
        awayName: item.away.name,
        match: match,
        name: `${match} -- ${item.process}`
      }
    })
    gameinfo.push(...info)
  })
  return gameinfo.sort((a, b) => a.status - b.status)
}

/**
 * @param {String} id gameId 比赛的id
 * @param {String} pid 每次请求对应的唯一id
 */
async function hupuDetailFetcher(id, pid) {
  const result = await request({
    method: 'POST',
    uri: `https://m.hupu.com/api/nba/game/getlastdata?gameid=${id}&pid=${pid || 0}`,
    json: true
  })
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
        awayScore: item.away_score,
        scoreChange: !!item.score_change
      })).reverse(),
      pid: result.data.prevpid,
      status: 200,
      quarter: result.data.process.split('剩')[0],
      process: result.data.process
    }
  }

  return {
    status: 404
  }
}

/**
 * @description  获取初始pid
 * @param {String} id 比赛的id
 */
exports.hupuInitFetcher = async function(id) {
  const html = await request({
    method: 'GET',
    uri: `https://m.hupu.com/nba/game/playbyplay_${id}.html`,
    headers: {
      referer: 'https://m.hupu.com/nba/game',
      origin: 'https://m.hupu.com',
    }
  })

  const dom = new JSDOM(html)
  const body = dom.window.document.body
  const element = body.querySelector('.match-live')
  const prevId = element.attributes['prev-id']
  const nextId = element.attributes['next-id']
  const isover = element.attributes['isover'].value

  return {
    // 已结束赛事没有该数据
    prevId: prevId ? prevId.value : null,
    nextId: nextId ? nextId.value : null,
    isover
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
