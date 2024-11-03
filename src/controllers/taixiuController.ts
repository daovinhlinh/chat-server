import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { Socket, DefaultEventsMap, Event } from 'socket.io'
import { Response, Request } from 'express'
import { ISocketData } from '~/contracts/socket'
import {
  ITaiXiuCuocPayload,
  ITaiXiuGetHistoryPayload,
  ITaiXiuUser
} from '~/contracts/taixiu'
import { ServerToClientEvents } from '~/crons/taixiu'
import { LichSuCuoc } from '~/models/LichSu_Cuoc'
import { TaiXiuCuoc } from '~/models/TaiXiu_cuoc'
import { TaiXiuOne } from '~/models/TaiXiu_one'
import { TaiXiuPhien } from '~/models/TaiXiu_phien'
import { TaiXiuUser } from '~/models/TaiXiu_user'
import { User } from '~/models/User'
import { ExtendedSocket } from '~/sockets'
import { getSocketServer } from '~/socketServer'

const cuoc = async (socket: ExtendedSocket, data: ITaiXiuCuocPayload) => {
  if (!!data && !!data.bet && !!socket.sendToTxUser) {
    const io = getSocketServer()
    if (io.TaiXiu_time < 3 || io.TaiXiu_time > 64) {
      socket.sendToTxUser({ taixiu: { err: 'Phiên mới chưa bắt đầu !' } })
    } else {
      let bet = data.bet >> 0 // Số tiền
      let select = !!data.select // Cửa đặt (Tài:1, Xỉu:0)
      if (bet < 1000) {
        socket.sendToTxUser({ taixiu: { err: 'Số tiền cược thấp nhất 1k !' } })
      } else if (bet > 999999999) {
        socket.sendToTxUser({
          taixiu: { err: 'Số tiền cược tối đa 999.999.999k !!' }
        })
      } else if (bet < 0) {
        socket.sendToTxUser({
          taixiu: { err: 'Cảnh báo TK sắp bị khóa vĩnh viễn !!' }
        })
      } else {
        const user = await User.findById(socket.data.user.id, 'coins username')

        if (user === null || user.coins < bet) {
          socket.sendToTxUser({ taixiu: { err: 'Bạn không đủ số dư !' } })
        } else {
          let phien = io.TaiXiu_phien
          const isCuoc = await TaiXiuOne.findOne(
            { uid: socket.data.user.id, phien: phien },
            'bet phien select'
          )

          if (!!isCuoc) {
            // update
            if (isCuoc.select !== select) {
              socket.sendToTxUser({ taixiu: { err: 'Chỉ được cược 1 bên.!!' } })
            } else {
              user.coins -= bet
              user.save()
              socket.sendToTxUser({ taixiu: { err: 'Đặt cược thành công!' } })
              socket.sendToTxUser({ amthanhdatcuoc: 1 })
              isCuoc.bet = isCuoc.bet * 1 + bet
              isCuoc.save()
              if (select) {
                io.taixiu.taixiu.coin_tai += bet
                io.taixiu.taixiu.player_tai += 1
                io.taixiu.taixiu.phien = phien
              } else {
                io.taixiu.taixiu.coin_xiu += bet
                io.taixiu.taixiu.player_xiu += 1
                io.taixiu.taixiu.phien = phien
              }
              // io.taixiuAdmin.list.unshift({name:user.name, select:select, bet:bet, time:new Date()});
              // io = null;

              TaiXiuCuoc.create({
                uid: socket.data.user.id,
                name: user.username,
                phien: phien,
                bet: bet,
                select: select,
                time: new Date()
              })
              LichSuCuoc.updateOne(
                { uid: socket.data.user.id, phien: phien },
                { $set: { tienhienco: user.coins }, $inc: { bet: bet } }
              ).exec()

              const taixiuVery = select
                ? { coin_tai: isCuoc.bet }
                : { coin_xiu: isCuoc.bet }

              socket.sendToTxUser({
                taixiu: taixiuVery,
                user: { coins: user.coins }
              })
            }
          } else {
            // cuoc
            user.coins -= bet
            user.save()

            if (select) {
              io.taixiu.taixiu.coin_tai += bet
              io.taixiu.taixiu.player_tai += 1
            } else {
              io.taixiu.taixiu.coin_xiu += bet
              io.taixiu.taixiu.player_xiu += 1
            }

            socket.sendToTxUser({ taixiu: { err: 'Đặt cược thành công!' } })
            socket.sendToTxUser({ taixiu: { amthanhdatcuoc: 1 } })
            TaiXiuOne.create({
              uid: socket.data.user.id,
              phien: phien,
              select: select,
              bet: bet
            })
            TaiXiuCuoc.create({
              uid: socket.data.user.id,
              name: user.username,
              phien: phien,
              bet: bet,
              select: select,
              time: new Date()
            })
            LichSuCuoc.create({
              uid: socket.data.user.id,
              phien: phien,
              select: select,
              bet: bet,
              thanhtoan: 0,
              tienhienco: user.coins,
              dichvu: 'Tài Xỉu MD5',
              time: new Date()
            })
            const taixiuVery = select ? { coin_tai: bet } : { coin_xiu: bet }

            socket.sendToTxUser({
              taixiu: taixiuVery,
              user: { coins: user.coins }
            })

            // if (!!client.redT.users[socket.UID]) {
            //   client.redT.users[socket.UID].forEach(function (obj) {
            //     obj.red({ taixiu: taixiuVery, user: { red: user.red } })
            //   })
            // }
          }
        }
      }
    }
  }
}

const getLogs = async (socket: ExtendedSocket) => {
  console.log('getLogs')
  if (socket.sendToTxUser != null) {
    const io = getSocketServer()
    const data = socket.data.taixiu

    data.taixiu.coin_tai = 0
    data.taixiu.coin_xiu = 0
    var active1: Promise<{ dice: number[]; phien: number }[]> = new Promise(
      async (resolve, reject) => {
        try {
          const post = await TaiXiuPhien.find(
            {},
            {},
            { sort: { _id: -1 }, limit: 125 }
          ).exec()
          const arrayOfResults = await Promise.all(
            post.map(obj => ({
              dice: [obj.dice1, obj.dice2, obj.dice3],
              phien: obj.id
            }))
          )
          resolve(arrayOfResults)
        } catch (err) {
          reject(err)
        }
      }
    )

    var active2: Promise<
      | Pick<
          ITaiXiuUser,
          'tLineWinCoin' | 'tLineLostCoin' | 'tLineWinCoinH' | 'tLineLostCoinH'
        >
      | {}
    > = new Promise(async (resolve, reject) => {
      // try {
      // const data_a2 = await TaiXiuUser.findOne({ uid: socket.data.user.id }, 'tLineWinRed tLineLostRed tLineWinRedH tLineLostRedH').exec();
      //   if (data_a2) {
      //     delete data_a2.
      //     // data_a2 = data_a2._doc;
      //     // delete data_a2._id;
      //     // resolve(data_a2);
      //   }

      // } catch (error) {
      //   reject(err);
      // }

      try {
        const data_a2 =
          (await TaiXiuUser.findOne(
            { uid: socket.data.user.id },
            'tLineWinCoin tLineLostCoin tLineWinCoinH tLineLostCoinH'
          ).lean()) || {}
        // console.log(data_a2)

        // return data_a2

        if (Object.keys(data_a2).length) {
          // delete data_a2._id
          const { _id, ...docWithoutId } = data_a2 as ITaiXiuUser
          resolve(docWithoutId)
        } else {
          resolve({})
        }
      } catch (error) {
        reject(error)
      }
    })

    // Lay data phien
    let phien = getSocketServer().TaiXiu_phien

    if (phien === 0) {
      TaiXiuPhien.findOne({}, 'id', { sort: { id: -1 } }).then(last => {
        if (!!last && !!io) {
          io.TaiXiu_phien = last.id + 1
          phien = io.TaiXiu_phien
        }
      })
    }

    // Lay data bet cua user
    const userBet = await TaiXiuOne.findOne(
      { phien: phien, uid: socket.data.user.id },
      'bet select'
    ).exec()
    if (!!userBet) {
      if (userBet.select) {
        data.taixiu.coin_tai += userBet.bet
      } else {
        data.taixiu.coin_xiu += userBet.bet
      }
    }

    // client.redT.taixiuAdmin.list.forEach(function (game) {
    // 	if (game.name == client.profile.name) {
    // 		if (game.select) {
    // 			data.taixiu.red_me_tai += game.bet;
    // 		} else {
    // 			data.taixiu.red_me_xiu += game.bet;
    // 		}
    // 	}
    // });
    try {
      const [logs, du_day] = await Promise.all([active1, active2])
      data.logs = logs
      data.du_day = du_day
      socket.sendToTxUser({ taixiu: data })
    } catch (error) {
      socket.sendToTxUser({
        taixiu: {
          err: 'Lỗi khi lấy dữ liệu'
        }
      })
    } finally {
      socket.data.taixiu = {
        taixiu: {
          coin_tai: 0,
          coin_xiu: 0,
          player_tai: 0,
          player_xiu: 0,
          phien: 0
        },
        logs: [],
        du_day: {}
      }
    }
  }
}

const getHistory = async (
  socket: ExtendedSocket,
  data: ITaiXiuGetHistoryPayload
) => {
  console.log(data)

  if (!!data && !!data.page && !!socket.sendToTxUser) {
    var page = data.page >> 0
    var kmess = 9
    if (page > 0) {
      try {
        const total = await TaiXiuCuoc.countDocuments({
          uid: socket.data.user.id,
          thanhtoan: true
        })
        const result = await TaiXiuCuoc.find(
          { uid: socket.data.user.id, thanhtoan: true },
          {},
          { sort: { _id: -1 }, skip: (page - 1) * kmess, limit: kmess }
        ).lean()
        // console.log(result)

        if (result.length) {
          const arrayOfResults = await Promise.all(
            result.map(async obj => {
              const phien = await TaiXiuPhien.findOne({ id: obj.phien }).lean()
              return {
                ...obj,
                ...phien,
                __v: undefined,
                _id: undefined,
                thanhtoan: undefined,
                id: undefined,
                uid: undefined
              }
            })
          )

          socket.sendToTxUser({
            taixiu: { history: { data: arrayOfResults, page, kmess, total } }
          })
        } else {
          socket.sendToTxUser({
            taixiu: { history: { data: [], page, kmess, total: 0 } }
          })
        }
      } catch (error) {
        console.error('Error in getHistory:', error)
        socket.sendToTxUser({
          taixiu: {
            get_log: { error: 'An error occurred while fetching history' }
          }
        })
      }
    }
  }
}

const getCurrentGameTime = async (req: Request, res: Response) => {
  const io = getSocketServer()
  if (!io) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      status: StatusCodes.INTERNAL_SERVER_ERROR
    })
  }

  return res.status(StatusCodes.OK).json({
    data: { time: io.TaiXiu_time },
    message: ReasonPhrases.OK,
    status: StatusCodes.OK
  })
}

export const taixiuController = {
  cuoc,
  getLogs,
  getHistory,
  getCurrentGameTime
}
