import {
  Controller,
  Get,
  Param,
  Request,
  Valid
} from '@auroravpn/fastify-inversify'
import { inject } from 'inversify'
import { DataService } from './data.service.js'
import { DateDTO } from './dto/date.dto.js'
import { isDailyDateStr } from '@/utils/date.util.js'

@Controller('/data')
export class DataController {
  constructor(@inject(DataService) private dataService: DataService) {}
  @Get('/dataleft')
  async getDataLeft(@Request() req: { uid: number }) {
    return {
      dataLeft: await this.dataService.getDataLeft(req.uid)
    }
  }

  @Get('/:date')
  async getDataByDate(
    @Request() req: { uid: number },
    @Valid(DateDTO) @Param('date') date: string
  ) {
    if (isDailyDateStr(date)) {
      return this.dataService.getDailyData(req.uid, date)
    } else {
      return this.dataService.getMonthyData(req.uid, date)
    }
  }

  @Get('/')
  async getAllData(@Request() req: { uid: number }) {
    return await this.dataService.getAllData(req.uid)
  }
}
