import request from 'request'
import cheerio from 'cheerio'
import requestBullshitData from './request_bullshit.js'

const BASE_URL = 'http://www.princesadosul.com.br/cmh/PrevisaoChegada.aspx'

export default {
  getBusLines(){
    return new Promise((resolve, reject) => {
      request(BASE_URL, (error, response, body) => {
        if(error) return reject(error)

        const $ = cheerio.load(body)

        const roadLines = $('select[name=ddLinhas] option')
          .toArray()
          .map(option => {
            const value = $(option).attr('value')
            // Ignore the first option
            if(value === '0') return null

            return value
          })
          .filter(roadLine => roadLine !== null)

        resolve(roadLines)
      })
    })
  },

  getAllBusLineStops(busLine){
    return new Promise((resolve, reject) => {
      const SERVER_BUS_LINE_FIELD = ''
      const SERVER_SHOW_ADDRESS_OPTION = ''
      const SERVER_SHOW_STOP_NAME_OPTION = ''

      request.post({
        url: BASE_URL,
        form: Object.assign(requestBullshitData, {
          ddLinhas: busLine,
          chkEndereco: 'on',
          chkPontos: 'on',
        }),
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.82 Safari/537.36',
        },
      }, (error, response, body) => {
        const $ = cheerio.load(body)
        const directionsTables = $('#Ida_content table table')
        const stopWays = directionsTables.toArray().map(table => {
          return $(table).find('tr')
            .toArray()
            .map(tr => {
              const tds = $(tr).find('td[title]')

              return {
                address: tds.eq(0).text(),
                stopDescription: tds.eq(1).text(),
                isCurrentOne: $(tr).find('td img[src="Bus-Blink.gif"]').length !== 0,
              }
            })
        })

        resolve({
          going: stopWays[0],
          coming: stopWays[1],
        })
      })
    })
  },
}
