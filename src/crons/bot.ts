import { TaiXiuCuoc } from '~/models/TaiXiu_cuoc'
import { TaiXiuOne } from '~/models/TaiXiu_one'
import { TaiXiuUser } from '~/models/TaiXiu_user'
import { User } from '~/models/User'
import { IUser, UserRole } from '~/contracts/user'
import helpers from '~/helpers'
import { createHash } from '~/utils/hash'
import { ExtendedServer } from './taixiu'

/**
 * Ngẫu nhiên cược
 * return {number}
 */
const random = () => {
  let a = (Math.random() * 35) >> 0
  if (a == 34) {
    // 34
    return (Math.floor(Math.random() * (20 - 3 + 1)) + 3) * 50021
  } else if (a >= 32 && a < 34) {
    // 32 33
    return (Math.floor(Math.random() * (20 - 5 + 1)) + 5) * 50033
  } else if (a >= 30 && a < 32) {
    // 30 31 32
    return (Math.floor(Math.random() * (20 - 10 + 1)) + 10) * 20018
  } else if (a >= 26 && a < 30) {
    // 26 27 28 29
    return (Math.floor(Math.random() * (100 - 10 + 1)) + 10) * 50125
  } else if (a >= 21 && a < 26) {
    // 21 22 23 24 25
    return (Math.floor(Math.random() * (200 - 10 + 1)) + 10) * 20000
  } else if (a == 21) {
    // 15 16 17 18 19 20
    return (Math.floor(Math.random() * (10 - 5 + 1)) + 5) * 900000
  } else if (a >= 8 && a < 21) {
    // 8 9 10 11 12 13 14
    return (Math.floor(Math.random() * (7 - 2 + 1)) + 2) * 4000100
  } else {
    // 0 1 2 3 4 5 6 7
    return (Math.floor(Math.random() * (100 - 10 + 1)) + 10) * 5012
  }
}
/**
 * Cược
 */
// Tài Xỉu RED
const tx = (bot: IUser, io: ExtendedServer) => {
  let cuoc = random()
  let select = !!((Math.random() * 2) >> 0)
  if (select) {
    io.taixiu.taixiu.coin_tai += cuoc
    io.taixiu.taixiu.player_tai += 2
  } else {
    io.taixiu.taixiu.coin_xiu += cuoc
    io.taixiu.taixiu.player_xiu += 2
  }

  if (cuoc > 1) {
    TaiXiuOne.create({
      uid: bot._id,
      phien: io.TaiXiu_phien,
      select: select,
      bet: cuoc
    })
    console.log('bot cuoc', {
      uid: bot._id,
      bot: true,
      name: bot.username,
      phien: io.TaiXiu_phien,
      bet: cuoc,
      select: select,
      time: new Date()
    })
    TaiXiuCuoc.create({
      uid: bot._id,
      bot: true,
      name: bot.username,
      phien: io.TaiXiu_phien,
      bet: cuoc,
      select: select,
      time: new Date()
    })
  }
  // bot = null;
  // io = null;
  // cuoc   = null;
  // select = null;
}

const regbot = async () => {
  const username =
    'nohu' + helpers.randomUserName(5) + helpers.randomUserName(1)
  const name =
    'nohu' +
    helpers.randomUserName(1) +
    helpers.randomUserName(2) +
    helpers.randomUserName(3)

  const hashedPassword = await createHash(username)

  const user = await User.create({
    username,
    password: hashedPassword,
    role: UserRole.BOT
  })

  if (!!user) {
    const bot_uid = user._id.toString()
    TaiXiuUser.create({ uid: bot_uid })

    // TXBotChat.create({'Content': bot_uid});

    console.log('reg suss name: ' + name)
  } else {
    console.log('reg fail acc: ' + username)
  }
}

export const bot = {
  tx: tx,
  //cl: cl,
  regbot: regbot
}
