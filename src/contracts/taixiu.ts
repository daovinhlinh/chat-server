export interface ITaiXiuOne {
  uid: string
  phien: number
  bet: number
  select: boolean
  tralai: number
  thuong: number
  win: boolean
  betwin: number
}

export interface ITaiXiuCuoc {
  uid: string
  name: string
  phien: number
  bet: number
  select: boolean
  tralai: number
  thanhtoan: boolean
  win: boolean
  betwin: number
  wincaonhat: number
  time: Date
}

export interface ITaiXiuPhien {
  dice1: number
  dice2: number
  dice3: number
  md5tx: string
  md5hash: string
  md5last: string
  userchontai: number
  userchonxiu: number
  jackpot: string
  time: Date
}

export interface ITaiXiuUser {
  _id: string
  uid: string
  tCoinPlay: number
  tWinCoin: number
  tLostCoin: number
  total: number
  tLineWinCoin: number
  tLineLostCoin: number
  first: number
  last: number
  tLineWinCoinH: number
  tLineLostCoinH: number
}

export interface IHu {
  game: string
  name: string
  md5key: string
  titles: string
  hutx: number
  type: number
  red: boolean
  bet: number
  min: number
  toX: number
  balances: number
  x: number
  hu: number
  coinPlay: number
  coinWin: number
  coinLost: number
}

export interface IHuTx {
  uid: string
  name: string
  phien: number
  nhan: number
  quyhu: number
  ketqua: number
  tongtiendat: number
  tonguser: number
  lenh: number
  time: Date
  phiennohu: number
}

export interface ILichSuCuoc {
  uid: string
  phien: number
  select: boolean
  tralai: number
  thuong: number
  betwin: number
  thanhtoan: boolean
  tienhienco: number
  game: string
  name: string
  bet: number
  chitiet: string
  win: boolean
  lswin: number
  type: number
  bigWin: boolean
  play: boolean
  goc: number
  cuoc: number
  card: any
  line: number
  a: any[]
  time: Date
}

export interface ITaiXiuData {
  player_tai: number
  player_xiu: number
  coin_tai: number
  coin_xiu: number
  phien?: number
}

export interface ITopUser {
  name: string
  bet: number
}

export interface ITaiXiuSocketData {
  cuoc: ITaiXiuCuocPayload
  getLogs: boolean
  getHistory: ITaiXiuGetHistoryPayload
}

export interface ITaiXiuGetHistoryPayload {
  page: number
}

export interface ITaiXiuCuocPayload {
  bet: number
  select: boolean
}
