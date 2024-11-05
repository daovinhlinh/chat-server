import { DefaultEventsMap, Server, Event } from 'socket.io'
import { ISocketData } from '~/contracts/socket'
import { ITaiXiuData, ITaiXiuUser, ITopUser } from '~/contracts/taixiu'
import { IUser, IUserWithoutId, UserRole } from '~/contracts/user'
import helpers from '~/helpers'
import { Hu } from '~/models/Hu'
import { HuTx } from '~/models/HuTX'
import { LichSuCuoc } from '~/models/LichSu_Cuoc'
import { TaiXiuCuoc } from '~/models/TaiXiu_cuoc'
import { TaiXiuOne } from '~/models/TaiXiu_one'
import { TaiXiuPhien } from '~/models/TaiXiu_phien'
import { TaiXiuUser } from '~/models/TaiXiu_user'
import { User } from '~/models/User'
import { getSocketServer } from '~/socketServer'
import { bot } from './bot'
export interface ServerToClientEvents {
  taixiu: (data: any) => void
}

export interface ExtendedServer
  extends Server<
    DefaultEventsMap,
    ServerToClientEvents,
    DefaultEventsMap,
    ISocketData
  > {
  listTop: ITopUser[]
  listBot: IUser[]
  taixiu: {
    taixiu: ITaiXiuData
  }
  TaiXiu_time: number
  TaiXiu_phien: number
  TaiXiu_phiennohu: number
  sendToTxUser: (data: any) => void
}

let io: ExtendedServer | null = null
let gameLoop: NodeJS.Timeout | null = null
const enableBot = true
let botTemp: IUser[] = []
let botList: IUser[] = []

const getTop = async (): Promise<void> => {
  try {
    const results = await TaiXiuUser.find({ total: { $gt: 0 } }, 'total uid', {
      sort: { total: -1 },
      limit: 10
    }).exec()

    const topUsers: ITopUser[] = await Promise.all(
      results.map(async obj => {
        const result2 = await User.findOne({ id: obj.uid }).exec()
        return {
          name: result2 ? result2.username : '',
          bet: obj.total
          // type: result2 ? result2.type : false
        }
      })
    )

    if (io) {
      io.listTop = topUsers
    }
  } catch (err) {
    console.error('Error in GetTop:', err)
  }
}

const truChietKhau = (bet: number, phe: number): number => {
  return bet - Math.ceil((bet * phe) / 100)
}

// const io.sendToTxUser = (data: any): void => {
//   if (!io) return
//   // Using boardcast
//   io.emit('taixiu', data)
// }

const setTaiXiu_user = async (phien: number) => {
  const list = await TaiXiuOne.find({ phien: phien })

  if (list.length !== 0) {
    Promise.all(
      list.map(obj => {
        let action = new Promise(async (resolve, reject) => {
          const data = await TaiXiuUser.findOne({ uid: obj.uid })

          if (!!data) {
            let bet_thua = obj.bet - obj.tralai
            let bet = obj.win ? obj.betwin + obj.bet : bet_thua
            let update: Record<string, any> = {}
            if (bet_thua >= 10000) {
              update = {
                tLineWinCoin:
                  obj.win && data.tLineWinCoin < data.tLineWinCoinH + 1
                    ? data.tLineWinCoinH + 1
                    : data.tLineWinCoin,
                tLineLostCoin:
                  !obj.win && data.tLineLostCoin < data.tLineLostCoinH + 1
                    ? data.tLineLostCoinH + 1
                    : data.tLineLostCoin,
                tLineWinCoinH: obj.win ? data.tLineWinCoinH + 1 : 0,
                tLineLostCoinH: obj.win ? 0 : data.tLineLostCoinH + 1,
                last: phien
              }
              if (obj.win) {
                if (data.tLineWinCoinH == 0) {
                  update.first = phien
                }
              } else {
                if (data.tLineLostCoinH == 0) {
                  update.first = phien
                }
              }
            }

            !!Object.entries(update).length &&
              TaiXiuUser.updateOne({ uid: obj.uid }, { $set: update }).exec()

            // if (void 0 !== io.users[obj.uid] && (obj.win > 0)) {
            //   io.users[obj.uid].forEach(function (client) {
            //     client.red({ taixiu: { status: { win: obj.win, select: obj.select, bet: bet } } });
            //   });
            // }

            if (obj.win) {
              const userId = obj.uid
              const data = {
                taixiu: {
                  status: {
                    win: obj.win,
                    select: obj.select,
                    bet: bet
                  }
                }
              }

              io?.to(userId).emit('taixiu', data)
            }

            resolve({ uid: obj.uid, betxwin: obj.betwin })
          } else {
            resolve(null)
          }
        })
        return action
      })
    )
    //  const results = await TaiXiuOne.find(
    //     { phien: phien },
    //     'betwin uid',
    //     { sort: { betwin: -1 }, limit: 17 }
    //   )

    //   Promise.all(
    //     results.map(function (obj) {
    //       let action = new Promise(async function (resolve, reject) {
    //         const result2 = await User.findOne({ id: obj.uid }).exec()
    //         resolve({ users: result2?.username, bet: obj.betwin, game: 'Tài Xỉu' })
    //       })
    //       return action
    //     })
    //   ).then(result => {
    //     // io.sendInHome({ news: { a: result } })
    //   })
  }
}

const thongtin_thanhtoan = async (
  game_id: number,
  dice: boolean | number = false
) => {
  if (dice) {
    try {
      const dataHu = await Hu.findOne({ game: 'taixiumd5', type: 1 }, 'hutx')
      const last = await HuTx.findOne({}, 'phiennohu', {
        sort: { phiennohu: -1 }
      })

      if (!!last) {
        var getphiennohu = last.phiennohu + 1
      }
      let hutaix = dataHu?.hutx

      // Tổng cược tài/xỉu
      let tong_coin_tai: number | null = 0
      let tong_coin_xiu: number | null = 0

      // Tổng số người chơi tài/xỉu
      let tong_user_tai = 0
      let tong_user_xiu = 0
      let getphien = 0

      // let vipConfig = Helpers.getConfig('topVip')

      // Lấy tất cả các lệnh của phiên
      const list = await TaiXiuCuoc.find({ phien: game_id }, null, {
        sort: { _id: -1 }
      })

      if (list.length) {
        list.forEach(objL => {
          if (objL.select === true) {
            // Tổng Red Tài
            tong_coin_tai = (tong_coin_tai ?? 0) + objL.bet
            tong_user_tai += objL.phien
          } else if (objL.select === false) {
            // Tổng Red Xỉu
            tong_coin_xiu = (tong_coin_xiu ?? 0) + objL.bet
            tong_user_xiu += objL.phien
          }
          getphien = objL.phien
        })
        let user_select_tai = tong_user_tai / getphien
        let user_dat_tai = user_select_tai % 10
        let user_select_xiu = tong_user_xiu / getphien
        let user_chon_xiu = user_select_xiu % 10

        // Tổng Coin chênh lệch
        let tong_coin_chenh: number | null = Math.abs(
          tong_coin_tai - tong_coin_xiu
        )

        let coin_lech_tai: boolean | null =
          tong_coin_tai > tong_coin_xiu ? true : false

        let lettongtai = coin_lech_tai ? tong_coin_xiu : tong_coin_tai

        tong_coin_tai = null
        tong_coin_xiu = null

        Promise.all(
          list.map(obj => {
            if (obj.select === true) {
              // Tổng Red Tài
              let win = (dice as number) > 10 ? true : false
              if (coin_lech_tai && tong_coin_chenh && tong_coin_chenh > 0) {
                if (tong_coin_chenh >= obj.bet) {
                  tong_coin_chenh -= obj.bet
                  // trả lại hoàn toàn
                  obj.thanhtoan = true
                  obj.win = win
                  obj.tralai = obj.bet
                  obj.save()

                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      { $inc: { coins: obj.bet } }
                    ).exec()

                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: win, thanhtoan: 1 },
                      $inc: { tralai: obj.bet, tienhienco: obj.bet }
                    }
                  ).exec()

                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    { $set: { win: win }, $inc: { tralai: obj.bet } }
                  ).exec()
                } else {
                  // Trả lại 1 phần
                  let betPlay = obj.bet - tong_coin_chenh //1000
                  let betwinP = 0
                  //100000 chenh 10000 => betPlay = 90000
                  obj.thanhtoan = true
                  obj.win = win
                  obj.tralai = tong_coin_chenh
                  tong_coin_chenh = 0

                  let addnohu = 0
                  if (win) {
                    // Thắng nhưng bị trừ tiền trả lại
                    // cộng tiền thắng
                    betwinP = truChietKhau(betPlay, 2) //980
                    if (
                      dice === 18 &&
                      (user_dat_tai === 5 || user_dat_tai === 0)
                    ) {
                      const hutai = betwinP * (hutaix ?? 0)
                      addnohu = Math.ceil(hutai / lettongtai)
                      //HUTX.updateMany({lenh:'1'}, {phien:'0',lenh:'0'}).exec();
                      //LScuoc.create({uid:obj.uid, phien:game_id, bet:betwinP, betwin:addnohu, thanhtoan:1, tienhienco:obj.red, game:'Nổ Hũ Tài Xỉu', time:new Date()});
                      HuTx.create({
                        name: obj.name,
                        uid: obj.uid,
                        phien: game_id,
                        nhan: addnohu,
                        quyhu: hutaix,
                        ketqua: dice,
                        phiennohu: getphiennohu,
                        tongtiendat: lettongtai,
                        tonguser: user_select_tai,
                        lenh: 1,
                        time: new Date()
                      })

                      Hu.updateOne(
                        { game: 'taixiumd5' },
                        { hutx: '5000000' }
                      ).exec()

                      TaiXiuPhien.updateOne(
                        { phien: game_id },
                        { jackpot: 1 }
                      ).exec()

                      // io.sendAllUser({
                      //   taixiu: { jackpot: { dices: 18, jackpot: 1 } }
                      // })

                      io?.sendToTxUser({
                        taixiu: { jackpot: { dices: 18, jackpot: 1 } }
                      })
                    } else {
                      addnohu = 0
                    }
                    obj.betwin = betwinP
                    let redUpdate = obj.bet + betwinP + addnohu //2000+980+0
                    let addquyhu = Math.floor(betwinP * 0.003)

                    !obj.bot &&
                      User.updateOne(
                        { _id: obj.uid },
                        {
                          $inc: {
                            total: betwinP,
                            coins: redUpdate,
                            coinsPlayed: betPlay,
                            coinsWin: betwinP
                          }
                        }
                      ).exec()

                    TaiXiuUser.updateOne(
                      { uid: obj.uid },
                      {
                        $inc: {
                          total: betwinP,
                          tWinCoin: betwinP,
                          tCoinPlay: betPlay
                        }
                      }
                    ).exec()

                    LichSuCuoc.updateOne(
                      { uid: obj.uid, phien: game_id },
                      {
                        $set: { win: win, thanhtoan: 1 },
                        $inc: {
                          tralai: obj.tralai,
                          lswin: betwinP,
                          tienhienco: redUpdate
                        }
                      }
                    ).exec()

                    Hu.updateOne(
                      { game: 'taixiumd5' },
                      { $inc: { hutx: addquyhu } }
                    ).exec()

                    // if (!!vipConfig && vipConfig.status === true) {
                    //   TopVip.updateOne(
                    //     { name: obj.name },
                    //     { $inc: { vip: betPlay } }
                    //   ).exec(function (errV, userV) {
                    //     if (!!userV && userV.n === 0) {
                    //       try {
                    //         TopVip.create({
                    //           name: obj.name,
                    //           vip: betPlay
                    //         })
                    //       } catch (e) {}
                    //     }
                    //   })
                    // }
                  } else {
                    //1000000 - 500000: bet - 50000
                    //Chenh: 500000
                    //Coin chenh < 500000
                    !obj.bot &&
                      User.updateOne(
                        { _id: obj.uid },
                        {
                          $inc: {
                            total: -betPlay,
                            coins: obj.tralai,
                            coinsPlayed: betPlay,
                            coinsLose: betPlay
                          }
                        }
                      ).exec()

                    LichSuCuoc.updateOne(
                      { uid: obj.uid, phien: game_id },
                      {
                        $set: { thanhtoan: 1 },
                        $inc: {
                          tralai: obj.tralai,
                          lswin: -betPlay,
                          tienhienco: obj.tralai
                        }
                      }
                    ).exec()

                    TaiXiuUser.updateOne(
                      { uid: obj.uid },
                      {
                        $inc: {
                          total: -betPlay,
                          tLostCoin: betPlay,
                          tCoinPlay: betPlay
                        }
                      }
                    ).exec()
                  }
                  obj.save()
                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: win },
                      $inc: { tralai: obj.tralai, betwin: betwinP }
                    }
                  ).exec()
                }
              } else {
                let addnohu = 0

                if (win) {
                  // cộng tiền thắng hoàn toàn
                  let betwin = truChietKhau(obj.bet, 2)
                  if (
                    dice === 18 &&
                    (user_dat_tai === 5 || user_dat_tai === 0)
                  ) {
                    const hutai = betwin * (hutaix ?? 0)
                    addnohu = Math.ceil(hutai / lettongtai)

                    HuTx.create({
                      name: obj.name,
                      uid: obj.uid,
                      phien: game_id,
                      nhan: addnohu,
                      quyhu: hutaix,
                      ketqua: dice,
                      phiennohu: getphiennohu,
                      tongtiendat: lettongtai,
                      tonguser: user_select_tai,
                      lenh: 1,
                      time: new Date()
                    })
                    Hu.updateOne(
                      { game: 'taixiumd5' },
                      { hutx: '5000000' }
                    ).exec()
                    TaiXiuPhien.updateOne(
                      { phien: game_id },
                      { jackpot: 1 }
                    ).exec()

                    io?.sendToTxUser({
                      taixiu: { jackpot: { dices: 18, jackpot: 1 } }
                    })
                  } else {
                    addnohu = 0
                  }
                  let addquyhu = Math.floor(betwin * 0.003)
                  obj.thanhtoan = true
                  obj.win = true
                  obj.betwin = betwin
                  obj.save()
                  // Helpers.MissionAddCurrent(
                  //   obj.uid,
                  //   (obj.bet * 0.02) >> 0
                  // )

                  // if (!!vipConfig && vipConfig.status === true) {
                  //   TopVip.updateOne(
                  //     { name: obj.name },
                  //     { $inc: { vip: obj.bet } }
                  //   ).exec(function (errV, userV) {
                  //     if (!!userV && userV.n === 0) {
                  //       try {
                  //         TopVip.create({
                  //           name: obj.name,
                  //           vip: obj.bet
                  //         })
                  //       } catch (e) {}
                  //     }
                  //   })
                  // }

                  let redUpdate = obj.bet + betwin + addnohu

                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      {
                        $inc: {
                          total: betwin,
                          coins: redUpdate,
                          coinsWin: betwin,
                          coinsPlayed: obj.bet
                        }
                      }
                    ).exec()
                  TaiXiuUser.updateOne(
                    { uid: obj.uid },
                    {
                      $inc: {
                        total: betwin,
                        tWinCoin: betwin,
                        tCoinPlay: obj.bet
                      }
                    }
                  ).exec()

                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: true, thanhtoan: 1 },
                      $inc: { lswin: betwin, tienhienco: redUpdate }
                    }
                  ).exec()

                  Hu.updateOne(
                    { game: 'taixiumd5' },
                    { $inc: { hutx: addquyhu } }
                  ).exec()

                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    { $set: { win: true }, $inc: { betwin: betwin } }
                  ).exec()
                } else {
                  obj.thanhtoan = true
                  obj.save()
                  // Helpers.MissionAddCurrent(
                  //   obj.uid,
                  //   (obj.bet * 0.02) >> 0
                  // )

                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      {
                        $inc: {
                          total: -obj.bet,
                          coinsLose: obj.bet,
                          coinsPlayed: obj.bet
                        }
                      }
                    ).exec()

                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { thanhtoan: 1 },
                      $inc: { lswin: -obj.bet }
                    }
                  ).exec()

                  TaiXiuUser.updateOne(
                    { uid: obj.uid },
                    {
                      $inc: {
                        total: -obj.bet,
                        tLostCoin: obj.bet,
                        tCoinPlay: obj.bet
                      }
                    }
                  ).exec()
                }
              }
            } else if (obj.select === false) {
              // Tổng Red Xỉu
              let win = (dice as number) > 10 ? false : true
              if (!coin_lech_tai && tong_coin_chenh && tong_coin_chenh > 0) {
                if (tong_coin_chenh >= obj.bet) {
                  // Trả lại hoàn toàn
                  tong_coin_chenh -= obj.bet
                  // trả lại hoàn toàn
                  obj.thanhtoan = true
                  obj.win = win
                  obj.tralai = obj.bet
                  obj.save()

                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      { $inc: { coins: obj.bet } }
                    ).exec()

                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: win, thanhtoan: 1 },
                      $inc: { tralai: obj.bet, tienhienco: obj.bet }
                    }
                  ).exec()

                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    { $set: { win: win }, $inc: { tralai: obj.bet } }
                  ).exec()
                } else {
                  // Trả lại 1 phần
                  let betPlay = obj.bet - tong_coin_chenh
                  let betwinP = 0

                  obj.thanhtoan = true
                  obj.win = win
                  obj.tralai = tong_coin_chenh
                  tong_coin_chenh = 0
                  // Helpers.MissionAddCurrent(
                  //   obj.uid,
                  //   (betPlay * 0.02) >> 0
                  // )
                  let addnohu = 0
                  if (win) {
                    // Thắng nhưng bị trừ tiền trả lại
                    // cộng tiền thắng
                    betwinP = truChietKhau(betPlay, 2)
                    if (
                      dice === 3 &&
                      (user_chon_xiu === 5 || user_chon_xiu === 0)
                    ) {
                      const hutai = betwinP * (hutaix ?? 0)
                      addnohu = Math.ceil(hutai / lettongtai)
                      //HUTX.updateMany({lenh:'1'}, {phien:'0',lenh:'0'}).exec();
                      HuTx.create({
                        name: obj.name,
                        uid: obj.uid,
                        phien: game_id,
                        nhan: addnohu,
                        quyhu: hutaix,
                        ketqua: dice,
                        phiennohu: getphiennohu,
                        tongtiendat: lettongtai,
                        tonguser: user_select_xiu,
                        lenh: 1,
                        time: new Date()
                      })
                      // LScuoc.create({uid:obj.uid, phien:game_id, bet:betwinP, betwin:addnohu, thanhtoan:1, tienhienco:obj.red, game:'Nổ Hũ Tài Xỉu', time:new Date()});
                      Hu.updateOne(
                        { game: 'taixiumd5' },
                        { hutx: '5000000' }
                      ).exec()

                      io?.sendToTxUser({
                        taixiu: { jackpot: { dices: 3, jackpot: 1 } }
                      })

                      TaiXiuPhien.updateOne(
                        { phien: game_id },
                        { jackpot: 1 }
                      ).exec()
                    } else {
                      addnohu = 0
                    }
                    const addquyhu = Math.floor(betwinP * 0.003)
                    obj.betwin = betwinP
                    let coinUpdate = obj.bet + betwinP + addnohu
                    !obj.bot &&
                      User.updateOne(
                        { _id: obj.uid },
                        {
                          $inc: {
                            total: betwinP,
                            coins: coinUpdate,
                            coinsPlayed: betPlay,
                            coinsWin: betwinP
                          }
                        }
                      ).exec()

                    LichSuCuoc.updateOne(
                      { uid: obj.uid, phien: game_id },
                      {
                        $set: { win: win, thanhtoan: 1 },
                        $inc: {
                          tralai: obj.tralai,
                          lswin: betwinP,
                          tienhienco: coinUpdate
                        }
                      }
                    ).exec()

                    TaiXiuUser.updateOne(
                      { uid: obj.uid },
                      {
                        $inc: {
                          total: betwinP,
                          tWinCoin: betwinP,
                          tCoinPlay: betPlay
                        }
                      }
                    ).exec()

                    Hu.updateOne(
                      { game: 'taixiumd5' },
                      { $inc: { hutx: addquyhu } }
                    ).exec()

                    // if (!!vipConfig && vipConfig.status === true) {
                    //   TopVip.updateOne(
                    //     { name: obj.name },
                    //     { $inc: { vip: betPlay } }
                    //   ).exec(function (errV, userV) {
                    //     if (!!userV && userV.n === 0) {
                    //       try {
                    //         TopVip.create({
                    //           name: obj.name,
                    //           vip: betPlay
                    //         })
                    //       } catch (e) {}
                    //     }
                    //   })
                    // }
                  } else {
                    !obj.bot &&
                      User.updateOne(
                        { _id: obj.uid },
                        {
                          $inc: {
                            total: -betPlay,
                            coins: obj.tralai,
                            coinsPlayed: betPlay,
                            coinsLose: betPlay
                          }
                        }
                      ).exec()
                    LichSuCuoc.updateOne(
                      { uid: obj.uid, phien: game_id },
                      {
                        $set: { thanhtoan: 1 },
                        $inc: {
                          lswin: -betPlay,
                          tralai: obj.tralai,
                          tienhienco: obj.tralai
                        }
                      }
                    ).exec()
                    TaiXiuUser.updateOne(
                      { uid: obj.uid },
                      {
                        $inc: {
                          total: -betPlay,
                          tLostCoin: betPlay,
                          tCoinPlay: betPlay
                        }
                      }
                    ).exec()
                  }
                  obj.save()
                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: win },
                      $inc: { tralai: obj.tralai, betwin: betwinP }
                    }
                  ).exec()
                }
              } else {
                let addnohu = 0

                if (win) {
                  // cộng tiền thắng hoàn toàn
                  let betwin = truChietKhau(obj.bet, 2)
                  if (
                    dice === 3 &&
                    (user_chon_xiu === 5 || user_chon_xiu === 0)
                  ) {
                    const hutai = betwin * (hutaix ?? 0)
                    addnohu = Math.ceil(hutai / lettongtai)
                    //HUTX.updateMany({lenh:'1'}, {phien:'0',lenh:'0'}).exec();
                    //LScuoc.create({uid:obj.uid, phien:game_id, bet:betwin, betwin:addnohu, thanhtoan:1, tienhienco:obj.red, game:'Nổ Hũ Tài Xỉu', time:new Date()});
                    HuTx.create({
                      name: obj.name,
                      uid: obj.uid,
                      phien: game_id,
                      nhan: addnohu,
                      quyhu: hutaix,
                      ketqua: dice,
                      phiennohu: getphiennohu,
                      tongtiendat: lettongtai,
                      tonguser: user_select_xiu,
                      lenh: 1,
                      time: new Date()
                    })
                    Hu.updateOne(
                      { game: 'taixiumd5' },
                      { hutx: '5000000' }
                    ).exec()
                    TaiXiuPhien.updateOne(
                      { phien: game_id },
                      { jackpot: 1 }
                    ).exec()
                    io?.sendToTxUser({
                      taixiu: { jackpot: { dices: 3, jackpot: 1 } }
                    })
                  } else {
                    addnohu = 0
                  }
                  const addquyhu = Math.floor(betwin * 0.003)
                  obj.thanhtoan = true
                  obj.win = true
                  obj.betwin = betwin
                  obj.save()
                  // Helpers.MissionAddCurrent(
                  //   obj.uid,
                  //   (obj.bet * 0.02) >> 0
                  // )

                  // if (!!vipConfig && vipConfig.status === true) {
                  //   TopVip.updateOne(
                  //     { name: obj.name },
                  //     { $inc: { vip: obj.bet } }
                  //   ).exec(function (errV, userV) {
                  //     if (!!userV && userV.n === 0) {
                  //       try {
                  //         TopVip.create({
                  //           name: obj.name,
                  //           vip: obj.bet
                  //         })
                  //       } catch (e) {}
                  //     }
                  //   })
                  // }

                  let redUpdate = obj.bet + betwin + addnohu
                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      {
                        $inc: {
                          total: betwin,
                          coins: redUpdate,
                          coinsWin: betwin,
                          coinsPlayed: obj.bet
                        }
                      }
                    ).exec()
                  TaiXiuUser.updateOne(
                    { uid: obj.uid },
                    {
                      $inc: {
                        total: betwin,
                        tWinCoin: betwin,
                        tCoinPlay: obj.bet
                      }
                    }
                  ).exec()
                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { win: true, thanhtoan: 1 },
                      $inc: { lswin: betwin, tienhienco: redUpdate }
                    }
                  ).exec()

                  Hu.updateOne(
                    { game: 'taixiumd5' },
                    { $inc: { hutx: addquyhu } }
                  ).exec()

                  return TaiXiuOne.updateOne(
                    { uid: obj.uid, phien: game_id },
                    { $set: { win: true }, $inc: { betwin: betwin } }
                  ).exec()
                } else {
                  // Helpers.MissionAddCurrent(
                  //   obj.uid,
                  //   (obj.bet * 0.02) >> 0
                  // )
                  obj.thanhtoan = true
                  obj.save()

                  !obj.bot &&
                    User.updateOne(
                      { _id: obj.uid },
                      {
                        $inc: {
                          total: -obj.bet,
                          coinsLose: obj.bet,
                          coinsPlayed: obj.bet
                        }
                      }
                    ).exec()
                  LichSuCuoc.updateOne(
                    { uid: obj.uid, phien: game_id },
                    {
                      $set: { thanhtoan: 1 },
                      $inc: { lswin: -obj.bet }
                    }
                  ).exec()
                  TaiXiuUser.updateOne(
                    { uid: obj.uid },
                    {
                      $inc: {
                        total: -obj.bet,
                        tLostCoin: obj.bet,
                        tCoinPlay: obj.bet
                      }
                    }
                  ).exec()
                }
              }
            }
            return 1
          })
        ).then(function (resultUpdate) {
          playGame()
          setTaiXiu_user(game_id)
          //get_newtop(game_id, dice);
          tong_coin_chenh = null
          coin_lech_tai = null
          // vipConfig = null
        })
      } else if (dice) {
        playGame()
        // vipConfig = null
      }
    } catch (error) {
      console.log(error)
    }
  } else {
    // Users
    //check lai
    // let home = {
    //   taixiu: {
    //     coin_tai: io?.taixiu.taixiu.coin_tai,
    //     coin_xiu: io?.taixiu.taixiu.coin_xiu
    //   }
    // }

    // Object.values(io.users).forEach(function (users) {
    //   users.forEach(function (client) {
    //     if (
    //       client.gameEvent !== void 0 &&
    //       client.gameEvent.viewTaiXiu !== void 0 &&
    //       client.gameEvent.viewTaiXiu
    //     ) {
    //       client.red({ taixiu: io.taixiu })
    //     } else if (client.scene == 'home') {
    //       client.red(home)
    //     }
    //     client = null
    //   })
    //   users = null
    // })

    io?.sendToTxUser({ ...io.taixiu, phien: io.TaiXiu_phien })

    // Admin
    // Object.values(io.admins).forEach(function (admin) {
    //   admin.forEach(function (client) {
    //     if (
    //       client.gameEvent !== void 0 &&
    //       client.gameEvent.viewTaiXiu !== void 0 &&
    //       client.gameEvent.viewTaiXiu
    //     ) {
    //       client.red({ taixiu: io.taixiuAdmin })
    //     }
    //     client = null
    //   })
    //   admin = null
    // })

    // Khách
    // if (io && !((io?.TaiXiu_time ?? 0) % 10)) {
    //   io.sendToTxUser(home)
    // }
  }
}

const playGame = () => {
  if (!io) return
  io.TaiXiu_time = 57
  gameLoop = setInterval(async () => {
    if (!io) return
    if (!(io.TaiXiu_time % 5)) {
      // TopHu();
      // thongbao();

      // Hu.findOne(
      //   { game: 'taixiumd5', type: 1 },
      //   'hutx',
      //   function (err, datahu) {
      //     console.log(datahu)
      //     var tienhu = datahu.hutx
      //     let data
      //     data = { hutxmain: { money: tienhu } }

      //     io.sendToTxUser(data)
      //   }
      // )

      const dataHu = await Hu.findOne({ game: 'taixiumd5', type: 1 }, 'hutx')

      if (dataHu) {
        var tienhu = 0
        if (dataHu.hutx) {
          tienhu = dataHu.hutx
        }
        let data
        data = { taixiu: { hutx: { money: tienhu } } }

        io.sendToTxUser(data)
      }
    }

    try {
      const dataHu = await Hu.findOne({ game: 'taixiumd5', type: 1 }, 'hutx')
      if (dataHu) {
        var tienhu = 0
        if (dataHu.hutx) {
          tienhu = dataHu.hutx
        }
        let data
        data = { taixiu: { hutx: { money: tienhu } } }

        io.sendToTxUser(data)
      }
    } catch (error) {
      console.log(error)
    }

    // if (io.TaiXiu_time == 64) {
    //   // Users
    //   let home
    //   home = { taixiu: { finish3: { phien: 199 } } }

    //   Object.values(io.users).forEach(function (users) {
    //     users.forEach(function (client) {
    //       if (
    //         client.gameEvent !== void 0 &&
    //         client.gameEvent.viewTaiXiu !== void 0 &&
    //         client.gameEvent.viewTaiXiu
    //       ) {
    //         client.red(home)
    //       } else if (client.scene == 'home') {
    //         client.red(home)
    //       }
    //     })
    //   })
    // }
    if (io.TaiXiu_time == 45) {
      // ThongBao.findOne(
      //   { active: 1 },
      //   'thongbao1 thongbao2 thongbao3 hienthitb',
      //   function (err, data) {
      //     if (!!data) {
      //       var thongbao1 = data.thongbao1
      //       ThongBao.updateOne({ hienthitb: thongbao1 }).exec()
      //     }
      //   }
      // )
      // Users
      let data
      data = { taixiu: { err: 'Bắt đầu phiên mới.' } }

      // Object.values(io.users).forEach(function (users) {
      //   users.forEach(function (client) {
      //     if (
      //       client.gameEvent !== void 0 &&
      //       client.gameEvent.viewTaiXiu !== void 0 &&
      //       client.gameEvent.viewTaiXiu
      //     ) {
      //       client.red(home)
      //     } else if (client.scene == 'home') {
      //       client.red(home)
      //     }
      //   })
      // })

      io.sendToTxUser(data)
    }
    //bot.regbot();
    io.TaiXiu_time--
    // console.log(io.TaiXiu_time);
    if (io.TaiXiu_time <= 45) {
      // if (io.TaiXiu_time == 20) {
      //   ThongBao.findOne(
      //     { active: 1 },
      //     'thongbao1 thongbao2 thongbao3 hienthitb',
      //     function (err, data) {
      //       if (!!data) {
      //         var thongbao2 = data.thongbao2
      //         ThongBao.updateOne({ hienthitb: thongbao2 }).exec()
      //       }
      //     }
      //   )
      // }
      // if (io.TaiXiu_time == 1) {
      //   ThongBao.findOne(
      //     { active: 1 },
      //     'thongbao1 thongbao2 thongbao3 hienthitb',
      //     function (err, data) {
      //       if (!!data) {
      //         var thongbao2 = 'Hoang son'
      //         ThongBao.updateOne({ hienthitb: thongbao2 }).exec()
      //       }
      //     }
      //   )
      // }
      if (io.TaiXiu_time == 5) {
        // Users
        let data
        if (io.taixiu.taixiu.coin_tai > io.taixiu.taixiu.coin_xiu) {
          io.taixiu.taixiu.coin_tai = io.taixiu.taixiu.coin_xiu
          data = {
            taixiu: {
              taixiu: {
                coin_tai: io.taixiu.taixiu.coin_tai,
                coin_xiu: io.taixiu.taixiu.coin_xiu,
                player_tai: io.taixiu.taixiu.player_tai,
                player_xiu: io.taixiu.taixiu.player_xiu
              },
              err: 'Trả tiền cân cửa.'
            }
          }
        } else {
          io.taixiu.taixiu.coin_xiu = io.taixiu.taixiu.coin_tai
          data = {
            taixiu: {
              taixiu: {
                coin_tai: io.taixiu.taixiu.coin_tai,
                coin_xiu: io.taixiu.taixiu.coin_xiu,
                player_tai: io.taixiu.taixiu.player_tai,
                player_xiu: io.taixiu.taixiu.player_xiu
              },
              err: 'Trả tiền cân cửa.'
            }
          }
        }

        // Object.values(io.users).forEach(function (users) {
        //   users.forEach(function (client) {
        //     if (
        //       client.gameEvent !== void 0 &&
        //       client.gameEvent.viewTaiXiu !== void 0 &&
        //       client.gameEvent.viewTaiXiu
        //     ) {
        //       client.red(home)
        //     } else if (client.scene == 'home') {
        //       client.red(home)
        //     }
        //   })
        // })

        io.sendToTxUser(data)
      }

      // if (io.TaiXiu_time == -1) {
      //   // Users
      //   let data
      //   data = { taixiu: { finish2: { phien: 1990 } } }

      //   Object.values(io.users).forEach(function (users) {
      //     users.forEach(function (client) {
      //       if (
      //         client.gameEvent !== void 0 &&
      //         client.gameEvent.viewTaiXiu !== void 0 &&
      //         client.gameEvent.viewTaiXiu
      //       ) {
      //         client.red(home)
      //       } else if (client.scene == 'home') {
      //         client.red(home)
      //       }
      //     })
      //   })
      // }

      if (io.TaiXiu_time < 0) {
        clearInterval(gameLoop!)
        io.TaiXiu_time = 0

        /** Cho admin can thiệp kết quả
        // let taixiujs = Helpers.getData('taixiumd5')
        // if (!!taixiujs) {
        //   let dice1 = parseInt(
        //     taixiujs.dice1 == 0
        //       ? Math.floor(Math.random() * 6) + 1
        //       : taixiujs.dice1
        //   )
        //   let dice2 = parseInt(
        //     taixiujs.dice2 == 0
        //       ? Math.floor(Math.random() * 6) + 1
        //       : taixiujs.dice2
        //   )
        //   let dice3 = parseInt(
        //     taixiujs.dice3 == 0
        //       ? Math.floor(Math.random() * 6) + 1
        //       : taixiujs.dice3
        //   )

        //   taixiujs.dice1 = 0
        //   taixiujs.dice2 = 0
        //   taixiujs.dice3 = 0
        //   taixiujs.uid = ''
        //   taixiujs.rights = 2

        //   Helpers.setData('taixiumd5', taixiujs)

        //   TXPhien.create(
        //     { dice1: dice1, dice2: dice2, dice3: dice3, time: new Date() },
        //     function (err, create) {
        //       if (!!create) {
        //         io.TaiXiu_phien = create.id + 1
        //         thongtin_thanhtoan(create.id, dice1 + dice2 + dice3)
        //         io.sendAllUser({
        //           taixiu: {
        //             finish: {
        //               dices: [create.dice1, create.dice2, create.dice3],
        //               phien: create.id
        //             }
        //           }
        //         })

        //         Object.values(io.admins).forEach(function (admin) {
        //           admin.forEach(function (client) {
        //             client.red({
        //               taixiu: {
        //                 finish: {
        //                   dices: [create.dice1, create.dice2, create.dice3],
        //                   phien: create.id
        //                 }
        //               }
        //             })
        //             client = null
        //           })
        //           admin = null
        //         })
        //         dice1 = null
        //         dice2 = null
        //         dice3 = null
        //       }
        //     }
        //   )
        // }
        */

        let dice1: number | undefined = Math.floor(Math.random() * 6) + 1
        let dice2: number | undefined = Math.floor(Math.random() * 6) + 1
        let dice3: number | undefined = Math.floor(Math.random() * 6) + 1

        const phien = await TaiXiuPhien.create({
          dice1,
          dice2,
          dice3,
          time: new Date()
        })

        if (!!phien) {
          io.TaiXiu_phien = phien.id + 1
          thongtin_thanhtoan(phien.id, dice1 + dice2 + dice3)

          io.sendToTxUser({
            taixiu: {
              finish: {
                dices: [dice1, dice2, dice3],
                phien: phien.id
              }
            }
          })

          dice1 = undefined
          dice2 = undefined
          dice3 = undefined
        }

        io.taixiu = {
          taixiu: {
            player_tai: 0,
            player_xiu: 0,
            coin_tai: 0,
            coin_xiu: 0,
            phien: 0
          }
        }
        // io.taixiuAdmin = {
        //   taixiu: {
        //     red_player_tai: 0,
        //     red_player_xiu: 0,
        //     red_tai: 0,
        //     red_xiu: 0
        //   },
        //   list: []
        // }

        // getTop()

        if (!!enableBot && !!io.listBot && io.listBot.length > 0) {
          // lấy danh sách tài khoản bot
          botTemp = [...io.listBot]
          botList = [...io.listBot]
          let maxBot = ((botList.length * 100) / 100) >> 0
          botList = helpers.shuffle(botList) // tráo
          botList = botList.slice(0, maxBot)
          // botListChat = botTemp
          // maxBot = null
        } else {
          botTemp = []
          botList = []
          // botListChat = []
        }
      } else {
        thongtin_thanhtoan(io.TaiXiu_phien)

        //Bot random
        if (!!botList.length && io.TaiXiu_time > 5) {
          let userCuoc = 0
          if (!((Math.random() * 3) >> 0)) {
            userCuoc = (Math.random() * 9) >> 0
          } else {
            userCuoc = (Math.random() * 5) >> 0
          }
          let iH = 0
          for (iH = 0; iH < userCuoc; iH++) {
            let dataT = botList[iH]
            if (!!dataT) {
              bot.tx(dataT, io)
              botList.splice(iH, 1) // Xoá bot đã đặt tránh trùng lặp
            }
            // dataT = []
          }
        }
      }
    }
    // botHu(io, botTemp)
  }, 1000)
  return gameLoop
}

const init = async () => {
  io = getSocketServer()
  io.listTop = []

  // Register 10 bot
  // Promise.all([
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot(),
  //   bot.regbot()
  // ])

  // Commented out bot list initialization
  const list = await User.find({ role: UserRole.BOT }, 'id username')

  if (list && list.length) {
    io.listBot = list
    // list = null;

    let botList: IUserWithoutId[] = [...io.listBot]
    let maxBot = ((botList.length * 100) / 100) >> 0
    botList = helpers.shuffle(botList) // tráo
    botList = botList.slice(0, maxBot)
  }

  io.taixiu = {
    taixiu: {
      player_tai: 0,
      player_xiu: 0,
      coin_tai: 0,
      coin_xiu: 0
    }
  }

  // io.taixiuAdmin = {
  //   taixiu: {
  //     player_tai: 0,
  //     player_xiu: 0,
  //     coin_tai: 0,
  //     coin_xiu: 0
  //   },
  //   list: []
  // }

  // getTop()
  playGame()
  // botchat();
}

TaiXiuPhien.findOne({}, 'id', { sort: { id: -1 } }).then(last => {
  if (!!last && !!io) {
    io.TaiXiu_phien = last.id + 1
  }
})

HuTx.findOne({}, 'phien', { sort: { phien: -1 } }).then(last => {
  if (!!last && !!io) {
    io.TaiXiu_phiennohu = last.phien + 1
  }
})

export { init }
