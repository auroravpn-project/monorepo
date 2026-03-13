export interface DataEntity {
  date: string
  uid: number
  platform: 'win32' | 'darwin' | 'linux' | 'android' | 'ios'
  data_used: number
  duration: number
}
