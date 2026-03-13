import { inject } from 'inversify'
import { DataRepo } from './data.repo.js'
import { getMonthRange } from '@/utils/date.util.js'

export class DataService {
  constructor(@inject(DataRepo) private dataRepo: DataRepo) {}
  async getDataLeft(uid: number) {
    return this.dataRepo.getDataLeft(uid)
  }

  getDailyData(uid: number, date: string) {
    return this.dataRepo.getDailyData(uid, date)
  }

  getMonthyData(uid: number, date: string) {
    const [start, end] = getMonthRange(date)
    return this.dataRepo.getMonthlyData(uid, start, end)
  }

  getAllData(uid: number) {
    return this.dataRepo.getAllData(uid)
  }
}
