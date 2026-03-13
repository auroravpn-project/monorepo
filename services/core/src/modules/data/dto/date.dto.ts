import { isDailyDateStr, isMonthlyDateStr } from '@/utils/date.util.js'
import {
  ValidatorConstraint,
  Validate,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator'

@ValidatorConstraint({ name: 'notDate', async: false })
class DateConstraint implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments
  ): Promise<boolean> | boolean {
    return isDailyDateStr(value) || isMonthlyDateStr(value)
  }
}

export class DateDTO {
  @Validate(DateConstraint, {
    message: '日期格式不正确，应为 YYYY-MM-DD 或 YYYY-MM'
  })
  date = ''
}
