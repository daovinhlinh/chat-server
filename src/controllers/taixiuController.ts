import { Socket, DefaultEventsMap, Event } from 'socket.io'
import { ISocketData } from '~/contracts/socket'
import { ITaiXiuCuocPayload } from '~/contracts/taixiu'
import { ServerToClientEvents } from '~/crons/taixiu'
import { LichSuCuoc } from '~/models/LichSu_Cuoc'
import { TaiXiuCuoc } from '~/models/TaiXiu_cuoc'
import { TaiXiuOne } from '~/models/TaiXiu_one'
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

export const taixiuController = { cuoc }
